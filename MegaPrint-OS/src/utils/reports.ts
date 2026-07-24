// Utility functions for MegaPrint OS - Phase 4 Reports & Utilities

import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { Platform } from 'react-native';

/**
 * Export data to CSV file
 */
export const exportToCSV = async (
  data: any[],
  filename: string,
  columns: string[]
): Promise<string> => {
  const csvDir = `${FileSystem.documentationDirectory || FileSystem.documentDirectory}reports/`;
  
  // Ensure directory exists
  const dirInfo = await FileSystem.getInfoAsync(csvDir);
  if (!dirInfo.exists) {
    await FileSystem.makeDirectoryAsync(csvDir, { intermediates: true });
  }

  const filePath = `${csvDir}${filename}`;
  
  // Create CSV header
  let csvContent = columns.join(',') + '\n';
  
  // Add rows
  data.forEach(row => {
    const rowValues = columns.map(col => {
      const value = row[col] !== undefined ? String(row[col]) : '';
      // Escape quotes and wrap in quotes if contains comma
      if (value.includes(',') || value.includes('"') || value.includes('\n')) {
        return `"${value.replace(/"/g, '""')}"`;
      }
      return value;
    });
    csvContent += rowValues.join(',') + '\n';
  });

  // Write file
  await FileSystem.writeAsStringAsync(filePath, csvContent, {
    encoding: FileSystem.EncodingType.UTF8,
  });

  return filePath;
};

/**
 * Share a file via native share dialog
 */
export const shareFile = async (filePath: string, title: string = 'Compartir archivo'): Promise<void> => {
  if (await Sharing.isAvailableAsync()) {
    await Sharing.shareAsync(filePath, {
      mimeType: filePath.endsWith('.csv') ? 'text/csv' : 'application/pdf',
      dialogTitle: title,
      UTI: filePath.endsWith('.csv') ? 'public.comma-separated-values-text' : undefined,
    });
  } else {
    throw new Error('Sharing is not available on this device');
  }
};

/**
 * Format currency based on workshop config
 */
