import React, { useState, useEffect, useCallback } from 'react';
import { Upload as UploadIcon, FileSpreadsheet, Trash2, Archive, Eye, Loader2, AlertCircle, RefreshCw, Calendar, CheckCircle, Info, FileSearch, X } from 'lucide-react';
import { useAuth } from '../contexts/AuthProvider';
import { logger } from '../lib/logger';
import { getDisplayFileName } from '../lib/active-file-registry';
import { ValidationReviewScreen } from './ValidationReviewScreen';

interface UploadedFile {
  id: string;
  originalId?: string;
  fileHash?: string;
  fileName: string;
  originalFileName?: string;
  displayName?: string;
  uploadDate: string;
  uploadedBy: string;
  fileType: 'expenses' | 'revenues' | 'payroll' | 'banks';
  recordCount: number;
  status: string;
  isDeleted?: boolean;
  deletedAt?: string;
}

interface StagedUpload {
  id: string;
  fileName: string;
  originalFileName: string;
  displayName: string;
  fileHash: string;
  classification: string;
  arabicLabel: string;
  dateRange: { minDate: string; maxDate: string };
  recordsCount: number;
  financialTotals?: any;
}

interface FileManagementProps {
  appMode: 'expenses' | 'revenues' | 'payroll' | 'banks';
  onUploadSuccess: () => void;
  onDeleteSuccess?: (deletedIds?: string | string[]) => void;
}

