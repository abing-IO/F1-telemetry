import { useState } from 'react';
import { Download, Loader2 } from 'lucide-react';
import jsPDF from 'jspdf';
import { toPng } from 'html-to-image';

export default function PDFExport({ targetRefs, sessionInfo, isDark = true }) {
    const [exporting, setExporting] = useState(false);

    const handleExport = async () => {
        setExporting(true);
        try {
            const pdf = new jsPDF('p', 'mm', 'a4');
            const pageWidth = pdf.internal.pageSize.getWidth();
            const pageHeight = pdf.internal.pageSize.getHeight();
            const margin = 10;
            const contentWidth = pageWidth - (margin * 2);
            let currentY = margin;

            // Header section
            pdf.setFontSize(22);
            pdf.setFont("helvetica", "bolditalic");
            pdf.setTextColor(220, 38, 38); // Red
            pdf.text("VELOCE", margin, currentY + 10);
            
            pdf.setFontSize(14);
            pdf.setFont("helvetica", "bold");
            pdf.setTextColor(40, 40, 40);
            currentY += 20;
            pdf.text(`Session Report: ${sessionInfo.year} ${sessionInfo.gp} GP - ${sessionInfo.sessionType}`, margin, currentY);
            
            pdf.setFontSize(11);
            pdf.setFont("helvetica", "normal");
            pdf.setTextColor(100, 100, 100);
            currentY += 8;
            pdf.text(`Drivers Compared: ${sessionInfo.drivers.join(', ')}`, margin, currentY);
            currentY += 15;

            // Capture and add charts
            for (const refObj of targetRefs) {
                if (!refObj.ref.current) continue;
                
                // Capture element as PNG
                const dataUrl = await toPng(refObj.ref.current, {
                    backgroundColor: isDark ? '#0f1014' : '#f3f4f6',
                    pixelRatio: 2,
                    filter: (node) => !node.classList?.contains('exclude-from-pdf')
                });

                // Calculate image dimensions to fit page width
                const imgProps = pdf.getImageProperties(dataUrl);
                const pdfHeight = (imgProps.height * contentWidth) / imgProps.width;

                // Add new page if content exceeds current page
                if (currentY + pdfHeight > pageHeight - margin) {
                    pdf.addPage();
                    currentY = margin;
                }

                // Add title for the chart
                pdf.setFontSize(12);
                pdf.setFont("helvetica", "bold");
                pdf.setTextColor(40, 40, 40);
                pdf.text(refObj.title, margin, currentY);
                currentY += 5;

                // Add image
                pdf.addImage(dataUrl, 'PNG', margin, currentY, contentWidth, pdfHeight);
                currentY += pdfHeight + 15;
            }

            // Save PDF
            const filename = `Veloce_${sessionInfo.year}_${sessionInfo.gp}_${sessionInfo.sessionType}_Report.pdf`.replace(/\s+/g, '_');
            pdf.save(filename);
            
        } catch (err) {
            console.error('PDF Export Error:', err);
            alert('Failed to generate PDF report. Check console for details.');
        } finally {
            setExporting(false);
        }
    };

    return (
        <button 
            onClick={handleExport} 
            disabled={exporting}
            className="flex items-center gap-2 bg-gray-800 hover:bg-gray-700 text-white px-4 py-2 rounded-lg text-sm font-bold transition-all disabled:opacity-50 border border-gray-600 shadow-md"
            title="Export full session report as PDF"
        >
            {exporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4 text-red-500" />}
            <span className="hidden sm:inline">{exporting ? 'Generating PDF...' : 'Export PDF'}</span>
        </button>
    );
}
