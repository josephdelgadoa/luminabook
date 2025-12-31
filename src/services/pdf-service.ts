import { jsPDF } from "jspdf";
import type { EBook, ExportConfig } from "../types";

interface PageFormat {
    width: number;
    height: number;
    margin: { top: number; bottom: number; x: number };
    fontSize: { body: number; title: number; chapter: number };
    lineHeight: number;
}

const FORMATS: Record<string, PageFormat> = {
    pocket: {
        width: 127,      // 5 inches
        height: 203.2,   // 8 inches
        margin: { top: 15, bottom: 15, x: 12 },
        fontSize: { body: 11, title: 18, chapter: 12 },
        lineHeight: 5
    },
    letter: {
        width: 215.9,    // 8.5 inches
        height: 279.4,   // 11 inches
        margin: { top: 25.4, bottom: 25.4, x: 25.4 },
        fontSize: { body: 12, title: 24, chapter: 16 },
        lineHeight: 7
    },
    a4: {
        width: 210,
        height: 297,
        margin: { top: 25.4, bottom: 25.4, x: 25.4 },
        fontSize: { body: 12, title: 24, chapter: 16 },
        lineHeight: 7
    }
};

export const generatePDF = async (book: EBook, config: ExportConfig): Promise<void> => {
    console.log("Generating PDF...", book.title, config);

    // Get format config, default to A4 if unknown
    const formatKey = config.pageSize || 'a4';
    const fmt = FORMATS[formatKey] || FORMATS['a4'];

    // Adjust margins for bleed if requested (simulated by adding safe buffer)
    const marginX = config.bleed ? fmt.margin.x + 5 : fmt.margin.x;
    const marginTop = config.bleed ? fmt.margin.top + 5 : fmt.margin.top;
    const marginBottom = config.bleed ? fmt.margin.bottom + 5 : fmt.margin.bottom;

    const doc = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: [fmt.width, fmt.height]
    });

    // --- COVER PAGE ---
    doc.setFillColor(15, 23, 42); // Slate 900 background
    doc.rect(0, 0, fmt.width, fmt.height, 'F');

    doc.setTextColor(255, 255, 255);
    doc.setFontSize(fmt.fontSize.title);

    // Center Title
    const titleLines = doc.splitTextToSize(book.title || "Untitled", fmt.width - (marginX * 2));
    const titleY = fmt.height * 0.4;
    doc.text(titleLines, fmt.width / 2, titleY, { align: 'center' });

    doc.setFontSize(fmt.fontSize.chapter);
    doc.text(book.author || "Joseph Delgado", fmt.width / 2, titleY + 20, { align: 'center' });


    // --- CONTENT PAGES ---
    doc.setTextColor(0, 0, 0);

    book.chapters.forEach((chapter, index) => {
        doc.addPage();
        let cursorY = marginTop;

        // Chapter Header
        doc.setFontSize(fmt.fontSize.chapter);
        doc.setFont("helvetica", "bold");
        doc.text(`Chapter ${index + 1}`, marginX, cursorY);
        cursorY += 10;

        doc.setFontSize(fmt.fontSize.title);
        doc.text(chapter.title, marginX, cursorY);
        cursorY += 15;

        // Chapter Body
        doc.setFontSize(fmt.fontSize.body);
        doc.setFont("times", "normal"); // Times New Roman is standard for books

        const textWidth = fmt.width - (marginX * 2);
        const splitText = doc.splitTextToSize(chapter.content, textWidth);

        // Pagination Loop
        for (let i = 0; i < splitText.length; i++) {
            // Check if we need a new page
            if (cursorY + fmt.lineHeight > fmt.height - marginBottom) {
                doc.addPage();
                cursorY = marginTop;
            }

            doc.text(splitText[i], marginX, cursorY);
            cursorY += fmt.lineHeight;
        }
    });

    const safeTitle = (book.title || "book").replace(/[^a-z0-9]/gi, '_').toLowerCase();
    doc.save(`${safeTitle}_${formatKey}.pdf`);
};
