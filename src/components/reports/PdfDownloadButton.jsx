'use client';

import React, { useState } from 'react';
import { FiDownload } from 'react-icons/fi';
import { Button } from '@/components/ui/Button';
import { PDFDownloadLink } from '@react-pdf/renderer';
import PdfReportDocument from './PdfReportDocument';

const PdfDownloadButton = ({ 
  reportData, 
  currency, 
  dateRange, 
  reportType,
  disabled = false 
}) => {
  const [isGenerating, setIsGenerating] = useState(false);

  if (!reportData) return null;

  const fileName = `Business_Report_${reportData.storeName.replace(/\s+/g, '_')}_${reportType}_${new Date().toISOString().split('T')[0]}.pdf`;

  return (
    <PDFDownloadLink
      document={
        <PdfReportDocument 
          reportData={reportData}
          currency={currency}
          dateRange={dateRange}
          reportType={reportType}
        />
      }
      fileName={fileName}
      onClick={() => setIsGenerating(true)}
      onLoad={() => setIsGenerating(false)}
    >
      {({ loading, error }) => (
        <Button
          variant="primary"
          disabled={disabled || loading || isGenerating}
          className="w-full sm:w-auto"
        >
          <FiDownload className="mr-2" />
          {loading || isGenerating ? 'Generating PDF...' : 'Download PDF Report'}
        </Button>
      )}
    </PDFDownloadLink>
  );
};

export default PdfDownloadButton;