export const FileManagement: React.FC<FileManagementProps> = ({ appMode, onUploadSuccess, onDeleteSuccess }) => {
  const { user, profile } = useAuth();
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [stagedFiles, setStagedFiles] = useState<StagedUpload[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  // Validation Review session states
  const [activeValidationSession, setActiveValidationSession] = useState<any | null>(null);
  const [loadingSessionId, setLoadingSessionId] = useState<string | null>(null);
  const [reviewStagedId, setReviewStagedId] = useState<string | null>(null);

  // Modals / Dialog states
  const [fileToDelete, setFileToDelete] = useState<UploadedFile | null>(null);
  const [fileToRestore, setFileToRestore] = useState<UploadedFile | null>(null);
  const [replaceTarget, setReplaceTarget] = useState<StagedUpload | null>(null);
  const [archivedFiles, setArchivedFiles] = useState<UploadedFile[]>([]);
  const [historyLogs, setHistoryLogs] = useState<any[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const [loadingHistory, setLoadingHistory] = useState(false);

  // Previews and net delta states
  const [deletePreview, setDeletePreview] = useState<any>(null);
  const [deletePreviewLoading, setDeletePreviewLoading] = useState(false);

  const [replaceConfirm, setReplaceConfirm] = useState<{ stagedId: string; targetId: string; targetName: string; stagedName: string; stagedCount: number; stagedTotal: number } | null>(null);
  const [replacePreview, setReplacePreview] = useState<any>(null);
  const [replacePreviewLoading, setReplacePreviewLoading] = useState(false);

  const fetchFiles = useCallback(async () => {
    if (!profile?.tenantId || !user) return;
    try {
      setLoading(true);
      const token = await user.getIdToken();
      
      const res = await fetch(`/api/erp/files?moduleType=${appMode}`, {
         headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (data && Array.isArray(data.data)) {
        setFiles(data.data);
      }

      const resStaged = await fetch(`/api/erp/files/governance/staged-uploads?moduleType=${appMode}`, {
         headers: { 'Authorization': `Bearer ${token}` }
      });
      const dataStaged = await resStaged.json();
      if (dataStaged.success) {
        setStagedFiles(dataStaged.stagedUploads);
      }

      const resArchived = await fetch(`/api/erp/files?moduleType=${appMode}&includeArchived=true`, {
         headers: { 'Authorization': `Bearer ${token}` }
      });
      const dataArchived = await resArchived.json();
      if (dataArchived && Array.isArray(dataArchived.data)) {
        const archived = dataArchived.data.filter((f: any) => f.isDeleted || f.status === 'archived');
        setArchivedFiles(archived);
      }
    } catch (err: any) {
      console.error(err);
      setError('تعذر تحميل الملفات.');
    } finally {
      setLoading(false);
    }
  }, [appMode, profile?.tenantId, user]);

  useEffect(() => {
    fetchFiles();
  }, [fetchFiles]);

  // Escape key handler to close active modals safely
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (replaceConfirm) {
          setReplaceConfirm(null);
        } else if (replaceTarget) {
          setReplaceTarget(null);
        } else if (fileToDelete) {
          setFileToDelete(null);
        } else if (fileToRestore) {
          setFileToRestore(null);
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [replaceConfirm, replaceTarget, fileToDelete, fileToRestore]);

  // Fetch previews
  useEffect(() => {
    if (fileToDelete && user) {
      const getDeletePreview = async () => {
        setDeletePreviewLoading(true);
        try {
          const token = await user.getIdToken();
          const res = await fetch(`/api/erp/files/governance/${fileToDelete.id}/preview?proposedAction=PREVIEW_SOFT_DISABLE&moduleType=${appMode}`, {
            headers: { 'Authorization': `Bearer ${token}` }
          });
          const preview = await res.json();
          if (preview.success) {
            setDeletePreview(preview);
          }
        } catch (e) {
          console.error(e);
        } finally {
          setDeletePreviewLoading(false);
        }
      };
      getDeletePreview();
    } else {
      setDeletePreview(null);
    }
  }, [fileToDelete, user, appMode]);

  useEffect(() => {
    if (replaceConfirm && user) {
      const getReplacePreview = async () => {
        setReplacePreviewLoading(true);
        try {
          const token = await user.getIdToken();
          const res = await fetch(`/api/erp/files/governance/${replaceConfirm.targetId}/preview?proposedAction=PREVIEW_REPLACE&moduleType=${appMode}`, {
            headers: { 'Authorization': `Bearer ${token}` }
          });
          const preview = await res.json();
          if (preview.success) {
            setReplacePreview(preview);
          }
        } catch (e) {
          console.error(e);
        } finally {
          setReplacePreviewLoading(false);
        }
      };
      getReplacePreview();
    } else {
      setReplacePreview(null);
    }
  }, [replaceConfirm, user, appMode]);

  const fetchHistory = async () => {
    if (!user) return;
    try {
      setLoadingHistory(true);
      const token = await user.getIdToken();
      const res = await fetch('/api/erp/files/audit-logs', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        setHistoryLogs(data.auditLogs);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingHistory(false);
    }
  };

  const handleReviewStaged = async (stagedId: string) => {
    if (!user) return;
    setLoadingSessionId(stagedId);
    setError(null);
    try {
      const token = await user.getIdToken();
      const res = await fetch(`/api/erp/files/governance/staged-uploads/${stagedId}/session`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success && data.session) {
        setActiveValidationSession(data.session);
        setReviewStagedId(stagedId);
      } else {
        setError(data.message || 'تعذر تحميل جلسة التحليل والمراجعة للمستند.');
      }
    } catch (err) {
      console.error(err);
      setError('حدث خطأ أثناء تحميل بيانات التحليل.');
    } finally {
      setLoadingSessionId(null);
    }
  };

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    setUploading(true);
    setError(null);
    try {
      const token = await user.getIdToken();
      const formData = new FormData();
      formData.append('file', file);
      formData.append('moduleType', appMode);
      
      const res = await fetch('/api/erp/files/governance/staged-upload', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: formData
      });
      const data = await res.json();
      
      if (!data.success) {
         throw new Error(data.errorCode || 'STAGED_UPLOAD_FAILED');
      }
      
      await fetchFiles();

      if (data.candidate && data.candidate.id) {
         const classification = data.candidate.classification;
         const needsReview = ['INVALID', 'UNPROCESSABLE', 'CORRECTED_VERSION', 'OVERLAP_AMBIGUOUS', 'AMBIGUOUS_OVERLAP'].includes(classification);
         if (needsReview) {
            await handleReviewStaged(data.candidate.id);
         }
      }
    } catch (err: any) {
       console.error("Upload error:", err);
       const code = err.message;
       if (code === 'UNSUPPORTED_FILE_TYPE') {
          setError('يرجى رفع ملف Excel أو CSV صالح فقط.');
       } else if (code === 'FILE_TOO_LARGE') {
          setError('حجم الملف أكبر من الحد المسموح به وهو 10 ميجابايت.');
       } else if (code === 'STAGED_FILE_SAVE_FAILED') {
          setError('تعذر حفظ الملف المرفوع للتحليل حاليًا. يرجى المحاولة مرة أخرى لاحقًا.');
       } else if (code === 'STAGED_FILE_PARSE_FAILED') {
          setError('تعذر تحليل الملف المرفوع. لم تتم إضافة أي بيانات إلى التقارير الحالية.');
       } else {
          setError('تعذر رفع الملف وتحليله حاليًا. يرجى المحاولة مرة أخرى لاحقًا.');
       }
    } finally {
      setUploading(false);
      if (e.target) e.target.value = '';
    }
  };

  const handleActivate = async (stagedId: string) => {
    if (!user) return;
    setActionLoading(stagedId);
    try {
      const token = await user.getIdToken();
      const res = await fetch(`/api/erp/files/lifecycle/${stagedId}/activate`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        await fetchFiles();
        onUploadSuccess();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setActionLoading(null);
    }
  };

  const handleReplace = async (stagedId: string, targetId: string) => {
    if (!user) return;
    setActionLoading(stagedId);
    try {
      const token = await user.getIdToken();
      const res = await fetch(`/api/erp/files/lifecycle/${stagedId}/replace/${targetId}`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        setReplaceTarget(null);
        setReplaceConfirm(null);
        await fetchFiles();
        onUploadSuccess();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setActionLoading(null);
    }
  };

  const handleRestore = async (fileId: string) => {
    if (!user) return;
    setActionLoading(fileId);
    setError(null);
    try {
      const token = await user.getIdToken();
      const res = await fetch(`/api/erp/files/${fileId}/restore`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok && data.success) {
        await fetchFiles();
        onUploadSuccess();
      } else {
        setError(data.message || 'فشلت عملية استعادة الملف.');
      }
    } catch (err: any) {
      console.error(err);
      setError('حدث خطأ أثناء استعادة الملف.');
    } finally {
      setActionLoading(null);
    }
  };

  const handleCancelStaged = async (stagedId: string) => {
    if (!user) return;
    setActionLoading(stagedId);
    try {
      const token = await user.getIdToken();
      await fetch(`/api/erp/files/lifecycle/${stagedId}/cancel`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      await fetchFiles();
    } catch (err) {
      console.error(err);
    } finally {
      setActionLoading(null);
    }
  };

  const handleDelete = async (fileId: string) => {
    if (!user) return;
    setActionLoading('delete');
    try {
      const token = await user.getIdToken();
      const res = await fetch(`/api/erp/files/${fileId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        setFileToDelete(null);
        await fetchFiles();
        if (onDeleteSuccess) onDeleteSuccess(fileId);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setActionLoading(null);
    }
  };

  const moduleTitle = appMode === 'expenses' ? 'المشتريات' : (appMode === 'revenues' ? 'المبيعات' : 'الملفات');

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-20">
      
      {/* Upload Header */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 bg-indigo-50 rounded-2xl flex items-center justify-center border border-indigo-100 shadow-inner">
            <FileSpreadsheet className="w-8 h-8 text-indigo-600" />
          </div>
          <div>
            <h2 className="text-2xl font-black text-slate-800 tracking-tight">إدارة ملفات {moduleTitle}</h2>
            <p className="text-slate-500 mt-1 font-medium">
              ارفع ملف {moduleTitle} وسيحدد النظام تلقائيًا ما إذا كان ملفًا جديدًا أو نسخة معدلة، مع حماية التقارير من التكرار أو التداخل.
            </p>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-center gap-3 w-full md:w-auto">
          <button 
            onClick={() => {
              setShowHistory(true);
              fetchHistory();
            }}
            className="flex items-center justify-center gap-2 px-6 py-4 bg-white border border-slate-200 hover:border-slate-300 text-slate-700 font-bold text-lg rounded-xl transition-all hover:bg-slate-50 shadow-sm w-full sm:w-auto"
          >
            <Eye className="w-5 h-5 text-slate-500" />
            عرض سجل العمليات
          </button>
          
          <div className="relative group w-full sm:w-auto">
            <input
              type="file"
              accept=".xlsx,.xls,.csv"
              onChange={handleUpload}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
              disabled={uploading}
            />
            <div className={`flex items-center justify-center gap-3 px-8 py-4 rounded-xl font-bold text-lg transition-all duration-300 shadow-md ${
              uploading ? 'bg-slate-100 text-slate-400 border border-slate-200' 
              : 'bg-indigo-600 text-white hover:bg-indigo-700 hover:shadow-indigo-200 hover:shadow-xl hover:-translate-y-0.5'
            }`}>
              {uploading ? <Loader2 className="w-6 h-6 animate-spin" /> : <UploadIcon className="w-6 h-6" />}
              {uploading ? 'جاري الرفع والتحليل...' : `رفع ملف ${moduleTitle}`}
            </div>
          </div>
        </div>
      </div>

      {/* First-upload guidance: accepted formats & size, shown upfront (not only on error) */}
      <p className="text-sm text-slate-500 font-medium flex items-center gap-2 px-1 -mt-2">
        <Info className="w-4 h-4 text-slate-400 shrink-0" />
        الصيغ المدعومة: ملفات إكسل (xlsx و xls) وملفات CSV — بحد أقصى 10 ميجابايت لكل ملف.
      </p>

      {error && (
        <div className="bg-red-50 border border-red-200 p-4 rounded-xl flex items-start gap-3">
          <AlertCircle className="w-6 h-6 text-red-600 shrink-0" />
          <p className="text-red-800 font-bold">{error}</p>
        </div>
      )}

      {/* Staged Uploads */}
      {stagedFiles.length > 0 && (
        <div className="bg-amber-50/50 border border-amber-200/50 rounded-2xl p-6 shadow-sm">
          <h3 className="text-xl font-black text-amber-900 mb-6 flex items-center gap-2">
            <FileSearch className="w-6 h-6" />
            الملفات المرفوعة قيد التصنيف والقرار
          </h3>
          <div className="grid grid-cols-1 gap-4">
            {stagedFiles.map(file => (
              <div key={file.id} className="bg-white border border-amber-100 rounded-xl p-5 shadow-sm flex flex-col md:flex-row gap-6 justify-between items-start md:items-center">
                <div className="flex-1 w-full">
                  <div className="flex items-center gap-3 mb-2">
                    <h4 className="font-bold text-slate-800 text-lg">{file.displayName || file.fileName}</h4>
                    {file.classification === 'INVALID' || file.classification === 'UNPROCESSABLE' ? (
                      <span className="bg-rose-50 text-rose-700 border border-rose-100 text-xs px-2.5 py-1 rounded-md font-bold">غير صالح — لا يؤثر على التقارير</span>
                    ) : (
                      <span className="bg-amber-50 text-amber-700 border border-amber-100 text-xs px-2.5 py-1 rounded-md font-bold">قيد القرار — لا يؤثر على التقارير</span>
                    )}
                  </div>
                  
                  {file.classification !== 'INVALID' && file.classification !== 'UNPROCESSABLE' && (
                    <div className="grid grid-cols-2 gap-4 text-sm mt-3 bg-slate-50 p-3 rounded-lg border border-slate-100">
                      <div className="flex flex-col">
                        <span className="text-slate-500 font-medium text-xs mb-1">الفترة الزمنية</span>
                        <span className="font-bold text-slate-800" dir="ltr">
                          {file.dateRange?.minDate} → {file.dateRange?.maxDate}
                        </span>
                      </div>
                      <div className="flex flex-col">
                        <span className="text-slate-500 font-medium text-xs mb-1">عدد السجلات</span>
                        <span className="font-bold text-slate-800" dir="ltr">{file.recordsCount}</span>
                      </div>
                    </div>
                  )}
                  
                  {/* Status explanation and recommended action */}
                  <div className="mt-3 text-xs space-y-1.5 bg-slate-50 p-3 rounded-lg border border-slate-100 font-medium text-slate-600" dir="rtl">
                    <p>
                      <strong className="text-slate-800">سبب الاستبعاد المؤقت:</strong>{' '}
                      {file.classification === 'INVALID' || file.classification === 'UNPROCESSABLE' 
                        ? 'تم حظر هذا الملف من التأثير على التقارير المالية لعدم اجتياز معايير الجودة وبنية البيانات.' 
                        : 'الملف قيد المراجعة والقرار ولا يؤثر على إجمالي التقارير المالية للنشاط حتى يتم اعتماده رسمياً.'}
                    </p>
                    <p>
                      <strong className="text-slate-800">الإجراء الموصى به:</strong>{' '}
                      {file.classification === 'INVALID' && 'فتح بوابة الرقابة لتعديل السجلات وحل الأخطاء أو استبعادها، أو إلغاء الملف.'}
                      {file.classification === 'UNPROCESSABLE' && 'إلغاء الملف وتدقيق بنيته الهيكلية والتأكد من عدم خلوه من البيانات قبل إعادة الرفع.'}
                      {file.classification === 'NEW_PERIOD_SOURCE' && 'اعتماد الملف كمصدر بيانات جديد للفترة الزمنية المحددة.'}
                      {file.classification === 'CORRECTED_VERSION' && 'استخدامه كبديل مصحح للملف الحالي المسجل لتلافي التكرار.'}
                      {(file.classification === 'OVERLAP_AMBIGUOUS' || file.classification === 'AMBIGUOUS_OVERLAP') && 'مراجعة السجلات وتحديد ما إذا كان الملف يمثل فترة جديدة إضافية أو نسخة بديلة معدلة.'}
                    </p>
                  </div>
                </div>

                <div className="flex flex-col gap-2 w-full md:w-auto shrink-0">
                  <button
                    onClick={() => handleReviewStaged(file.id)}
                    disabled={actionLoading === file.id || loadingSessionId === file.id}
                    className="w-full px-6 py-2.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold text-sm rounded-lg border border-indigo-200 transition-colors flex items-center justify-center gap-2"
                  >
                    {loadingSessionId === file.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Eye className="w-4 h-4" />}
                    فحص ومراجعة السجلات والأخطاء
                  </button>

                  {file.classification === 'NEW_PERIOD_SOURCE' && (
                    <button
                      onClick={() => handleActivate(file.id)}
                      disabled={actionLoading === file.id || loadingSessionId === file.id}
                      className="w-full px-6 py-2.5 bg-emerald-600 text-white font-bold text-sm rounded-lg hover:bg-emerald-700 transition-colors flex items-center justify-center gap-2"
                    >
                      {actionLoading === file.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
                      إضافة كمصدر جديد
                    </button>
                  )}
                  
                  {file.classification === 'CORRECTED_VERSION' && (
                    <button
                      onClick={() => setReplaceTarget(file)}
                      disabled={actionLoading === file.id || loadingSessionId === file.id}
                      className="w-full px-6 py-2.5 bg-blue-600 text-white font-bold text-sm rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
                    >
                      {actionLoading === file.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
                      استخدامه كبديل
                    </button>
                  )}

                  {(file.classification === 'OVERLAP_AMBIGUOUS' || file.classification === 'AMBIGUOUS_OVERLAP') && (
                    <div className="flex flex-col gap-2 w-full">
                      <button
                        onClick={() => setReplaceTarget(file)}
                        disabled={actionLoading === file.id || loadingSessionId === file.id}
                        className="w-full px-6 py-2.5 bg-blue-600 text-white font-bold text-sm rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
                      >
                        {actionLoading === file.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
                        استخدامه كبديل
                      </button>
                      <button
                        onClick={() => handleActivate(file.id)}
                        disabled={actionLoading === file.id || loadingSessionId === file.id}
                        className="w-full px-6 py-2.5 bg-emerald-600 text-white font-bold text-sm rounded-lg hover:bg-emerald-700 transition-colors flex items-center justify-center gap-2"
                      >
                        إضافة كمصدر جديد
                      </button>
                    </div>
                  )}

                  <button
                    onClick={() => handleCancelStaged(file.id)}
                    disabled={actionLoading === file.id || loadingSessionId === file.id}
                    className="w-full px-6 py-2.5 bg-slate-100 text-slate-700 font-bold text-sm rounded-lg hover:bg-slate-200 transition-colors flex items-center justify-center gap-2"
                  >
                    إلغاء الملف المرفوع
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Replace Target Modal */}
      {replaceTarget && (
        <div 
          onClick={(e) => { if (e.target === e.currentTarget) setReplaceTarget(null); }}
          className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-[1000] flex items-center justify-center p-4"
        >
          <div className="bg-white rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl flex flex-col">
            <div className="p-6 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
              <div>
                <h3 className="text-xl font-black text-slate-800">اختر الملف الحالي المراد استبداله</h3>
                <p className="text-sm text-slate-500 mt-1">سيتم أرشفة الملف القديم واعتماد الملف الجديد ({replaceTarget.displayName}) في التقارير.</p>
              </div>
              <button onClick={() => setReplaceTarget(null)} className="p-1.5 hover:bg-slate-200 rounded-lg transition-colors">
                <X className="w-6 h-6 text-slate-500" />
              </button>
            </div>
            <div className="p-6 max-h-[60vh] overflow-y-auto space-y-3">
              {files.map(f => (
                <div 
                  key={f.id} 
                  className="flex items-center justify-between p-4 border border-slate-200 rounded-xl hover:border-indigo-400 hover:bg-indigo-50/30 transition-colors cursor-pointer" 
                  onClick={() => {
                    setReplaceConfirm({
                      stagedId: replaceTarget.id,
                      targetId: f.id,
                      targetName: getDisplayFileName(f as any, appMode),
                      stagedName: replaceTarget.displayName || replaceTarget.fileName,
                      stagedCount: replaceTarget.recordsCount,
                      stagedTotal: replaceTarget.financialTotals?.totalIncludingVat || 0
                    });
                  }}
                >
                  <div>
                    <h4 className="font-bold text-slate-800">{getDisplayFileName(f as any, appMode)}</h4>
                    <p className="text-xs text-slate-500 mt-1" dir="ltr">{f.recordCount} records</p>
                  </div>
                  <button className="px-4 py-2 bg-indigo-100 text-indigo-700 font-bold text-sm rounded-lg hover:bg-indigo-200">
                    استبدال هذا الملف
                  </button>
                </div>
              ))}
            </div>
            <div className="p-6 border-t border-slate-100 bg-slate-50 flex justify-end">
              <button onClick={() => setReplaceTarget(null)} className="px-6 py-2.5 bg-slate-200 text-slate-700 font-bold rounded-lg hover:bg-slate-300">
                إلغاء
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Replace Confirmation Sub-Modal with Deltas */}
      {replaceConfirm && (
        <div 
          onClick={(e) => { if (e.target === e.currentTarget) setReplaceConfirm(null); }}
          className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[1000] flex items-center justify-center p-4"
        >
          <div className="bg-white rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl flex flex-col border border-slate-100">
            <div className="p-6 border-b border-slate-100 bg-blue-50/60 text-blue-900 flex justify-between items-center">
              <h3 className="text-xl font-black flex items-center gap-2">
                <RefreshCw className="w-5 h-5 text-blue-600" />
                تأكيد استبدال الملف وتحديث التقارير
              </h3>
              <button onClick={() => setReplaceConfirm(null)} className="p-1.5 hover:bg-blue-100 rounded-lg transition-colors">
                <X className="w-5 h-5 text-blue-800" />
              </button>
            </div>
            
            <div className="p-6 space-y-4">
              <div className="text-sm text-slate-600 leading-relaxed">
                سيتم استبعاد الملف الحالي <span className="font-bold text-slate-800">{replaceConfirm.targetName}</span> واعتماد الملف الجديد <span className="font-bold text-slate-800">{replaceConfirm.stagedName}</span> كبديل مصحح.
              </div>

              {replacePreviewLoading ? (
                <div className="p-6 flex flex-col items-center justify-center text-slate-400">
                  <Loader2 className="w-6 h-6 animate-spin mb-2" />
                  <span className="text-xs font-bold">جاري احتساب الفروقات المالية...</span>
                </div>
              ) : replacePreview ? (
                <div className="bg-slate-50 border border-slate-200/60 p-4 rounded-xl space-y-3">
                  <h4 className="font-black text-xs text-slate-500 uppercase tracking-wider">ملخص الفروقات وتأثير القرار:</h4>
                  
                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <div className="bg-white p-2.5 rounded-lg border border-slate-100">
                      <span className="text-slate-400 block mb-0.5">الفرق في السجلات</span>
                      <span className={`font-bold ${
                        (replaceConfirm.stagedCount - replacePreview.currentState.recordCount) >= 0 ? 'text-emerald-600' : 'text-rose-600'
                      }`}>
                        {(replaceConfirm.stagedCount - replacePreview.currentState.recordCount) >= 0 ? '+' : ''}
                        {replaceConfirm.stagedCount - replacePreview.currentState.recordCount} سجل
                      </span>
                    </div>

                    <div className="bg-white p-2.5 rounded-lg border border-slate-100">
                      <span className="text-slate-400 block mb-0.5">تأثير القيمة الإجمالية</span>
                      <span className={`font-bold ${
                        (replaceConfirm.stagedTotal - replacePreview.currentState.totalIncludingVat) >= 0 ? 'text-emerald-600' : 'text-rose-600'
                      }`}>
                        {(replaceConfirm.stagedTotal - replacePreview.currentState.totalIncludingVat) >= 0 ? '+' : ''}
                        {((replaceConfirm.stagedTotal - replacePreview.currentState.totalIncludingVat)).toLocaleString('ar-SA')} ر.س
                      </span>
                    </div>
                  </div>

                  <div className="text-[11px] text-slate-400 border-t border-slate-200/50 pt-2 flex justify-between">
                    <span>قيمة الملف الجديد: {replaceConfirm.stagedTotal.toLocaleString('ar-SA')} ر.س</span>
                    <span>قيمة الملف القديم: {replacePreview.currentState.totalIncludingVat.toLocaleString('ar-SA')} ر.س</span>
                  </div>
                </div>
              ) : null}

              <div className="bg-amber-50 border border-amber-200 p-3 rounded-lg flex items-start gap-2.5">
                <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                <p className="text-xs text-amber-800 font-medium">
                  ملاحظة: هذا الإجراء سيقوم بأرشفة الملف القديم تلقائيًا لضمان عدم تكرار احتساب البيانات في شاشات التقارير.
                </p>
              </div>
            </div>

            <div className="p-6 border-t border-slate-100 bg-slate-50 flex justify-end gap-3">
              <button 
                onClick={() => setReplaceConfirm(null)} 
                disabled={actionLoading === replaceConfirm.stagedId}
                className="px-5 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold rounded-lg text-sm transition-all"
              >
                إلغاء
              </button>
              <button 
                onClick={() => handleReplace(replaceConfirm.stagedId, replaceConfirm.targetId)}
                disabled={actionLoading === replaceConfirm.stagedId}
                className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg text-sm transition-all flex items-center gap-1.5 shadow-md shadow-blue-100"
              >
                {actionLoading === replaceConfirm.stagedId ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                تأكيد الاستبدال
              </button>
            </div>
          </div>
        </div>
      )}

           {/* Delete/Archive Confirmation Modal */}
      {fileToDelete && (
        <div 
          onClick={(e) => { if (e.target === e.currentTarget) setFileToDelete(null); }}
          className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-[1000] flex items-center justify-center p-4"
        >
          <div className="bg-white rounded-2xl w-full max-w-md overflow-hidden shadow-2xl flex flex-col border border-slate-100">
            <div className="p-6 border-b border-slate-100 bg-amber-50 text-amber-900 flex justify-between items-center">
              <h3 className="text-xl font-black flex items-center gap-2">
                <AlertCircle className="w-6 h-6 text-amber-600" />
                تأكيد أرشفة الملف وإزالته
              </h3>
              <button onClick={() => setFileToDelete(null)} className="p-1.5 hover:bg-amber-100 rounded-lg transition-colors">
                <X className="w-5 h-5 text-amber-800" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <p className="text-slate-700 font-bold text-sm leading-relaxed" dir="rtl">
                سيتم أرشفة الملف وإزالته من التقارير الحالية، مع الاحتفاظ بسجله لإمكانية المراجعة أو الاستعادة لاحقًا.
              </p>
              
              <div className="text-xs text-slate-500 font-medium">
                الملف المستهدف: <span className="font-bold text-slate-800">{getDisplayFileName(fileToDelete as any, appMode)}</span>
              </div>
              
              {deletePreviewLoading ? (
                <div className="p-4 flex flex-col items-center justify-center text-slate-400">
                  <Loader2 className="w-5 h-5 animate-spin mb-1" />
                  <span className="text-xs">جاري حساب التأثير المالي...</span>
                </div>
              ) : deletePreview ? (
                <div className="bg-amber-50/50 border border-amber-100 p-4 rounded-xl space-y-2 text-xs">
                  <div className="flex justify-between items-center text-slate-500 font-bold">
                    <span>عدد السجلات المستبعدة:</span>
                    <span className="font-black text-amber-700" dir="ltr">-{deletePreview.currentState.recordCount}</span>
                  </div>
                  <div className="flex justify-between items-center text-slate-500 font-bold">
                    <span>إجمالي القيمة المستبعدة:</span>
                    <span className="font-black text-amber-700" dir="ltr">-{deletePreview.currentState.totalIncludingVat.toLocaleString('ar-SA')} ر.س</span>
                  </div>
                  <div className="flex justify-between items-center text-slate-500 font-bold border-t border-amber-200/30 pt-1.5 mt-1.5">
                    <span>الضريبة المستبعدة (VAT):</span>
                    <span className="font-black text-amber-700" dir="ltr">-{deletePreview.currentState.inputVatAmount.toLocaleString('ar-SA')} ر.س</span>
                  </div>
                </div>
              ) : (
                <div className="bg-slate-50 border border-slate-100 p-4 rounded-xl">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm text-slate-500 font-bold">عدد السجلات المستبعدة:</span>
                    <span className="font-black text-slate-800" dir="ltr">{fileToDelete.recordCount}</span>
                  </div>
                </div>
              )}
            </div>
            <div className="p-6 border-t border-slate-100 flex justify-end gap-3 bg-slate-50">
              <button onClick={() => setFileToDelete(null)} className="px-6 py-2.5 bg-slate-200 text-slate-700 font-bold rounded-lg hover:bg-slate-300">
                إلغاء
              </button>
              <button onClick={() => handleDelete(fileToDelete.id)} disabled={actionLoading === 'delete'} className="px-6 py-2.5 bg-amber-600 text-white font-bold rounded-lg hover:bg-amber-700 flex items-center gap-2">
                {actionLoading === 'delete' ? <Loader2 className="w-4 h-4 animate-spin" /> : <Archive className="w-4 h-4" />}
                تأكيد أرشفة الملف
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Restore Confirmation Modal */}
      {fileToRestore && (
        <div 
          onClick={(e) => { if (e.target === e.currentTarget) setFileToRestore(null); }}
          className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-[1000] flex items-center justify-center p-4"
        >
          <div className="bg-white rounded-2xl w-full max-w-md overflow-hidden shadow-2xl flex flex-col border border-slate-100 animate-in fade-in zoom-in duration-200">
            <div className="p-6 border-b border-slate-100 bg-indigo-50 text-indigo-900 flex justify-between items-center" dir="rtl">
              <h3 className="text-lg font-black flex items-center gap-2 justify-start">
                <RefreshCw className="w-5 h-5 text-indigo-600" />
                تأكيد استعادة الملف للتقارير
              </h3>
              <button onClick={() => setFileToRestore(null)} className="p-1.5 hover:bg-indigo-100 rounded-lg transition-colors">
                <X className="w-5 h-5 text-indigo-800" />
              </button>
            </div>
            
            <div className="p-6 space-y-4 text-right" dir="rtl">
              <p className="text-slate-700 text-sm leading-relaxed font-bold">
                سيتم إعادة الملف المؤرشف إلى التقارير إذا لم ينتج عن ذلك تكرار أو تعارض مع ملف نشط آخر.
              </p>
              <div className="text-xs text-slate-500 font-medium">
                الملف المستهدف: <span className="font-bold text-slate-800">{getDisplayFileName(fileToRestore as any, appMode)}</span>
              </div>
            </div>

            <div className="p-6 border-t border-slate-100 bg-slate-50 flex justify-end gap-3" dir="rtl">
              <button 
                onClick={() => setFileToRestore(null)}
                className="px-5 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold rounded-lg text-sm transition-all"
              >
                إلغاء
              </button>
              <button 
                onClick={async () => {
                  const targetId = fileToRestore.id;
                  setFileToRestore(null);
                  await handleRestore(targetId);
                }}
                className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-lg text-sm transition-all"
              >
                تأكيد الاستعادة للتقارير
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Active Files List */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <h3 className="text-lg font-black text-slate-800 flex items-center gap-2">
            <CheckCircle className="w-5 h-5 text-emerald-500" />
            الملفات المدرجة حاليًا في التقارير
          </h3>
          <span className="bg-slate-100 text-slate-600 text-xs font-bold px-3 py-1.5 rounded-full border border-slate-200">
            {files.length} ملفات نشطة
          </span>
        </div>
        
        {loading ? (
          <div className="p-12 flex flex-col items-center justify-center text-slate-400">
            <Loader2 className="w-8 h-8 animate-spin mb-4" />
            <p className="font-bold">جاري تحميل الملفات...</p>
          </div>
        ) : files.length === 0 ? (
          <div className="p-12 flex flex-col items-center justify-center text-slate-400 text-center">
            <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-4 border border-slate-100">
              <FileSpreadsheet className="w-8 h-8 text-slate-300" />
            </div>
            <p className="font-bold text-slate-500 text-lg">لا توجد ملفات مدرجة حاليًا</p>
            <p className="text-sm mt-1 max-w-sm">قم برفع ملف {moduleTitle} من الأعلى لبدء إضافة البيانات إلى التقارير.</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {files.map(file => (
              <div key={file.id} className="p-6 hover:bg-slate-50/80 transition-colors flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
                <div className="flex items-start gap-4 flex-1">
                  <div className="w-12 h-12 rounded-xl bg-emerald-50 flex items-center justify-center border border-emerald-100 shrink-0 mt-1">
                    <FileSpreadsheet className="w-6 h-6 text-emerald-600" />
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-800 text-lg">{getDisplayFileName(file as any, appMode)}</h4>
                    <div className="flex flex-wrap items-center gap-3 mt-2 text-xs">
                      <span className="flex items-center gap-1.5 text-slate-500 font-bold bg-slate-100 px-2 py-1 rounded-md">
                        <Calendar className="w-3.5 h-3.5" />
                        {new Date(file.uploadDate).toLocaleDateString('ar-SA')}
                      </span>
                      <span className="flex items-center gap-1.5 text-slate-500 font-bold bg-slate-100 px-2 py-1 rounded-md" dir="ltr">
                        {file.recordCount} records
                      </span>
                      <span className="bg-emerald-50 text-emerald-700 border border-emerald-100 font-bold px-2 py-1 rounded-md">
                        نشط — يؤثر على التقارير
                      </span>
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center gap-2 w-full lg:w-auto shrink-0 border-t lg:border-t-0 pt-4 lg:pt-0 border-slate-100">
                  <button 
                    onClick={() => {
                      setShowHistory(true);
                      fetchHistory();
                    }}
                    className="flex-1 lg:flex-none px-4 py-2 bg-white border border-slate-200 text-slate-700 font-bold text-sm rounded-lg hover:bg-slate-50 hover:border-slate-300 transition-colors flex items-center justify-center gap-2"
                  >
                    <Eye className="w-4 h-4" />
                    عرض السجل
                  </button>
                  <label className="flex-1 lg:flex-none px-4 py-2 bg-white border border-slate-200 text-slate-700 font-bold text-sm rounded-lg hover:bg-slate-50 hover:border-slate-300 transition-colors flex items-center justify-center gap-2 cursor-pointer">
                    <RefreshCw className="w-4 h-4" />
                    استبدال بنسخة معدلة
                    <input type="file" accept=".xlsx,.xls,.csv" className="hidden" onChange={handleUpload} />
                  </label>
                  <button 
                    onClick={() => setFileToDelete(file)} 
                    className="flex-1 lg:flex-none px-4 py-2 bg-white border border-red-200 text-red-600 font-bold text-sm rounded-lg hover:bg-red-50 transition-colors flex items-center justify-center gap-2"
                  >
                    <Archive className="w-4 h-4" />
                    أرشفة / إزالة من التقارير
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Archived Files Section */}
      {archivedFiles.length > 0 && (
        <div className="bg-slate-50 rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-100/50">
            <h3 className="text-lg font-black text-slate-700 flex items-center gap-2">
              <Info className="w-5 h-5 text-slate-500" />
              الأرشيف وملفات التقارير المستبعدة
            </h3>
            <span className="bg-slate-200 text-slate-600 text-xs font-bold px-3 py-1.5 rounded-full border border-slate-300">
              {archivedFiles.length} ملفات مؤرشفة
            </span>
          </div>

          <div className="divide-y divide-slate-200/60 bg-white">
            {archivedFiles.map(file => {
              const isReplaced = files.some(f => f.originalId === file.id) || archivedFiles.some(f => f.originalId === file.id);
              return (
                <div key={file.id} className="p-6 hover:bg-slate-50/50 transition-colors flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 opacity-75 hover:opacity-100">
                  <div className="flex items-start gap-4 flex-1">
                    <div className="w-12 h-12 rounded-xl bg-slate-100 flex items-center justify-center border border-slate-200 shrink-0 mt-1">
                      <FileSpreadsheet className="w-6 h-6 text-slate-500" />
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-600 text-lg line-through">{getDisplayFileName(file as any, appMode)}</h4>
                      <div className="flex flex-wrap items-center gap-3 mt-2 text-xs">
                        <span className="flex items-center gap-1.5 text-slate-400 font-medium bg-slate-100 px-2 py-1 rounded-md">
                          <Calendar className="w-3.5 h-3.5" />
                          مؤرشف بتاريخ: {file.deletedAt ? new Date(file.deletedAt).toLocaleDateString('ar-SA') : 'غير محدد'}
                        </span>
                        <span className="flex items-center gap-1.5 text-slate-400 font-medium bg-slate-100 px-2 py-1 rounded-md" dir="ltr">
                          {file.recordCount} records
                        </span>
                        {isReplaced ? (
                          <span className="bg-blue-50 text-blue-700 border border-blue-100 font-bold px-2 py-1 rounded-md">
                            مستبدل — محفوظ في السجل ولا يؤثر على التقارير
                          </span>
                        ) : (
                          <span className="bg-slate-50 text-slate-600 border border-slate-200 font-bold px-2 py-1 rounded-md">
                            مؤرشف — لا يؤثر على التقارير
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 w-full lg:w-auto shrink-0 border-t lg:border-t-0 pt-4 lg:pt-0 border-slate-100">
                    <button 
                      onClick={() => {
                        setShowHistory(true);
                        fetchHistory();
                      }}
                      className="flex-1 lg:flex-none px-4 py-2 bg-white border border-slate-200 text-slate-700 font-bold text-sm rounded-lg hover:bg-slate-50 hover:border-slate-300 transition-colors flex items-center justify-center gap-2"
                    >
                      <Eye className="w-4 h-4" />
                      عرض السجل
                    </button>
                    <button 
                      onClick={() => setFileToRestore(file)}
                      disabled={actionLoading === file.id}
                      className="flex-1 lg:flex-none px-5 py-2 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 text-indigo-700 font-bold text-sm rounded-lg transition-colors flex items-center justify-center gap-1.5"
                    >
                      <RefreshCw className="w-4 h-4" />
                      استعادة الملف للتقارير
                    </button>
                    <button 
                      disabled 
                      className="flex-1 lg:flex-none px-5 py-2 bg-slate-100 border border-slate-200 text-slate-400 font-bold text-sm rounded-lg cursor-not-allowed flex items-center justify-center gap-1.5"
                      title="الحذف النهائي غير متاح في هذه المرحلة. سيتم تفعيله لاحقًا بسياسة حوكمة تتضمن الصلاحيات، سبب الحذف، الموافقات، وفترة الاحتفاظ، مع الاحتفاظ بسجل رقابي مختصر."
                    >
                      <Trash2 className="w-4 h-4 text-slate-300" />
                      حذف نهائي محكوم
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
          <div className="bg-slate-50 p-4 border-t border-slate-200 text-xs text-slate-500 flex items-start gap-2" dir="rtl">
            <Info className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
            <p>
              الحذف النهائي غير متاح في هذه المرحلة. سيتم تفعيله لاحقًا بسياسة حوكمة تتضمن الصلاحيات، سبب الحذف، الموافقات، وفترة الاحتفاظ، مع الاحتفاظ بسجل رقابي مختصر.
            </p>
          </div>
        </div>
      )}

      {/* History Log Drawer */}
      {showHistory && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex justify-end">
          <div className="bg-white w-full max-w-xl h-full shadow-2xl flex flex-col animate-slide-in-left">
            <div className="p-6 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <FileSearch className="w-6 h-6 text-indigo-600" />
                <h3 className="text-xl font-black text-slate-800">سجل عمليات الملفات والتقارير</h3>
              </div>
              <button onClick={() => setShowHistory(false)} className="p-1.5 hover:bg-slate-200 rounded-lg transition-colors">
                <X className="w-6 h-6 text-slate-500" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              {loadingHistory ? (
                <div className="p-12 flex flex-col items-center justify-center text-slate-400">
                  <Loader2 className="w-8 h-8 animate-spin mb-4" />
                  <p className="font-bold">جاري تحميل سجل العمليات...</p>
                </div>
              ) : historyLogs.length === 0 ? (
                <div className="p-12 text-center text-slate-400">
                  <p className="font-bold text-lg">سجل العمليات فارغ حالياً</p>
                  <p className="text-xs mt-1">تظهر هنا جميع عمليات الرفع والاعتماد والأرشفة والاستعادة.</p>
                </div>
              ) : (
                <div className="relative border-r border-slate-100 pr-6 space-y-6">
                  {historyLogs.map(log => {
                    let actionLabel = log.action;
                    let actionColor = 'bg-slate-100 text-slate-700';
                    if (log.action === 'activate_new_source' || log.action === 'تم تفعيل الملف في التقارير') {
                      actionLabel = 'تم تفعيل الملف في التقارير';
                      actionColor = 'bg-emerald-50 text-emerald-700 border-emerald-100';
                    } else if (log.action === 'replace_active_source' || log.action === 'تم استبدال الملف' || log.action === 'تم استبدال الملف بنسخة أحدث') {
                      actionLabel = 'تم استبدال الملف بنسخة أحدث';
                      actionColor = 'bg-blue-50 text-blue-700 border-blue-100';
                    } else if (log.action === 'archive_active_source' || log.action === 'تم أرشفة الملف' || log.action === 'تمت أرشفة الملف وإزالته من التقارير') {
                      actionLabel = 'تمت أرشفة الملف وإزالته من التقارير';
                      actionColor = 'bg-rose-50 text-rose-700 border-rose-100';
                    } else if (log.action === 'restore_archived_source' || log.action === 'تم استعادة الملف للتقارير' || log.action === 'تمت استعادة الملف من الأرشيف') {
                      actionLabel = 'تمت استعادة الملف من الأرشيف';
                      actionColor = 'bg-amber-50 text-amber-700 border-amber-100';
                    } else if (log.action === 'upload_staged_file' || log.action === 'تم رفع الملف' || log.action === 'تم رفع ملف مشتريات جديد') {
                      actionLabel = 'تم رفع ملف مشتريات جديد';
                      actionColor = 'bg-indigo-50 text-indigo-700 border-indigo-100';
                    } else if (log.action === 'classify_staged_file' || log.action === 'تم تصنيف الملف') {
                      actionLabel = 'تم تصنيف الملف';
                      actionColor = 'bg-purple-50 text-purple-700 border-purple-100';
                    } else if (log.action === 'cancel_staged_file' || log.action === 'تم إلغاء الملف المرفوع') {
                      actionLabel = 'تم إلغاء الملف المرفوع';
                      actionColor = 'bg-slate-50 text-slate-700 border-slate-100';
                    }
                    
                    return (
                      <div key={log.id} className="relative">
                        <div className="absolute right-[-29px] top-1.5 w-2.5 h-2.5 rounded-full bg-indigo-500 ring-4 ring-indigo-50" />
                        <div className="bg-slate-50/50 border border-slate-100 p-4 rounded-xl space-y-2">
                          <div className="flex items-center justify-between">
                            <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold border ${actionColor}`}>
                              {actionLabel}
                            </span>
                            <span className="text-[11px] text-slate-400 font-medium">
                              {new Date(log.timestamp).toLocaleString('ar-SA')}
                            </span>
                          </div>
                          
                          <p className="text-sm font-bold text-slate-800">
                            {log.details || 'تم إجراء عملية على الملف'}
                          </p>
                          
                          {log.after?.fileName && (
                            <div className="text-xs text-slate-500">
                              <span className="font-semibold">الملف:</span> {log.after.fileName}
                            </div>
                          )}
                          
                          {log.before?.fileName && (
                            <div className="text-xs text-slate-400">
                              <span className="font-semibold">الملف المستبدل:</span> {log.before.fileName}
                            </div>
                          )}
                          
                          <div className="text-[10px] text-slate-400 flex justify-between pt-1 border-t border-slate-100/50">
                            <span>بواسطة: المسؤول</span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {activeValidationSession && (
        <ValidationReviewScreen
          session={activeValidationSession}
          appMode={appMode}
          onCancelStaged={handleCancelStaged}
          onCancel={() => {
            setActiveValidationSession(null);
            setReviewStagedId(null);
          }}
          onApprove={async (updatedSession) => {
            if (!user || !reviewStagedId) return;
            setActionLoading(reviewStagedId);
            try {
              const token = await user.getIdToken();
              const res = await fetch(`/api/erp/files/governance/staged-uploads/${reviewStagedId}/session/approve`, {
                method: 'POST',
                headers: { 
                  'Authorization': `Bearer ${token}`,
                  'Content-Type': 'application/json'
                },
                body: JSON.stringify({ approvedRecords: updatedSession.rawRecords })
              });
              const data = await res.json();
              if (data.success) {
                setActiveValidationSession(null);
                setReviewStagedId(null);
                await fetchFiles();
              } else {
                setError(data.message || 'فشلت عملية حفظ تعديلات الجلسة.');
              }
            } catch (e) {
              console.error(e);
              setError('حدث خطأ أثناء حفظ التعديلات.');
            } finally {
              setActionLoading(null);
            }
          }}
          onReject={() => {
            setActiveValidationSession(null);
            setReviewStagedId(null);
          }}
        />
      )}

    </div>
  );
};
