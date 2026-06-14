export interface SuggestedFix {
  action: 'REPLACE_VALUE' | 'DELETE_RECORD' | 'MARK_AS_DUPLICATE' | 'FLAG_AS_REFUND' | string;
  field?: string;
  suggestedValue?: any;
  confidence: number;
  description: string;
}

export interface ValidationIssue {
  code: string;
  type: "STRUCTURAL" | "BUSINESS" | "INTELLIGENCE";
  severity: "CRITICAL" | "HIGH" | "MEDIUM" | "LOW";
  message: string;
  explanation: string;
  impact: string;
  suggestedFixes?: SuggestedFix[];
  field?: string;
  scoreImpact?: number;
}

export interface SessionRecord {
  id: string;
  rawData: any;
  normalizedData: any;
  issues: ValidationIssue[];
  suggestions: SuggestedFix[];
  financialIntelligence: {
     insights: any[];
     riskScore: number;
  };
  status: "PENDING" | "APPROVED" | "REJECTED" | "EDITED" | "ESCALATED";
}

export interface ValidationSession {
  sessionId: string;
  uploadedFileName?: string;
  uploadedBy?: string;
  timestamp?: string;
  records: SessionRecord[];
  
  // Keep original references for backward compatibility with commit pipeline
  rawRecords: any[]; 
  validRecords: any[];
  warnings: any[];
  errors: any[];
  suggestions: any[];
  intelligenceResults?: any[];
  
  summary: {
    totalRecords: number;
    cleanRecords: number;
    criticalIssues: number;
    highRiskCount: number;
    totalFinancialExposure: number;
  };
  
  severitySummary: {
    HIGH: number;
    MEDIUM: number;
    LOW: number;
  };
  status: "PENDING_REVIEW" | "APPROVED" | "REJECTED";
  
  fileMetadatas: any[];
  skippedRows: any[];
  rejectedRecords: any[];
  journalEntries: any[];
  masterData: any;
  classification?: string;
  stagedStatus?: string;
  arabicLabel?: string;
}

