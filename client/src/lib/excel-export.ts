import * as XLSX from 'xlsx';

export interface ExcelColumn {
  key: string;
  header: string;
  formatter?: (value: any) => string;
}

export function exportToExcel(
  data: any[],
  columns: ExcelColumn[],
  filename: string
) {
  // Prepare data for Excel
  const excelData = data.map(row => {
    const excelRow: any = {};
    columns.forEach(col => {
      const value = getNestedValue(row, col.key);
      excelRow[col.header] = col.formatter ? col.formatter(value) : value;
    });
    return excelRow;
  });

  // Create workbook and worksheet
  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.json_to_sheet(excelData);

  // Auto-size columns
  const colWidths = columns.map(col => {
    const headerLength = col.header.length;
    const maxDataLength = Math.max(
      ...excelData.map(row => 
        String(row[col.header] || '').length
      )
    );
    return { wch: Math.max(headerLength, maxDataLength, 10) };
  });
  ws['!cols'] = colWidths;

  // Add worksheet to workbook
  XLSX.utils.book_append_sheet(wb, ws, 'Data');

  // Generate filename with timestamp
  const timestamp = new Date().toISOString().slice(0, 19).replace(/:/g, '-');
  const finalFilename = `${filename}_${timestamp}.xlsx`;

  // Save file
  XLSX.writeFile(wb, finalFilename);
}

// Helper function to get nested object values
function getNestedValue(obj: any, path: string): any {
  return path.split('.').reduce((current, key) => {
    return current && current[key] !== undefined ? current[key] : '';
  }, obj);
}

// Format currency for Excel
export function formatCurrencyForExcel(amount: number | string): string {
  const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
  if (isNaN(numAmount)) return '0.00';
  return numAmount.toFixed(2);
}

// Format date for Excel
export function formatDateForExcel(date: string | Date): string {
  if (!date) return '';
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  return dateObj.toLocaleDateString('en-IN');
}

// Format status for Excel
export function formatStatusForExcel(status: string): string {
  return status.charAt(0).toUpperCase() + status.slice(1).replace('_', ' ');
}