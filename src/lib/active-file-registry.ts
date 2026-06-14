export type FileModuleType = 'expenses' | 'revenues' | 'payroll' | 'banks' | string;

export type ActiveFileLike = {
  id?: string | null;
  fileHash?: string | null;
  originalId?: string | null;
  fileName?: string | null;
  name?: string | null;
  originalFileName?: string | null;
  displayName?: string | null;
  processedFileName?: string | null;
  fileType?: FileModuleType | null;
  moduleType?: FileModuleType | null;
  type?: FileModuleType | null;
  tenantId?: string | null;
  status?: string | null;
  processed?: boolean | null;
  processingVersion?: number | string | null;
  periodYear?: string | number | null;
  recordCount?: number | null;
  skippedRowCount?: number | null;
  uploadedBy?: string | null;
  sessionId?: string | null;
  isDeleted?: boolean | null;
  deletedAt?: string | null;
  uploadDate?: string | null;
  createdAt?: string | null;
};

export type ActiveRecordLike = {
  fileId?: string | null;
  fileHash?: string | null;
  sourceFileId?: string | null;
  _sourceFile?: string | null;
};

const INACTIVE_STATUSES = new Set(['deleted', 'archived', 'inactive']);

const hasValue = (value: unknown) => value !== undefined && value !== null && String(value).trim() !== '';

export const getFileIdentifier = (file: ActiveFileLike): string => {
  return String(file?.id || file?.fileHash || file?.originalId || '').trim();
};

export const isActiveFile = (file: ActiveFileLike): boolean => {
  const status = String(file?.status || '').trim().toLowerCase();
  return Boolean(
    getFileIdentifier(file) &&
    file?.isDeleted !== true &&
    !hasValue(file?.deletedAt) &&
    !INACTIVE_STATUSES.has(status)
  );
};

export const getActiveFiles = (
  files: ActiveFileLike[] = [],
  moduleType?: FileModuleType | null,
  tenantId?: string | null
): ActiveFileLike[] => {
  return files.filter((file) => {
    const fileModuleType = file?.fileType || file?.moduleType || file?.type;
    const tenantMatches = !tenantId || file?.tenantId === tenantId;
    const moduleMatches = !moduleType || fileModuleType === moduleType;
    return tenantMatches && moduleMatches && isActiveFile(file);
  });
};

export const getActiveFileIds = (
  files: ActiveFileLike[] = [],
  moduleType?: FileModuleType | null,
  tenantId?: string | null
): string[] => {
  return getActiveFiles(files, moduleType, tenantId)
    .map(getFileIdentifier)
    .filter(Boolean);
};

export const getDisplayFileName = (file: ActiveFileLike, moduleType?: FileModuleType | null): string => {
  const candidates = [file?.originalFileName, file?.displayName, file?.fileName, file?.name];
  const displayName = candidates.find((value) => {
    const text = String(value || '').trim();
    return text && !text.startsWith('Processed_File_');
  });

  if (displayName) return String(displayName);

  const uploadedAt = file?.uploadDate || file?.createdAt;
  const formattedDate = uploadedAt ? new Date(uploadedAt).toLocaleDateString('ar-SA') : '';
  const detectedModuleType = file?.fileType || file?.moduleType || file?.type || moduleType;
  const moduleLabel = detectedModuleType === 'expenses' ? 'مصروفات' : 'بيانات';
  return formattedDate ? `ملف ${moduleLabel} - ${formattedDate}` : `ملف ${moduleLabel} بدون اسم`;
};

export const filterRecordsByActiveFiles = <T extends ActiveRecordLike>(
  records: T[] = [],
  activeFiles: ActiveFileLike[] = [],
  strict: boolean = false
): T[] => {
  const activeFileIds = new Set(activeFiles.map(f => strict ? String(f.id || '') : getFileIdentifier(f)).filter(Boolean));
  return records.filter((record) => {
    const recordFileId = strict
      ? String(record?.sourceFileId || record?.fileId || '').trim()
      : String(record?.fileId || record?.fileHash || record?.sourceFileId || record?._sourceFile || '').trim();
    return Boolean(recordFileId && activeFileIds.has(recordFileId));
  });
};

