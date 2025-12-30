import { jsPDF } from "jspdf";
import type { EBook, ExportConfig } from "../types";

export const generatePDF = async (book: EBook, config: ExportConfig): Promise<void> => {
    console.log("Generating PDF...", book.title, config);

    // Calculate dimensions based on config
    let format = 'a4';
    if (config.pageSize === 'letter') format = 'letter';
    // Pocket is approx 5x8 inches (127mm x 203.2mm). jsPDF doesn't have 'pocket', so we custom set it if needed, or map to closest.
    // For simplicity here we'll let jsPDF handle standard formats or custom [127, 203] for pocket.
    const dims = config.pageSize === 'pocket' ? [127, 203] : format;

    const doc = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: dims as any
    });

    // FONTS: In a real app, we would add fonts here.
    // doc.addFont(...)

    // COVER PAGE
    doc.setFillColor(15, 23, 42); // Slate 900
    doc.rect(0, 0, doc.internal.pageSize.getWidth(), doc.internal.pageSize.getHeight(), 'F');

    doc.setTextColor(255, 255, 255);
    doc.setFontSize(24);
    doc.text(book.title || "Untitled", 20, 60);

    doc.setFontSize(14);
    doc.text(book.author || "Joseph Delgado", 20, 75);

    // CHAPTERS
    book.chapters.forEach((chapter, index) => {
        doc.addPage();

        // Bleed handling (conceptually simply margins here for basic implementation)
        // Increased margins for better reading experience (Standard is usually ~25mm)
        const margin = config.bleed ? 30 : 25;

        doc.setTextColor(0, 0, 0);
        doc.setFontSize(18);
        doc.text(`Chapter ${index + 1}`, margin, 30);

        doc.setFontSize(22);
        doc.text(chapter.title, margin, 45);

        doc.setFontSize(12);
        // Split text for wrapping
        // doc.internal.pageSize.getWidth() might be in different units if not standard, but we set unit: 'mm'
        const splitText = doc.splitTextToSize(chapter.content, doc.internal.pageSize.getWidth() - (margin * 2));
        doc.text(splitText, margin, 60);
    });

    doc.save(`${book.title?.replace(/\s+/g, '_').toLowerCase()}_${config.pageSize}.pdf`);
};
