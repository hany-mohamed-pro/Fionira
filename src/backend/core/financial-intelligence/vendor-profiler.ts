import { FinancialRecord } from '../../../types';
import { VendorProfile } from './models';

export function buildVendorProfiles(historicalData: FinancialRecord[]): Record<string, VendorProfile> {
    const profiles: Record<string, VendorProfile> = {};

    historicalData.forEach(record => {
        const vendorKey = record.Entity_ID || record.Raw_Entity || 'UNKNOWN_VENDOR';
        const vendorName = record.Entity_Name || record.Raw_Entity || 'Unknown Vendor';
        const amount = record.Total_Amount || 0;
        
        if (!profiles[vendorKey]) {
            profiles[vendorKey] = {
                id: vendorKey,
                name: vendorName,
                totalAmount: 0,
                transactionCount: 0,
                avgAmount: 0,
                variance: 0,
                standardDeviation: 0,
                isNew: true, // New relative to historical data context
            };
        }
        
        const p = profiles[vendorKey];
        p.totalAmount += amount;
        p.transactionCount += 1;
        
        // Update last transaction date
        if (record.Invoice_Date) {
            if (!p.lastTransactionDate || new Date(record.Invoice_Date) > new Date(p.lastTransactionDate)) {
                p.lastTransactionDate = record.Invoice_Date;
            }
        }
    });

    // Calculate Variance and standard deviation
    Object.keys(profiles).forEach(key => {
        const p = profiles[key];
        p.avgAmount = p.transactionCount > 0 ? p.totalAmount / p.transactionCount : 0;
        p.isNew = p.transactionCount === 0;

        // Second pass for variance (only for performance efficiency we'd do stream-based, but here array is fine)
        let sumSquaredDiffs = 0;
        const vendorRecords = historicalData.filter(r => (r.Entity_ID || r.Raw_Entity || 'UNKNOWN_VENDOR') === key);
        vendorRecords.forEach(r => {
            const amount = r.Total_Amount || 0;
            const diff = amount - p.avgAmount;
            sumSquaredDiffs += diff * diff;
        });

        p.variance = p.transactionCount > 1 ? sumSquaredDiffs / (p.transactionCount - 1) : 0;
        p.standardDeviation = Math.sqrt(p.variance);
    });

    return profiles;
}
