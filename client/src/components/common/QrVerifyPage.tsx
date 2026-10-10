import React, { useEffect, useState } from 'react';
import { CheckCircle, XCircle } from 'lucide-react';

export const QrVerifyPage: React.FC = () => {
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const searchParams = new URLSearchParams(window.location.search);
    const type = searchParams.get('type');
    const id = searchParams.get('id');
    const sig = searchParams.get('sig');

    if (!type || !id || !sig) {
      setError('অবৈধ বা অসম্পূর্ণ QR কোড লিংক।');
      setLoading(false);
      return;
    }

    const verify = async () => {
      try {
        const apiBase = import.meta.env.VITE_API_URL || 'http://127.0.0.1:5000/api/v1';
        const res = await fetch(`${apiBase}/verify?type=${type}&id=${id}&sig=${sig}`);
        const data = await res.json();

        if (data.ok) {
          setResult(data);
        } else {
          setError('QR কোড যাচাইকরণ ব্যর্থ হয়েছে বা পরিবর্তন করা হয়েছে। (Invalid/Tampered QR)');
        }
      } catch (err) {
        console.error('Verify error', err);
        setError('সার্ভারে যোগাযোগ করতে সমস্যা হয়েছে।');
      } finally {
        setLoading(false);
      }
    };

    verify();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-emerald-600 font-medium">যাচাই করা হচ্ছে...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 p-4">
      <div className="bg-white rounded-2xl max-w-md w-full shadow-lg overflow-hidden p-6 text-center">
        {error ? (
          <div>
            <XCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-slate-800 mb-2">যাচাইকরণ ব্যর্থ</h2>
            <p className="text-red-600 font-medium">{error}</p>
          </div>
        ) : result ? (
          <div>
            <CheckCircle className="w-16 h-16 text-emerald-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-slate-800 mb-6">যাচাই সফল হয়েছে</h2>
            
            <div className="bg-slate-50 p-6 rounded-xl text-left text-sm space-y-3 mb-6 border border-slate-100 shadow-sm">
              {result.type === 'payment' && (
                <>
                  <p><strong>রসিদ নম্বর:</strong> {result.data.receiptNo}</p>
                  <p><strong>শিক্ষার্থীর নাম:</strong> {result.data.studentName}</p>
                  <p><strong>টাকার পরিমাণ:</strong> ৳{result.data.amount}</p>
                  <p><strong>মাধ্যম:</strong> {result.data.method}</p>
                  <p><strong>তারিখ:</strong> {new Date(result.data.date).toLocaleDateString()}</p>
                </>
              )}
              
              {result.type === 'result' && (
                <>
                  <p><strong>শিক্ষার্থীর নাম:</strong> {result.data.studentName}</p>
                  <p><strong>গ্রেড:</strong> {result.data.grade}</p>
                  <p><strong>জিপিএ (GPA):</strong> {result.data.gpa}</p>
                  <p><strong>ফলাফল:</strong> {result.data.status}</p>
                </>
              )}
              
              {result.type === 'student' && (
                <>
                  <div className="w-24 h-24 bg-slate-200 rounded-full mx-auto mb-4 overflow-hidden border-2 border-emerald-500 flex items-center justify-center">
                    <span className="text-sm text-slate-500">ছবি</span>
                  </div>
                  <p><strong>নাম:</strong> {result.data.name}</p>
                  <p><strong>ক্লাস:</strong> {result.data.class}</p>
                  <p><strong>রোল:</strong> {result.data.roll}</p>
                  <p><strong>কোড:</strong> {result.data.code}</p>
                </>
              )}

              {result.type === 'payslip' && (
                <>
                  <p><strong>স্টাফের নাম:</strong> {result.data.staffName}</p>
                  <p><strong>মাস/বছর:</strong> {result.data.month}, {result.data.year}</p>
                  <p><strong>বেতন:</strong> ৳{result.data.amount}</p>
                </>
              )}
            </div>
          </div>
        ) : null}

        <div className="mt-8">
          <a href="/" className="text-emerald-600 font-medium hover:underline">মূল পেজে ফিরে যান</a>
        </div>
      </div>
    </div>
  );
};
