/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { TrendingUp, Activity } from 'lucide-react';
import { formatAmount, formatCurrency, formatPercent } from '../lib/formatters';

interface OwnersSummaryProps {
  incomeStatement: any;
}

export const OwnersSummary: React.FC<OwnersSummaryProps> = ({ incomeStatement }) => {
  const { totalRevenue, totalOPEX, totalCOGS, grossProfit, netOperatingIncome, netMargin, grossMargin, totalPayroll } = incomeStatement;

  return (
      <div className="max-w-6xl mx-auto space-y-6 animate-in fade-in duration-300 pb-10">
          
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-5 gap-4">
              <div className="bg-white rounded-[16px] border border-slate-200 p-4 shadow-sm flex flex-col h-[130px] justify-between relative overflow-hidden group">
                  <div className="absolute top-0 right-0 w-1.5 h-full bg-emerald-500"></div>
                  <div>
                      <p className="text-[13px] font-bold text-slate-500 mb-1 leading-tight">إجمالي المبيعات</p>
                      <p className="text-[10px] text-slate-400">المبيعات الصافية</p>
                  </div>
                  <div className="flex items-baseline gap-1 mt-2">
                     <h3 className="text-[22px] leading-none font-black text-slate-800 tracking-tight" dir="ltr">
                       {formatAmount(totalRevenue || 0, 0, 0)}
                     </h3>
                     <span className="text-[11px] font-bold text-slate-400">ر.س</span>
                  </div>
              </div>
              
              <div className="bg-white rounded-[16px] border border-slate-200 p-4 shadow-sm flex flex-col h-[130px] justify-between relative overflow-hidden group">
                  <div className="absolute top-0 right-0 w-1.5 h-full bg-rose-500"></div>
                  <div>
                      <p className="text-[13px] font-bold text-slate-500 mb-1 leading-tight">تكلفة المبيعات (COGS)</p>
                      <p className="text-[10px] text-slate-400">تكلفة المواد الغذائية</p>
                  </div>
                  <div className="flex items-baseline gap-1 mt-2">
                     <h3 className="text-[22px] leading-none font-black text-slate-800 tracking-tight" dir="ltr">
                       {formatAmount(totalCOGS || 0, 0, 0)}
                     </h3>
                     <span className="text-[11px] font-bold text-slate-400">ر.س</span>
                  </div>
              </div>

              <div className="bg-white rounded-[16px] border border-slate-200 p-4 shadow-sm flex flex-col h-[130px] justify-between relative overflow-hidden group">
                  <div className="absolute top-0 right-0 w-1.5 h-full bg-amber-500"></div>
                  <div>
                      <p className="text-[13px] font-bold text-slate-500 mb-1 leading-tight">المصاريف التشغيلية (OPEX)</p>
                      <p className="text-[10px] text-slate-400">الرواتب، الإيجارات، وغيرها</p>
                  </div>
                  <div className="flex items-baseline gap-1 mt-2">
                     <h3 className="text-[22px] leading-none font-black text-slate-800 tracking-tight" dir="ltr">
                       {formatAmount(totalOPEX || 0, 0, 0)}
                     </h3>
                     <span className="text-[11px] font-bold text-slate-400">ر.س</span>
                  </div>
              </div>

              <div className="bg-white rounded-[16px] border border-slate-200 p-4 shadow-sm flex flex-col h-[130px] justify-between relative overflow-hidden group">
                  <div className="absolute top-0 right-0 w-1.5 h-full bg-purple-500"></div>
                  <div>
                      <p className="text-[13px] font-bold text-slate-500 mb-1 leading-tight">صافي الرواتب</p>
                      <p className="text-[10px] text-slate-400">صافي الرواتب والأجور</p>
                  </div>
                  <div className="flex items-baseline gap-1 mt-2">
                     <h3 className="text-[22px] leading-none font-black text-slate-800 tracking-tight" dir="ltr">
                       {formatAmount(totalPayroll || 0, 0, 0)}
                     </h3>
                     <span className="text-[11px] font-bold text-slate-400">ر.س</span>
                  </div>
              </div>

              <div className={`rounded-[16px] border p-4 shadow-sm flex flex-col h-[130px] justify-between relative overflow-hidden group ${netOperatingIncome >= 0 ? 'bg-indigo-600 border-indigo-700' : 'bg-red-600 border-red-700'}`}>
                  <div>
                      <p className="text-[13px] font-bold text-white/80 mb-1 leading-tight">صافي الربح</p>
                      <p className="text-[10px] text-white/50">الربح الصافي النهائي</p>
                  </div>
                  <div className="flex items-baseline gap-1 mt-2 text-white">
                     <h3 className="text-[22px] leading-none font-black tracking-tight" dir="ltr">
                       {formatAmount(netOperatingIncome || 0, 0, 0)}
                     </h3>
                     <span className="text-[11px] font-bold text-white/70">ر.س</span>
                  </div>
              </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
                  <div className="flex items-center gap-4">
                      <div className="bg-emerald-100 p-3 rounded-full"><TrendingUp className="w-6 h-6 text-emerald-600" /></div>
                      <div>
                          <p className="text-slate-500 text-sm font-bold">نسبة مجمل الربح</p>
                          <p className="text-xs text-slate-400">الربحية بعد خصم تكلفة المواد</p>
                      </div>
                  </div>
                  <h3 className="text-2xl font-black text-slate-800" dir="ltr">{formatPercent(grossMargin)}</h3>
              </div>
              <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
                  <div className="flex items-center gap-4">
                      <div className="bg-indigo-100 p-3 rounded-full"><TrendingUp className="w-6 h-6 text-indigo-600" /></div>
                      <div>
                          <p className="text-slate-500 text-sm font-bold">نسبة صافي الربح</p>
                          <p className="text-xs text-slate-400">الربحية النهائية للمطعم</p>
                      </div>
                  </div>
                  <h3 className="text-2xl font-black text-slate-800" dir="ltr">{formatPercent(netMargin)}</h3>
              </div>
          </div>

          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
              <h3 className="text-lg font-black text-slate-800 mb-6 flex items-center">
                  <Activity className="w-5 h-5 ml-2 text-indigo-500" /> مسار تدفق الأرباح (Profitability Waterfall)
              </h3>
              <div className="space-y-5">
                  <div>
                      <div className="flex justify-between text-sm mb-1.5">
                          <span className="font-bold text-slate-700 ml-4">1. إجمالي المبيعات المحصلة</span>
                          <div className="flex gap-4">
                              <span className="font-black text-slate-900 shrink-0" dir="ltr">{formatCurrency(totalRevenue)}</span>
                              <span className="text-slate-400 font-bold w-12 text-left">{formatPercent(100)}</span>
                          </div>
                      </div>
                      <div className="w-full bg-slate-100 rounded-full h-3">
                          <div className="bg-emerald-500 h-3 rounded-full" style={{ width: '100%' }}></div>
                      </div>
                  </div>

                  <div>
                      <div className="flex justify-between text-sm mb-1.5">
                          <span className="font-bold text-slate-700 ml-4">2. مجمل الربح (بعد خصم تكلفة المواد)</span>
                          <div className="flex gap-4">
                              <span className="font-black text-slate-900 shrink-0" dir="ltr">{formatCurrency(grossProfit)}</span>
                              <span className="text-slate-400 font-bold w-12 text-left">{formatPercent(totalRevenue > 0 ? (grossProfit/totalRevenue)*100 : 0)}</span>
                          </div>
                      </div>
                      <div className="w-full bg-slate-100 rounded-full h-3">
                          <div className="bg-blue-500 h-3 rounded-full" style={{ width: `${totalRevenue > 0 ? (grossProfit/totalRevenue)*100 : 0}%` }}></div>
                      </div>
                  </div>

                  <div>
                      <div className="flex justify-between text-sm mb-1.5">
                          <span className="font-bold text-slate-700 ml-4">3. صافي الأرباح (بعد خصم كافة المصاريف التشغيلية)</span>
                          <div className="flex gap-4">
                              <span className="font-black text-slate-900 shrink-0" dir="ltr">{formatCurrency(netOperatingIncome)}</span>
                              <span className="text-slate-400 font-bold w-12 text-left">{formatPercent(netMargin)}</span>
                          </div>
                      </div>
                      <div className="w-full bg-slate-100 rounded-full h-3">
                          <div className={`h-3 rounded-full ${netMargin >= 0 ? 'bg-indigo-600' : 'bg-red-500'}`} style={{ width: `${Math.max(0, netMargin)}%` }}></div>
                      </div>
                  </div>
              </div>
          </div>
      </div>
  );
};
