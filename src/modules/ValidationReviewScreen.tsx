import React, { useState } from 'react';
import { ValidationSession, SessionRecord } from '../backend/core/pre-validation/validation-session';
import { ShieldAlert, AlertTriangle, CheckCircle, Info, ChevronDown, ChevronRight, XCircle, Search, Edit3, DollarSign, Activity, Settings, RefreshCw, BarChart, FileText, Filter, Check, X } from 'lucide-react';
import { db } from '../firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { routeToDomainIntelligence } from '../backend/core/financial-intelligence/domain-orchestrator';
import { useAuth } from '../contexts/AuthProvider';

interface ValidationReviewScreenProps {
  session: ValidationSession;
  appMode: string;
  onApprove: (session: ValidationSession) => void;
  onReject: (session: ValidationSession) => void;
  onCancel: () => void;
  onCancelStaged?: (stagedId: string) => Promise<void>;
}

export const ValidationReviewScreen: React.FC<ValidationReviewScreenProps> = ({ 
  session, 
  appMode, 
  onApprove, 
  onReject, 
  onCancel,
  onCancelStaged
}) => {
  const isSprintMode = localStorage.getItem('sprint_mode') === 'AG-RAPID-S1' || window.location.pathname.startsWith('/rapid-s1');
  const { user } = useAuth();
  const [currentSession, setCurrentSession] = useState<ValidationSession>(session);
  const [expandedRows, setExpandedRows] = useState<Record<string, boolean>>({});
  const [agreedToWarnings, setAgreedToWarnings] = useState(false);
  const [editingRecord, setEditingRecord] = useState<string | null>(null);
  const [editValues, setEditValues] = useState<any>({});
  const [filterStatus, setFilterStatus] = useState<'ALL'|'CLEAN'|'CRITICAL'|'HIGH'>('ALL');
  const [showExitConfirm, setShowExitConfirm] = useState(false);

  // Exit handler with unsaved changes verification
  const handleExitClick = React.useCallback(() => {
    const initialRecordsStr = JSON.stringify(session.records.map(r => ({ id: r.id, status: r.status, normalizedData: r.normalizedData })));
    const currentRecordsStr = JSON.stringify(currentSession.records.map(r => ({ id: r.id, status: r.status, normalizedData: r.normalizedData })));
    
    if (initialRecordsStr !== currentRecordsStr) {
      setShowExitConfirm(true);
    } else {
      onCancel();
    }
  }, [currentSession.records, session.records, onCancel]);

  // Active cancellation workflow for unprocessable/corrupted files
  const handleUnprocessableCancel = async () => {
    const confirmCancel = window.confirm("هل أنت متأكد من إلغاء وحذف هذا الملف المعطوب بنيوياً من قائمة الاستيراد؟");
    if (confirmCancel) {
      if (onCancelStaged && (currentSession as any).stagedId) {
        try {
          await onCancelStaged((currentSession as any).stagedId);
        } catch (e) {
          console.error("Failed to cancel staged file:", e);
        }
      }
      onCancel();
    }
  };

  // Click handler for modal backdrop click dismissal
  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      if (currentSession.classification === 'UNPROCESSABLE') {
        handleUnprocessableCancel();
      } else {
        handleExitClick();
      }
    }
  };

  // Escape key handler
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (showExitConfirm) {
          setShowExitConfirm(false);
        } else if (currentSession.classification === 'UNPROCESSABLE') {
          handleUnprocessableCancel();
        } else {
          handleExitClick();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleExitClick, showExitConfirm, currentSession.classification]);

  // Refs to always access the latest values inside the popstate listener without triggering effect cleanup/re-runs
  const sessionRef = React.useRef(session);
  sessionRef.current = session;
  const currentSessionRef = React.useRef(currentSession);
  currentSessionRef.current = currentSession;
  const onCancelRef = React.useRef(onCancel);
  onCancelRef.current = onCancel;

  // Browser back navigation interception popstate logic
  React.useEffect(() => {
    console.log("[DEBUG] ValidationReviewScreen popstate useEffect setup running");
    
    (window as any).__reviewModalRemounted = true;

    // Only push history state if we haven't already pushed it
    if (!window.history.state?.reviewModalOpen) {
      window.history.pushState({ reviewModalOpen: true }, '');
      console.log("[DEBUG] Pushed history state:", window.history.state);
    } else {
      console.log("[DEBUG] History state already exists, skipping pushState");
    }

    const handlePopState = (e: PopStateEvent) => {
      console.log("[DEBUG] handlePopState triggered with event state:", e.state);
      
      const initialRecordsStr = JSON.stringify(sessionRef.current.records.map(r => ({ id: r.id, status: r.status, normalizedData: r.normalizedData })));
      const currentRecordsStr = JSON.stringify(currentSessionRef.current.records.map(r => ({ id: r.id, status: r.status, normalizedData: r.normalizedData })));
      
      if (initialRecordsStr !== currentRecordsStr) {
        console.log("[DEBUG] Unsaved changes detected in popstate. Showing exit confirm.");
        window.history.pushState({ reviewModalOpen: true }, '');
        setShowExitConfirm(true);
      } else {
        console.log("[DEBUG] No changes. Calling onCancelRef.current()");
        onCancelRef.current();
      }
    };

    window.addEventListener('popstate', handlePopState);
    
    return () => {
      console.log("[DEBUG] ValidationReviewScreen popstate useEffect cleanup running");
      window.removeEventListener('popstate', handlePopState);
      
      (window as any).__reviewModalRemounted = false;
      
      // Delay history cleanup to verify if it is a remount or actual unmount
      setTimeout(() => {
        if (!(window as any).__reviewModalRemounted) {
          console.log("[DEBUG] Real unmount. Cleaning up history state. Calling window.history.back()");
          if (window.history.state?.reviewModalOpen) {
            window.history.back();
          }
        } else {
          console.log("[DEBUG] StrictMode remount detected. Skipping history.back() cleanup.");
        }
      }, 0);
    };
  }, []);


  React.useEffect(() => {
    console.log("[DEBUG] Auto-approve check running");
    // Post-Validation Flow — only auto-approve if:
    // 1. All records are clean (no issues)
    // 2. The session has NO governance-level classification that requires an explicit user lifecycle decision
    //    (e.g. AMBIGUOUS_OVERLAP, CORRECTED_VERSION, OVERLAP_AMBIGUOUS require the user to choose Activate/Replace/Cancel)
    const governanceDecisionRequired = ['AMBIGUOUS_OVERLAP', 'OVERLAP_AMBIGUOUS', 'CORRECTED_VERSION', 'INVALID', 'UNPROCESSABLE'].includes(session.classification ?? '');
    const total = session.records.length;
    const clean = session.records.filter(r => r.issues.length === 0).length;

    console.log("[DEBUG] Auto-approve details:", { governanceDecisionRequired, total, clean, classification: session.classification });

    if (!governanceDecisionRequired && total > 0 && clean === total) {
      console.log("[DEBUG] Auto-approving session");
      onApprove(session);
    }
  }, []);


  const toggleRow = (id: string) => setExpandedRows(prev => ({ ...prev, [id]: !prev[id] }));

  const updateSessionSummary = (records: SessionRecord[]) => {
    let clean = 0, critical = 0, highRisk = 0, exposure = 0;
    records.forEach(r => {
      const isCritical = r.issues.some(i => i.severity === 'CRITICAL');
      if (isCritical) critical++;
      if (r.financialIntelligence.riskScore > 50 || isCritical) {
        highRisk++;
        exposure += (r.normalizedData.Total_Amount || 0);
      }
      if (r.issues.length === 0 && r.financialIntelligence.riskScore < 30) {
        clean++;
      }
    });

    setCurrentSession(prev => ({
      ...prev,
      records,
      summary: {
        ...prev.summary,
        cleanRecords: clean,
        criticalIssues: critical,
        highRiskCount: highRisk,
        totalFinancialExposure: exposure,
      }
    }));
  };

  const handleApplyFix = (recordId: string, fix: any, issueCode?: string) => {
    let newRecords = currentSession.records.map(r => {
      if (r.id === recordId) {
        const newRecord = { ...r };
        newRecord.normalizedData = { ...newRecord.normalizedData };
        if (fix.action === 'REPLACE_VALUE' && fix.field) {
          newRecord.normalizedData[fix.field] = fix.suggestedValue;
        }
        if (issueCode) {
           newRecord.issues = newRecord.issues.filter(i => i.code !== issueCode);
        }
        return newRecord;
      }
      return r;
    });

    // Reactive Recalculation
    const recordToRecalculate = newRecords.find(r => r.id === recordId);
    if (recordToRecalculate) {
        const updatedBatch = newRecords.map(r => r.normalizedData);
        const intelResults = routeToDomainIntelligence([recordToRecalculate.normalizedData as any], appMode as any, updatedBatch as any);
        const intel = intelResults[0];
        
        let newIssues: any[] = [];
        let riskScore = recordToRecalculate.financialIntelligence.riskScore;
        let insights: any[] = recordToRecalculate.financialIntelligence.insights;
        
        if (intel) {
            insights = intel.insights;
            riskScore = intel.riskScore;
            
            insights.forEach((insight: any) => {
                const mappedSeverity = insight.severity === 'HIGH' ? 'CRITICAL' : insight.severity;
                newIssues.push({
                   code: insight.type,
                   type: insight.type.includes('MISSING') ? 'STRUCTURAL' : 'INTELLIGENCE',
                   severity: mappedSeverity,
                   message: insight.message,
                   explanation: insight.message,
                   impact: 'مخاطر مالية محتملة',
                   scoreImpact: insight.scoreImpact || (insight.severity === 'HIGH' || insight.severity === 'CRITICAL' ? 30 : 10),
                   suggestedFixes: insight.suggestedAction ? [{ description: insight.suggestedAction, action: "MANUAL_REVIEW" }] : []
                });
            });
        }
        
        newRecords = newRecords.map(r => {
            if (r.id === recordId) {
                return {
                    ...r,
                    issues: newIssues,
                    status: newIssues.length === 0 ? ('APPROVED' as const) : ('PENDING' as const),
                    financialIntelligence: { insights, riskScore }
                };
            }
            return r;
        });
    }

    updateSessionSummary(newRecords);
  };

  const handleOverrideAndApprove = async (recordId: string) => {
    const justification = window.prompt("يرجى إدخال تبرير الاعتماد الشخصي مع وجود مخاطر:");
    if (!justification) return;

    const record = currentSession.records.find(r => r.id === recordId);
    try {
        if (isSprintMode) {
            console.log("[SANDBOX] Bypassed Firestore override audit log write:", {
                recordId,
                sessionId: currentSession.sessionId,
                justification,
                issues: record?.issues.map(i => i.message) || []
            });
        } else {
            await addDoc(collection(db, 'override_audit_logs'), {
                recordId,
                sessionId: currentSession.sessionId,
                justification,
                timestamp: serverTimestamp(),
                issues: record?.issues.map(i => i.message) || [],
                source: "cfo_console",
                moduleType: appMode
            });
        }
    } catch (e) {
        console.error("Failed to log override", e);
    }

    const newRecords = currentSession.records.map(r => {
      if (r.id === recordId) {
        return { ...r, status: 'APPROVED' as 'APPROVED' };
      }
      return r;
    });
    updateSessionSummary(newRecords);
  };

  const handleApproveClean = () => {
    const newRecords = currentSession.records.map(r => {
      if (r.issues.length === 0) r.status = 'APPROVED';
      return r;
    });
    updateSessionSummary(newRecords);
  };

  const handleRejectRecord = (recordId: string) => {
    const newRecords = currentSession.records.filter(r => r.id !== recordId);
    updateSessionSummary(newRecords);
  };

  const handleSaveEdit = (recordId: string) => {
    let newRecords = currentSession.records.map(r => {
      if (r.id === recordId) {
        return { 
          ...r, 
          normalizedData: { ...r.normalizedData, ...editValues[recordId] }
        };
      }
      return r;
    });

    const recordToRecalculate = newRecords.find(r => r.id === recordId);
    if (recordToRecalculate) {
        const updatedBatch = newRecords.map(r => r.normalizedData);
        const intelResults = routeToDomainIntelligence([recordToRecalculate.normalizedData as any], appMode as any, updatedBatch as any);
        const intel = intelResults[0];
        
        let newIssues: any[] = [];
        let riskScore = 0;
        let insights: any[] = [];
        
        if (intel) {
            insights = intel.insights;
            riskScore = intel.riskScore;
            
            insights.forEach((insight: any) => {
                const mappedSeverity = insight.severity === 'HIGH' ? 'CRITICAL' : insight.severity;
                newIssues.push({
                   code: insight.type,
                   type: insight.type.includes('MISSING') ? 'STRUCTURAL' : 'INTELLIGENCE',
                   severity: mappedSeverity,
                   message: insight.message,
                   explanation: insight.message,
                   impact: 'مخاطر مالية محتملة (تمت إعادة الحساب بعد التعديل اليدوي)',
                   scoreImpact: insight.scoreImpact || (insight.severity === 'HIGH' || insight.severity === 'CRITICAL' ? 30 : 10),
                   suggestedFixes: insight.suggestedAction ? [{ description: insight.suggestedAction, action: "MANUAL_REVIEW" }] : []
                });
            });
        }
        
        newRecords = newRecords.map(r => {
            if (r.id === recordId) {
                return {
                    ...r,
                    issues: newIssues,
                    status: newIssues.length === 0 ? 'APPROVED' as const : 'EDITED' as const,
                    financialIntelligence: { insights, riskScore }
                };
            }
            return r;
        });
    }

    setEditingRecord(null);
    updateSessionSummary(newRecords);
  };

  const updateLocalEditState = (recordId: string, field: string, value: any) => {
    setEditValues((prev: any) => ({
      ...prev,
      [recordId]: {
        ...(prev[recordId] || {}),
        [field]: value
      }
    }));
  };

  const handleAmountChange = (recordId: string, field: string, value: number) => {
    setEditValues((prev: any) => {
      const currentEditState = prev[recordId] || {};
      const baseData = currentSession.records.find(r => r.id === recordId)?.normalizedData || {};
      const currentState = { ...baseData, ...currentEditState, [field]: value };

      if (field === 'Net_Amount') {
        const vatRate = currentState.VAT_Rate !== undefined ? currentState.VAT_Rate : 0.15;
        currentState.VAT_Amount = +(value * vatRate).toFixed(2);
        currentState.Total_Amount = +(value + currentState.VAT_Amount).toFixed(2);
      } else if (field === 'Total_Amount') {
        const vatRate = currentState.VAT_Rate !== undefined ? currentState.VAT_Rate : 0.15;
        currentState.Net_Amount = +(value / (1 + vatRate)).toFixed(2);
        currentState.VAT_Amount = +(value - currentState.Net_Amount).toFixed(2);
      } else if (field === 'VAT_Amount') {
        currentState.Total_Amount = +((currentState.Net_Amount || 0) + value).toFixed(2);
      }

      return {
        ...prev,
        [recordId]: currentState
      };
    });
  };

  // Route a single record's escalation through the server (Fix B) — replaces the
  // dev-broken client-side Firestore write. Returns true ONLY on a confirmed save,
  // so the caller can flip status to ESCALATED after success (never before).
  const escalateRecordToServer = async (rec: SessionRecord): Promise<boolean> => {
    if (isSprintMode) {
      console.log("[SANDBOX] Bypassed server escalation write:", { id: rec.id, issues: rec.issues.map(e => e.message) });
      return true;
    }
    try {
      const token = user ? await user.getIdToken() : null;
      if (!token) { console.error("Escalation aborted: no auth token"); return false; }
      const res = await fetch('/api/erp/governance/escalate-record', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          recordId: rec.id,
          sessionId: currentSession.sessionId,
          record: rec.normalizedData,
          issues: rec.issues.map(e => e.message),
          severity: rec.issues.some(i => i.severity === 'CRITICAL') ? 'CRITICAL' : 'HIGH',
          moduleType: appMode,
        }),
      });
      const json = await res.json().catch(() => ({}));
      return res.ok && json.success === true;
    } catch (e) {
      console.error("Governance escalation failed", e);
      return false;
    }
  };

  const handleSingleEscalate = async (recordId: string) => {
    const record = currentSession.records.find(r => r.id === recordId);
    if (!record) return;

    const ok = await escalateRecordToServer(record);
    if (!ok) { console.error("Governance escalation not saved for record", recordId); return; }

    // Only after a confirmed save: flip status to ESCALATED.
    updateSessionSummary(
      currentSession.records.map(r => r.id === recordId ? { ...r, status: 'ESCALATED' as any } : r)
    );
  };

  const handleFullEscalate = async () => {
    const rejectedRecords = currentSession.records.filter(r => r.issues.some(i => i.severity === 'CRITICAL'));
    if (rejectedRecords.length === 0) return;

    const results = await Promise.all(rejectedRecords.map(escalateRecordToServer));
    const savedIds = new Set(rejectedRecords.filter((_, i) => results[i]).map(r => r.id));
    if (savedIds.size === 0) { console.error("Governance full escalation failed — nothing saved"); return; }
    if (savedIds.size < rejectedRecords.length) {
      console.warn("Some records failed to escalate; only the saved ones are marked ESCALATED.");
    }

    // Flip only the records whose escalation was actually saved.
    updateSessionSummary(
      currentSession.records.map(r => savedIds.has(r.id) ? { ...r, status: 'ESCALATED' as any } : r)
    );
  };

  const handleFinalSubmit = () => {
    const hasUnhandledCritical = currentSession.records.some(r => r.status === 'PENDING' && r.issues.some(i => i.severity === 'CRITICAL'));
    if (hasUnhandledCritical) return;

    const validSessionRecords = currentSession.records.filter(sr => sr.status !== 'ESCALATED' && sr.status !== 'REJECTED' as any);
    
    const updatedRawRecords = currentSession.rawRecords
      .filter(raw => validSessionRecords.some(sr => sr.id === raw.id))
      .map(raw => {
         const sessionRec = validSessionRecords.find(sr => sr.id === raw.id);
         return sessionRec?.normalizedData || raw;
      });

    onApprove({ ...currentSession, rawRecords: updatedRawRecords });
  };

  const summary = currentSession.summary;

  const getEntityLabel = () => {
    switch (appMode) {
      case 'expenses': return 'اسم المورد';
      case 'revenues': return 'اسم العميل';
      case 'payroll': return 'اسم الموظف / المستفيد';
      case 'banks': return 'الطرف المعني / الحساب';
      case 'inventory': return 'الصنف / المستودع';
      default: return 'الجهة';
    }
  };

  const getExposureLabel = () => {
    switch (appMode) {
      case 'expenses': return 'إجمالي المصروفات المعرضة للخطر';
      case 'revenues': return 'إيرادات محتملة الخسارة';
      case 'payroll': return 'مخاطر الرواتب (هدر محتمل)';
      case 'banks': return 'حركات بنكية حرجة غير مسواة';
      case 'inventory': return 'قيمة المخزون المعرضة للخطأ';
      default: return 'التعرض المالي';
    }
  };

  const getGateLabel = () => {
    switch (appMode) {
      case 'expenses': return 'بوابة الرقابة على المصروفات';
      case 'revenues': return 'بوابة الرقابة على الإيرادات';
      case 'payroll': return 'بوابة الرقابة على مسيرات الرواتب';
      case 'banks': return 'الرقابة والتسويات البنكية';
      case 'inventory': return 'الرقابة على حركة المخزون';
      default: return 'مركز القرار المالي';
    }
  };

  const getSeverityArabic = (severity: string) => {
    if (severity === 'CRITICAL') return 'حرج جداً';
    if (severity === 'HIGH') return 'مرتفع';
    if (severity === 'MEDIUM') return 'متوسط';
    return 'منخفض';
  };

  const getRiskLevel = (score: number) => {
    if (score >= 80) return { label: 'حرج', color: 'text-red-700', bg: 'bg-red-100', border: 'border-red-200' };
    if (score >= 60) return { label: 'مرتفع', color: 'text-orange-700', bg: 'bg-orange-100', border: 'border-orange-200' };
    if (score >= 31) return { label: 'متوسط', color: 'text-amber-700', bg: 'bg-amber-100', border: 'border-amber-200' };
    return { label: 'منخفض', color: 'text-emerald-700', bg: 'bg-emerald-100', border: 'border-emerald-200' };
  };

  const getIssueTitleArabic = (code: string) => {
    const map: Record<string, string> = {
      'MISSING_VENDOR': 'نقص في بيانات هوية المورد',
      'NEGATIVE_EXPENSE': 'طبيعة مصروف غير اعتيادية (رصيد دائن)',
      'MATH_MISMATCH': 'اختلال حسابي في هيكل الفاتورة',
      'MISSING_EXPECTED_VAT': 'اشتباه في تهرب أو خطأ ضريبي',
      'ZERO_VAT_EXPENSE': 'مصروف غير مشمول بالضريبة',
      'EXPENSE_SPIKE': 'طفرة مالية غير معتادة للمورد',
      'FUTURE_EXPENSE': 'تاريخ التزام مالي في المستقبل',
      'MISSING_CUSTOMER': 'عميل مجهول الهوية',
      'NEGATIVE_REVENUE': 'عكس غير منطقي للإيرادات',
      'REVENUE_WITHOUT_VAT': 'إيرادات مستبعدة ضريبياً بشكل مشتبه به',
      'MISSING_EMPLOYEE': 'مستفيد غير مدرج في السجلات',
      'NEGATIVE_PAYROLL': 'خصم غیر مبرر من الراتب',
      'PAYROLL_WITH_VAT': 'تطبيق ضريبة خاطئ على مسير راتب',
      'EXTRAORDINARY_PAYROLL': 'مدفوعات رواتب تتجاوز السقف الاستثنائي',
      'BANK_WITHDRAWAL': 'سحب بنكي دائن غير اعتيادي',
      'ZERO_BANK_TX': 'حركة بنكية صفرية مشبوهة',
      'UNALLOCATED_BANK_TX': 'حركة بنكية لم يتم توجيهها مالياً',
      'NEGATIVE_INVENTORY': 'عكس أو صرف مخزون غیر منطقي',
      'NEGATIVE_INVENTORY_VALUE': 'تقييم قيمة مخزون بالسالب',
      'MISSING_ITEM_CODE': 'حركة أصل أو مخزون غير معرف',
      'FUZZY_DUPLICATE': 'اشتباه في فاتورة مزدوجة',
      'EXACT_DUPLICATE': 'تكرار متطابق للسجل المالي',
      'INVALID_ID': 'عدم تطابق تسلسل المستند',
      'MISSING_TOTAL': 'نقص في مجموع المستند المالي',
      'NEGATIVE_AMOUNT': 'مبلغ مسجل بالسالب بدون سياق دائن',
      'VALID_NEGATIVE_AMOUNT': 'مستند دائن معتمد',
      'VALID_NEGATIVE_EXPENSE': 'مستند دائن معتمد',
      'VALID_NEGATIVE_REVENUE': 'مستند دائن معتمد',
      'LOGICAL_INCONSISTENCY': 'تناقض هيكلي في السجل المالي',
      'VAT_RATE_MISMATCH': 'نسبة الضريبة المسجلة غير مطابقة',
      'OUTSIDE_FISCAL_PERIOD': 'تسجيل مستند خارج الفترة المالية',
    };
    return map[code] || 'تنبيه جودة البيانات';
  };

  const hasCritical = summary.criticalIssues > 0;
  const formatCur = (val: number) => new Intl.NumberFormat('ar-SA', { style: 'currency', currency: 'SAR', maximumFractionDigits: 0 }).format(val);

  const displayedRecords = currentSession.records.filter(r => {
      if (filterStatus === 'ALL') return true;
      if (filterStatus === 'CLEAN') return r.issues.length === 0;
      if (filterStatus === 'CRITICAL') return r.issues.some(i => i.severity === 'CRITICAL');
      if (filterStatus === 'HIGH') return r.financialIntelligence.riskScore > 30;
      return true;
  });

  const renderIssue = (issue: any, idx: number, recordId: string) => (
    <div key={idx} className={`p-5 rounded-xl border bg-white ${issue.severity === 'CRITICAL' ? 'border-red-300 shadow-[0_0_15px_rgba(239,68,68,0.1)]' : (issue.severity === 'HIGH' ? 'border-orange-200 shadow-sm' : 'border-blue-200 shadow-sm')}`}>
       <div className="flex items-start gap-4">
          <div className={`mt-1 p-2 rounded-xl ${issue.severity === 'CRITICAL' ? 'bg-red-100' : (issue.severity === 'HIGH' ? 'bg-orange-100' : 'bg-blue-100')}`}>
             {issue.severity === 'CRITICAL' ? <ShieldAlert className="w-6 h-6 text-red-700" /> : (issue.severity === 'HIGH' ? <AlertTriangle className="w-6 h-6 text-orange-700" /> : <CheckCircle className="w-6 h-6 text-blue-700" />)}
          </div>
          <div className="flex-1">
            <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
              <h4 className="font-black text-slate-800 text-base">{getIssueTitleArabic(issue.code)}</h4>
              <span className={`text-[11px] px-2.5 py-1 rounded-lg font-black ${issue.severity === 'CRITICAL' ? 'bg-red-100 text-red-800 border border-red-200' : (issue.severity === 'HIGH' ? 'bg-orange-100 text-orange-800 border border-orange-200' : 'bg-blue-100 text-blue-800 border border-blue-200')}`}>
                  مستوى الخطر: {getSeverityArabic(issue.severity)}
              </span>
            </div>
            
            <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 mt-3">
              <p className="text-sm text-slate-700 leading-relaxed"><span className="font-black text-slate-800">التفسير المُحاسبي:</span> {issue.explanation || issue.message}</p>
            </div>
            
            {issue.severity !== 'LOW' && (
            <div className="mt-3">
              <p className="text-sm text-red-800 leading-relaxed font-medium flex items-start gap-2">
                  <XCircle className="w-4 h-4 text-red-500 mt-0.5 shrink-0" />
                  <span><strong className="font-black">التأثير المالي/النظامي:</strong> {issue.impact || 'قد يتسبب في اختلال التقارير المالية وتوجيهات الحسابات.'}</span>
              </p>
            </div>
            )}
            
            {/* Smart Actions */}
            {issue.suggestedFixes && issue.suggestedFixes.length > 0 && (
              <div className="mt-5 pt-4 border-t border-slate-200">
                <p className="text-xs font-black text-indigo-700 mb-3 flex items-center gap-1.5"><Settings className="w-4 h-4"/> الإجراءات التصحيحية المقترحة:</p>
                <div className="flex flex-wrap gap-3">
                  {issue.suggestedFixes.map((fix: any, fidx: number) => (
                    <button 
                      key={fidx}
                      onClick={() => handleApplyFix(recordId, fix, issue.code)}
                      className="bg-indigo-600 hover:bg-indigo-700 text-white border-none shadow-sm text-sm font-bold px-4 py-2.5 rounded-xl transition-all flex items-center gap-2 hover:shadow-lg"
                    >
                      <Check className="w-4 h-4" /> تنفيذ تلقائي: {fix.description}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
       </div>
    </div>
  );

  return (
    <div 
      onClick={handleBackdropClick}
      className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[1000] overflow-y-auto flex items-start justify-center p-4 md:p-8"
    >
      <div 
        dir="rtl"
        onClick={(e) => e.stopPropagation()}
        className="bg-white rounded-3xl w-full max-w-7xl overflow-hidden shadow-2xl border border-slate-100 my-auto animate-in fade-in zoom-in duration-200 font-sans"
      >
        <div className="bg-slate-50 flex flex-col overflow-hidden">
          
          {/* TOP SUMMARY BAR (Executive View) */}
          <div className="bg-white border-b border-slate-200 p-6 shadow-sm z-10">
             {/* Governance classification context banner — shown at the very top when staged */}
             {currentSession.classification && [
               'AMBIGUOUS_OVERLAP', 'OVERLAP_AMBIGUOUS', 'CORRECTED_VERSION', 'INVALID', 'UNPROCESSABLE'
             ].includes(currentSession.classification ?? '') && (
               <div className="mb-5 flex items-center gap-3 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 text-right" dir="rtl">
                 <Info className="w-5 h-5 text-amber-600 shrink-0" />
                 <p className="text-sm font-bold text-amber-900">
                   {currentSession.classification === 'AMBIGUOUS_OVERLAP' || currentSession.classification === 'OVERLAP_AMBIGUOUS'
                     ? '⚠️ هذا الملف مرفوع قيد القرار بسبب احتمالية التداخل مع ملف نشط. يرجى مراجعة السجلات أدناه ثم العودة لإدارة الملفات لاختيار: إضافة كمصدر جديد أو استبداله أو إلغاؤه.'
                     : currentSession.classification === 'CORRECTED_VERSION'
                     ? '🔄 هذا الملف مرشح كنسخة مصححة لملف موجود. راجع السجلات ثم اختر من إدارة الملفات: استخدامه كبديل أو إلغاؤه.'
                     : currentSession.classification === 'UNPROCESSABLE'
                     ? '🚫 تعذر تحليل هيكل هذا الملف. مراجعة الأخطاء الهيكلية أدناه ثم إلغاؤه وإعادة رفعه بعد التدقيق.'
                     : '⛔ يحتوي هذا الملف على أخطاء هيكلية أو مالية. راجع الأخطاء أدناه ثم قرر الإبقاء أو الإلغاء.'}
                 </p>
               </div>
             )}
             <div className="flex justify-between items-center mb-6">
                <div>
                  <h1 className="text-2xl font-black text-slate-800 tracking-tight flex items-center gap-3">
                    <Activity className="w-8 h-8 text-indigo-600" /> 
                    فحص ومراجعة السجلات
                    <span className="text-sm border border-indigo-200 ml-2 font-bold bg-indigo-50 text-indigo-800 px-3 py-1.5 rounded-full shadow-sm">
                      {getGateLabel()}
                    </span>
                  </h1>
                  <p className="text-sm font-medium text-slate-500 mt-2">رقم الجلسة الرقابية: <span className="font-mono bg-slate-100 px-2 py-0.5 rounded">{currentSession.sessionId.substring(0,8)}</span></p>
                </div>
                <div className="flex items-center gap-3">
                   <button 
                     onClick={currentSession.classification === 'UNPROCESSABLE' ? handleUnprocessableCancel : handleExitClick} 
                     className="bg-white text-slate-600 border border-slate-300 hover:bg-slate-50 hover:text-slate-800 font-bold px-5 py-2.5 rounded-xl text-sm transition-all shadow-sm flex items-center gap-1.5"
                   >
                     ← العودة إلى إدارة الملفات
                   </button>
                   {!currentSession.classification && (
                     <button onClick={handleApproveClean} className="bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100 font-bold px-5 py-2.5 rounded-xl text-sm transition-all shadow-sm flex items-center gap-2">
                       <CheckCircle className="w-4 h-4" /> اعتماد السجلات السليمة
                     </button>
                   )}
                   <button onClick={currentSession.classification === 'UNPROCESSABLE' ? handleUnprocessableCancel : handleExitClick} className="p-2 hover:bg-slate-100 rounded-xl transition-colors shrink-0" title="إغلاق المراجعة">
                     <X className="w-5 h-5 text-slate-500" />
                   </button>
                </div>
             </div>

             {/* Render Statistics Cards (Hidden or replaced for Unprocessable files to avoid misleading actions) */}
             {currentSession.classification === 'UNPROCESSABLE' ? (
               <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-center gap-3">
                 <XCircle className="w-6 h-6 text-red-600 shrink-0" />
                 <p className="text-sm font-bold text-red-950">
                   فشل تحليل بنية وهيكل هذا الملف المرفوع. لا تتوفر أي إحصاءات أو حركات صالحة للعرض.
                 </p>
               </div>
             ) : (
               <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
                  <div 
                    onClick={() => setFilterStatus('ALL')}
                    className={`border rounded-xl p-4 relative overflow-hidden cursor-pointer transition-all hover:shadow-sm ${filterStatus === 'ALL' ? 'bg-slate-100 border-slate-400 ring-2 ring-slate-200' : 'bg-slate-50 border-slate-200'}`}
                  >
                     <p className="text-xs font-bold text-slate-500 mb-1">إجمالي السجلات المفحوصة</p>
                     <p className="text-3xl font-black text-slate-800">{summary.totalRecords}</p>
                     <FileText className="absolute left-[-10px] bottom-[-10px] w-16 h-16 text-slate-200 opacity-50" />
                  </div>
                  <div 
                    onClick={() => setFilterStatus('CLEAN')}
                    className={`border rounded-xl p-4 relative overflow-hidden cursor-pointer transition-all hover:shadow-sm ${filterStatus === 'CLEAN' ? 'bg-emerald-100 border-emerald-400 ring-2 ring-emerald-200' : 'bg-emerald-50 border-emerald-200'}`}
                  >
                     <p className="text-xs font-bold text-emerald-700 mb-1">سجلات سليمة فنيًا</p>
                     <p className="text-3xl font-black text-emerald-800">{summary.cleanRecords}</p>
                     <CheckCircle className="absolute left-[-10px] bottom-[-10px] w-16 h-16 text-emerald-200 opacity-50" />
                  </div>
                  <div 
                    onClick={() => setFilterStatus('CRITICAL')}
                    className={`border rounded-xl p-4 relative overflow-hidden cursor-pointer transition-all hover:shadow-sm ${filterStatus === 'CRITICAL' ? 'bg-red-100 border-red-400 ring-2 ring-red-200' : 'bg-red-50 border-red-200'}`}
                  >
                     <p className="text-xs font-bold text-red-700 mb-1">أخطاء جودة السطور</p>
                     <p className="text-3xl font-black text-red-800">{summary.criticalIssues}</p>
                     <ShieldAlert className="absolute left-[-10px] bottom-[-10px] w-16 h-16 text-red-200 opacity-50" />
                  </div>
                  <div 
                    onClick={() => setFilterStatus('HIGH')}
                    className={`border rounded-xl p-4 relative overflow-hidden cursor-pointer transition-all hover:shadow-sm ${filterStatus === 'HIGH' ? 'bg-orange-100 border-orange-400 ring-2 ring-orange-200' : 'bg-orange-50 border-orange-200'}`}
                  >
                     <p className="text-xs font-bold text-orange-700 mb-1">مخاطر جودة السطور</p>
                     <p className="text-3xl font-black text-orange-800">{summary.highRiskCount}</p>
                     <AlertTriangle className="absolute left-[-10px] bottom-[-10px] w-16 h-16 text-orange-200 opacity-50" />
                  </div>
                  <div className="bg-indigo-50 border border-indigo-200 rounded-xl p-4 relative overflow-hidden cursor-default">
                     <p className="text-xs font-bold text-indigo-700 mb-1">{getExposureLabel()}</p>
                     <p className="text-3xl font-black text-indigo-800">{formatCur(summary.totalFinancialExposure)}</p>
                     <DollarSign className="absolute left-[-10px] bottom-[-10px] w-16 h-16 text-indigo-200 opacity-50" />
                  </div>
               </div>
             )}
          </div>

          {/* CONTROLS */}
          {currentSession.classification !== 'UNPROCESSABLE' && (
            <div className="flex items-center justify-between px-6 py-3 bg-white border-b border-slate-200 shadow-sm z-10">
              <div className="flex items-center gap-3">
                 <span className="text-sm font-bold text-slate-700 flex items-center gap-1.5"><Filter className="w-4 h-4 text-slate-500" /> عرض السجلات:</span>
                 <span className="text-sm font-black text-indigo-700 bg-indigo-50 px-3 py-1 rounded-full border border-indigo-100">
                   {filterStatus === 'ALL' && 'الكل'}
                   {filterStatus === 'CLEAN' && 'السليمة فقط'}
                   {filterStatus === 'CRITICAL' && 'الحرجة فقط'}
                   {filterStatus === 'HIGH' && 'المخاطر فقط'}
                 </span>
              </div>
            </div>
          )}

          {/* RECORD TABLE (Main Grid) */}
          <div className="flex-1 overflow-auto p-6 bg-slate-50/50 min-h-[400px]">

            {currentSession.classification && ['AMBIGUOUS_OVERLAP', 'OVERLAP_AMBIGUOUS', 'CORRECTED_VERSION'].includes(currentSession.classification ?? '') ? (
              <div className="flex flex-col gap-6">

                {/* === MANDATORY GOVERNANCE DECISION BLOCK === */}
                <div className="bg-gradient-to-br from-amber-50 to-orange-50 border-2 border-amber-300 rounded-2xl p-8 shadow-md text-right" dir="rtl">
                  <div className="flex items-start gap-5">
                    <div className="w-14 h-14 rounded-2xl bg-amber-100 border-2 border-amber-300 flex items-center justify-center shrink-0">
                      <Info className="w-8 h-8 text-amber-700" />
                    </div>
                    <div className="flex-1">
                      <h2 className="text-xl font-black text-amber-900 mb-3">
                        هذا الملف يحتاج إلى قرار قبل إدراجه في التقارير
                      </h2>
                      <p className="text-sm font-medium text-amber-950 leading-relaxed mb-5">
                        {currentSession.classification === 'AMBIGUOUS_OVERLAP' || currentSession.classification === 'OVERLAP_AMBIGUOUS'
                          ? 'لم يتم إدراج هذا الملف في التقارير لأن النظام اكتشف احتمال تداخل أو تعارض مع ملف نشط أو ملف سابق لنفس الفترة. قد تكون السجلات نفسها قابلة للقراءة، لكن القرار المطلوب هنا على مستوى الملف وليس على مستوى السطر.'
                          : 'لم يتم إدراج هذا الملف في التقارير لأنه يبدو نسخة مصححة أو محدّثة لملف موجود مسبقاً. القرار المطلوب هنا على مستوى الملف: هل يحل هذا الملف محل القديم أم يُضاف كمصدر منفصل؟'}
                      </p>

                      {/* === DETAILED OVERLAP ANALYSIS CARD === */}
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-5 text-right">
                        <div className="bg-white/90 border border-amber-200 rounded-xl p-4 flex flex-col justify-center">
                          <span className="text-xs font-black text-amber-800 mb-1">الفترة الزمنية للملف</span>
                          <span className="text-sm font-bold text-slate-800 font-mono" dir="ltr">
                            {((currentSession as any).dateRange?.from || 'غير محدد')} &rarr; {((currentSession as any).dateRange?.to || 'غير محدد')}
                          </span>
                        </div>
                        <div className="bg-white/90 border border-amber-200 rounded-xl p-4 flex flex-col justify-center">
                          <span className="text-xs font-black text-amber-800 mb-1">الحركات المتداخلة مع النظام</span>
                          <span className="text-sm font-bold text-slate-800">
                            {((currentSession as any).recordsMatchingActiveBusinessKeys !== undefined)
                              ? `${(currentSession as any).recordsMatchingActiveBusinessKeys} حركة مكررة مع ملف نشط`
                              : 'لا توجد حركات مكررة بالكامل'}
                          </span>
                        </div>
                        <div className="bg-white/90 border border-amber-200 rounded-xl p-4 flex flex-col justify-center">
                          <span className="text-xs font-black text-amber-800 mb-1">مستوى القرار والتدقيق</span>
                          <span className="text-sm font-black text-amber-900">
                            قرار حوكمة على مستوى الملف بأكمله
                          </span>
                        </div>
                      </div>

                      <div className="bg-white/80 border border-amber-200 rounded-xl p-5 mb-5">
                        <p className="text-sm font-black text-amber-800 mb-3">الإجراء الموصى به:</p>
                        <p className="text-sm text-amber-900 leading-relaxed">
                          ارجع إلى إدارة الملفات واختر أحد الخيارات التالية:
                        </p>
                        <ul className="mt-3 space-y-2">
                          <li className="flex items-center gap-2 text-sm text-amber-900 font-medium">
                            <span className="w-6 h-6 rounded-full bg-emerald-100 border border-emerald-300 flex items-center justify-center text-emerald-700 font-black text-xs shrink-0">١</span>
                            <strong>إضافة كمصدر جديد</strong> — إذا كان الملف يغطي فترة مختلفة أو بيانات إلافية غير متداخلة
                          </li>
                          <li className="flex items-center gap-2 text-sm text-amber-900 font-medium">
                            <span className="w-6 h-6 rounded-full bg-blue-100 border border-blue-300 flex items-center justify-center text-blue-700 font-black text-xs shrink-0">٢</span>
                            <strong>استخدامه كبديل</strong> — إذا كان يحل محل ملف نشط سابق لنفس الفترة
                          </li>
                          <li className="flex items-center gap-2 text-sm text-amber-900 font-medium">
                            <span className="w-6 h-6 rounded-full bg-slate-100 border border-slate-300 flex items-center justify-center text-slate-700 font-black text-xs shrink-0">٣</span>
                            <strong>إلغاء الملف المرفوع</strong> — إذا كان مكرراً أو خاطئاً
                          </li>
                        </ul>
                      </div>

                      <button
                        onClick={handleExitClick}
                        className="inline-flex items-center gap-2 px-6 py-3 bg-amber-700 hover:bg-amber-800 text-white font-black rounded-xl transition-all shadow-md text-sm"
                      >
                        <X className="w-4 h-4" /> العودة إلى إدارة الملفات لاتخاذ القرار
                      </button>
                    </div>
                  </div>
                </div>

                {/* === RECORDS SECTION (for context review) === */}
                {displayedRecords.length > 0 ? (
                  <div>
                    <div className="flex items-center gap-2 mb-4 mt-6" dir="rtl">
                      <BarChart className="w-5 h-5 text-slate-500" />
                      <h3 className="text-base font-black text-slate-700">سجلات الملف — للمراجعة والاطلاع فقط</h3>
                      <span className="text-xs font-bold bg-slate-100 border border-slate-200 text-slate-500 px-2.5 py-1 rounded-full">لا يؤثر على التقارير</span>
                    </div>
                    <div className="space-y-4 opacity-80">
                      {displayedRecords.map((record) => {
                        const isExpanded = expandedRows[record.id];
                        const hasCriticalError = record.issues.some(i => i.severity === 'CRITICAL');
                        const entity = record.normalizedData.Item_Code || record.normalizedData.Entity_Name || record.normalizedData.Raw_Entity || 'جهة غير معرفة';
                        const amt = record.normalizedData.Total_Amount || record.normalizedData.Quantity || 0;
                        const score = record.financialIntelligence.riskScore;
                        const riskObj = getRiskLevel(score);
                        let borderColor = 'border-slate-200 shadow-sm';
                        if (hasCriticalError) borderColor = 'border-red-300 shadow-sm ring-1 ring-red-100';
                        else if (score > 30) borderColor = 'border-orange-200 shadow-sm';
                        return (
                          <div key={record.id} className={`bg-white rounded-xl border ${borderColor} overflow-hidden transition-all duration-200`}>
                            <div
                              className="px-5 py-4 flex items-center justify-between cursor-pointer hover:bg-slate-50"
                              onClick={() => toggleRow(record.id)}
                            >
                              <div className="flex items-center gap-5 flex-1">
                                <div className={`w-12 h-12 rounded-xl flex items-center justify-center font-black text-lg border ${riskObj.bg} ${riskObj.color} ${riskObj.border}`}>
                                  {score}
                                </div>
                                <div>
                                  <p className="font-bold text-slate-800">{entity}</p>
                                  <p className="text-xs text-slate-500 mt-0.5">
                                    {record.normalizedData.Invoice_Number || record.normalizedData.Document_Number || ''}
                                    {amt > 0 ? ` · ${formatCur(amt)}` : ''}
                                  </p>
                                </div>
                                <div className="flex-1 flex gap-2 justify-end">
                                  {hasCriticalError && (
                                    <span className="px-3 py-1 bg-red-100 text-red-700 text-xs font-bold rounded-lg border border-red-200 flex items-center gap-1">
                                      <ShieldAlert className="w-3.5 h-3.5" /> تنبيه مالي
                                    </span>
                                  )}
                                  {record.issues.length === 0 && (
                                    <span className="px-3 py-1 bg-emerald-50 text-emerald-700 text-xs font-bold rounded-lg border border-emerald-200">
                                      سجل سليم
                                    </span>
                                  )}
                                </div>
                              </div>
                              <div className="pr-3 border-r border-slate-200 mr-2">
                                {isExpanded ? <ChevronDown className="w-5 h-5 text-slate-400" /> : <ChevronRight className="w-5 h-5 text-slate-400" />}
                              </div>
                            </div>
                            {isExpanded && record.issues.length > 0 && (
                              <div className="p-5 bg-slate-50 border-t border-slate-100 space-y-3">
                                <p className="text-xs font-bold text-slate-500 mb-2">التنبيهات المكتشفة في هذا السجل:</p>
                                {record.issues.map((issue, idx) => (
                                  <div key={idx} className={`p-3 rounded-lg border text-sm ${issue.severity === 'CRITICAL' ? 'bg-red-50 border-red-200 text-red-900' : 'bg-orange-50 border-orange-200 text-orange-900'}`} dir="rtl">
                                    <p className="font-bold">{getIssueTitleArabic(issue.code)}</p>
                                    <p className="text-xs mt-1 opacity-80">{issue.explanation || issue.message}</p>
                                  </div>
                                ))}
                              </div>
                            )}
                            {isExpanded && record.issues.length === 0 && (
                              <div className="p-5 bg-emerald-50/50 border-t border-emerald-100 text-center">
                                <p className="text-sm text-emerald-700 font-bold flex items-center justify-center gap-2">
                                  <CheckCircle className="w-4 h-4" /> لا توجد مشكلات مكتشفة في هذا السجل
                                </p>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ) : (
                  /* Specific empty state for filtered lists under governance classification */
                  <div className="bg-white border border-slate-200 rounded-xl p-6 text-center shadow-sm" dir="rtl">
                    <CheckCircle className="w-12 h-12 text-emerald-500 mx-auto mb-3" />
                    <p className="font-bold text-slate-700 mb-1">
                      {filterStatus === 'CRITICAL'
                        ? 'سجلات الملف سليمة فنيًا بنسبة 100% وخالية من الأخطاء الفردية'
                        : filterStatus === 'HIGH'
                        ? 'لا توجد مخاطر مالية على مستوى السطور أو السجلات الفردية'
                        : 'سجلات الملف سليمة — لا توجد مشكلات مكتشفة'}
                    </p>
                    <p className="text-xs text-slate-500 max-w-lg mx-auto leading-relaxed mt-1.5">
                      {filterStatus === 'CRITICAL' || filterStatus === 'HIGH'
                        ? 'لقد تم تصفية العرض، وتظهر البيانات خالية تماماً من العيوب الفنية والمالية الفردية. يرجى العلم بأن تعليق هذا الملف هو قرار حوكمة إداري على مستوى الملف بالكامل نتيجة تداخل التواريخ مع ملف نشط، وليس بسبب عيوب في الأسطر.'
                        : 'جميع سجلات هذا الملف سليمة ومطابقة للمعايير المالية الفنية، والتعليق الحالي هو قرار إداري على مستوى الملف بالكامل بسبب تداخل البيانات.'}
                    </p>
                  </div>
                )}
              </div>

            ) : currentSession.records.length === 0 && currentSession.skippedRows && currentSession.skippedRows.length > 0 ? (
              /* PATH B: UNPROCESSABLE / STRUCTURAL ERROR FILE */
              <div className="flex flex-col items-center justify-center h-full text-slate-500 p-8 max-w-2xl mx-auto">
                 <XCircle className="w-16 h-16 text-rose-500 mb-4 animate-bounce" />
                 <h2 className="text-2xl font-black text-rose-800 mb-3 text-center">فشل تحليل هيكل ومحتوى المستند</h2>
                 <p className="text-sm text-slate-600 mb-6 text-center leading-relaxed">
                    تعذر استخلاص أي سجلات صالحة من الملف المرفوع بسبب أخطاء هيكلية أو خلوه من البيانات الرقمية المطلوبة. يرجى مراجعة تفاصيل المشكلة أدناه.
                 </p>
                 
                 <div className="w-full bg-white border border-rose-100 rounded-2xl p-6 shadow-sm mb-6">
                    <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2 border-b pb-2 text-sm">
                       <AlertTriangle className="w-4 h-4 text-rose-500" />
                       تفاصيل الخلل الهيكلي:
                    </h3>
                    <div className="space-y-3 max-h-[200px] overflow-y-auto pr-2">
                       {currentSession.skippedRows.map((row: any, idx: number) => {
                          let arReason = row.reason || 'خطأ هيكلي غير معروف';
                          if (arReason.includes('Structural: No numeric values')) {
                              arReason = 'لم يتم العثور على أي قيم رقمية صالحة (المبالغ والضريبة) في هذا السطر.';
                          }
                          return (
                             <div key={idx} className="bg-rose-50/50 border border-rose-100/50 p-3 rounded-lg text-xs flex flex-col gap-1 text-right" dir="rtl">
                                <div className="flex justify-between items-center">
                                   <span className="font-bold text-rose-800">تنبيه بنية البيانات #{idx + 1}</span>
                                   {row.rowIndex !== undefined && (
                                      <span className="bg-rose-100/80 text-rose-950 px-2 py-0.5 rounded font-black">السطر: {row.rowIndex}</span>
                                   )}
                                </div>
                                <p className="text-slate-700 mt-1">
                                   <strong className="text-slate-800">طبيعة المشكلة:</strong> {arReason}
                                </p>
                             </div>
                          );
                       })}
                    </div>
                 </div>

                 <div className="text-xs text-slate-500 text-center bg-slate-100 px-4 py-2.5 rounded-lg border w-full">
                    <span className="font-black text-slate-700">التوجيه المالي:</span> يرجى تدقيق ملف Excel والتأكد من وجود الأعمدة الأساسية (المبلغ الإجمالي، الضريبة، تاريخ الفاتورة) وتوفر القيم الصالحة قبل إعادة رفعه.
                 </div>
              </div>

            ) : displayedRecords.length === 0 ? (
              /* PATH C: FILTER SHOWS 0 RECORDS (Standard flow specific empty state) */
              <div className="flex flex-col items-center justify-center h-full text-slate-500 py-16">
                <CheckCircle className="w-16 h-16 text-amber-300 mb-4" />
                <h2 className="text-xl font-bold text-slate-700 mb-2">لا توجد سجلات مطابقة للتصفية المحددة.</h2>
                <p className="text-sm text-slate-500">
                  {currentSession.classification
                    ? 'هذا الملف معلق حالياً كقرار حوكمة على مستوى الملف بالكامل، وتظهر السطور خالية من الفئة المحددة.'
                    : 'يمكنك تعديل خيارات التصفية لعرض السجلات الأخرى.'}
                </p>
              </div>

            ) : (
              /* PATH D: STANDARD REVIEW - RECORDS LIST */
              <div className="space-y-6">
                {displayedRecords.map((record) => {
                  const isExpanded = expandedRows[record.id];
                  const hasCriticalError = record.issues.some(i => i.severity === 'CRITICAL');
                  const entity = record.normalizedData.Item_Code || record.normalizedData.Entity_Name || record.normalizedData.Raw_Entity || 'جهة غير معرفة';
                  const amt = record.normalizedData.Total_Amount || record.normalizedData.Quantity || 0;
                  const score = record.financialIntelligence.riskScore;
                  const riskObj = getRiskLevel(score);

                  let borderColor = 'border-slate-300 shadow-sm';
                  if (record.status === 'REJECTED') borderColor = 'border-red-300 shadow-sm opacity-60';
                  else if (record.status === 'APPROVED') borderColor = 'border-emerald-300 shadow-sm opacity-80';
                  else if (hasCriticalError) borderColor = 'border-red-400 shadow-sm ring-2 ring-red-100';
                  else if (score > 30) borderColor = 'border-orange-300 shadow-sm';

                  return (
                    <div key={record.id} className={`bg-white rounded-xl border ${borderColor} overflow-hidden transition-all duration-200`}>
                      <div className="px-6 py-5 flex items-center justify-between cursor-pointer hover:bg-slate-50" onClick={() => toggleRow(record.id)}>
                        <div className="flex items-center gap-8 flex-1">
                          <div className="flex flex-col items-center justify-center min-w-[100px]">
                             <div className={`w-14 h-14 rounded-xl flex items-center justify-center font-black text-xl shadow-sm border mb-1 ${riskObj.bg} ${riskObj.color} ${riskObj.border}`}>
                               {score}
                             </div>
                             <span className={`text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md ${riskObj.bg} ${riskObj.color}`}>{riskObj.label}</span>
                          </div>
                          <div className="w-1/4 pr-4">
                            <p className="text-xs font-bold text-slate-400 mb-1">{getEntityLabel()}</p>
                            <p className="font-bold text-slate-800 text-lg truncate" title={entity}>{entity}</p>
                          </div>
                          <div className="w-1/6">
                            <p className="text-xs font-bold text-slate-400 mb-1">{appMode === 'inventory' ? 'رقم المستند / المعرف' : 'رقم الفاتورة / المستند'}</p>
                            <p className="font-bold text-slate-700 font-mono text-base">{record.normalizedData.Invoice_Number || record.normalizedData.Document_Number || 'غير متوفر'}</p>
                          </div>
                          <div className="w-1/5">
                            <p className="text-xs font-bold text-slate-400 mb-1">{appMode === 'inventory' ? 'الكمية / القيمة' : 'المبلغ الإجمالي'}</p>
                            <p className="font-black text-slate-800 text-lg">{appMode === 'inventory' ? amt : formatCur(amt)}</p>
                          </div>
                          <div className="flex-1 flex gap-2 justify-end pl-4">
                             {record.status === 'REJECTED' && <span className="px-3 py-1.5 bg-slate-100 text-slate-600 text-xs font-bold rounded-xl border border-slate-200 flex items-center gap-1"><XCircle className="w-4 h-4"/> تم الاستبعاد</span>}
                             {record.status === 'APPROVED' && <span className="px-3 py-1.5 bg-emerald-100 text-emerald-800 text-xs font-bold rounded-xl border border-emerald-200 flex items-center gap-1"><CheckCircle className="w-4 h-4"/> تم الاعتماد</span>}
                             {record.status === 'EDITED' && <span className="px-3 py-1.5 bg-indigo-100 text-indigo-800 text-xs font-bold rounded-xl border border-indigo-200 flex items-center gap-1"><Edit3 className="w-4 h-4"/> تم التعديل يدوياً</span>}
                             {record.status === 'PENDING' && record.issues.length > 0 && (
                                 <div className="flex items-center gap-2">
                                   {hasCriticalError ? (
                                       <span className="px-3 py-1.5 bg-red-100 text-red-800 text-sm font-black rounded-xl border border-red-200 flex items-center gap-1.5 shadow-sm"><ShieldAlert className="w-4 h-4"/> إيقاف مالي عاجل</span>
                                   ) : (
                                       <span className="px-3 py-1.5 bg-orange-100 text-orange-800 text-sm font-bold rounded-xl border border-orange-200 flex items-center gap-1.5">يتطلب قرارك ({record.issues.length})</span>
                                   )}
                                 </div>
                             )}
                          </div>
                        </div>
                        <div className="pr-4 border-r border-slate-200 mr-2">
                          {isExpanded ? <ChevronDown className="w-6 h-6 text-slate-400" /> : <ChevronRight className="w-6 h-6 text-slate-400" />}
                        </div>
                      </div>

                      {isExpanded && (
                        <div className="p-8 bg-slate-50 border-t border-slate-200 grid lg:grid-cols-[2fr_1fr] gap-8 shadow-inner">
                           <div>
                              <h3 className="text-base font-black text-slate-800 mb-5 flex items-center gap-2 border-b border-slate-200 pb-3">
                                 <Activity className="w-5 h-5 text-indigo-600" /> تحليل المخاطر والمشكلات المكتشفة
                              </h3>
                              {record.issues.some(i => i.severity === 'CRITICAL' || i.severity === 'HIGH') && (
                                <div className="space-y-4">
                                  {record.issues.filter(i => i.severity === 'CRITICAL' || i.severity === 'HIGH').map((issue, idx) => (
                                    <div key={idx} className={`p-5 rounded-xl border bg-white ${issue.severity === 'CRITICAL' ? 'border-red-300 shadow-[0_0_15px_rgba(239,68,68,0.1)]' : 'border-orange-200 shadow-sm'}`}>
                                       <div className="flex items-start gap-4">
                                         <div className={`mt-1 p-2 rounded-xl ${issue.severity === 'CRITICAL' ? 'bg-red-100' : 'bg-orange-100'}`}>
                                            {issue.severity === 'CRITICAL' ? <ShieldAlert className="w-6 h-6 text-red-700" /> : <AlertTriangle className="w-6 h-6 text-orange-700" />}
                                         </div>
                                         <div className="flex-1">
                                           <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                                             <h4 className="font-black text-slate-800 text-base">{getIssueTitleArabic(issue.code)}</h4>
                                             <span className={`text-[11px] px-2.5 py-1 rounded-lg font-black ${issue.severity === 'CRITICAL' ? 'bg-red-100 text-red-800 border border-red-200' : 'bg-orange-100 text-orange-800 border border-orange-200'}`}>
                                                 مستوى الخطر: {getSeverityArabic(issue.severity)}
                                             </span>
                                           </div>
                                           <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 mt-3 space-y-3">
                                             <div>
                                               <p className="text-sm font-black text-slate-800 flex items-center gap-1.5"><Search className="w-4 h-4 text-slate-500"/> ماذا اكتشف النظام؟</p>
                                               <p className="text-sm text-slate-600 mt-1 mr-5">{issue.explanation || issue.message || 'اكتشف النظام تعارضا في القيم المالية ضمن السياق. يرجى المراجعة.'}</p>
                                             </div>
                                             {(issue.impact || issue.severity !== "LOW") && (
                                               <div>
                                                 <p className="text-sm font-black text-red-800 flex items-center gap-1.5"><AlertTriangle className="w-4 h-4 text-red-500"/> لماذا تعتبر مخاطرة (التأثير المالي/النظامي)؟</p>
                                                 <p className="text-sm text-red-700 mt-1 mr-5">{issue.impact || 'قد يتسبب في اختلال التقارير المالية والإقرارات الضريبية، مما يستوجب توجيه قيود تصحيحية لاحقا.'}</p>
                                               </div>
                                             )}
                                           </div>
                                           {issue.suggestedFixes && issue.suggestedFixes.length > 0 && (
                                             <div className="mt-5 pt-4 border-t border-slate-200 bg-indigo-50/30 -mx-5 -mb-5 p-5 rounded-b-2xl">
                                               <p className="text-xs font-black text-indigo-700 mb-3 flex items-center gap-1.5"><Settings className="w-4 h-4"/> الإجراء المقترح (تصحيح ذكي):</p>
                                               <div className="flex flex-wrap gap-3">
                                                 {issue.suggestedFixes.map((fix, fidx) => (
                                                   <button 
                                                     key={fidx}
                                                     onClick={() => handleApplyFix(record.id, fix, issue.code)}
                                                     className="bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm text-sm font-bold px-5 py-2.5 rounded-xl transition-all flex items-center gap-2 hover:shadow-lg hover:-translate-y-0.5"
                                                   >
                                                     <RefreshCw className="w-4 h-4" /> تطبيق التصحيح التلقائي: {fix.description}
                                                   </button>
                                                 ))}
                                               </div>
                                             </div>
                                           )}
                                         </div>
                                       </div>
                                    </div>
                                  ))}
                                </div>
                              )}
                              {record.issues.some(i => i.severity !== 'CRITICAL' && i.severity !== 'HIGH') && (
                                 <details className="mt-4 group bg-slate-50 border border-slate-200 rounded-xl overflow-hidden focus-within:ring-2 focus-within:ring-indigo-500">
                                     <summary className="p-4 cursor-pointer font-bold text-slate-700 flex items-center gap-2 hover:bg-slate-100 transition-colors list-none">
                                        <ChevronDown className="w-5 h-5 text-slate-400 group-open:-rotate-180 transition-transform" />
                                        إظهار الملاحظات الإرشادية والتحذيرات ({record.issues.filter(i => i.severity !== 'CRITICAL' && i.severity !== 'HIGH').length})
                                     </summary>
                                     <div className="p-4 border-t border-slate-200 space-y-4 bg-white">
                                       {record.issues.filter(i => i.severity !== 'CRITICAL' && i.severity !== 'HIGH').map((issue, idx) => renderIssue(issue, idx, record.id))}
                                     </div>
                                 </details>
                              )}
                           </div>

                           <div>
                              <h3 className="text-base font-black text-slate-800 mb-5 flex items-center gap-2 border-b border-slate-200 pb-3">
                                 <FileText className="w-5 h-5 text-slate-500" /> قرار و وثيقة البيانات
                              </h3>
                              <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm relative">
                                 <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6 pb-5 border-b border-slate-100">
                                    <button onClick={() => setEditingRecord(record.id)} className="text-sm font-bold bg-white text-indigo-700 hover:bg-indigo-50 py-2.5 rounded-xl transition-colors border border-indigo-200 shadow-sm flex justify-center items-center gap-2">
                                      <Edit3 className="w-4 h-4" /> تعديل يدوي
                                    </button>
                                    <button onClick={() => handleOverrideAndApprove(record.id)} className="text-sm font-bold bg-white text-emerald-700 hover:bg-emerald-50 py-2.5 rounded-xl transition-colors border border-emerald-200 shadow-sm flex justify-center items-center gap-2">
                                       <CheckCircle className="w-4 h-4" /> اعتماد استثنائي
                                    </button>
                                    <button onClick={() => handleSingleEscalate(record.id)} className="text-sm font-bold bg-white text-orange-700 hover:bg-orange-50 py-2.5 rounded-xl transition-colors border border-orange-200 shadow-sm flex justify-center items-center gap-2">
                                      <ShieldAlert className="w-4 h-4" /> تصعيد للحوكمة
                                    </button>
                                    <button onClick={() => handleRejectRecord(record.id)} className="text-sm font-bold bg-white text-red-600 hover:bg-red-50 py-2.5 rounded-xl transition-colors border border-red-200 shadow-sm flex justify-center items-center gap-2">
                                      <XCircle className="w-4 h-4" /> استبعاد السجل
                                    </button>
                                 </div>

                                 {editingRecord === record.id ? (
                                   <div className="space-y-4">
                                      <div className="grid grid-cols-2 gap-3">
                                       <div>
                                         <label className="text-xs font-bold text-slate-600 mb-1 block">مبلغ الصافي</label>
                                         <input 
                                           type="number" 
                                           value={(editValues[record.id] && editValues[record.id].Net_Amount !== undefined) ? editValues[record.id].Net_Amount : (record.normalizedData.Net_Amount || '')} 
                                           onChange={(e) => handleAmountChange(record.id, 'Net_Amount', Number(e.target.value))}
                                           className="w-full text-sm font-bold border border-slate-300 rounded-xl px-4 py-2.5 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-left dir-ltr"
                                         />
                                       </div>
                                       <div>
                                         <label className="text-xs font-bold text-slate-600 mb-1 block">مبلغ الضريبة</label>
                                         <input 
                                           type="number" 
                                           value={(editValues[record.id] && editValues[record.id].VAT_Amount !== undefined) ? editValues[record.id].VAT_Amount : (record.normalizedData.VAT_Amount || '')} 
                                           onChange={(e) => handleAmountChange(record.id, 'VAT_Amount', Number(e.target.value))}
                                           className="w-full text-sm font-bold border border-slate-300 rounded-xl px-4 py-2.5 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-left dir-ltr"
                                         />
                                       </div>
                                      </div>
                                      <div className="grid grid-cols-2 gap-3">
                                       <div>
                                           <label className="text-xs font-bold text-slate-600 mb-1 block">الإجمالي الكلي</label>
                                           <input 
                                             type="number" 
                                             value={(editValues[record.id] && editValues[record.id].Total_Amount !== undefined) ? editValues[record.id].Total_Amount : (record.normalizedData.Total_Amount || '')} 
                                             onChange={(e) => handleAmountChange(record.id, 'Total_Amount', Number(e.target.value))}
                                             className="w-full text-sm font-bold border border-slate-300 rounded-xl px-4 py-2.5 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-left dir-ltr"
                                           />
                                       </div>
                                       <div>
                                         <label className="text-xs font-bold text-slate-600 mb-1 block">تاريخ المستند</label>
                                         <input 
                                           type="date" 
                                           defaultValue={record.normalizedData.Invoice_Date ? new Date(record.normalizedData.Invoice_Date).toISOString().split('T')[0] : ''} 
                                           onChange={(e) => setEditValues({...editValues, [record.id]: {...(editValues[record.id]||{}), Invoice_Date: e.target.value}})}
                                           className="w-full text-sm font-bold border border-slate-300 rounded-xl px-4 py-2.5 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-left dir-ltr"
                                         />
                                       </div>
                                      </div>
                                      <div className="flex gap-2 justify-end pt-3 border-t border-slate-100">
                                         <button onClick={() => setEditingRecord(null)} className="text-sm font-bold px-4 py-2 text-slate-500 hover:text-slate-800 transition-colors">إلغاء</button>
                                         <button onClick={() => handleSaveEdit(record.id)} className="bg-emerald-600 text-white font-bold text-sm px-6 py-2 rounded-xl hover:bg-emerald-700 shadow-sm transition-colors">حفظ التغييرات</button>
                                      </div>
                                   </div>
                                 ) : (
                                   <div className="grid grid-cols-1 gap-y-3 gap-x-2 text-sm">
                                     <div className="flex justify-between items-center bg-slate-50 p-2 rounded-lg border border-slate-100"><span className="text-xs font-bold text-slate-500">الإجمالي الكلي</span> <span className="font-black text-slate-800 text-base">{formatCur(record.normalizedData.Total_Amount)}</span></div>
                                     <div className="flex justify-between items-center bg-slate-50 p-2 rounded-lg border border-slate-100"><span className="text-xs font-bold text-slate-500">المبلغ الصافي</span> <span className="font-bold text-slate-700 text-sm">{formatCur(record.normalizedData.Net_Amount)}</span></div>
                                     <div className="flex justify-between items-center bg-slate-50 p-2 rounded-lg border border-slate-100"><span className="text-xs font-bold text-slate-500">قيمة الضريبة</span> <span className="font-bold text-slate-700 text-sm">{formatCur(record.normalizedData.VAT_Amount)}</span></div>
                                   </div>
                                 )}
                              </div>
                           </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* BOTTOM ACTION BAR */}
          <div className="bg-white border-t border-slate-200 p-6 flex flex-col md:flex-row items-center justify-between gap-6 shadow-[0_-5px_15px_-10px_rgba(0,0,0,0.1)]">
             <div className="flex-1 w-full md:w-auto">
               {hasCritical && currentSession.records.some(r => r.status === 'PENDING' && r.issues.some(i => i.severity === 'CRITICAL')) ? (
                 <div className="flex flex-col sm:flex-row sm:items-center gap-4 text-red-900 bg-red-50 p-4 rounded-xl md:max-w-xl border border-red-200">
                   <ShieldAlert className="w-8 h-8 text-red-600 flex-shrink-0" />
                   <div>
                     <p className="font-black text-base mb-1">يوجد سجلات حرجة تحتاج إجراءً</p>
                     <p className="text-sm font-bold text-red-700">الرجاء اتخاذ إجراء على السجلات الحرجة من خلال أزرار الإجراءات داخل كل بطاقة (تصحيح / استبعاد / تصعيد) قبل المتابعة.</p>
                   </div>
                 </div>
               ) : currentSession.classification && ['AMBIGUOUS_OVERLAP','OVERLAP_AMBIGUOUS','CORRECTED_VERSION','INVALID','UNPROCESSABLE'].includes(currentSession.classification ?? '') ? (
                 currentSession.classification === 'UNPROCESSABLE' ? (
                   <div className="flex flex-col sm:flex-row sm:items-center gap-4 text-red-955 bg-red-50 p-4 rounded-xl md:max-w-xl border border-red-200">
                     <XCircle className="w-8 h-8 text-red-600 flex-shrink-0" />
                     <div>
                       <p className="font-black text-base mb-1">هذا المستند معطوب بنيوياً ولا يمكن اعتماده</p>
                       <p className="text-sm font-bold text-red-700">لا توجد سجلات صالحة للاستخلاص. يرجى إلغاء الملف المرفوع وتدقيق أعمدة جدول البيانات قبل رفعه مجدداً.</p>
                     </div>
                   </div>
                 ) : (
                   <div className="flex flex-col sm:flex-row sm:items-center gap-4 text-amber-900 bg-amber-50 p-4 rounded-xl md:max-w-xl border border-amber-200">
                     <Info className="w-8 h-8 text-amber-600 flex-shrink-0" />
                     <div>
                       <p className="font-black text-base mb-1">هذا الملف قيد القرار الرقابي</p>
                       <p className="text-sm font-bold text-amber-700">بعد الاطلاع على السجلات، أغلق هذه الشاشة وعد إلى إدارة الملفات لاختيار القرار المناسب (إضافة كمصدر جديد / استبدال الملف النشط / إلغاء المرفوع).</p>
                     </div>
                   </div>
                 )
               ) : null}
             </div>

             <div className="flex flex-col sm:flex-row gap-4 w-full md:w-auto mt-4 md:mt-0">
               {currentSession.classification && ['AMBIGUOUS_OVERLAP','OVERLAP_AMBIGUOUS','CORRECTED_VERSION','INVALID','UNPROCESSABLE'].includes(currentSession.classification ?? '') ? (
                 <button
                   onClick={currentSession.classification === 'UNPROCESSABLE' ? handleUnprocessableCancel : handleExitClick}
                   className={`px-10 py-3.5 rounded-xl font-black text-white transition-all shadow-lg hover:shadow-lg min-w-[250px] w-full sm:w-auto text-base flex items-center justify-center gap-2 ${
                     currentSession.classification === 'UNPROCESSABLE'
                       ? 'bg-rose-600 hover:bg-rose-700 shadow-rose-100'
                       : 'bg-slate-700 hover:bg-slate-800'
                   }`}
                 >
                   {currentSession.classification === 'UNPROCESSABLE' ? (
                     <>
                       <X className="w-5 h-5" /> تأكيد إلغاء الملف المرفوع والعودة
                     </>
                   ) : (
                     <>
                       <X className="w-5 h-5" /> العودة إلى إدارة الملفات لاتخاذ القرار
                     </>
                   )}
                 </button>
               ) : (
                 <button 
                   onClick={handleFinalSubmit}
                   disabled={hasCritical && currentSession.records.some(r => r.status === 'PENDING' && r.issues.some(i => i.severity === 'CRITICAL'))}
                   className="px-10 py-3.5 rounded-xl font-black text-white bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 disabled:text-slate-500 disabled:cursor-not-allowed transition-all shadow-lg hover:shadow-lg disabled:shadow-none min-w-[250px] w-full sm:w-auto text-base"
                 >
                   حفظ التعديلات في الجلسة
                 </button>
               )}
             </div>
          </div>
    
        </div>

        {showExitConfirm && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[1001] flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl w-full max-w-md overflow-hidden shadow-2xl border border-slate-100 p-6 text-right animate-in fade-in zoom-in-95 duration-150" dir="rtl">
              <h3 className="text-lg font-black text-slate-800 mb-2 flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-amber-500" />
                تنبيه: توجد تعديلات غير محفوظة
              </h3>
              <p className="text-slate-600 text-sm leading-relaxed mb-6">
                لقد قمت بإجراء تعديلات أو معالجة للأخطاء في السجلات. في حال الخروج الآن، ستفقد هذه التعديلات ولن يتم تطبيقها على الملف. هل تريد تأكيد الخروج؟
              </p>
              <div className="flex justify-end gap-3">
                <button 
                  onClick={() => setShowExitConfirm(false)}
                  className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-sm transition-all"
                >
                  البقاء وحفظ التعديلات
                </button>
                <button 
                  onClick={() => {
                    setShowExitConfirm(false);
                    onCancel();
                  }}
                  className="px-5 py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl text-sm transition-all shadow-md shadow-rose-100"
                >
                  تأكيد الخروج وإلغاء التعديلات
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};