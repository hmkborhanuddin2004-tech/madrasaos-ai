import React, { useState } from 'react';
import { Download, Loader2 } from 'lucide-react';

interface ExportButtonProps {
  type: 'csv' | 'xlsx' | 'pdf';
  url?: string;
  onClick?: () => void;
  label?: string;
  disabled?: boolean;
}

export const ExportButton: React.FC<ExportButtonProps> = ({ type, url, onClick, label, disabled = false }) => {
  const [loading, setLoading] = useState(false);
  
  const defaultLabel = type === 'csv' ? 'CSV ডাউনলোড' : type === 'xlsx' ? 'Excel ডাউনলোড' : 'PDF ডাউনলোড';
  const colorClass = type === 'csv' ? 'text-blue-600 bg-blue-50 border-blue-200 hover:bg-blue-100' : 'text-emerald-600 bg-emerald-50 border-emerald-200 hover:bg-emerald-100';

  const handleDownload = async () => {
    if (onClick) {
      onClick();
      return;
    }
    
    if (!url) return;
    
    try {
      setLoading(true);
      const token = localStorage.getItem('token') || localStorage.getItem('madrasa_token');
      const tenantId = localStorage.getItem('tenantId') || 'inst_main';
      
      const res = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'X-Tenant-ID': tenantId
        }
      });
      
      if (!res.ok) {
        throw new Error('Download failed');
      }
      
      const blob = await res.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = downloadUrl;
      
      // Try to get filename from content-disposition
      const contentDisposition = res.headers.get('Content-Disposition');
      let filename = `export.${type}`;
      if (contentDisposition) {
        const matches = /filename="([^"]+)"/.exec(contentDisposition);
        if (matches && matches[1]) {
          filename = matches[1];
        } else {
          const match2 = /filename=([^;]+)/.exec(contentDisposition);
          if (match2 && match2[1]) filename = match2[1];
        }
      }
      
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(downloadUrl);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Error downloading file:', error);
      alert('ডাউনলোড ব্যর্থ হয়েছে (Download failed).');
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handleDownload}
      disabled={disabled || loading}
      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-semibold transition ${colorClass} ${disabled || loading ? 'opacity-50 cursor-not-allowed' : ''}`}
    >
      {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Download className="w-3.5 h-3.5" />}
      <span>{label || defaultLabel}</span>
    </button>
  );
};