export const formatCurrency = (amount: number, currencySymbol: string = '$'): string => {
  return `${currencySymbol}${amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
};

/**
 * Format date for display
 */
export const formatDate = (dateString: string, locale: string = 'es-ES'): string => {
  const date = new Date(dateString);
  return date.toLocaleDateString(locale, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
};

/**
 * Format datetime for display
 */
export const formatDateTime = (dateString: string, locale: string = 'es-ES'): string => {
  const date = new Date(dateString);
  return date.toLocaleString(locale, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

/**
 * Calculate date range based on period
 */
export const getDateRange = (period: import('../types').ReportPeriod, customStart?: string, customEnd?: string): { start: string; end: string } => {
  const now = new Date();
  let startDate: Date;
  let endDate: Date = now;

  switch (period) {
    case 'DAY':
      startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      break;
    case 'WEEK':
      startDate = new Date(now);
      startDate.setDate(now.getDate() - 7);
      break;
    case 'MONTH':
      startDate = new Date(now.getFullYear(), now.getMonth(), 1);
      break;
    case 'QUARTER':
      const quarter = Math.floor(now.getMonth() / 3);
      startDate = new Date(now.getFullYear(), quarter * 3, 1);
      break;
    case 'YEAR':
      startDate = new Date(now.getFullYear(), 0, 1);
      break;
    case 'CUSTOM':
    default:
      startDate = customStart ? new Date(customStart) : new Date(now.getFullYear(), now.getMonth(), 1);
      endDate = customEnd ? new Date(customEnd) : now;
      break;
  }

  if (period !== 'CUSTOM') {
    endDate = now;
  }

  return {
    start: startDate.toISOString().split('T')[0],
    end: endDate.toISOString().split('T')[0],
  };
};

/**
 * Get period label for display
 */
export const getPeriodLabel = (period: import('../types').ReportPeriod): string => {
  const labels: Record<import('../types').ReportPeriod, string> = {
    DAY: 'Hoy',
    WEEK: 'Últimos 7 días',
    MONTH: 'Este mes',
    QUARTER: 'Este trimestre',
    YEAR: 'Este año',
    CUSTOM: 'Personalizado',
  };
  return labels[period];
};

/**
 * Calculate growth percentage between two values
 */
export const calculateGrowth = (current: number, previous: number): number => {
  if (previous === 0) return current > 0 ? 100 : 0;
  return ((current - previous) / previous) * 100;
};

/**
 * Generate a simple unique ID
 */
export const generateId = (): string => {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
};

/**
 * Debounce function for search inputs
 */
export const debounce = <T extends (...args: any[]) => any>(
  func: T,
  wait: number
): ((...args: Parameters<T>) => void) => {
  let timeout: NodeJS.Timeout | null = null;
  
  return (...args: Parameters<T>) => {
    if (timeout) clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
};

/**
 * Validate email format
 */
export const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

/**
 * Validate phone number (basic validation)
 */
export const isValidPhone = (phone: string): boolean => {
  const phoneRegex = /^[\d\s\-\+\(\)]{8,20}$/;
  return phoneRegex.test(phone);
};

/**
 * Truncate text with ellipsis
 */
export const truncateText = (text: string, maxLength: number): string => {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength - 3) + '...';
};

/**
 * Group array by key
 */
export const groupBy = <T>(array: T[], key: keyof T): Record<string, T[]> => {
  return array.reduce((result, item) => {
    const groupKey = String(item[key]);
    if (!result[groupKey]) {
      result[groupKey] = [];
    }
    result[groupKey].push(item);
    return result;
  }, {} as Record<string, T[]>);
};

/**
 * Sort array by key
 */
export const sortBy = <T>(
  array: T[],
  key: keyof T,
  order: 'asc' | 'desc' = 'asc'
): T[] => {
  return [...array].sort((a, b) => {
    const aVal = a[key];
    const bVal = b[key];
    
    if (aVal === bVal) return 0;
    if (aVal === undefined || aVal === null) return 1;
    if (bVal === undefined || bVal === null) return -1;
    
    const comparison = aVal < bVal ? -1 : 1;
    return order === 'asc' ? comparison : -comparison;
  });
};

/**
 * Download backup to device storage
 */
export const downloadBackup = async (
  data: any,
  filename: string
): Promise<string> => {
  const backupDir = `${FileSystem.documentDirectory}backups/`;
  
  // Ensure directory exists
  const dirInfo = await FileSystem.getInfoAsync(backupDir);
  if (!dirInfo.exists) {
    await FileSystem.makeDirectoryAsync(backupDir, { intermediates: true });
  }

  const filePath = `${backupDir}${filename}`;
  const jsonString = JSON.stringify(data, null, 2);
  
  await FileSystem.writeAsStringAsync(filePath, jsonString, {
    encoding: FileSystem.EncodingType.UTF8,
  });

  return filePath;
};

/**
 * Read and parse JSON file
 */
export const readJsonFile = async (filePath: string): Promise<any> => {
  const content = await FileSystem.readAsStringAsync(filePath, {
    encoding: FileSystem.EncodingType.UTF8,
  });
  return JSON.parse(content);
};

/**
 * Check if file exists
 */
export const fileExists = async (filePath: string): Promise<boolean> => {
  const info = await FileSystem.getInfoAsync(filePath);
  return info.exists;
};

/**
 * Delete file
 */
export const deleteFile = async (filePath: string): Promise<void> => {
  await FileSystem.deleteAsync(filePath, { idempotent: true });
};

/**
 * Get file size in human readable format
 */
export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

/**
 * Export report to PDF (wrapper around pdfGenerator)
 */
export const exportReportToPDF = async (
  htmlContent: string,
  filename: string
): Promise<string> => {
  // This would integrate with the existing pdfGenerator utility
  // For now, we'll just save the HTML
  const reportsDir = `${FileSystem.documentDirectory}reports/`;
  
  const dirInfo = await FileSystem.getInfoAsync(reportsDir);
  if (!dirInfo.exists) {
    await FileSystem.makeDirectoryAsync(reportsDir, { intermediates: true });
  }

  const filePath = `${reportsDir}${filename}.html`;
  await FileSystem.writeAsStringAsync(filePath, htmlContent, {
    encoding: FileSystem.EncodingType.UTF8,
  });

  return filePath;
};

/**
 * Clear all cached reports
 */
export const clearCache = async (): Promise<void> => {
  const cacheDir = `${FileSystem.documentDirectory}reports/`;
  const dirInfo = await FileSystem.getInfoAsync(cacheDir);
  
  if (dirInfo.exists) {
    await FileSystem.deleteAsync(cacheDir, { idempotent: true });
  }
};

/**
 * Get storage usage info
 */
export const getStorageInfo = async (): Promise<{
  used: number;
  total: number;
  free: number;
}> => {
  const freeDiskStorage = await FileSystem.getFreeDiskStorageAsync();
  const totalDiskCapacity = await FileSystem.getTotalDiskCapacityAsync();
  
  return {
    used: totalDiskCapacity - freeDiskStorage,
    total: totalDiskCapacity,
    free: freeDiskStorage,
  };
};
