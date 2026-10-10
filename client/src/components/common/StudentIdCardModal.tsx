import React, { useState, useEffect } from 'react';
import { X, CreditCard } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { StudentIdCard } from './StudentIdCard';

interface StudentIdCardModalProps {
  studentId: string;
  initialStudent?: any;
  onClose: () => void;
  onOpenPhotoModal?: () => void;
}

export const StudentIdCardModal: React.FC<StudentIdCardModalProps> = ({
  studentId,
  initialStudent,
  onClose,
  onOpenPhotoModal
}) => {
  const { apiCall } = useAuth();
  const [data, setData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(!initialStudent);

  const fetchIdCardData = async () => {
    try {
      const res = await apiCall(`/api/v1/students/${studentId}/id-card`);
      setData(res?.data || res);
    } catch (err) {
      console.error('Failed to load ID card data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (studentId) {
      fetchIdCardData();
    }
  }, [studentId]);

  const studentObj = data?.student || (initialStudent ? {
    id: initialStudent.id,
    name: initialStudent.full_name_bn,
    name_en: initialStudent.full_name_en || initialStudent.full_name_bn,
    code: initialStudent.student_id_number,
    roll: initialStudent.roll_number,
    class_name: initialStudent.class_name_bn,
    session_year: initialStudent.academic_year || '২০২৬',
    avatar_url: initialStudent.avatar_url || initialStudent.photo_url,
    blood_group: initialStudent.blood_group
  } : null);

  const guardianObj = data?.guardian || (initialStudent ? {
    name: initialStudent.guardian_name_bn,
    phone: initialStudent.guardian_phone,
    relation: initialStudent.guardian_relation || 'অভিভাবক'
  } : null);

  const institutionObj = data?.institution || {
    name_bn: 'জামিয়া ইসলামিয়া মডেল মাদ্রাসা',
    name_en: 'JAMIYA ISLAMIA MODEL MADRASA',
    address: 'মিরপুর, ঢাকা, বাংলাদেশ',
    phone: '01711-000000'
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-3xl w-full shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col my-auto animate-in fade-in zoom-in-95 duration-150">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-850">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-emerald-700 text-white flex items-center justify-center shadow-sm">
              <CreditCard className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                ডিজিটাল স্টুডেন্ট আইডি কার্ড প্রিভিউ
              </h3>
              <div className="text-[11px] text-slate-500">
                {studentObj?.name ? `${studentObj.name} (রোল: ${studentObj.roll || '—'})` : 'আন্তর্জাতিক স্ট্যান্ডার্ড সাইজ (CR80)'}
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-xl hover:bg-slate-200/50 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Area */}
        <div className="p-6 flex flex-col items-center justify-center overflow-y-auto max-h-[80vh]">
          {isLoading && !studentObj ? (
            <div className="py-20 text-center text-xs text-slate-500 animate-pulse">
              আইডি কার্ডের তথ্য লোড হচ্ছে...
            </div>
          ) : studentObj ? (
            <StudentIdCard
              student={studentObj}
              guardian={guardianObj}
              institution={institutionObj}
              studentName={studentObj.name_en || studentObj.name}
              rollNumber={studentObj.roll}
              className={studentObj.class_name}
              guardianName={guardianObj?.name}
              guardianPhone={guardianObj?.phone}
              bloodGroup={studentObj.blood_group}
              institutionName={institutionObj.name_bn}
              qrUrl={data?.qr_url}
              qrDataUrl={data?.qr_data_url}
              onEditPhoto={onOpenPhotoModal}
            />
          ) : (
            <div className="py-16 text-center text-xs text-red-500">
              আইডি কার্ড ডাটা লোড করা সম্ভব হয়নি।
            </div>
          )}
        </div>

      </div>
    </div>
  );
};

