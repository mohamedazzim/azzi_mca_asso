/**
 * Dynamic Batch Generation Utility
 * Supports both historical (3-year) and modern (2-year) batch cycles
 * 
 * Rules:
 * - 1980-2019: 3-year degree cycles (e.g., 2017-2020)
 * - 2020-Present: 2-year degree cycles (e.g., 2020-2022, 2021-2023)
 */

export interface BatchOption {
  value: string;
  label: string;
  startYear: number;
  endYear: number;
  isHistorical: boolean;
}

/**
 * Generate all available batch options from 1980 to future years
 */
export function generateBatchOptions(): BatchOption[] {
  const currentYear = new Date().getFullYear();
  const batches: BatchOption[] = [];
  
  // Historical batches: 1980-2019 (3-year cycles)
  for (let startYear = 1980; startYear <= 2019; startYear++) {
    const endYear = startYear + 3;
    batches.push({
      value: `${startYear}-${endYear}`,
      label: `${startYear}-${endYear}`,
      startYear,
      endYear,
      isHistorical: true
    });
  }
  
  // Modern batches: 2020-present and future (2-year cycles)
  // Generate 5 years into the future for future planning
  const futureYears = 5;
  for (let startYear = 2020; startYear <= currentYear + futureYears; startYear++) {
    const endYear = startYear + 2;
    batches.push({
      value: `${startYear}-${endYear}`,
      label: `${startYear}-${endYear}`,
      startYear,
      endYear,
      isHistorical: false
    });
  }
  
  // Sort by start year (most recent first for better UX)
  return batches.sort((a, b) => b.startYear - a.startYear);
}

/**
 * Get current active batches (students who should still be enrolled)
 */
export function getActiveBatches(): BatchOption[] {
  const currentYear = new Date().getFullYear();
  
  return generateBatchOptions().filter(batch => {
    // For historical batches (3-year), consider active if end year >= current year
    // For modern batches (2-year), consider active if end year >= current year
    return batch.endYear >= currentYear;
  });
}

/**
 * Get batches for a specific year range
 */
export function getBatchesForYears(startYear: number, endYear: number): BatchOption[] {
  return generateBatchOptions().filter(batch => 
    batch.startYear >= startYear && batch.startYear <= endYear
  );
}

/**
 * Get batch by value
 */
export function getBatchByValue(value: string): BatchOption | undefined {
  return generateBatchOptions().find(batch => batch.value === value);
}

/**
 * Check if a batch is currently active
 */
export function isBatchActive(batchValue: string): boolean {
  const batch = getBatchByValue(batchValue);
  if (!batch) return false;
  
  const currentYear = new Date().getFullYear();
  return batch.endYear >= currentYear;
}

/**
 * Get formatted batch options for dropdowns
 */
export function getFormattedBatchOptions(): Array<{ value: string; label: string }> {
  return generateBatchOptions().map(batch => ({
    value: batch.value,
    label: batch.label
  }));
}

/**
 * Get active batch options formatted for dropdowns
 */
export function getActiveFormattedBatchOptions(): Array<{ value: string; label: string }> {
  return getActiveBatches().map(batch => ({
    value: batch.value,
    label: batch.label
  }));
}

/**
 * Get batch academic year info
 */
export function getBatchAcademicInfo(batchValue: string): {
  duration: number;
  type: 'historical' | 'modern';
  status: 'completed' | 'ongoing' | 'future';
} | null {
  const batch = getBatchByValue(batchValue);
  if (!batch) return null;
  
  const currentYear = new Date().getFullYear();
  const duration = batch.isHistorical ? 3 : 2;
  
  let status: 'completed' | 'ongoing' | 'future';
  if (batch.endYear < currentYear) {
    status = 'completed';
  } else if (batch.startYear <= currentYear && batch.endYear >= currentYear) {
    status = 'ongoing';
  } else {
    status = 'future';
  }
  
  return {
    duration,
    type: batch.isHistorical ? 'historical' : 'modern',
    status
  };
}