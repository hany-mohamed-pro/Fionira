import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthProvider';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip as RechartsTooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';
import { ShieldAlert, AlertTriangle, CheckCircle, Database } from 'lucide-react';

export default function DataGovernanceDashboard() {
  const { user, profile } = useAuth();
  const [loading, setLoading] = useState(true);
  const [rejectedRecords, setRejectedRecords] = useState<any[]>([]);

  useEffect(() => {
    let active = true;
    const fetchGovernance = async () => {
      if (!user) return;
      try {
        const token = await user.getIdToken();
        const res = await fetch(`/api/erp/governance/rejected`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        if (res.ok) {
           const json = await res.json();
           console.log("[FRONTEND FETCH RESULT]", json);
           if (active) {
               setRejectedRecords(json.data || []);
               console.log("[RENDER DATA]", json.data || []);
           }
        }
      } catch (err) {
        console.error("Governance limit error", err);
      } finally {
        if (active) setLoading(false);
      }
    };
    fetchGovernance();
    return () => { active = false; };
  }, [user]);

  if (loading) {
    return <div className="p-8 text-center text-slate-500 animate-pulse">جاري تحميل بيانات حوكمة البيانات...</div>;
  }

  const categoryCounts: Record<string, number> = {};
  const moduleCounts: Record<string, number> = {};
  
  rejectedRecords.forEach(r => {
     categoryCounts[r.category || 'UNKNOWN'] = (categoryCounts[r.category || 'UNKNOWN'] || 0) + 1;
     moduleCounts[r.moduleType || 'UNKNOWN'] = (moduleCounts[r.moduleType || 'UNKNOWN'] || 0) + 1;
  });

  const pieData = Object.entries(categoryCounts).map(([name, value]) => ({ name, value })).sort((a,b)=>b.value-a.value);
  const barData = Object.entries(moduleCounts).map(([name, value]) => ({ name, value })).sort((a,b)=>b.value-a.value);

  const COLORS = ['#ef4444', '#f97316', '#eab308', '#3b82f6', '#8b5cf6'];

  const performAction = async (id: string, action: 'approve' | 'reject') => {
    if (!user) return;
    try {
      const token = await user.getIdToken();
      const res = await fetch(`/api/erp/governance/rejected/${id}/${action}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await res.json();
      if (res.ok && data.success) {
         // Update status locally to show impact immediately without refetch
         setRejectedRecords(prev => prev.map(r => r.id === id ? { ...r, status: data.status || (action === 'approve' ? 'APPROVED' : 'REJECTED'), approvals: data.approvals || [] } : r));
      } else {
         alert("Error: " + (data.error || "Failed to perform action"));
      }
    } catch (err) {
      console.error(err);
      alert("Network error while trying to perform action");
    }
  };

  return (
    <div className="p-8 space-y-8 animate-fade-in" dir="rtl">
      <div className="flex items-center justify-between">
         <h2 className="text-2xl font-black text-slate-800 flex items-center gap-3">
            <Database className="w-8 h-8 text-indigo-600" />
            حوكمة وجودة البيانات (Enterprise Governance)
         </h2>
         <div className="bg-white border rounded-xl px-4 py-2 shadow-sm font-bold text-slate-700">
           إجمالي السجلات المرفوضة: <span className="text-rose-600">{rejectedRecords.length}</span>
         </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
         <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
            <h3 className="font-bold text-slate-700 mb-4 flex items-center gap-2"><ShieldAlert className="w-5 h-5 text-amber-500" /> توزيع الأخطاء (حسب الفئة)</h3>
            <div className="h-64">
               {pieData.length > 0 ? (
                 <ResponsiveContainer width="100%" height="100%">
                   <PieChart>
                     <Pie data={pieData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label>
                        {pieData.map((entry, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
                     </Pie>
                     <RechartsTooltip />
                   </PieChart>
                 </ResponsiveContainer>
               ) : <div className="h-full flex items-center justify-center text-slate-400">لا توجد بيانات</div>}
            </div>
         </div>
         <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
            <h3 className="font-bold text-slate-700 mb-4 flex items-center gap-2"><AlertTriangle className="w-5 h-5 text-rose-500" /> توزيع الأخطاء (حسب الموديول)</h3>
            <div className="h-64">
               {barData.length > 0 ? (
                 <ResponsiveContainer width="100%" height="100%">
                   <BarChart data={barData}>
                     <CartesianGrid strokeDasharray="3 3" />
                     <XAxis dataKey="name" />
                     <YAxis />
                     <RechartsTooltip />
                     <Bar dataKey="value" fill="#4f46e5" radius={[4, 4, 0, 0]} />
                   </BarChart>
                 </ResponsiveContainer>
               ) : <div className="h-full flex items-center justify-center text-slate-400">لا توجد بيانات</div>}
            </div>
         </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
         <div className="p-6 border-b border-slate-100 flex justify-between items-center">
            <h3 className="text-lg font-bold text-slate-800">تفاصيل السجلات المرفوضة والقرارات</h3>
         </div>
         <div className="overflow-x-auto">
            <table className="w-full text-sm text-right align-middle text-slate-600">
              <thead className="bg-slate-50 text-slate-500 font-semibold border-b">
                <tr>
                   <th className="px-6 py-4">معرف/الموديول</th>
                   <th className="px-6 py-4">المنشئ (Maker)</th>
                   <th className="px-6 py-4">الأخطاء (Errors)</th>
                   <th className="px-6 py-4">درجة الخطورة</th>
                   <th className="px-6 py-4">حالة الاعتماد (Checker)</th>
                   <th className="px-6 py-4">الإجراء الذكي</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                 {rejectedRecords.slice(0, 50).map(r => {
                    const requiredApprovals = r.severity === 'CRITICAL' ? 2 : 1;
                    const isMyOwn = r.createdBy && user && (r.createdBy === user.uid);
                    return (
                    <tr key={r.id} className="hover:bg-slate-50 transition-colors">
                       <td className="px-6 py-4">
                          <div className="font-mono text-xs mb-1">{String(r.id).slice(0, 8)}</div>
                          <span className="bg-slate-100 text-slate-700 px-2 py-1 rounded-md text-xs font-bold">{r.moduleType}</span>
                       </td>
                       <td className="px-6 py-4 font-bold text-xs">
                          {r.createdBy === 'upload_process' ? 'System (Upload)' : r.createdBy || 'Unknown'}
                       </td>
                       <td className="px-6 py-4">
                          <div className="flex flex-wrap gap-1">
                             {(r.errors || []).map((e: string, i: number) => (
                                <span key={i} className="bg-rose-100 text-rose-700 text-[10px] px-2 py-1 rounded-full font-bold">{e}</span>
                             ))}
                          </div>
                          <div className="text-xs mt-1 text-slate-400 truncate max-w-[200px]" title={JSON.stringify(r.record)}>
                             {JSON.stringify(r.record).slice(0, 40)}...
                          </div>
                       </td>
                       <td className="px-6 py-4">
                          {r.severity === 'CRITICAL' ? <span className="text-rose-600 font-bold flex items-center gap-1"><ShieldAlert className="w-3 h-3"/> CRITICAL</span> :
                           r.severity === 'HIGH' ? <span className="text-orange-500 font-bold flex items-center gap-1"><AlertTriangle className="w-3 h-3"/> HIGH</span> :
                           r.severity === 'MEDIUM' ? <span className="text-amber-500 font-bold flex items-center gap-1"><AlertTriangle className="w-3 h-3"/> MEDIUM</span> :
                           <span className="text-slate-500 font-bold">LOW</span>}
                       </td>
                       <td className="px-6 py-4">
                          {r.status === 'PENDING' || r.status === 'PENDING_APPROVAL' ? (
                             <span className="text-amber-600 font-bold text-xs bg-amber-50 px-2 py-1 rounded">Pending (0/{requiredApprovals})</span>
                          ) : r.status === 'UNDER_REVIEW' ? (
                             <div className="text-indigo-600 font-bold text-xs bg-indigo-50 px-2 py-1 rounded">
                               Under Review ({(r.approvals || []).length}/{requiredApprovals})
                               <div className="flex -space-x-2 space-x-reverse mt-1">
                                 {(r.approvals || []).map((a: any, i: number) => (
                                    <div key={i} className="w-5 h-5 rounded-full bg-indigo-200 border-2 border-white text-[8px] flex items-center justify-center" title={a.userName || a.userId}>
                                      {(a.userName || a.userId).slice(0, 1).toUpperCase()}
                                    </div>
                                 ))}
                               </div>
                             </div>
                          ) : r.status === 'APPROVED' ? (
                             <div className="text-emerald-600 font-bold text-xs bg-emerald-50 px-2 py-1 rounded">
                               Approved
                               <div className="flex -space-x-2 space-x-reverse mt-1">
                                 {(r.approvals || []).map((a: any, i: number) => (
                                    <div key={i} className="w-5 h-5 rounded-full bg-emerald-200 border-2 border-white text-[8px] flex items-center justify-center" title={a.userName || a.userId}>
                                      {(a.userName || a.userId).slice(0, 1).toUpperCase()}
                                    </div>
                                 ))}
                               </div>
                             </div>
                          ) : r.status === 'REJECTED' ? (
                             <span className="text-rose-600 font-bold text-xs bg-rose-50 px-2 py-1 rounded">Rejected</span>
                          ) : (
                             <span className="text-slate-500 font-bold text-xs">{r.status}</span>
                          )}
                       </td>
                       <td className="px-6 py-4">
                          <div className="flex flex-col gap-2">
                            {r.status !== 'APPROVED' && r.status !== 'REJECTED' && (
                              <>
                                {r.proposedFix ? (
                                   <div className="text-[10px] text-slate-500 bg-slate-50 p-1 rounded border overflow-hidden truncate max-w-[150px]" title={JSON.stringify(r.proposedFix)}>
                                     Proposed Fix: {JSON.stringify(r.proposedFix).slice(0,30)}...
                                   </div>
                                ) : (
                                   <span className="text-xs text-slate-400">No fix proposed</span>
                                )}
                                <div className="flex flex-col gap-2 mt-1">
                                  {isMyOwn && r.createdBy !== 'upload_process' ? (
                                     <span className="text-xs text-rose-500 font-bold text-center border border-rose-200 bg-rose-50 rounded py-1">Cannot Self-Approve</span>
                                  ) : (
                                     <>
                                        <button onClick={() => performAction(r.id, 'approve')} disabled={!r.proposedFix || (r.approvals || []).some((a: any) => a.userId === user?.uid)} className="text-[10px] bg-emerald-50 hover:bg-emerald-100 disabled:opacity-50 text-emerald-700 px-3 py-1.5 rounded-lg font-bold border border-emerald-200 transition-colors flex items-center justify-center gap-1">
                                          ✅ Approve Fix
                                        </button>
                                        <button onClick={() => performAction(r.id, 'reject')} disabled={(r.approvals || []).some((a: any) => a.userId === user?.uid)} className="text-[10px] bg-rose-50 hover:bg-rose-100 disabled:opacity-50 text-rose-700 px-3 py-1.5 rounded-lg font-bold border border-rose-200 transition-colors flex items-center justify-center gap-1">
                                          ❌ Reject Fix
                                        </button>
                                     </>
                                  )}
                                </div>
                              </>
                            )}
                          </div>
                       </td>
                    </tr>
                 )})}
                 {rejectedRecords.length === 0 && (
                    <tr>
                       <td colSpan={6} className="px-6 py-8 text-center text-slate-400 font-medium">لم يتم العثور على أخطاء في البيانات (النظام آمن)</td>
                    </tr>
                 )}
              </tbody>
            </table>
         </div>
      </div>
    </div>
  );
}
