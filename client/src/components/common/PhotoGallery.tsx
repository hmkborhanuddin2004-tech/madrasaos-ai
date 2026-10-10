import React, { useState, useEffect } from 'react';
import { Camera, Trash2, X, Image as ImageIcon } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { DocumentCapture } from './DocumentCapture';

interface PhotoGalleryProps {
  type: 'payment_receipt' | 'result_card' | 'student_doc' | 'payslip' | 'other';
  refId: string;
  buttonLabel?: string;
}

export const PhotoGallery: React.FC<PhotoGalleryProps> = ({ type, refId, buttonLabel = "ছবি তুলুন" }) => {
  const [photos, setPhotos] = useState<any[]>([]);
  const [isGalleryOpen, setIsGalleryOpen] = useState(false);
  const [isCaptureOpen, setIsCaptureOpen] = useState(false);
  const { user } = useAuth();
  
  const fetchPhotos = async () => {
    try {
      const apiBase = import.meta.env.VITE_API_URL || 'http://127.0.0.1:5000/api/v1';
      const tenantId = localStorage.getItem('tenantId') || 'inst_main';
      const res = await fetch(`${apiBase}/uploads/photos?type=${type}&refId=${refId}`, {
        headers: { 'X-Tenant-ID': tenantId }
      });
      const data = await res.json();
      if (res.ok) setPhotos(data);
    } catch (err) {
      console.error('Failed to fetch photos', err);
    }
  };
  
  useEffect(() => {
    if (refId) fetchPhotos();
  }, [type, refId]);

  const handleDelete = async (id: string) => {
    if (!confirm('সত্যিই মুছে ফেলতে চান?')) return;
    try {
      const apiBase = import.meta.env.VITE_API_URL || 'http://127.0.0.1:5000/api/v1';
      const tenantId = localStorage.getItem('tenantId') || 'inst_main';
      const token = localStorage.getItem('token') || '';
      await fetch(`${apiBase}/uploads/photos/${id}`, {
        method: 'DELETE',
        headers: { 
          'X-Tenant-ID': tenantId,
          'X-User-Role': user?.role || 'admin',
          'Authorization': `Bearer ${token}` 
        }
      });
      fetchPhotos();
    } catch (err) {
      console.error(err);
    }
  };

  const isAdminOrAccountant = user?.role === 'admin' || user?.role === 'superadmin' || user?.role === 'accountant';
  const getImageUrl = (url: string) => {
    const apiBase = import.meta.env.VITE_API_URL || 'http://127.0.0.1:5000/api/v1';
    const serverBase = apiBase.replace('/api/v1', '');
    return `${serverBase}${url}`;
  };

  return (
    <div className="mt-4">
      <div className="flex items-center space-x-3 mb-2">
        <button 
          onClick={() => setIsCaptureOpen(true)}
          className="flex items-center space-x-1 px-3 py-1.5 bg-emerald-50 text-emerald-700 rounded-lg hover:bg-emerald-100 text-sm font-medium border border-emerald-200"
        >
          <Camera className="w-4 h-4" />
          <span>{buttonLabel}</span>
        </button>
        
        {photos.length > 0 && (
          <button 
            onClick={() => setIsGalleryOpen(true)}
            className="flex items-center space-x-1 px-3 py-1.5 bg-slate-50 text-slate-700 rounded-lg hover:bg-slate-100 text-sm font-medium border border-slate-200"
          >
            <ImageIcon className="w-4 h-4" />
            <span>সংযুক্ত ছবি ({photos.length})</span>
          </button>
        )}
      </div>

      <DocumentCapture 
        isOpen={isCaptureOpen} 
        onClose={() => setIsCaptureOpen(false)} 
        defaultTab="camera"
        type={type}
        refId={refId}
        onPhotoUploaded={() => {
          fetchPhotos();
          setIsCaptureOpen(false);
        }}
      />

      {isGalleryOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 p-4">
          <div className="bg-white rounded-2xl w-full max-w-4xl max-h-[90vh] flex flex-col">
            <div className="flex justify-between items-center p-4 border-b">
              <h3 className="font-bold text-lg">সংযুক্ত ছবি সমূহ</h3>
              <button onClick={() => setIsGalleryOpen(false)} className="p-2 hover:bg-slate-100 rounded-full">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-4 overflow-y-auto grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {photos.map(photo => (
                <div key={photo.id} className="border rounded-lg overflow-hidden flex flex-col bg-slate-50">
                  <div className="aspect-square bg-slate-200 relative">
                    <img 
                      src={getImageUrl(photo.url)} 
                      alt="Document" 
                      className="w-full h-full object-cover" 
                    />
                    {isAdminOrAccountant && (
                      <button 
                        onClick={() => handleDelete(photo.id)}
                        className="absolute top-2 right-2 p-1.5 bg-red-500 text-white rounded-full hover:bg-red-600 shadow-sm"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                  <div className="p-3 text-xs text-slate-600 space-y-1">
                    <p><strong>Captured By:</strong> {photo.capturedBy}</p>
                    <p><strong>Date:</strong> {new Date(photo.capturedAt).toLocaleString()}</p>
                  </div>
                </div>
              ))}
              {photos.length === 0 && (
                <div className="col-span-full py-10 text-center text-slate-500">
                  কোনো ছবি পাওয়া যায়নি
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
