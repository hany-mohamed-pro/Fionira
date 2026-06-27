import React, { useMemo, useState, useEffect } from 'react';
import { useUI } from '../contexts/UIContext';
import { useAuth } from '../contexts/AuthProvider';
import { TrendingDown, Users, FileText, AlertTriangle, Activity, Tag, Layers, Upload, CheckCircle, Download, Search, Calendar, Filter, X, RefreshCw } from 'lucide-react';
import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import ExcelJS from 'exceljs';
import * as htmlToImage from 'html-to-image';
import { getExpenseBeforeVat, getExpenseVat, getExpenseTotalIncludingVat, getVendorExposureIncludingVat, safeNumber } from '../lib/financial-basis';

type TopVendorInsight = {
  name: string;
  totalAmount: number;
  beforeVatAmount: number;
  vatAmount: number;
  count: number;
  percentage: number;
};

import { formatCurrency, formatPercent, formatCount, formatAmount } from '../lib/formatters';

export const ExpensesDashboard = ({ incomeStatement, expensesData, chartDataRaw, anomaliesCount, onNavigateToTab, onMonthClick, updateGlobalDateFilter, fileScopeLabel }: any) => {
  const { language, notify } = useUI();
  const isRTL = language === 'ar';
  
  const [mounted, setMounted] = useState(false);
  const [showNeedsAttentionDetails, setShowNeedsAttentionDetails] = useState(false);
  const [showAvgExplanation, setShowAvgExplanation] = useState(false);
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [showFilterMenu, setShowFilterMenu] = useState(false);
  const dashboardRef = React.useRef<HTMLDivElement>(null);
  const currentScopeLabel = fileScopeLabel || (isRTL ? 'جميع الملفات النشطة' : 'All active files');

  // New Control Bar State
  const [periodFilter, setPeriodFilter] = useState('all');
  const [dateRange, setDateRange] = useState({ start: '', end: '' });
  const [searchQuery, setSearchQuery] = useState('');

  // Branch segmentation: filter + branch names (loaded from tenant settings).
  const { user } = useAuth();
  const [branchFilter, setBranchFilter] = useState('all');
  const [branchMap, setBranchMap] = useState<Record<string, string>>({});
  useEffect(() => {
    (async () => {
      if (!user) return;
      try {
        const token = await user.getIdToken();
        const res = await fetch('/api/erp/settings', { headers: { 'Authorization': `Bearer ${token}` } });
        const json = await res.json();
        const map: Record<string, string> = {};
        (json?.data?.branches || []).forEach((b: any) => { map[b.id] = b.name; });
        setBranchMap(map);
      } catch { /* no branches → single default */ }
    })();
  }, [user]);

  const navigateWithContext = (tab: string, arg2?: string, query?: string, mode?: string, skipDateFilterUpdate = false) => {
    if (updateGlobalDateFilter && !skipDateFilterUpdate) {
       let updatedFilter: any = { sourceMode: 'expenses' };
       if (periodFilter === 'this_year') {
           updatedFilter.year = new Date().getFullYear().toString();
       } else if (periodFilter === 'this_month') {
           updatedFilter.year = new Date().getFullYear().toString();
           updatedFilter.month = (new Date().getMonth() + 1).toString();
       } else if (periodFilter === 'this_quarter') {
           // Basic mapping of quarter to month range or just year, let's keep it simple with year for now
           updatedFilter.year = new Date().getFullYear().toString();
       } else if (periodFilter === 'custom') {
           updatedFilter.start = dateRange.start;
           updatedFilter.end = dateRange.end;
       } else {
           updatedFilter = { sourceMode: 'expenses', year: '', month: '', start: '', end: '' }; // reset
       }
       updateGlobalDateFilter((prev: any) => ({ ...prev, ...updatedFilter }));
    }
    
    let finalSearch = query;
    if (query !== undefined && query !== null) {
      // Caller provided specific query
    } else {
      finalSearch = searchQuery; 
    }
    
    if (onNavigateToTab) onNavigateToTab(tab, arg2, finalSearch, mode);
  };

  // 1. Single source of truth: Filtered Records
  const allRecords = expensesData?.records || [];
  
  const filteredExpenseRecords = useMemo(() => {
    let result = [...allRecords];

    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter((r: any) => {
        const vName = (r.Entity_Normalized_Name || r.Vendor_Name || '').toLowerCase();
        const cat = (r.Category || '').toLowerCase();
        const ref = (r.Reference || r.Invoice_Number || '').toLowerCase();
        const desc = (r.Description || '').toLowerCase();
        const fn = (r.fileName || '').toLowerCase();
        return vName.includes(q) || cat.includes(q) || ref.includes(q) || desc.includes(q) || fn.includes(q);
      });
    }

    const now = new Date();
    if (periodFilter === 'this_year') {
      const startOfYear = new Date(now.getFullYear(), 0, 1).toISOString().split('T')[0];
      const endOfYear = new Date(now.getFullYear(), 11, 31).toISOString().split('T')[0];
      result = result.filter(r => r.Invoice_Date >= startOfYear && r.Invoice_Date <= endOfYear);
    } else if (periodFilter === 'this_month') {
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
      const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0];
      result = result.filter(r => r.Invoice_Date >= startOfMonth && r.Invoice_Date <= endOfMonth);
    } else if (periodFilter === 'this_quarter') {
      const quarterMonths = [[0, 2], [3, 5], [6, 8], [9, 11]];
      const currentQuarter = Math.floor(now.getMonth() / 3);
      const startOfQuarter = new Date(now.getFullYear(), quarterMonths[currentQuarter][0], 1).toISOString().split('T')[0];
      const endOfQuarter = new Date(now.getFullYear(), quarterMonths[currentQuarter][1] + 1, 0).toISOString().split('T')[0];
      result = result.filter(r => r.Invoice_Date >= startOfQuarter && r.Invoice_Date <= endOfQuarter);
    } else if (periodFilter === 'custom' && dateRange.start && dateRange.end) {
      result = result.filter(r => r.Invoice_Date >= dateRange.start && r.Invoice_Date <= dateRange.end);
    }

    if (branchFilter !== 'all') result = result.filter((r: any) => (r.branchId || 'default') === branchFilter);
    return result;
  }, [allRecords, searchQuery, periodFilter, dateRange, branchFilter]);

  // Branch segmentation: distinct branches present + per-branch totals (never silently merged).
  const branchesInData = useMemo(() => {
    const s = new Set<string>();
    allRecords.forEach((r: any) => s.add(r.branchId || 'default'));
    return Array.from(s);
  }, [allRecords]);
  const hasMultipleBranches = branchesInData.length > 1;
  const branchLabel = (id: string) => (id === 'default' ? 'الفرع الرئيسي' : (branchMap[id] || id));
  const branchTotals = useMemo(() => {
    const m: Record<string, number> = {};
    allRecords.forEach((r: any) => { const b = r.branchId || 'default'; m[b] = (m[b] || 0) + (Number(r.Net_Amount) || 0); });
    return Object.entries(m).map(([id, total]) => ({ id, total })).sort((a, b) => b.total - a.total);
  }, [allRecords]);

  // Insights: Categories Needing Review
  const previousPeriodRecords = useMemo(() => {
    let result = [...allRecords];
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter((r: any) => {
        const vName = (r.Entity_Normalized_Name || r.Vendor_Name || '').toLowerCase();
        const cat = (r.Category || '').toLowerCase();
        const ref = (r.Reference || r.Invoice_Number || '').toLowerCase();
        const desc = (r.Description || '').toLowerCase();
        const fn = (r.fileName || '').toLowerCase();
        return vName.includes(q) || cat.includes(q) || ref.includes(q) || desc.includes(q) || fn.includes(q);
      });
    }

    const now = new Date();
    if (periodFilter === 'this_year') {
      const startOfPrevYear = new Date(now.getFullYear() - 1, 0, 1).toISOString().split('T')[0];
      const endOfPrevYear = new Date(now.getFullYear() - 1, 11, 31).toISOString().split('T')[0];
      result = result.filter(r => r.Invoice_Date >= startOfPrevYear && r.Invoice_Date <= endOfPrevYear);
    } else if (periodFilter === 'this_month') {
      const startOfPrevMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString().split('T')[0];
      const endOfPrevMonth = new Date(now.getFullYear(), now.getMonth(), 0).toISOString().split('T')[0];
      result = result.filter(r => r.Invoice_Date >= startOfPrevMonth && r.Invoice_Date <= endOfPrevMonth);
    } else if (periodFilter === 'this_quarter') {
      const quarterMonths = [[0, 2], [3, 5], [6, 8], [9, 11]];
      let prevQuarter = Math.floor(now.getMonth() / 3) - 1;
      let prevYear = now.getFullYear();
      if (prevQuarter < 0) {
        prevQuarter = 3;
        prevYear -= 1;
      }
      const startOfPrevQuarter = new Date(prevYear, quarterMonths[prevQuarter][0], 1).toISOString().split('T')[0];
      const endOfPrevQuarter = new Date(prevYear, quarterMonths[prevQuarter][1] + 1, 0).toISOString().split('T')[0];
      result = result.filter(r => r.Invoice_Date >= startOfPrevQuarter && r.Invoice_Date <= endOfPrevQuarter);
    } else if (periodFilter === 'custom' && dateRange.start && dateRange.end) {
      const start = new Date(dateRange.start);
      const end = new Date(dateRange.end);
      const diffTime = Math.abs(end.getTime() - start.getTime());
      
      const prevEnd = new Date(start.getTime() - (1000 * 60 * 60 * 24)); // 1 day before current start
      const prevStart = new Date(prevEnd.getTime() - diffTime);

      const startOfPrev = prevStart.toISOString().split('T')[0];
      const endOfPrev = prevEnd.toISOString().split('T')[0];
      result = result.filter(r => r.Invoice_Date >= startOfPrev && r.Invoice_Date <= endOfPrev);
    } else {
        // For 'all' or anything else, we don't have a specific previous period comparison logic
        return [];
    }

    return result;
  }, [allRecords, searchQuery, periodFilter, dateRange]);

  const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#94A3B8'];

  const expensesDashboardModel = useMemo(() => {
    const totalBeforeVat = filteredExpenseRecords.reduce((sum: number, rec: any) => sum + getExpenseBeforeVat(rec), 0);
    const totalIncludingVat = filteredExpenseRecords.reduce((sum: number, rec: any) => sum + getExpenseTotalIncludingVat(rec), 0);
    const inputVat = filteredExpenseRecords.reduce((sum: number, rec: any) => sum + getExpenseVat(rec), 0);
    const taxableAmount = filteredExpenseRecords.reduce((sum: number, rec: any) => sum + safeNumber(rec.Taxable_Amount), 0);
    const nonTaxableAmount = filteredExpenseRecords.reduce((sum: number, rec: any) => sum + safeNumber(rec.Non_Taxable_Amount ?? rec.NonTaxable_Amount), 0);
    const suppliersCount = new Set(filteredExpenseRecords.map((r: any) => r.Entity_Normalized_Name || r.Vendor_Name).filter(Boolean)).size || 0;
    const transactionsCount = filteredExpenseRecords.length || 0;

    const topVendorsMap: Record<string, Omit<TopVendorInsight, 'percentage'>> = {};
    filteredExpenseRecords.forEach((r: any) => {
      const vName = r.Entity_Normalized_Name || r.Vendor_Name || (isRTL ? 'غير محدد' : 'Unknown');
      if (!topVendorsMap[vName]) {
        topVendorsMap[vName] = { name: vName, totalAmount: 0, beforeVatAmount: 0, vatAmount: 0, count: 0 };
      }
      topVendorsMap[vName].totalAmount += getVendorExposureIncludingVat(r);
      topVendorsMap[vName].beforeVatAmount += getExpenseBeforeVat(r);
      topVendorsMap[vName].vatAmount += getExpenseVat(r);
      topVendorsMap[vName].count += 1;
    });

    const topVendorsIncludingVat = Object.values(topVendorsMap)
      .map(vendor => ({ ...vendor, percentage: vendor.totalAmount / (totalIncludingVat || 1) }))
      .sort((a, b) => b.totalAmount - a.totalAmount)
      .slice(0, 5);

    const buildCategoryMap = (records: any[]) => {
      const map: Record<string, number> = {};
      records.forEach((r: any) => {
        const cat = r.Category || (isRTL ? 'أخرى' : 'Other');
        map[cat] = (map[cat] || 0) + getExpenseBeforeVat(r);
      });
      return map;
    };

    const currentCategoryMap = buildCategoryMap(filteredExpenseRecords);
    const previousCategoryMap = buildCategoryMap(previousPeriodRecords);

    const categoryChangeBeforeVat = Array.from(new Set([...Object.keys(currentCategoryMap), ...Object.keys(previousCategoryMap)]))
      .map(name => {
        const curr = currentCategoryMap[name] || 0;
        const prev = previousCategoryMap[name] || 0;
        const change = curr - prev;
        const percentage = prev > 0 ? (change / prev) : (curr > 0 ? 1 : 0);
        return { name, curr, prev, change, percentage };
      })
      .filter(item => item.change !== 0 && previousPeriodRecords.length > 0)
      .sort((a, b) => Math.abs(b.change) - Math.abs(a.change))
      .slice(0, 5);

    let categoryDistributionBeforeVat: { name: string; value: number; percentage: number }[] = [];
    if (filteredExpenseRecords.length) {
      let hasValidCategories = false;
      filteredExpenseRecords.forEach((r: any) => {
        const cat = r.Category || (isRTL ? 'أخرى' : 'Other');
        if (cat && cat !== 'أخرى' && cat !== 'Other') hasValidCategories = true;
      });

      if (hasValidCategories || Object.keys(currentCategoryMap).length > 1) {
        const otherLabel = isRTL ? 'أخرى' : 'Other';
        const preExistingOtherValue = currentCategoryMap[otherLabel] || 0;
        const entriesWithoutOther = Object.entries(currentCategoryMap)
          .filter(([name]) => name !== otherLabel)
          .map(([name, value]) => ({ name, value }))
          .sort((a, b) => b.value - a.value);

        categoryDistributionBeforeVat = entriesWithoutOther
          .slice(0, 5)
          .map(item => ({ ...item, percentage: item.value / (totalBeforeVat || 1) }));

        const remainingValue = entriesWithoutOther.slice(5).reduce((sum, item) => sum + item.value, 0) + preExistingOtherValue;
        if (remainingValue > 0) {
          categoryDistributionBeforeVat.push({
            name: otherLabel,
            value: remainingValue,
            percentage: remainingValue / (totalBeforeVat || 1)
          });
        }
      }
    }

    const monthlyMap: Record<string, { value: number; count: number; categories: Record<string, number> }> = {};
    filteredExpenseRecords.forEach((r: any) => {
      const rawDate = r.Invoice_Date || r.transactionDate || r.date || r.createdAt;
      if (rawDate && rawDate !== 'غير محدد' && rawDate !== '-' && rawDate !== 'بدون تاريخ') {
        const month = rawDate.toString().substring(0, 7);
        if (!monthlyMap[month]) monthlyMap[month] = { value: 0, count: 0, categories: {} };
        const amount = getExpenseBeforeVat(r);
        monthlyMap[month].value += amount;
        monthlyMap[month].count += 1;
        const cat = r.Category || (isRTL ? 'أخرى' : 'Other');
        monthlyMap[month].categories[cat] = (monthlyMap[month].categories[cat] || 0) + amount;
      }
    });

    const monthlyTrendBeforeVat = Object.entries(monthlyMap)
      .filter(([_, data]) => data.value > 0 || data.count > 0)
      .map(([name, data]) => {
        const topCat = Object.entries(data.categories).sort((a, b) => b[1] - a[1])[0];
        return {
          name,
          value: data.value,
          count: data.count,
          topCategory: topCat ? topCat[0] : ''
        };
      })
      .sort((a, b) => a.name.localeCompare(b.name));

    const totalPeriodBeforeVat = monthlyTrendBeforeVat.reduce((sum, item) => sum + item.value, 0);
    const activeMonthsCount = monthlyTrendBeforeVat.length;
    const averageMonthlyBeforeVat = activeMonthsCount > 0 ? totalPeriodBeforeVat / activeMonthsCount : 0;
    const highestMonthBeforeVat = monthlyTrendBeforeVat.length ? monthlyTrendBeforeVat.reduce((prev, current) => (prev.value > current.value ? prev : current)) : null;
    const lowestMonthBeforeVat = monthlyTrendBeforeVat.length ? monthlyTrendBeforeVat.reduce((prev, current) => (prev.value < current.value ? prev : current)) : null;

    return {
      scope: currentScopeLabel,
      filters: { periodFilter, dateRange, searchQuery },
      kpis: {
        totalBeforeVat,
        totalIncludingVat,
        inputVat,
        taxableAmount,
        nonTaxableAmount,
        transactionsCount,
        suppliersCount
      },
      analytics: {
        monthlyTrendBeforeVat,
        totalPeriodBeforeVat,
        averageMonthlyBeforeVat,
        activeMonthsCount,
        highestMonthBeforeVat,
        lowestMonthBeforeVat,
        categoryDistributionBeforeVat,
        categoryChangeBeforeVat,
        topVendorsIncludingVat,
        topVendorsBeforeVat: topVendorsIncludingVat.map(v => ({ name: v.name, value: v.beforeVatAmount })),
        topVendorsVat: topVendorsIncludingVat.map(v => ({ name: v.name, value: v.vatAmount }))
      }
    };
  }, [filteredExpenseRecords, previousPeriodRecords, isRTL, currentScopeLabel, periodFilter, dateRange, searchQuery]);

  const totalExpenses = expensesDashboardModel.kpis.totalIncludingVat;
  const totalBeforeVat = expensesDashboardModel.kpis.totalBeforeVat;
  const totalTaxable = expensesDashboardModel.kpis.taxableAmount;
  const totalNonTaxable = expensesDashboardModel.kpis.nonTaxableAmount;
  const totalVAT = expensesDashboardModel.kpis.inputVat;
  const vendorsCount = expensesDashboardModel.kpis.suppliersCount;
  const transactionsCount = expensesDashboardModel.kpis.transactionsCount;
  const topVendors = expensesDashboardModel.analytics.topVendorsIncludingVat;
  const categoryChangesInsight = expensesDashboardModel.analytics.categoryChangeBeforeVat;
  const categoryChart = expensesDashboardModel.analytics.categoryDistributionBeforeVat;
  const historicalChart = expensesDashboardModel.analytics.monthlyTrendBeforeVat;
  const totalPeriodBeforeVat = expensesDashboardModel.analytics.totalPeriodBeforeVat;
  const averageMonthlyBeforeVat = expensesDashboardModel.analytics.averageMonthlyBeforeVat;
  const activeMonthsCount = expensesDashboardModel.analytics.activeMonthsCount;
  const highestMonthBeforeVat = expensesDashboardModel.analytics.highestMonthBeforeVat;
  const lowestMonthBeforeVat = expensesDashboardModel.analytics.lowestMonthBeforeVat;

  // Real Needs Attention derived from filtered list
  const filteredAnomaliesCount = filteredExpenseRecords.filter((r: any) => r.Needs_Attention || (r.validationIssues && r.validationIssues.length > 0)).length;

  // Re-run animations when records change
  useEffect(() => {
    setMounted(false);
    const timer = setTimeout(() => setMounted(true), 150);
    return () => clearTimeout(timer);
  }, [filteredExpenseRecords]);

  const handleCategoryClick = (name: string) => {
    const isOther = name === (isRTL ? 'أخرى' : 'Other');
    if (isOther) {
      navigateWithContext('categories_summary', undefined, 'other_categories', 'expenses');
    } else {
      navigateWithContext('categories_summary', undefined, name, 'expenses');
    }
  };

  const handleExportPDF = async () => {
    setShowExportMenu(false);
    try {
      notify(isRTL ? 'جاري تجهيز التقرير...' : 'Preparing report...', 'info');

      // Capture charts as images
      let categoryChartImgData = null;
      let trendChartImgData = null;

      try {
        const catNode = document.getElementById('category-chart-container');
        if (catNode) {
          categoryChartImgData = await htmlToImage.toPng(catNode, { backgroundColor: '#ffffff', pixelRatio: 2 });
        }
        const trendNode = document.getElementById('historical-chart-container');
        if (trendNode) {
          trendChartImgData = await htmlToImage.toPng(trendNode, { backgroundColor: '#ffffff', pixelRatio: 2 });
        }
      } catch (err) {
        console.warn('Failed to capture chart images:', err);
      }

      // Safe number helpers
      const safeNum = (val: any) => (!val || isNaN(val) || !isFinite(val)) ? 0 : Number(val);
      
      const createKpiCard = (title: string, value: string, color: string) => ({
        table: {
          widths: ['*'],
          body: [[{
            text: [
              { text: `${title}\n`, fontSize: 11, color: '#64748B' },
              { text: value, fontSize: 18, color: color, bold: true }
            ],
            fillColor: '#F8FAFC',
            margin: [12, 16, 12, 16],
            border: [false, false, false, false],
            alignment: isRTL ? 'right' : 'left'
          }]]
        },
        layout: {
          defaultBorder: false,
          hLineWidth: function () { return 1; },
          vLineWidth: function () { return 1; },
          hLineColor: function () { return '#E2E8F0'; },
          vLineColor: function () { return '#E2E8F0'; }
        }
      });

      const reverseCols = (arr: any[]) => isRTL ? [...arr].reverse() : arr;

      const docDefinition = {
        pageOrientation: 'portrait',
        content: [
          { text: isRTL ? 'تقرير لوحة المصروفات' : 'Expenses Dashboard Report', style: 'header', alignment: 'center' },
          { 
             text: `${isRTL ? 'نطاق الملفات:' : 'File Scope:'} ${currentScopeLabel} | ${isRTL ? 'تاريخ التصدير:' : 'Export Date:'} ${new Date().toLocaleDateString(isRTL ? 'ar-SA' : 'en-US')} | ${isRTL ? 'الفترة:' : 'Period:'} ${periodFilter !== 'all' ? (periodFilter === 'custom' ? `${dateRange.start} - ${dateRange.end}` : periodFilter) : (isRTL?'الكل':'All')} ${searchQuery ? `| ${isRTL?'بحث:':'Search:'} ${searchQuery}` : ''}`, 
             style: 'subheader', 
             alignment: 'center', 
             margin: [0, 0, 0, 20] 
          },
          
          { text: isRTL ? 'مؤشرات الأداء الرئيسية' : 'Key Performance Indicators', style: 'sectionHeader' },
          {
            columns: reverseCols([
              createKpiCard(isRTL ? 'المصروفات قبل الضريبة' : 'Expenses Before VAT', formatCurrency(safeNum(totalBeforeVat)), '#1D4ED8'),
              createKpiCard(isRTL ? 'ضريبة المدخلات' : 'Input VAT', formatCurrency(safeNum(totalVAT)), '#6D28D9'),
              createKpiCard(isRTL ? 'إجمالي المصروفات شامل الضريبة' : 'Total Expenses Incl. VAT', formatCurrency(safeNum(totalExpenses)), '#BE123C'),
              createKpiCard(isRTL ? 'غير الخاضع' : 'Non-Taxable', formatCurrency(safeNum(totalNonTaxable)), '#334155')
            ]),
            columnGap: 15,
            margin: [0, 0, 0, 15]
          },
          {
            columns: reverseCols([
              createKpiCard(isRTL ? 'عدد الموردين' : 'Vendors Count', safeNum(vendorsCount).toString(), '#0F172A'),
              createKpiCard(isRTL ? 'عدد المعاملات' : 'Transactions', safeNum(transactionsCount).toString(), '#0F172A'),
              createKpiCard(isRTL ? 'يحتاج الانتباه' : 'Needs Attention', safeNum(filteredAnomaliesCount) > 0 ? safeNum(filteredAnomaliesCount).toString() : (isRTL ? 'كل شيء جيد' : 'All Good'), safeNum(filteredAnomaliesCount) > 0 ? '#E11D48' : '#10B981'),
              { width: '*', text: '' }
            ]),
            columnGap: 15,
            margin: [0, 0, 0, 30]
          },
          
          trendChartImgData ? {
             image: trendChartImgData,
             width: 500,
             margin: [0, 0, 0, 20],
             alignment: 'center'
          } : { text: '' },
          
          categoryChartImgData ? {
             image: categoryChartImgData,
             width: 500,
             margin: [0, 0, 0, 30],
             alignment: 'center'
          } : { text: '' },
          
          { text: isRTL ? 'أعلى الموردين حسب إجمالي التعامل شامل الضريبة' : 'Top Vendors by Total Exposure Incl. VAT', style: 'sectionHeader', margin: [0, 0, 0, 10] },
          {
            table: {
              headerRows: 1,
              widths: reverseCols(['*', 'auto', 'auto', 'auto', 'auto']),
              body: [
                reverseCols([isRTL ? 'المورد' : 'Vendor', isRTL ? 'المعاملات' : 'Transactions', isRTL ? 'قبل الضريبة' : 'Before VAT', isRTL ? 'ضريبة' : 'VAT', isRTL ? 'شامل الضريبة' : 'Incl. VAT'].map(t => ({ text: t, style: 'tableHeader' }))),
                ...topVendors.slice(0, 5).map((v: any) => {
                  return reverseCols([
                    { text: v.name, bold: true },
                    { text: safeNum(v.count).toString() },
                    { text: formatCurrency(safeNum(v.beforeVatAmount)) },
                    { text: formatCurrency(safeNum(v.vatAmount)) },
                    { text: formatCurrency(safeNum(v.totalAmount)), bold: true }
                  ]);
                })
              ]
            },
            layout: 'lightHorizontalLines',
            margin: [0, 0, 0, 30]
          },
          
          { text: isRTL ? 'أكبر تغيرات المصروفات قبل الضريبة حسب التصنيف' : 'Top Before-VAT Expense Category Changes', style: 'sectionHeader', margin: [0, 15, 0, 10] },
          categoryChangesInsight.length > 0 ? {
            table: {
              headerRows: 1,
              widths: reverseCols(['*', 'auto', 'auto', 'auto']),
              body: [
                reverseCols([isRTL ? 'التصنيف' : 'Category', isRTL ? 'الحالي' : 'Current', isRTL ? 'السابق' : 'Previous', isRTL ? 'التغير' : 'Change'].map(t => ({ text: t, style: 'tableHeader' }))),
                ...categoryChangesInsight.map((c: any) => {
                  const isIncrease = c.change > 0;
                  const arrow = isIncrease ? '↑' : '↓';
                  const color = isIncrease ? '#E11D48' : '#10B981';
                  const p = safeNum(c.percentage);
                  return reverseCols([
                    { text: c.name, bold: true },
                    formatCurrency(safeNum(c.curr)),
                    formatCurrency(safeNum(c.prev)),
                    { text: `${arrow} ${formatCurrency(Math.abs(safeNum(c.change)))} (${formatPercent(p * 100, 0)})`, color: color, bold: true }
                  ]);
                })
              ]
            },
            layout: 'lightHorizontalLines',
            margin: [0, 0, 0, 20]
          } : {
            table: {
              widths: ['*'],
              body: [[{
                text: isRTL ? 'يحتاج هذا التحليل إلى بيانات من فترة سابقة لقياس تغير المصروفات حسب التصنيف.' : 'This analysis needs data from a previous period to measure changes.',
                color: '#64748B',
                margin: [10, 15, 10, 15],
                alignment: 'center'
              }]]
            },
            layout: { defaultBorder: false, fillColor: '#F8FAFC' },
            margin: [0, 0, 0, 20]
          }
        ],
        defaultStyle: { font: 'Cairo', alignment: isRTL ? 'right' : 'left' },
        defaultTextDirection: isRTL ? 'rtl' : 'ltr',
        styles: {
          header: { fontSize: 22, bold: true, margin: [0, 0, 0, 10], alignment: 'center' },
          subheader: { fontSize: 13, color: '#666666', alignment: 'center' },
          sectionHeader: { fontSize: 16, bold: true, margin: [0, 10, 0, 10], color: '#334155', alignment: isRTL ? 'right' : 'left' },
          tableHeader: { bold: true, fontSize: 12, color: 'black', fillColor: '#f3f4f6', alignment: isRTL ? 'right' : 'left' }
        }
      };
      
      const response = await fetch('/api/pdf/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ docDefinition, filename: `Expenses_Dashboard_Report_${new Date().toISOString().split('T')[0]}.pdf` }),
      });

      if (!response.ok) throw new Error('Failed to generate PDF');

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Expenses_Dashboard_Report_${new Date().toISOString().split('T')[0]}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error exporting PDF:', error);
      notify(isRTL ? 'عذراً، حدث خطأ أثناء تصدير PDF.' : 'Error generating PDF.', 'error');
    }
  };

  const handleExportRawExcel = async () => {
    setShowExportMenu(false);
    try {
      const workbook = new ExcelJS.Workbook();
      const s1 = workbook.addWorksheet(isRTL ? 'البيانات الخام' : 'Raw Data', { views: [{ rightToLeft: isRTL }] });
      if (filteredExpenseRecords.length > 0) {
        s1.columns = Object.keys(filteredExpenseRecords[0]).map(key => ({ header: key, key: key, width: 20 }));
        filteredExpenseRecords.forEach((r: any) => s1.addRow(r));
      }
      const buffer = await workbook.xlsx.writeBuffer();
      const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `expenses_raw_${new Date().getTime()}.xlsx`;
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (e) {
      console.error(e);
      notify(isRTL ? 'عفواً، حدث خطأ أثناء التصدير.' : 'Error exporting data.', 'error');
    }
  };

  const handleExportExcel = async () => {
    setShowExportMenu(false);
    try {
      notify(isRTL ? 'جاري تجهيز تقرير الإكسيل...' : 'Preparing Excel report...', 'info');

      // Capture charts as images
      let categoryChartImgData = null;
      let trendChartImgData = null;
      try {
        const catNode = document.getElementById('category-chart-container');
        if (catNode) {
          categoryChartImgData = await htmlToImage.toPng(catNode, { backgroundColor: '#ffffff', pixelRatio: 2 });
        }
        const trendNode = document.getElementById('historical-chart-container');
        if (trendNode) {
          trendChartImgData = await htmlToImage.toPng(trendNode, { backgroundColor: '#ffffff', pixelRatio: 2 });
        }
      } catch (err) {
        console.warn('Failed to capture excel chart images:', err);
      }

      const safeNum = (val: any) => (!val || isNaN(val) || !isFinite(val)) ? 0 : Number(val);

      const workbook = new ExcelJS.Workbook();
      const createSheet = (name: string) => workbook.addWorksheet(name, { views: [{ rightToLeft: isRTL }] });

      // Sheet 1: Dashboard Report layout
      const s1 = createSheet(isRTL ? 'لوحة المصروفات' : 'Expenses Dashboard');
      
      // Setup grid columns
      s1.columns = [
        { width: 3 }, // A: Margin
        { width: 25 }, // B
        { width: 20 }, // C
        { width: 20 }, // D
        { width: 20 }, // E
        { width: 25 }, // F
        { width: 3 }  // G: Margin
      ];

      // Draw Header
      s1.mergeCells('B2:F3');
      const titleCell = s1.getCell('B2');
      titleCell.value = isRTL ? 'لوحة قياس المصروفات' : 'Expenses Dashboard Report';
      titleCell.font = { size: 22, bold: true, color: { argb: 'FF0F172A' } };
      titleCell.alignment = { vertical: 'middle', horizontal: 'center' };

      // Draw Filters
      s1.getCell('B5').value = isRTL ? 'تاريخ التصدير:' : 'Export Date:';
      s1.getCell('B5').font = { bold: true, color: { argb: 'FF64748B' } };
      s1.getCell('C5').value = new Date().toLocaleDateString(isRTL ? 'ar-SA' : 'en-US');
      s1.getCell('B6').value = isRTL ? 'نطاق الملفات:' : 'File Scope:';
      s1.getCell('B6').font = { bold: true, color: { argb: 'FF64748B' } };
      s1.getCell('C6').value = currentScopeLabel;
      
      if (periodFilter !== 'all') {
         s1.getCell('E5').value = isRTL ? 'الفترة:' : 'Period:';
         s1.getCell('E5').font = { bold: true, color: { argb: 'FF64748B' } };
         s1.getCell('F5').value = periodFilter === 'custom' ? `${dateRange.start} - ${dateRange.end}` : periodFilter;
      }
      
      if (searchQuery) {
         s1.getCell('E6').value = isRTL ? 'كلمة البحث:' : 'Search:';
         s1.getCell('E6').font = { bold: true, color: { argb: 'FF64748B' } };
         s1.getCell('F6').value = searchQuery;
      }

      const createCard = (startCell: string, endCell: string, title: string, value: number, isCurrency: boolean, bgColor: string, textColor: string) => {
         s1.mergeCells(`${startCell}:${endCell}`);
         const cell = s1.getCell(startCell);
         const formattedValue = isCurrency ? formatCurrency(value) : value.toString();
         cell.value = `${title}\n${formattedValue}`;
         cell.font = { size: 14, bold: true, color: { argb: textColor } };
         cell.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };
         cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: bgColor } };
         
         // Add border
         const range = s1.getCell(startCell);
         range.border = {
           top: {style:'thin', color: {argb:'FFE2E8F0'}},
           left: {style:'thin', color: {argb:'FFE2E8F0'}},
           bottom: {style:'thin', color: {argb:'FFE2E8F0'}},
           right: {style:'thin', color: {argb:'FFE2E8F0'}}
         };
      };

      // KPI ROW 1 (Lines 8-10)
      createCard('B8', 'C10', isRTL ? 'المصروفات قبل الضريبة' : 'Expenses Before VAT', safeNum(totalBeforeVat), true, 'FFEFF6FF', 'FF1D4ED8');
      createCard('D8', 'D10', isRTL ? 'إجمالي المصروفات شامل الضريبة' : 'Total Expenses Incl. VAT', safeNum(totalExpenses), true, 'FFFFF1F2', 'FFBE123C');
      createCard('E8', 'E10', isRTL ? 'ضريبة المدخلات' : 'Input VAT', safeNum(totalVAT), true, 'FFF5F3FF', 'FF6D28D9');
      createCard('F8', 'F10', isRTL ? 'غير الخاضع' : 'Non-Taxable', safeNum(totalNonTaxable), true, 'FFF8FAFC', 'FF475569');

      // KPI ROW 2 (Lines 12-14)
      createCard('B12', 'C14', isRTL ? 'عدد الموردين' : 'Vendors Count', safeNum(vendorsCount), false, 'FFF8FAFC', 'FF0F172A');
      createCard('D12', 'E14', isRTL ? 'عدد المعاملات' : 'Transactions', safeNum(transactionsCount), false, 'FFF8FAFC', 'FF0F172A');
      if (safeNum(filteredAnomaliesCount) > 0) {
        createCard('F12', 'F14', isRTL ? 'يحتاج الانتباه' : 'Needs Attention', safeNum(filteredAnomaliesCount), false, 'FFFFF1F2', 'FFE11D48');
      } else {
        s1.mergeCells('F12:F14');
        const ac = s1.getCell('F12');
        ac.value = isRTL ? 'حالة النظام\nكل شيء جيد' : 'System Status\nAll Good';
        ac.font = { size: 12, bold: true, color: { argb: 'FF059669' } };
        ac.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };
        ac.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF0FDF4' } };
        ac.border = { top: {style:'thin', color: {argb:'FFE2E8F0'}}, left: {style:'thin', color: {argb:'FFE2E8F0'}}, bottom: {style:'thin', color: {argb:'FFE2E8F0'}}, right: {style:'thin', color: {argb:'FFE2E8F0'}} };
      }

      let currentRow = 16;
      
      // Top Vendors Table
      s1.mergeCells(`B${currentRow}:F${currentRow}`);
      s1.getCell(`B${currentRow}`).value = isRTL ? '🏢 أعلى الموردين حسب إجمالي التعامل شامل الضريبة' : '🏢 Top Vendors by Total Exposure Incl. VAT';
      s1.getCell(`B${currentRow}`).font = { size: 14, bold: true, color: { argb: 'FF0F172A' } };
      
      let vRow = currentRow + 2;
      s1.getCell(`B${vRow}`).value = isRTL ? 'المورد' : 'Vendor';
      s1.getCell(`C${vRow}`).value = isRTL ? 'شامل الضريبة' : 'Incl. VAT';
      s1.getCell(`D${vRow}`).value = isRTL ? 'قبل الضريبة' : 'Before VAT';
      s1.getCell(`E${vRow}`).value = isRTL ? 'ضريبة' : 'VAT';
      s1.getCell(`F${vRow}`).value = isRTL ? 'المعاملات' : 'Transactions';
      
      ['B','C','D','E','F'].forEach(col => s1.getCell(`${col}${vRow}`).font = { bold: true, color: { argb: 'FFFFFFFF' } });
      ['B','C','D','E','F'].forEach(col => s1.getCell(`${col}${vRow}`).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1F2937' } });
      
      vRow++;
      
      const maxVen = Math.max(...topVendors.map((x: any) => safeNum(x.totalAmount)), 0);
      topVendors.slice(0, 5).forEach((v: any) => {
         const val = safeNum(v.totalAmount);
         const pct = maxVen > 0 ? val / maxVen : 0;
         
         s1.getCell(`B${vRow}`).value = v.name;
         s1.getCell(`C${vRow}`).value = formatCurrency(val);
         s1.getCell(`D${vRow}`).value = formatCurrency(safeNum(v.beforeVatAmount));
         s1.getCell(`E${vRow}`).value = formatCurrency(safeNum(v.vatAmount));
         s1.getCell(`F${vRow}`).value = safeNum(v.count);
         
         // Data bar uses a hidden percentage helper cell outside the visible report area.
         s1.getCell(`G${vRow}`).value = pct;
         s1.getCell(`G${vRow}`).numFmt = '0.0%';
         s1.addConditionalFormatting({
            ref: `G${vRow}:G${vRow}`,
            rules: [{ 
               type: 'dataBar', 
               priority: 1, 
               gradient: false, 
               cfvo: [{ type: 'num', value: 0 }, { type: 'num', value: 1 }]
            }]
         });
         
         vRow++;
      });
      
      currentRow = vRow + 2;

      // Embed Historical Trend Chart Image
      if (trendChartImgData) {
         try {
             // clean base64 prefix
             const base64Data = trendChartImgData.replace(/^data:image\/png;base64,/, '');
             const imageId = workbook.addImage({ base64: base64Data, extension: 'png' });
             s1.addImage(imageId, {
                 tl: { col: 1, row: currentRow }, // starts at column B (index 1)
                 ext: { width: 800, height: 350 } // absolute dimensions in pixels
             });
             currentRow += 20; // estimate roughly 20 rows of row-height equivalent to 350px
         } catch(e) {
             console.error("Failed to embed trend chart", e);
         }
      }

      // Embed Category Distribution Chart Image
      if (categoryChartImgData) {
         try {
             const base64Data = categoryChartImgData.replace(/^data:image\/png;base64,/, '');
             const imageId = workbook.addImage({ base64: base64Data, extension: 'png' });
             s1.addImage(imageId, {
                 tl: { col: 1, row: currentRow },
                 ext: { width: 500, height: 400 }
             });
             currentRow += 22;
         } catch(e) {
             console.error("Failed to embed category chart", e);
         }
      }

      // Draw Section: Top Category changes Insights List
      s1.mergeCells(`B${currentRow}:F${currentRow}`);
      s1.getCell(`B${currentRow}`).value = isRTL ? '🔄 تغيرات التصنيفات قبل الضريبة' : '🔄 Before-VAT Category Changes';
      s1.getCell(`B${currentRow}`).font = { size: 14, bold: true, color: { argb: 'FF0F172A' } };
      
      let aRowOffset = currentRow + 2;
      if (categoryChangesInsight.length > 0) {
          s1.getCell(`B${aRowOffset}`).value = isRTL ? 'التصنيف' : 'Category';
          s1.getCell(`C${aRowOffset}`).value = isRTL ? 'السابق' : 'Previous';
          s1.getCell(`D${aRowOffset}`).value = isRTL ? 'الحالي' : 'Current';
          s1.getCell(`E${aRowOffset}`).value = isRTL ? 'التغير' : 'Change';
          s1.getCell(`B${aRowOffset}`).font = { bold: true };
          s1.getCell(`C${aRowOffset}`).font = { bold: true };
          s1.getCell(`D${aRowOffset}`).font = { bold: true };
          s1.getCell(`E${aRowOffset}`).font = { bold: true };
          aRowOffset++;

          categoryChangesInsight.forEach((c: any) => {
             const isIncrease = c.change > 0;
             const arrow = isIncrease ? '↑' : '↓';
             s1.getCell(`B${aRowOffset}`).value = c.name;
             s1.getCell(`C${aRowOffset}`).value = formatCurrency(safeNum(c.prev));
             s1.getCell(`D${aRowOffset}`).value = formatCurrency(safeNum(c.curr));
             s1.getCell(`E${aRowOffset}`).value = `${arrow} ${formatCurrency(Math.abs(safeNum(c.change)))} (${formatPercent(safeNum(c.percentage) * 100, 0)})`;
             s1.getCell(`E${aRowOffset}`).font = { bold: true, color: { argb: isIncrease ? 'FFE11D48' : 'FF10B981' } };
             s1.getCell(`E${aRowOffset}`).alignment = { vertical: 'middle', horizontal: isRTL ? 'right' : 'left', wrapText: true };
             aRowOffset++;
          });
      } else {
          s1.getCell(`B${aRowOffset}`).value = isRTL ? 'لا توجد بيانات مقارنة كافية' : 'Insufficient comparison data';
          s1.getCell(`B${aRowOffset}`).font = { color: { argb: 'FF64748B' } };
          aRowOffset++;
      }

      const formatHeader = (row: any) => {
        row.font = { bold: true, color: { argb: 'FFFFFFFF' } };
        row.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1F2937' } };
        row.alignment = { vertical: 'middle', horizontal: 'center' };
      };

      // Sheet 2: Raw Monthly Trend (Optional/Detail)
      const s2 = createSheet(isRTL ? 'بيانات الاتجاه الشهري' : 'Monthly Trend Data');
      s2.columns = [
        { header: isRTL ? 'الشهر' : 'Month', width: 25 },
        { header: isRTL ? 'إجمالي المصروفات قبل الضريبة' : 'Total Expenses Before VAT', width: 30, style: { numFmt: '#,##0.00' } },
        { header: isRTL ? 'عدد المعاملات' : 'Transactions Count', width: 20 },
        { header: isRTL ? 'أعلى تصنيف' : 'Top Category', width: 30 }
      ];
      formatHeader(s2.getRow(1));
      historicalChart.forEach((h: any) => s2.addRow([h.name, safeNum(h.value), safeNum(h.count), h.topCategory || 'N/A']));

      // Sheet 3: Raw Categories Data
      const s3 = createSheet(isRTL ? 'بيانات التصنيفات' : 'Categories Data');
      s3.columns = [
        { header: isRTL ? 'التصنيف' : 'Category', width: 40 },
        { header: isRTL ? 'المبلغ قبل الضريبة' : 'Amount Before VAT', width: 25, style: { numFmt: '#,##0.00' } },
        { header: isRTL ? 'النسبة' : 'Percentage', width: 15, style: { numFmt: '0.00%' } }
      ];
      formatHeader(s3.getRow(1));
      categoryChart.forEach((c: any) => s3.addRow([c.name, safeNum(c.value), safeNum(c.percentage)]));

      // Sheet 4: Raw Vendors Data
      const s4 = createSheet(isRTL ? 'بيانات الموردين' : 'Vendors Data');
      s4.columns = [
        { header: isRTL ? 'المورد' : 'Vendor', width: 40 },
        { header: isRTL ? 'شامل الضريبة' : 'Incl. VAT', width: 25, style: { numFmt: '#,##0.00' } },
        { header: isRTL ? 'قبل الضريبة' : 'Before VAT', width: 25, style: { numFmt: '#,##0.00' } },
        { header: isRTL ? 'ضريبة' : 'VAT', width: 20, style: { numFmt: '#,##0.00' } },
        { header: isRTL ? 'عدد المعاملات' : 'Transactions', width: 20 }
      ];
      formatHeader(s4.getRow(1));
      topVendors.forEach((v: any) => s4.addRow([v.name, safeNum(v.totalAmount), safeNum(v.beforeVatAmount), safeNum(v.vatAmount), safeNum(v.count)]));

      const buffer = await workbook.xlsx.writeBuffer();
      const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = `Expenses_Dashboard_Report_${new Date().toISOString().split('T')[0]}.xlsx`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      notify(isRTL ? 'تم تصدير الإكسيل بنجاح' : 'Excel exported successfully', 'success');
    } catch (error) {
      console.error('Error exporting dashboard:', error);
      notify(isRTL ? 'عذراً، حدث خطأ أثناء التصدير.' : 'Sorry, an error occurred during export.', 'error');
    }
  };

  return (
    <div ref={dashboardRef} className="space-y-4 w-full dashboard-print-container" dir={isRTL ? "rtl" : "ltr"}>
      {/* BRANCH SEGMENTATION — only when real multiple branches exist; never a silent merge */}
      {hasMultipleBranches && (
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm print-hidden">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-black text-slate-800">المصروفات حسب الفرع</h3>
            <span className="text-[11px] font-bold text-slate-500 bg-slate-100 px-2 py-1 rounded">
              {branchFilter === 'all' ? 'العرض: كل الفروع (مجمّع)' : `العرض: ${branchLabel(branchFilter)}`}
            </span>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setBranchFilter('all')}
              className={`px-3 py-2 rounded-xl text-sm font-bold border transition-all ${branchFilter === 'all' ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'}`}
            >
              كل الفروع (مجمّع) — {formatCurrency(branchTotals.reduce((s, b) => s + b.total, 0))}
            </button>
            {branchTotals.map(bt => (
              <button
                key={bt.id}
                onClick={() => setBranchFilter(bt.id)}
                className={`px-3 py-2 rounded-xl text-sm font-bold border transition-all ${branchFilter === bt.id ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white text-slate-700 border-slate-200 hover:border-indigo-300'}`}
              >
                {branchLabel(bt.id)} — {formatCurrency(bt.total)}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* PAGE ACTIONS */}
      <div className="flex justify-between items-center w-full print-hidden mb-2 relative z-20">
        <div className="flex flex-wrap items-center gap-2">
          {/* Active Filter Chips (Optional) */}
          {periodFilter !== 'all' && (
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-blue-50 text-blue-700 text-xs font-bold border border-blue-100">
               <Calendar className="w-3.5 h-3.5" />
               {periodFilter === 'custom' ? `${dateRange.start} - ${dateRange.end}` : (
                 periodFilter === 'this_year' ? (isRTL ? 'هذا العام' : 'This Year') :
                 periodFilter === 'this_quarter' ? (isRTL ? 'الربع الحالي' : 'This Quarter') :
                 periodFilter === 'this_month' ? (isRTL ? 'هذا الشهر' : 'This Month') : ''
               )}
            </span>
          )}
          {searchQuery && (
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-blue-50 text-blue-700 text-xs font-bold border border-blue-100">
               <Search className="w-3.5 h-3.5" />
               {searchQuery}
            </span>
          )}
        </div>

        <div className="flex items-center gap-3">
          {/* FILTER BUTTON */}
          <div className="relative shrink-0">
            <button
              onClick={() => setShowFilterMenu(!showFilterMenu)}
              className="flex items-center justify-center h-10 gap-2 px-4 md:px-5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-sm font-bold rounded-xl shadow-sm transition-all active:scale-95"
            >
              <Filter className="w-4 h-4" />
              <span className="inline">{isRTL ? 'تصفية' : 'Filter'}</span>
            </button>

            {showFilterMenu && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setShowFilterMenu(false)}></div>
                <div className={`absolute top-full mt-2 w-72 bg-white border border-slate-200 rounded-xl shadow-xl z-20 overflow-hidden animate-in fade-in zoom-in-95 duration-200 p-4 flex flex-col gap-4 ${isRTL ? 'left-0 origin-top-left' : 'right-0 origin-top-right'}`}>
                  
                  {/* Period Filter */}
                  <div>
                    <label className="block text-xs font-bold text-slate-500 mb-1.5">{isRTL ? 'الفترة' : 'Period'}</label>
                    <select
                      value={periodFilter}
                      onChange={(e) => setPeriodFilter(e.target.value)}
                      className="w-full h-10 px-3 bg-slate-50 border border-slate-200 rounded-lg text-sm font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                    >
                      <option value="all">{isRTL ? 'كل السنوات' : 'All Years'}</option>
                      <option value="this_year">{isRTL ? 'هذا العام' : 'This Year'}</option>
                      <option value="this_quarter">{isRTL ? 'الربع الحالي' : 'This Quarter'}</option>
                      <option value="this_month">{isRTL ? 'هذا الشهر' : 'This Month'}</option>
                      <option value="custom">{isRTL ? 'مخصص' : 'Custom'}</option>
                    </select>
                  </div>

                  {/* Custom Date Range */}
                  {periodFilter === 'custom' && (
                    <div className="flex gap-2 w-full">
                      <div className="flex-1">
                        <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">{isRTL ? 'من' : 'From'}</label>
                        <input 
                          type="date"
                          value={dateRange.start}
                          onChange={(e) => setDateRange({...dateRange, start: e.target.value})}
                          className="w-full h-9 px-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                        />
                      </div>
                      <div className="flex-1">
                        <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">{isRTL ? 'إلى' : 'To'}</label>
                        <input 
                          type="date"
                          value={dateRange.end}
                          onChange={(e) => setDateRange({...dateRange, end: e.target.value})}
                          className="w-full h-9 px-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                        />
                      </div>
                    </div>
                  )}

                  {/* Search */}
                  <div>
                    <label className="block text-xs font-bold text-slate-500 mb-1.5">{isRTL ? 'بحث داخل المصروفات' : 'Search Expenses'}</label>
                    <div className="relative">
                      <Search className={`w-3.5 h-3.5 absolute ${isRTL ? 'right-2.5' : 'left-2.5'} top-1/2 -translate-y-1/2 text-slate-400`} />
                      <input 
                        type="text" 
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder={isRTL ? 'مورد، مستند، ملف...' : 'Vendor, document, file...'}
                        className={`w-full h-10 ${isRTL ? 'pr-8 pl-3' : 'pl-8 pr-3'} py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500/20`}
                      />
                    </div>
                  </div>

                  <div className="pt-3 mt-1 border-t border-slate-100 flex items-center justify-between">
                    <button
                      onClick={() => {
                        setPeriodFilter('all');
                        setDateRange({ start: '', end: '' });
                        setSearchQuery('');
                      }}
                      className="text-xs font-bold text-slate-400 hover:text-slate-700 transition-colors"
                    >
                      {isRTL ? 'إعادة ضبط' : 'Reset'}
                    </button>
                    <button
                      onClick={() => setShowFilterMenu(false)}
                      className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold transition-colors"
                    >
                      {isRTL ? 'تطبيق' : 'Apply'}
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>

          {/* EXPORT BUTTON */}
          <div className="relative shrink-0">
            <button
              onClick={() => setShowExportMenu(!showExportMenu)}
              className="flex items-center justify-center h-10 gap-2 px-4 md:px-5 bg-slate-900 border border-slate-800 hover:bg-slate-800 text-white text-sm font-bold rounded-xl shadow-sm transition-all active:scale-95"
            >
              <Download className="w-4 h-4" />
              <span className="inline">{isRTL ? 'تصدير' : 'Export'}</span>
              <svg className={`w-4 h-4 transition-transform ${showExportMenu ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
            </button>
            
            {showExportMenu && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setShowExportMenu(false)}></div>
                <div className={`absolute top-full mt-2 w-52 bg-white border border-slate-200 rounded-xl shadow-lg z-20 overflow-hidden animate-in fade-in zoom-in-95 duration-200 ${isRTL ? 'left-0 origin-top-left' : 'right-0 origin-top-right'}`}>
                  <button
                    onClick={handleExportPDF}
                    className="w-full text-start px-4 py-3 text-[13px] font-bold text-slate-700 hover:bg-rose-50 hover:text-rose-700 flex items-center justify-between transition-colors border-b border-slate-100"
                  >
                    <span className="flex items-center gap-2">
                       <FileText className="w-4 h-4 text-rose-600" />
                       {isRTL ? 'تصدير PDF' : 'Export PDF'}
                    </span>
                  </button>
                  <button
                    onClick={handleExportExcel}
                    className="w-full text-start px-4 py-3 text-[13px] font-bold text-slate-700 hover:bg-emerald-50 hover:text-emerald-700 flex items-center justify-between transition-colors border-b border-slate-100"
                  >
                    <span className="flex items-center gap-2">
                       <Layers className="w-4 h-4 text-emerald-600" />
                       {isRTL ? 'تصدير لوحة المصروفات (Excel)' : 'Export Dashboard (Excel)'}
                    </span>
                  </button>
                  <button
                    onClick={handleExportRawExcel}
                    className="w-full text-start px-4 py-3 text-[13px] font-bold text-slate-700 hover:bg-slate-50 hover:text-slate-900 flex items-center justify-between transition-colors border-b border-slate-100"
                  >
                    <span className="flex items-center gap-2">
                       <FileText className="w-4 h-4 text-slate-500" />
                       {isRTL ? 'تصدير البيانات الخام' : 'Export Raw Data'}
                    </span>
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* SECTION B - KPI ROW */}
      <div className="flex flex-col gap-4 w-full">
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-[16px] md:gap-[20px]">
          {/* Card 1: Expenses Before VAT */}
          <div onClick={() => navigateWithContext('monthly_summary')} className="cursor-pointer bg-white rounded-[16px] border border-blue-100 p-3.5 px-4 shadow-[0_2px_10px_-4px_rgba(0,0,0,0.05)] flex flex-col justify-between hover:border-blue-300 hover:shadow-[0_8px_16px_-6px_rgba(59,130,246,0.12)] hover:-translate-y-[2px] transition-all duration-300 group relative overflow-hidden h-auto min-h-[114px]">
            <div className="absolute top-0 left-0 w-full h-[4px] bg-blue-500 transition-colors opacity-90 group-hover:opacity-100"></div>
            <div className="flex justify-between items-start mb-1">
              <div className="flex flex-col gap-0.5">
                <p className="text-[13px] font-bold text-blue-700 tracking-wider mr-2 truncate">{isRTL ? 'المصروفات قبل الضريبة' : 'Expenses Before VAT'}</p>
                <div className="flex items-baseline gap-1.5 mt-0.5">
                   <h3 className="text-[22px] leading-none font-black text-slate-800 tracking-tight truncate group-hover:text-blue-900 transition-colors">{formatCurrency(totalBeforeVat)}</h3>
                </div>
              </div>
              <div className="w-8 h-8 rounded-lg bg-blue-50/80 flex items-center justify-center shrink-0 group-hover:bg-blue-100 transition-colors">
                 <TrendingDown className="w-4 h-4 text-blue-500 group-hover:text-blue-600 transition-colors" />
              </div>
            </div>
            <div className="pt-1.5 border-t border-slate-50 flex items-center justify-between">
               <span className="text-[12px] font-bold text-blue-600/80 group-hover:text-blue-700 transition-colors uppercase tracking-widest">{isRTL ? 'عرض ملخص المصروفات' : 'View Expense Summary'}</span>
               <span className="text-blue-500 opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all text-[13px]">&rarr;</span>
            </div>
          </div>

          {/* Card 2: Input VAT */}
          <div onClick={() => navigateWithContext('tax_declaration')} className="cursor-pointer bg-white rounded-[16px] border border-violet-100 p-3.5 px-4 shadow-[0_2px_10px_-4px_rgba(0,0,0,0.05)] flex flex-col justify-between hover:border-violet-300 hover:shadow-[0_8px_16px_-6px_rgba(139,92,246,0.12)] hover:-translate-y-[2px] transition-all duration-300 group relative overflow-hidden h-auto min-h-[114px]">
            <div className="absolute top-0 left-0 w-full h-[4px] bg-violet-500 transition-colors opacity-90 group-hover:opacity-100"></div>
            <div className="flex justify-between items-start mb-1">
              <div className="flex flex-col gap-0.5">
                <p className="text-[13px] font-bold text-violet-700 tracking-wider mr-2 truncate">{isRTL ? 'ضريبة المدخلات' : 'Input VAT'}</p>
                <div className="flex items-baseline gap-1.5 mt-0.5">
                   <h3 className="text-[22px] leading-none font-black text-slate-800 tracking-tight truncate group-hover:text-violet-900 transition-colors">{formatCurrency(totalVAT)}</h3>
                </div>
              </div>
              <div className="w-8 h-8 rounded-lg bg-violet-50/80 flex items-center justify-center shrink-0 group-hover:bg-violet-100 transition-colors">
                 <Tag className="w-4 h-4 text-violet-500 group-hover:text-violet-600 transition-colors" />
              </div>
            </div>
            <div className="pt-1.5 border-t border-slate-50 flex items-center justify-between">
               <span className="text-[12px] font-bold text-violet-600/80 group-hover:text-violet-700 transition-colors uppercase tracking-widest">{isRTL ? 'عرض الإقرار الضريبي' : 'VAT Declaration'}</span>
               <span className="text-violet-500 opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all text-[13px]">&rarr;</span>
            </div>
          </div>

          {/* Card 3: Non-Taxable */}
          <div onClick={() => navigateWithContext('categories_summary', undefined, 'non_taxable_categories', 'expenses')} className="cursor-pointer bg-white rounded-[16px] border border-slate-200 p-3.5 px-4 shadow-[0_2px_10px_-4px_rgba(0,0,0,0.05)] flex flex-col justify-between hover:border-slate-300 hover:shadow-[0_8px_16px_-6px_rgba(0,0,0,0.08)] hover:-translate-y-[2px] transition-all duration-300 group relative overflow-hidden h-auto min-h-[114px]">
            <div className="absolute top-0 left-0 w-full h-[4px] bg-slate-400 transition-colors opacity-80 group-hover:opacity-100"></div>
            <div className="flex justify-between items-start mb-1">
              <div className="flex flex-col gap-0.5">
                <p className="text-[13px] font-bold text-slate-600 tracking-wider mr-2 truncate">{isRTL ? 'غير خاضع للضريبة' : 'Non-Taxable Amount'}</p>
                <div className="flex items-baseline gap-1.5 mt-0.5">
                   <h3 className="text-[22px] leading-none font-black text-slate-800 tracking-tight truncate group-hover:text-slate-900 transition-colors">{formatCurrency(totalNonTaxable)}</h3>
                </div>
              </div>
              <div className="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center shrink-0 group-hover:bg-slate-100 transition-colors">
                 <Layers className="w-4 h-4 text-slate-500 group-hover:text-slate-600 transition-colors" />
              </div>
            </div>
            <div className="pt-1.5 border-t border-slate-50 flex items-center justify-between">
               <span className="text-[12px] font-bold text-slate-500/80 group-hover:text-slate-700 transition-colors uppercase tracking-widest">{isRTL ? 'التصنيفات غير الخاضعة' : 'Exempt Categories'}</span>
               <span className="text-slate-400 opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all text-[13px]">&rarr;</span>
            </div>
          </div>

          {/* Card 4: Total Expenses */}
          <div onClick={() => navigateWithContext('monthly_summary')} className="cursor-pointer bg-white rounded-[16px] border border-rose-100 p-3.5 px-4 shadow-[0_2px_10px_-4px_rgba(0,0,0,0.05)] flex flex-col justify-between hover:border-rose-300 hover:shadow-[0_8px_16px_-6px_rgba(244,63,94,0.12)] hover:-translate-y-[2px] transition-all duration-300 group relative overflow-hidden h-auto min-h-[114px]">
            <div className="absolute top-0 left-0 w-full h-[4px] bg-rose-500 transition-colors opacity-90 group-hover:opacity-100"></div>
            <div className="flex justify-between items-start mb-1">
              <div className="flex flex-col gap-0.5">
                <p className="text-[13px] font-bold text-rose-700 tracking-wider mr-2 truncate">{isRTL ? 'إجمالي المصروفات شامل الضريبة' : 'Total Expenses Incl. VAT'}</p>
                <div className="flex items-baseline gap-1.5 mt-0.5">
                   <h3 className="text-[22px] leading-none font-black text-rose-700 tracking-tight truncate group-hover:text-rose-800 transition-colors">{formatCurrency(totalExpenses)}</h3>
                </div>
              </div>
              <div className="w-8 h-8 rounded-lg bg-rose-50/80 flex items-center justify-center shrink-0 group-hover:bg-rose-100 transition-colors">
                 <FileText className="w-4 h-4 text-rose-500 group-hover:text-rose-600 transition-colors" />
              </div>
            </div>
            <div className="pt-1.5 border-t border-slate-50 flex items-center justify-between">
               <span className="text-[12px] font-bold text-rose-600/80 group-hover:text-rose-700 transition-colors uppercase tracking-widest">{isRTL ? 'عرض ملخص المصروفات' : 'Expenses Summary'}</span>
               <span className="text-rose-500 opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all text-[13px]">&rarr;</span>
            </div>
          </div>
        </div>

        {/* Operational Flow */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-[16px] md:gap-[20px]">
           <div onClick={() => navigateWithContext('monthly_summary')} className="cursor-pointer bg-white rounded-[16px] border border-slate-200 p-4 shadow-[0_2px_10px_-4px_rgba(0,0,0,0.05)] flex flex-col justify-between hover:border-sky-200 hover:shadow-[0_8px_20px_-8px_rgba(14,165,233,0.15)] hover:-translate-y-1 transition-all duration-300 group">
             <div className="flex justify-between items-center mb-2">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded bg-sky-50 flex items-center justify-center shrink-0 group-hover:bg-sky-100 transition-colors">
                    <Activity className="w-3.5 h-3.5 text-sky-500" />
                  </div>
                  <p className="text-[13px] font-bold text-slate-600 uppercase tracking-wider truncate group-hover:text-sky-600/90 transition-colors">{isRTL ? 'عدد المعاملات' : 'Transactions Count'}</p>
                </div>
                <span className="text-[12px] font-bold text-sky-500 group-hover:text-sky-600 transition-colors">{isRTL ? 'عرض المعاملات' : 'View Transactions'} &rarr;</span>
             </div>
             <div className="flex items-baseline gap-1.5 px-1 mt-1">
                <h3 className="text-[22px] leading-none font-black text-slate-800 tracking-tight">{transactionsCount}</h3>
                <span className="text-[11px] font-bold text-slate-400">{isRTL ? 'معاملة' : 'Txn'}</span>
             </div>
           </div>

           <div onClick={() => navigateWithContext('grouped_purchases')} className="cursor-pointer bg-white rounded-[16px] border border-slate-200 p-4 shadow-[0_2px_10px_-4px_rgba(0,0,0,0.05)] flex flex-col justify-between hover:border-indigo-200 hover:shadow-[0_8px_20px_-8px_rgba(99,102,241,0.15)] hover:-translate-y-1 transition-all duration-300 group">
             <div className="flex justify-between items-center mb-2">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded bg-indigo-50 flex items-center justify-center shrink-0 group-hover:bg-indigo-100 transition-colors">
                    <Users className="w-3.5 h-3.5 text-indigo-500" />
                  </div>
                  <p className="text-[13px] font-bold text-slate-600 uppercase tracking-wider truncate group-hover:text-indigo-600/90 transition-colors">{isRTL ? 'عدد الموردين' : 'Vendors Count'}</p>
                </div>
                <span className="text-[12px] font-bold text-indigo-500 group-hover:text-indigo-600 transition-colors">{isRTL ? 'عرض الموردين' : 'View Vendors'} &rarr;</span>
             </div>
             <div className="flex items-baseline gap-1.5 px-1 mt-1">
                <h3 className="text-[22px] leading-none font-black text-slate-800 tracking-tight">{vendorsCount}</h3>
                <span className="text-[11px] font-bold text-slate-400">{isRTL ? 'مورد' : 'Vendor'}</span>
             </div>
           </div>
           
           <div onClick={() => setShowNeedsAttentionDetails(!showNeedsAttentionDetails)} className={`cursor-pointer bg-white rounded-[16px] border ${filteredAnomaliesCount === 0 ? 'border-slate-200 hover:border-emerald-200 hover:shadow-[0_8px_20px_-8px_rgba(16,185,129,0.15)]' : 'border-rose-200 ring-1 ring-rose-50 hover:border-rose-300 hover:shadow-[0_8px_20px_-8px_rgba(244,63,94,0.15)]'} p-4 shadow-[0_2px_10px_-4px_rgba(0,0,0,0.05)] flex flex-col justify-between hover:-translate-y-1 transition-all duration-300 group`}>
             <div className="flex justify-between items-center mb-2">
                <div className="flex items-center gap-2">
                  <div className={`w-6 h-6 rounded ${filteredAnomaliesCount === 0 ? 'bg-emerald-50 group-hover:bg-emerald-100' : 'bg-rose-50 group-hover:bg-rose-100'} flex items-center justify-center shrink-0 transition-colors`}>
                    {filteredAnomaliesCount === 0 ? <CheckCircle className="w-3.5 h-3.5 text-emerald-500" /> : <AlertTriangle className="w-3.5 h-3.5 text-rose-500" />}
                  </div>
                  <p className={`text-[13px] font-bold uppercase tracking-wider truncate transition-colors ${filteredAnomaliesCount === 0 ? 'text-slate-600 group-hover:text-emerald-600/90' : 'text-rose-600 group-hover:text-rose-700'}`}>{isRTL ? 'يحتاج انتباهك' : 'Needs Attention'}</p>
                </div>
                <span className={`text-[12px] font-bold transition-colors ${filteredAnomaliesCount === 0 ? 'text-emerald-500 group-hover:text-emerald-600' : 'text-rose-500 group-hover:text-rose-600'}`}>{filteredAnomaliesCount === 0 ? (isRTL ? 'عرض التفاصيل' : 'Details') : (isRTL ? 'مراجعة الأخطاء' : 'Review Errors')} &rarr;</span>
             </div>
             <div className="flex items-baseline gap-1.5 px-1 mt-1">
                {filteredAnomaliesCount === 0 ? (
                  <h3 className="text-[14px] leading-none font-bold text-slate-800 tracking-tight mt-1 mb-1">{isRTL ? 'كل شيء يبدو جيدًا' : 'Everything looks good'}</h3>
                ) : (
                  <>
                    <h3 className="text-[22px] leading-none font-black text-rose-700 tracking-tight">{filteredAnomaliesCount}</h3>
                    <span className="text-[11px] font-bold text-rose-500 truncate">{isRTL ? 'عناصر تحتاج مراجعة' : 'Items need review'}</span>
                  </>
                )}
             </div>
           </div>
        </div>

        {/* Needs Attention Details Modal/Drawer */}
        {showNeedsAttentionDetails && (
          <div className={`fixed inset-0 z-50 flex ${filteredAnomaliesCount === 0 ? 'items-center justify-center bg-slate-900/20 backdrop-blur-sm' : 'bg-slate-900/5'} transition-opacity duration-300`} onClick={() => setShowNeedsAttentionDetails(false)}>
            {filteredAnomaliesCount === 0 ? (
              <div 
                className="bg-white rounded-2xl shadow-xl border border-slate-200 w-full max-w-sm overflow-hidden animate-in zoom-in-95 duration-200"
                onClick={e => e.stopPropagation()}
              >
                <div className="p-6 flex flex-col items-center text-center">
                  <div className="flex justify-end w-full mb-2">
                    <button onClick={() => setShowNeedsAttentionDetails(false)} className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors">
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                  </div>
                  <div className="w-16 h-16 bg-emerald-50 rounded-full flex items-center justify-center mb-4 ring-8 ring-emerald-50/50">
                    <CheckCircle className="w-8 h-8 text-emerald-500" />
                  </div>
                  <h3 className="text-[18px] font-bold text-emerald-800 mb-2 tracking-tight">
                    {isRTL ? 'تفاصيل الانتباه' : 'Attention Details'}
                  </h3>
                  <h4 className="text-[15px] font-bold text-slate-800 mb-2">
                    {isRTL ? 'كل شيء يبدو جيدًا' : 'Everything looks good'}
                  </h4>
                  <p className="text-[14px] text-emerald-600/80 mb-4 max-w-[280px] leading-relaxed">
                    {isRTL ? 'لا توجد عناصر تحتاج انتباهك حاليًا. جميع المعاملات مسجلة بشكل صحيح.' : 'No items need attention right now. All transactions are correctly recorded.'}
                  </p>
                  <button onClick={() => setShowNeedsAttentionDetails(false)} className="w-full py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-[14px] font-bold rounded-xl transition-all shadow-sm">
                    {isRTL ? 'إغلاق' : 'Close'}
                  </button>
                </div>
              </div>
            ) : (
              <div 
                className={`fixed top-0 bottom-0 ${isRTL ? 'left-0 border-r' : 'right-0 border-l'} z-50 w-full max-w-sm bg-white shadow-2xl border-slate-200 animate-in ${isRTL ? 'slide-in-from-left' : 'slide-in-from-right'} duration-300`} 
                onClick={e => e.stopPropagation()}
              >
                <div className="p-6 h-full flex flex-col">
                  <div className="flex justify-between items-center mb-8">
                    <h3 className="text-xl font-black text-slate-800 tracking-tight">{isRTL ? 'يحتاج انتباهك' : 'Needs Attention'}</h3>
                    <button onClick={() => setShowNeedsAttentionDetails(false)} className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 hover:bg-slate-200 hover:text-slate-700 transition-colors">
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                  </div>
                  
                  <div className="flex-1 overflow-y-auto">
                    <div className="flex flex-col items-center justify-center text-center mt-2 mb-6">
                       <div className="w-20 h-20 bg-rose-50 rounded-full flex items-center justify-center mb-5 ring-8 ring-rose-50/50">
                         <AlertTriangle className="w-10 h-10 text-rose-500" />
                       </div>
                       <h3 className="text-[18px] font-bold text-rose-800 mb-2">
                         {isRTL ? `يوجد ${filteredAnomaliesCount} أخطاء تحتاج للمراجعة` : `${filteredAnomaliesCount} anomalies require review`}
                       </h3>
                    </div>
                    
                    <div className="flex flex-col gap-3">
                       {filteredExpenseRecords.filter((r:any) => r.Needs_Attention || (r.validationIssues && r.validationIssues.length > 0)).slice(0, 5).map((errRec: any, i: number) => (
                         <div key={i} className="p-4 rounded-xl border border-rose-100 bg-rose-50/50 flex flex-col gap-2 transition-colors hover:bg-rose-50">
                           <div className="flex justify-between items-center">
                             <p className="font-bold text-slate-800 text-[13px] truncate flex-1 pl-2">{errRec.Vendor_Name || errRec.Entity_Normalized_Name || (isRTL ? 'مورد غير معروف' : 'Unknown Vendor')}</p>
                             <span className="text-rose-600 font-black text-[13px]">{formatCurrency(errRec.Total_Amount || errRec.Net_Amount || 0)}</span>
                           </div>
                           <p className="text-[12px] text-rose-600/80 font-bold leading-relaxed">
                             {errRec.validationIssues && errRec.validationIssues.length > 0 ? errRec.validationIssues.map((v:any)=>v.message).join(' • ') : (isRTL ? 'قيم غير متطابقة أو بيانات ناقصة' : 'Mismatched val/missing data')}
                           </p>
                         </div>
                       ))}
                       {filteredAnomaliesCount > 5 && (
                         <p className="text-center text-sm font-bold text-slate-500 mt-2">{isRTL ? `و ${filteredAnomaliesCount - 5} معاملات أخرى` : `And ${filteredAnomaliesCount - 5} more transactions`}</p>
                       )}
                    </div>
                  </div>
                  <div className="pt-4 border-t border-slate-100 mt-4">
                     <button onClick={() => { setShowNeedsAttentionDetails(false); navigateWithContext('anomalies_report', undefined, undefined, 'expenses')}} className="w-full py-3.5 bg-rose-600 hover:bg-rose-700 text-white text-[14px] font-bold rounded-xl transition-all shadow-sm hover:shadow-md active:scale-[0.98]">
                       {isRTL ? 'مراجعة الأخطاء بالكامل' : 'Review All Errors'}
                     </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Average Calculation Explanation Modal */}
        {showAvgExplanation && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/20 backdrop-blur-sm transition-opacity duration-300" onClick={() => setShowAvgExplanation(false)}>
            <div 
              className="bg-white rounded-2xl shadow-xl border border-slate-200 w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200"
              onClick={e => e.stopPropagation()}
            >
              <div className="p-6">
                <div className="flex justify-between items-center mb-6">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center">
                      <Activity className="w-5 h-5 text-blue-600" />
                    </div>
                    <h3 className="text-[18px] font-bold text-slate-800 tracking-tight">
                      {isRTL ? 'متوسط المصروف الشهري قبل الضريبة' : 'Monthly Average Before VAT'}
                    </h3>
                  </div>
                  <button onClick={() => setShowAvgExplanation(false)} className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" /></svg>
                  </button>
                </div>
                
                <div className="bg-slate-50 rounded-xl p-5 mb-4 border border-slate-100">
                   <p className="text-sm font-bold text-slate-500 mb-3 uppercase tracking-wider">{isRTL ? 'طريقة الاحتساب' : 'Formula'}</p>
                   <div className="flex items-center justify-center gap-3 bg-white p-4 rounded-lg border border-slate-200 mb-4 text-[15px] font-bold text-slate-700 text-center">
                     <span>{isRTL ? 'إجمالي المصروفات قبل الضريبة' : 'Total Expenses Before VAT'}</span>
                     <span className="text-blue-500 font-black">&divide;</span>
                     <span>{isRTL ? 'الأشهر النشطة' : 'Active Months'}</span>
                   </div>
                   
                   <p className="text-sm font-bold text-slate-500 mb-3 uppercase tracking-wider">{isRTL ? 'تطبيق عملي' : 'Live Example'}</p>
                   <div className="flex items-center justify-center gap-2 bg-blue-50/50 p-4 rounded-lg border border-blue-100 text-[15px] text-blue-900 font-bold max-w-full overflow-hidden text-center flex-wrap">
                     <span>{formatCurrency(totalPeriodBeforeVat)}</span>
                     <span className="text-blue-500">&divide;</span>
                     <span>{activeMonthsCount} {isRTL ? 'أشهر نشطة' : 'active months'}</span>
                     <span className="text-blue-500">=</span>
                     <span className="text-blue-700 font-black">{formatCurrency(averageMonthlyBeforeVat)}</span>
                   </div>
                </div>
                
                <div className="flex items-start gap-3 text-[13px] font-semibold text-slate-600 bg-amber-50/50 p-3 rounded-lg border border-amber-100/50">
                   <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0" />
                   <p className="leading-relaxed">
                     {isRTL ? 'إجمالي المصروفات قبل الضريبة ÷ عدد الشهور النشطة التي تحتوي على مصروفات فعلية.' : 'Total expenses before VAT divided by active months with actual expense records.'}
                   </p>
                </div>
              </div>
              <div className="p-4 border-t border-slate-100 bg-slate-50 flex justify-end">
                <button onClick={() => setShowAvgExplanation(false)} className="px-5 py-2 bg-white border border-slate-200 hover:bg-slate-100 hover:text-slate-800 text-slate-700 text-[14px] font-bold rounded-xl transition-all shadow-sm">
                  {isRTL ? 'موافق' : 'Got it'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* SECTION C - MAIN ANALYTICS */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-[16px] md:gap-[20px] items-stretch">
        {/* Historical Area Chart */}
        <div id="historical-chart-container" className="xl:col-span-2 bg-white rounded-[18px] border border-slate-200 p-6 shadow-sm flex flex-col h-full min-h-[380px]">
           <div className="flex justify-between items-center mb-6">
              <h3 className="text-base font-bold text-slate-800">{isRTL ? 'المصروفات قبل الضريبة عبر الزمن' : 'Before-VAT Expenses Over Time'}</h3>
           </div>
           <div className="flex-1 w-full relative flex flex-col">
               {historicalChart.length > 0 ? (
                 <div className="flex flex-col flex-1 w-full min-h-0">
                   <div className="flex-1 w-full min-h-[200px]">
                     <ResponsiveContainer width="100%" height="100%">
                       <AreaChart data={historicalChart} margin={{ top: 10, right: 10, left: 0, bottom: 0 }} onClick={(e: any) => { if (e && e.activeLabel) { if (onMonthClick) onMonthClick(e.activeLabel); navigateWithContext('monthly_summary', undefined, undefined, 'expenses', true); } }}>
                         <defs>
                           <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                             <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.3}/>
                             <stop offset="95%" stopColor="#3B82F6" stopOpacity={0}/>
                           </linearGradient>
                         </defs>
                         <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                         <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#64748B', fontSize: 11, cursor: 'pointer' }} dy={10} width={isRTL ? 100 : 80} onClick={(data: any) => { if (data && data.value) { if (onMonthClick) onMonthClick(data.value); navigateWithContext('monthly_summary', undefined, undefined, 'expenses', true); } }} />
                         <YAxis axisLine={false} tickLine={false} tick={{fill: '#64748B', fontSize: 11}} tickFormatter={(val) => `${val / 1000}k`} />
                         <RechartsTooltip 
                           cursor={{fill: '#EEF3F8', opacity: 0.5}} 
                           content={({ active, payload, label }) => {
                             if (active && payload && payload.length) {
                               const data = payload[0].payload;
                               return (
                                 <div className="bg-white border border-slate-200 shadow-md rounded-lg p-3 text-sm" dir={isRTL ? 'rtl' : 'ltr'}>
                                   <p className="font-bold text-slate-800 mb-1">{isRTL ? 'الشهر: ' : 'Month: '}{label}</p>
                                   <p className="text-rose-600 font-bold mb-1"><span className="text-slate-600 font-normal mr-1">{isRTL ? 'إجمالي المصروفات قبل الضريبة:' : 'Total Expenses Before VAT:'}</span> {formatCurrency(data.value)}</p>
                                   {data.count > 0 && <p className="text-slate-600 mb-1"><span className="font-bold">{isRTL ? 'عدد المعاملات:' : 'Transactions:'}</span> {data.count}</p>}
                                   {data.topCategory && <p className="text-slate-600"><span className="font-bold">{isRTL ? 'أعلى تصنيف:' : 'Top Category:'}</span> {data.topCategory}</p>}
                                   {data.value === 0 && <p className="text-slate-500 mt-2 text-xs">{isRTL ? 'لا توجد مصروفات مسجلة في هذا الشهر' : 'No expenses recorded in this month'}</p>}
                                 </div>
                               );
                             }
                             return null;
                           }}
                         />
                         <Area type="monotone" dataKey="value" name={isRTL ? 'المصروفات قبل الضريبة' : 'Expenses Before VAT'} stroke="#3B82F6" strokeWidth={3} fillOpacity={1} fill="url(#colorValue)" cursor="pointer" isAnimationActive={true} animationDuration={800} animationEasing="ease-out" activeDot={{r: 6, cursor: 'pointer', strokeWidth: 0, fill: '#1e40af'}} />
                       </AreaChart>
                     </ResponsiveContainer>
                   </div>
                   <div className="mt-4 pt-4 border-t border-slate-100 grid grid-cols-2 lg:grid-cols-4 gap-2 bg-slate-50 p-2 rounded-2xl">
                     <div 
                       onClick={() => { navigateWithContext('monthly_summary', undefined, undefined, 'expenses') }}
                       className="p-3 rounded-xl hover:bg-white hover:shadow-[0_2px_8px_-4px_rgba(0,0,0,0.1)] border border-transparent hover:border-slate-200 transition-all cursor-pointer group flex flex-col"
                     >
                       <div className="flex justify-between items-center mb-1.5">
                         <p className="text-xs font-bold text-slate-500">{isRTL ? 'إجمالي الفترة قبل الضريبة' : 'Period Total Before VAT'}</p>
                         <span className="text-slate-400 group-hover:text-slate-600 opacity-0 group-hover:opacity-100 transition-opacity">
                           <svg className={`w-3.5 h-3.5 ${isRTL ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                         </span>
                       </div>
                       <p className="text-xl font-black text-slate-800 tracking-tight">{formatCurrency(totalPeriodBeforeVat)}</p>
                     </div>
                     <div 
                       onClick={() => setShowAvgExplanation(true)}
                       className="p-3 rounded-xl border border-transparent hover:border-slate-200 hover:bg-white hover:shadow-[0_2px_8px_-4px_rgba(0,0,0,0.1)] transition-all cursor-pointer group flex flex-col"
                     >
                       <div className="flex justify-between items-center mb-1.5">
                         <p className="text-xs font-bold text-slate-500">{isRTL ? 'متوسط المصروف الشهري قبل الضريبة' : 'Monthly Avg Before VAT'}</p>
                         <span className="text-slate-400 cursor-help transition-colors hover:text-slate-600" title={isRTL ? 'إجمالي المصروفات قبل الضريبة ÷ عدد الشهور النشطة' : 'Expenses before VAT ÷ active months'}>
                           <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                         </span>
                       </div>
                       <p className="text-xl font-black text-slate-800 tracking-tight">{formatCurrency(averageMonthlyBeforeVat)}</p>
                     </div>
                     <div 
                       onClick={() => { 
                         const val = highestMonthBeforeVat;
                         if (!val) return;
                         if(onMonthClick) onMonthClick(val.name); 
                         navigateWithContext('monthly_summary', undefined, undefined, 'expenses', true);
                       }}
                       className="p-3 rounded-xl hover:bg-white hover:shadow-[0_2px_8px_-4px_rgba(0,0,0,0.1)] border border-transparent hover:border-slate-200 transition-all cursor-pointer group flex flex-col lg:relative lg:before:absolute lg:before:-left-2 lg:before:top-2 lg:before:bottom-2 lg:before:w-[1px] lg:before:bg-slate-200"
                     >
                       <div className="flex justify-between items-center mb-1.5">
                         <p className="text-xs font-bold text-slate-500">{isRTL ? 'أعلى شهر إنفاقًا قبل الضريبة' : 'Highest Month Before VAT'}</p>
                         <span className="text-slate-400 group-hover:text-slate-600 opacity-0 group-hover:opacity-100 transition-opacity">
                           <svg className={`w-3.5 h-3.5 ${isRTL ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                         </span>
                       </div>
                       <p className="text-xl font-black text-slate-800 tracking-tight">{highestMonthBeforeVat?.name || '-'}</p>
                     </div>
                     <div 
                       onClick={() => { 
                         const val = lowestMonthBeforeVat;
                         if (!val) return;
                         if(onMonthClick) onMonthClick(val.name); 
                         navigateWithContext('monthly_summary', undefined, undefined, 'expenses', true);
                       }}
                       className="p-3 rounded-xl hover:bg-white hover:shadow-[0_2px_8px_-4px_rgba(0,0,0,0.1)] border border-transparent hover:border-slate-200 transition-all cursor-pointer group flex flex-col relative lg:before:absolute lg:before:-left-2 lg:before:top-2 lg:before:bottom-2 lg:before:w-[1px] lg:before:bg-slate-200"
                     >
                       <div className="flex justify-between items-center mb-1.5">
                         <p className="text-xs font-bold text-slate-500">{isRTL ? 'أقل شهر إنفاقًا قبل الضريبة' : 'Lowest Month Before VAT'}</p>
                         <span className="text-slate-400 group-hover:text-slate-600 opacity-0 group-hover:opacity-100 transition-opacity">
                           <svg className={`w-3.5 h-3.5 ${isRTL ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                         </span>
                       </div>
                       <p className="text-xl font-black text-slate-800 tracking-tight">{lowestMonthBeforeVat?.name || '-'}</p>
                     </div>
                   </div>
                 </div>
               ) : (
                 <div className="absolute inset-0 border border-dashed border-slate-200 rounded-[16px] bg-slate-50 flex flex-col items-center justify-center text-center p-6">
                   <div className="w-14 h-14 bg-white rounded-full shadow-sm flex items-center justify-center mb-4">
                     <Activity className="w-6 h-6 text-slate-400" />
                   </div>
                   <h3 className="text-sm font-bold text-slate-800 mb-1">
                     {allRecords.length > 0 ? (isRTL ? 'توجد بيانات مصروفات، لكن لا توجد تواريخ صالحة لإنشاء مسار زمني.' : 'Expense data exists, but dates are invalid for analysis.') : (isRTL ? 'بيانات المصروفات غير متوفرة' : 'Expenses Data Unavailable')}
                   </h3>
                 </div>
               )}
           </div>
        </div>

        {/* Category Pie Chart */}
        <div id="category-chart-container" className="bg-white rounded-[18px] border border-slate-200 p-6 shadow-sm flex flex-col xl:col-span-1 h-full min-h-[380px]">
           <div className="flex justify-between items-center mb-6">
              <h3 className="text-base font-bold text-slate-800">{isRTL ? 'توزيع المصروفات قبل الضريبة حسب التصنيف' : 'Before-VAT Expenses Distribution by Category'}</h3>
           </div>
           <div className="flex-1 w-full relative flex flex-col min-h-0">
               {categoryChart.length > 0 ? (
                 <>
                   <div className="h-[180px] shrink-0 w-full mb-2 relative">
                     <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none mt-2">
                        <span className="text-[10px] font-bold text-slate-500 mb-0.5 uppercase tracking-wider">{isRTL ? 'الإجمالي قبل الضريبة' : 'Before VAT Total'}</span>
                        <span className="text-[20px] font-black text-slate-800 tracking-tight">{formatCurrency(totalBeforeVat)}</span>
                     </div>
                     <ResponsiveContainer width="100%" height="100%">
                       <PieChart margin={{ top: 0, right: 0, bottom: 0, left: 0 }}>
                         <Pie
                           data={categoryChart}
                           cx="50%"
                           cy="50%"
                           innerRadius={65}
                           outerRadius={85}
                           paddingAngle={2}
                           dataKey="value"
                           isAnimationActive={true}
                           animationBegin={200}
                           animationDuration={1200}
                           animationEasing="ease-in-out"
                           onClick={((data: any) => handleCategoryClick(data.name)) as any}
                           cursor="pointer"
                           stroke="none"
                         >
                           {categoryChart.map((entry, index) => (
                             <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                           ))}
                         </Pie>
                         <RechartsTooltip 
                           content={({ active, payload }) => {
                             if (active && payload && payload.length) {
                               const data = payload[0].payload;
                               return (
                                 <div className="bg-white border border-slate-200 shadow-md rounded-lg p-2 text-xs" dir={isRTL ? 'rtl' : 'ltr'}>
                                   <p className="font-bold text-slate-800 mb-1">{isRTL ? 'اسم التصنيف: ' : 'Category: '}{data.name}</p>
                                   <p className="text-rose-600 font-bold mb-1"><span className="text-slate-600 font-normal mr-1">{isRTL ? 'القيمة قبل الضريبة:' : 'Before-VAT Amount:'}</span> {formatCurrency(data.value)}</p>
                                   <p className="text-slate-600 font-bold"><span className="text-slate-500 font-normal mr-1">{isRTL ? 'النسبة من الإجمالي قبل الضريبة:' : '% of Before-VAT Total:'}</span> {formatPercent((data.percentage || 0) * 100, 1)}</p>
                                 </div>
                               );
                             }
                             return null;
                           }}
                         />
                       </PieChart>
                     </ResponsiveContainer>
                   </div>
                   <div className="flex-1 flex flex-col justify-center min-h-0">
                     <div className="flex flex-col gap-[2px]">
                       {categoryChart.map((c: any, i: number) => {
                         const isOther = c.name === (isRTL ? 'أخرى' : 'Other');
                         return (
                           <div key={i} className={`flex justify-between items-center cursor-pointer hover:bg-slate-50 p-2 rounded-xl transition-all group ${isOther ? 'mt-1' : ''}`} onClick={() => handleCategoryClick(c.name)}>
                             <div className="flex items-center gap-3 flex-1 min-w-0 mr-2">
                               <div className={`w-3 h-3 rounded-full shrink-0 shadow-sm transition-transform group-hover:scale-110 ${isOther ? 'bg-slate-300' : ''}`} style={!isOther ? {backgroundColor: COLORS[i % COLORS.length]} : {}}></div>
                               <span className={`text-[13px] font-semibold truncate transition-colors ${isOther ? 'text-slate-600 group-hover:text-slate-800' : 'text-slate-700 group-hover:text-blue-700'}`} title={c.name}>{c.name}</span>
                             </div>
                             <div className="flex items-center gap-3 shrink-0 ml-2">
                               <span className={`text-[13px] font-black tabular-nums transition-colors ${isOther ? 'text-slate-600 group-hover:text-slate-800' : 'text-slate-800'}`}>{formatCurrency(c.value)}</span>
                               <span className={`text-[12px] font-bold w-[40px] text-right tabular-nums ${isOther ? 'text-slate-400' : 'text-slate-500'}`}>{formatPercent((c.percentage || 0) * 100, 0)}</span>
                             </div>
                           </div>
                         );
                       })}
                     </div>
                   </div>
                 </>
               ) : (
                 <div className="absolute inset-0 border border-dashed border-slate-200 rounded-[16px] bg-slate-50 flex flex-col items-center justify-center text-center p-6 mt-4">
                   <div className="w-14 h-14 bg-white rounded-full shadow-sm flex items-center justify-center mb-4">
                     <Layers className="w-6 h-6 text-slate-400" />
                   </div>
                   <h3 className="text-sm font-bold text-slate-800 mb-1">
                     {allRecords.length > 0 ? (isRTL ? 'توجد بيانات مصروفات، لكن لا توجد تصنيفات كافية لعرض التوزيع.' : 'Expense data exists, but categories are insufficient.') : (isRTL ? 'تصنيفات غير متوفرة' : 'Categories Data Unavailable')}
                   </h3>
                 </div>
               )}
           </div>
        </div>
      </div>

      {/* SECTION D - ACTIVITY & SUMMARY */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-[16px] md:gap-[20px] pb-4 items-stretch">
        <div className="bg-white rounded-[18px] border border-slate-200 p-6 shadow-sm flex flex-col h-full min-h-[360px]">
          <h3 className="text-base font-bold text-slate-800 mb-6">{isRTL ? 'أعلى الموردين حسب إجمالي التعامل شامل الضريبة' : 'Top Vendors by Total Exposure Incl. VAT'}</h3>
          <div className="flex-1 flex flex-col justify-around">
             {topVendors.length > 0 ? (
               <div className="flex flex-col h-full justify-between">
                 {topVendors.map((v: any, i: number) => (
                    <div key={i} className="cursor-pointer group flex flex-col p-2.5 -mx-2.5 rounded-xl hover:bg-slate-50 transition-all justify-center" onClick={() => { navigateWithContext('grouped_purchases', undefined, v.name, 'expenses'); }}>
                       <div className="flex justify-between items-center mb-2">
                         <span className="text-[13px] font-bold text-slate-700 truncate group-hover:text-indigo-700 transition-colors mr-2" title={v.name}>{v.name}</span>
                         <div className="flex items-center gap-3 shrink-0">
                           <span className="text-[13px] font-black text-slate-800 tabular-nums">{formatCurrency(v.totalAmount)}</span>
                           <span className="text-[12px] font-bold text-slate-500 tabular-nums w-[36px] text-right">{formatPercent((v.percentage || 0) * 100, 0)}</span>
                         </div>
                       </div>
                       <div className="flex flex-wrap gap-x-3 gap-y-1 mb-2 text-[11px] font-bold text-slate-500">
                         <span>{isRTL ? 'شامل الضريبة' : 'Incl. VAT'}: <span className="text-slate-700">{formatCurrency(v.totalAmount)}</span></span>
                         <span>{isRTL ? 'قبل الضريبة' : 'Before VAT'}: <span className="text-slate-700">{formatCurrency(v.beforeVatAmount)}</span></span>
                         <span>{isRTL ? 'ضريبة' : 'VAT'}: <span className="text-slate-700">{formatCurrency(v.vatAmount)}</span></span>
                       </div>
                       <div className="w-full bg-slate-100 group-hover:bg-slate-200/60 rounded-full h-[6px] overflow-hidden transition-colors" dir={isRTL ? "rtl" : "ltr"}>
                          <div className="bg-indigo-500 h-full rounded-full transition-all duration-700 ease-out" style={{ width: mounted ? `${Math.max(1, (v.percentage || 0) * 100)}%` : '0%' }}></div>
                       </div>
                    </div>
                 ))}
               </div>
             ) : (
               <div className="h-full flex flex-col items-center justify-center border border-dashed border-slate-200 rounded-[12px] bg-slate-50 p-4 min-h-[200px]">
                 <div className="w-10 h-10 bg-white rounded-full shadow-sm flex items-center justify-center mb-2">
                    <Users className="w-4 h-4 text-slate-400" />
                 </div>
                 <h3 className="text-[13px] font-bold text-slate-700 mb-0.5">
                   {isRTL ? 'لا يوجد موردون' : 'No vendors found'}
                 </h3>
                 <p className="text-[11px] font-medium text-slate-500 text-center">
                   {allRecords.length > 0 ? (isRTL ? 'لا توجد بيانات موردين كافية لعرض أعلى الموردين.' : 'Insufficient data to show top vendors.') : (isRTL ? 'بيانات المصروفات غير متوفرة' : 'Expenses Data Unavailable')}
                 </p>
               </div>
             )}
          </div>
        </div>
        
        <div className="bg-white rounded-[18px] border border-slate-200 p-6 shadow-sm flex flex-col h-full min-h-[360px]">
          <h3 className="text-base font-bold text-slate-800 mb-6">{isRTL ? 'أكبر تغيرات المصروفات قبل الضريبة حسب التصنيف' : 'Top Before-VAT Expense Category Changes'}</h3>
          <div className="flex-1 flex flex-col justify-around">
             {categoryChangesInsight.length > 0 ? (
               <div className="flex flex-col h-full justify-start gap-4">
                 {categoryChangesInsight.map((c: any, i: number) => {
                    const isIncrease = c.change > 0;
                    const changeColor = isIncrease ? 'text-rose-600' : 'text-emerald-600';
                    const hoverColor = isIncrease ? 'hover:border-rose-200 hover:bg-rose-50/30' : 'hover:border-emerald-200 hover:bg-emerald-50/30';
                    const iconBg = isIncrease ? 'bg-rose-50' : 'bg-emerald-50';
                    const arrowIcon = isIncrease ? '↑' : '↓';
                    const dirText = isIncrease ? (isRTL ? 'زيادة' : 'Increase') : (isRTL ? 'انخفاض' : 'Decrease');

                    return (
                        <div key={i} className={`cursor-pointer group flex flex-col p-3 rounded-xl bg-white border border-slate-100 ${hoverColor} transition-all justify-center`} onClick={() => handleCategoryClick(c.name)}>
                           <div className="flex justify-between items-start mb-2">
                             <div className="flex items-center gap-2 mr-2 min-w-0">
                               <div className={`w-8 h-8 rounded-lg ${iconBg} flex items-center justify-center shrink-0`}>
                                 <TrendingDown className={`w-4 h-4 ${changeColor} ${isIncrease ? 'rotate-180' : ''}`} />
                               </div>
                               <div className="flex flex-col">
                                  <span className="text-[13px] font-bold text-slate-700 truncate group-hover:text-slate-900 transition-colors" title={c.name}>{c.name}</span>
                                  <span className="text-[11px] font-bold text-slate-500 tabular-nums break-keep">
                                      {formatCurrency(c.curr)} <span className="text-slate-400 font-normal">({isRTL ? 'سابقًا' : 'Prev'}: {formatCurrency(c.prev)})</span>
                                  </span>
                               </div>
                             </div>
                             <div className="flex flex-col items-end shrink-0 pl-2">
                               <span className={`text-[13px] font-black tabular-nums ${changeColor}`}>
                                 {arrowIcon} {formatCurrency(Math.abs(c.change))}
                               </span>
                               <span className={`text-[11px] font-bold ${changeColor} opacity-90`}>
                                 {dirText} ({formatPercent(c.percentage * 100, 0)})
                               </span>
                             </div>
                           </div>
                        </div>
                    );
                 })}
               </div>
             ) : (
               <div className="h-full flex flex-col items-center justify-center border border-dashed border-slate-200 rounded-[12px] bg-slate-50 p-4 min-h-[200px]">
                 <div className="w-10 h-10 bg-white rounded-full shadow-sm flex items-center justify-center mb-2">
                    <Activity className="w-5 h-5 text-slate-400" />
                 </div>
                 <h3 className="text-[13px] font-bold text-slate-700 mb-0.5">
                   {isRTL ? 'لا توجد فترة مقارنة كافية' : 'No comparison data'}
                 </h3>
                 <p className="text-[11px] font-medium text-slate-500 text-center">
                   {isRTL ? 'يحتاج هذا التحليل إلى بيانات من فترة سابقة لقياس تغير المصروفات حسب التصنيف.' : 'This analysis needs data from a previous period to measure changes.'}
                 </p>
               </div>
             )}
          </div>
        </div>
      </div>
    </div>
  );
};
