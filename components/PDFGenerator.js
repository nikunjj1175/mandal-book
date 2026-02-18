/**
 * PDF Generator Component
 * Handles all PDF export functionality with light theme
 */

export const generateContributionPDF = async (data, memberFilter, memberOptions) => {
  // Dynamically import jsPDF
  const [{ default: jsPDF }, { default: autoTable }] = await Promise.all([
    import('jspdf'),
    import('jspdf-autotable'),
  ]);

  // A4 Portrait Mode
  const doc = new jsPDF('portrait', 'mm', 'a4');
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();

  // Light Theme Colors (matching site colors from globals.css)
  const colors = {
    bgPrimary: [248, 250, 252],      // --bg-primary: #f8fafc
    bgSecondary: [255, 255, 255],    // --bg-secondary: #ffffff
    bgCard: [255, 255, 255],         // --bg-card: #ffffff
    textPrimary: [15, 23, 42],       // --text-primary: #0f172a
    textSecondary: [71, 85, 105],     // --text-secondary: #475569
    textTertiary: [100, 116, 139],   // --text-tertiary: #64748b
    borderColor: [226, 232, 240],     // --border-color: #e2e8f0
    accentPrimary: [59, 130, 246],   // --accent-primary: #3b82f6
    accentSecondary: [99, 102, 241],  // --accent-secondary: #6366f1
    success: [16, 185, 129],         // --success: #10b981
    lightBg: [248, 250, 252],        // Slate-50
  };

  // Helper function to format currency with ₹ symbol
  const formatCurrency = (amount) => {
    return `Rs. ${amount.toLocaleString('en-IN')}`;
  };

  // Helper function to format month names
  const formatMonth = (monthStr) => {
    if (!monthStr || monthStr === 'N/A') return 'N/A';
    try {
      if (monthStr.includes('-')) {
        const [year, month] = monthStr.split('-');
        const date = new Date(parseInt(year), parseInt(month) - 1);
        return date.toLocaleDateString('en-IN', { month: 'short', year: 'numeric' });
      }
      return monthStr;
    } catch {
      return monthStr;
    }
  };

  // Helper function to set text color from array
  const setTextColorFromArray = (colorArray) => {
    doc.setTextColor(colorArray[0], colorArray[1], colorArray[2]);
  };

  // Set background color for entire page
  doc.setFillColor(...colors.bgPrimary);
  doc.rect(0, 0, pageWidth, pageHeight, 'F');

  // Modern Header with Theme Colors
  doc.setFillColor(...colors.accentPrimary);
  doc.rect(0, 0, pageWidth, 45, 'F');
  
  // Accent stripe
  doc.setFillColor(...colors.accentSecondary);
  doc.rect(0, 0, pageWidth, 4, 'F');

  // Logo/Title Section
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(24);
  doc.setFont('helvetica', 'bold');
  doc.text('MANDAL-BOOK', pageWidth / 2, 18, { align: 'center' });

  doc.setFontSize(12);
  doc.setFont('helvetica', 'normal');
  doc.text('Contribution Report', pageWidth / 2, 26, { align: 'center' });

  doc.setFontSize(9);
  doc.setTextColor(240, 240, 240);
  doc.text(
    `Generated: ${new Date().toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })}`,
    pageWidth / 2,
    34,
    { align: 'center' }
  );

  // Member filter info
  if (memberFilter !== 'all' && memberOptions && memberOptions.length > 0) {
    const selectedMember = memberOptions.find(m => m.id === memberFilter);
    if (selectedMember) {
      doc.setFontSize(8);
      doc.text(`Member: ${selectedMember.name}`, pageWidth / 2, 40, { align: 'center' });
    }
  }

  let yPos = 55;

  // Summary Cards Section with Theme Colors
  doc.setFillColor(...colors.bgCard);
  doc.rect(14, yPos, pageWidth - 28, 45, 'F');
  
  doc.setDrawColor(...colors.borderColor);
  doc.setLineWidth(0.5);
  doc.rect(14, yPos, pageWidth - 28, 45, 'S');

  setTextColorFromArray(colors.textPrimary);
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('SUMMARY OVERVIEW', 20, yPos + 8);

  yPos += 12;
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  setTextColorFromArray(colors.textSecondary);

  // Summary stats - two rows
  doc.text(`Total Members: ${data.totalMembers}`, 20, yPos);
  doc.text(`Total Contributions: ${data.totalContributions}`, 20, yPos + 6);
  
  // Current Year Total - Highlighted
  doc.setFont('helvetica', 'bold');
  setTextColorFromArray(colors.accentPrimary);
  doc.setFontSize(9);
  doc.text(`Current Year (${data.currentYear}) Total:`, 20, yPos + 14);
  doc.setFontSize(16);
  doc.text(formatCurrency(data.currentYearTotal || 0), 20, yPos + 22);
  
  // Last Year Total - Right side
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  setTextColorFromArray(colors.textTertiary);
  doc.text(`Last Year (${data.lastYear}) Total:`, pageWidth - 90, yPos + 14);
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  setTextColorFromArray(colors.success);
  doc.text(formatCurrency(data.lastYearTotal || 0), pageWidth - 90, yPos + 22);

  yPos += 50;

  // Current Year Month-wise Section
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  setTextColorFromArray(colors.textPrimary);
  doc.text(`Current Year (${data.currentYear}) - Month-wise Breakdown`, 14, yPos);
  yPos += 10;

  if (data.currentYearMonthWise && data.currentYearMonthWise.length > 0) {
    const monthTableData = data.currentYearMonthWise.map((month) => [
      formatMonth(month.month),
      Object.keys(month.members).length.toString(),
      formatCurrency(month.total),
    ]);

    autoTable(doc, {
      head: [['Month', 'Contributors', 'Total Amount']],
      body: monthTableData,
      startY: yPos,
      theme: 'striped',
      headStyles: {
        fillColor: colors.accentPrimary,
        textColor: 255,
        fontStyle: 'bold',
        fontSize: 10,
        cellPadding: 3,
      },
      bodyStyles: {
        fontSize: 9,
        cellPadding: 2.5,
        textColor: colors.textPrimary,
      },
      alternateRowStyles: {
        fillColor: colors.lightBg,
      },
      columnStyles: {
        0: { cellWidth: 55, fontStyle: 'bold' },
        1: { cellWidth: 40, halign: 'center' },
        2: { cellWidth: 50, halign: 'right', fontStyle: 'bold' },
      },
      margin: { left: 14, right: 14 },
      styles: {
        lineColor: colors.borderColor,
        lineWidth: 0.2,
      },
    });

    yPos = doc.lastAutoTable.finalY + 12;
  } else {
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    setTextColorFromArray(colors.textTertiary);
    doc.text('No contributions found for current year.', 14, yPos);
    yPos += 12;
  }

  // Last Year Total Section
  if (yPos > pageHeight - 50) {
    doc.addPage();
    doc.setFillColor(...colors.bgPrimary);
    doc.rect(0, 0, pageWidth, pageHeight, 'F');
    yPos = 20;
  }

  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  setTextColorFromArray(colors.textPrimary);
  doc.text(`Last Year (${data.lastYear}) - Total Summary`, 14, yPos);
  yPos += 10;

  // Last Year Total Card with Theme Colors
  doc.setFillColor(...colors.success);
  doc.rect(14, yPos, pageWidth - 28, 28, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(12);
  doc.setFont('helvetica', 'normal');
  doc.text(`Total Contributions for ${data.lastYear}:`, 20, yPos + 10);

  doc.setFontSize(22);
  doc.setFont('helvetica', 'bold');
  doc.text(formatCurrency(data.lastYearTotal || 0), 20, yPos + 22);

  yPos += 35;

  // Member-wise Contributions Table (Current Year Only)
  if (yPos > pageHeight - 60) {
    doc.addPage();
    doc.setFillColor(...colors.bgPrimary);
    doc.rect(0, 0, pageWidth, pageHeight, 'F');
    yPos = 20;
  }

  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  setTextColorFromArray(colors.textPrimary);
  doc.text(`Member-wise Contributions (${data.currentYear})`, 14, yPos);
  yPos += 10;

  if (data.memberWise && data.memberWise.length > 0 && data.currentYearMonths && data.currentYearMonths.length > 0) {
    const memberTableData = data.memberWise.map((member) => {
      const monthData = data.currentYearMonths.map((month) => {
        const amount = member.currentYearMonths?.[month] || 0;
        return amount > 0 ? formatCurrency(amount) : '-';
      });

      return [
        member.name,
        ...monthData,
        formatCurrency(member.currentYearTotal || 0),
        formatCurrency(member.lastYearTotal || 0),
        formatCurrency(member.total),
        member.count.toString(),
      ];
    });

    const memberHeaders = [
      'Member Name',
      ...data.currentYearMonths.map(formatMonth),
      `${data.currentYear} Total`,
      `${data.lastYear} Total`,
      'Grand Total',
      'Count'
    ];

    autoTable(doc, {
      head: [memberHeaders],
      body: memberTableData,
      startY: yPos,
      theme: 'striped',
      headStyles: {
        fillColor: colors.textPrimary,
        textColor: 255,
        fontStyle: 'bold',
        fontSize: 8,
        cellPadding: 2.5,
      },
      bodyStyles: {
        fontSize: 7,
        cellPadding: 1.5,
        textColor: colors.textPrimary,
      },
      alternateRowStyles: {
        fillColor: colors.lightBg,
      },
      columnStyles: {
        0: { cellWidth: 35, fontStyle: 'bold' },
      },
      margin: { left: 14, right: 14 },
      styles: {
        lineColor: colors.borderColor,
        lineWidth: 0.2,
        overflow: 'linebreak',
      },
      didDrawPage: (tableData) => {
        // Footer with page numbers
        doc.setFontSize(8);
        setTextColorFromArray(colors.textTertiary);
        const pageCount = doc.internal.getNumberOfPages();
        doc.text(
          `Page ${tableData.pageNumber} of ${pageCount}`,
          pageWidth / 2,
          pageHeight - 8,
          { align: 'center' }
        );
      },
    });
  }

  // Add footer to all pages with theme colors
  const totalPages = doc.internal.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setFontSize(7);
    setTextColorFromArray(colors.textTertiary);
    doc.text(`© ${new Date().getFullYear()} Mandal-Book | Group Finance Management System`, pageWidth / 2, pageHeight - 5, { align: 'center' });
  }

  // Save PDF
  const fileName = `Mandal_Contribution_Report_${new Date().toISOString().split('T')[0]}.pdf`;
  doc.save(fileName);
};
