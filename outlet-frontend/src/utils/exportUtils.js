// Export utility functions for CSV, Excel, and SQL formats

export const exportToCSV = (data, filename = 'export.csv') => {
  if (!data || data.length === 0) {
    alert('No data to export');
    return;
  }

  const headers = Object.keys(data[0]);
  const csvContent = [
    headers.join(','),
    ...data.map(row =>
      headers.map(header => {
        const value = row[header];
        if (value === null || value === undefined) return '';
        const stringValue = String(value);
        if (stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n')) {
          return `"${stringValue.replace(/"/g, '""')}"`;
        }
        return stringValue;
      }).join(',')
    )
  ].join('\n');

  downloadFile(csvContent, filename, 'text/csv');
};

export const exportToExcel = (data, filename = 'export.xlsx') => {
  if (!data || data.length === 0) {
    alert('No data to export');
    return;
  }

  const headers = Object.keys(data[0]);
  
  let xmlContent = '<?xml version="1.0" encoding="UTF-8"?>\n';
  xmlContent += '<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet" xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet">\n';
  xmlContent += '<Worksheet ss:Name="Sheet1">\n';
  xmlContent += '<Table>\n';

  xmlContent += '<Row>\n';
  headers.forEach(header => {
    xmlContent += `<Cell><Data ss:Type="String">${escapeXml(header)}</Data></Cell>\n`;
  });
  xmlContent += '</Row>\n';

  data.forEach(row => {
    xmlContent += '<Row>\n';
    headers.forEach(header => {
      const value = row[header];
      const stringValue = value === null || value === undefined ? '' : String(value);
      xmlContent += `<Cell><Data ss:Type="String">${escapeXml(stringValue)}</Data></Cell>\n`;
    });
    xmlContent += '</Row>\n';
  });

  xmlContent += '</Table>\n';
  xmlContent += '</Worksheet>\n';
  xmlContent += '</Workbook>';

  downloadFile(xmlContent, filename, 'application/vnd.ms-excel');
};

export const exportToSQL = (data, tableName = 'table', filename = 'export.sql') => {
  if (!data || data.length === 0) {
    alert('No data to export');
    return;
  }

  const headers = Object.keys(data[0]);
  let sqlContent = `-- SQL Export\n-- Table: ${tableName}\n-- Generated: ${new Date().toISOString()}\n\n`;
  sqlContent += `INSERT INTO ${tableName} (${headers.join(', ')}) VALUES\n`;

  const values = data.map(row => {
    const rowValues = headers.map(header => {
      const value = row[header];
      if (value === null || value === undefined) return 'NULL';
      if (typeof value === 'number') return value;
      if (typeof value === 'boolean') return value ? 1 : 0;
      return `'${String(value).replace(/'/g, "''")}'`;
    });
    return `(${rowValues.join(', ')})`;
  });

  sqlContent += values.join(',\n') + ';\n';

  downloadFile(sqlContent, filename, 'text/plain');
};

const escapeXml = (str) => {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
};

const downloadFile = (content, filename, mimeType) => {
  const blob = new Blob([content], { type: mimeType });
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.URL.revokeObjectURL(url);
};

export const formatOutletData = (outlets) => {
  return outlets.map(o => ({
    'ID': o.id,
    'Outlet Name': o.outletName,
    'Code': o.outletCode || '—',
    'Type': o.outletType,
    'Location': o.locationName,
    'Divisions': (o.divisionNames || []).join('; '),
    'Products': (o.productNames || []).join('; '),
    'Owner Name': o.ownerName,
    'Address': o.address,
  }));
};

export const formatDivisionData = (divisions) => {
  return divisions.map(d => ({
    'ID': d.id,
    'Division Name': d.name,
    'Total Products': d.products?.length || 0,
    'Created At': d.createdAt ? new Date(d.createdAt).toLocaleDateString() : '—',
  }));
};

export const formatProductData = (products) => {
  return products.map(p => ({
    'ID': p.id,
    'Product Name': p.name,
    'Product Code': p.productCode || '—',
    'Division': p.divisionName || p.division?.name || '—',
    'UIM Price': p.uimPrice ?? '—',
    'MRP': p.mrp ?? '—',
    'Selling Price': p.sellingPrice ?? '—',
    'Purchase Price': p.purchasePrice ?? '—',
  }));
};

export const formatLocationData = (locations) => {
  return locations.map(l => ({
    'ID': l.id,
    'Location Name': l.name,
  }));
};
