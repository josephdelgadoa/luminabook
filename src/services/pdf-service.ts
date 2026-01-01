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

// Helper: Load image from URL to Base64 (needed for jsPDF)
const loadImage = async (url: string): Promise<string | null> => {
    if (!url) return null;
    try {
        const response = await fetch(url);
        const blob = await response.blob();
        return new Promise((resolve) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve(reader.result as string);
            reader.onerror = () => resolve(null);
            reader.readAsDataURL(blob);
        });
    } catch (e) {
        console.warn("Failed to load PDF image:", url, e);
        return null;
    }
};

export const generatePDF = async (book: EBook, config: ExportConfig): Promise<void> => {
    console.log("Generating Professional PDF...", book.title, config);

    const formatKey = config.pageSize || 'a4';
    const fmt = FORMATS[formatKey] || FORMATS['a4'];

    const marginX = config.bleed ? fmt.margin.x + 5 : fmt.margin.x;
    const marginTop = config.bleed ? fmt.margin.top + 5 : fmt.margin.top;
    const marginBottom = config.bleed ? fmt.margin.bottom + 5 : fmt.margin.bottom;

    const doc = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: [fmt.width, fmt.height]
    });

    // --- 1. FRONT COVER PAGE ---
    const coverImage = await loadImage(book.coverImageUrl || "");

    if (coverImage) {
        doc.addImage(coverImage, 'JPEG', 0, 0, fmt.width, fmt.height);

        // Gradient & Overlays
        doc.saveGraphicsState();
        doc.setGState(new (doc as any).GState({ opacity: 0.7 }));
        doc.setFillColor(0, 0, 0);
        doc.rect(0, 0, fmt.width, fmt.height * 0.35, 'F'); // Top Dark

        doc.setGState(new (doc as any).GState({ opacity: 0.6 }));
        doc.rect(0, fmt.height * 0.8, fmt.width, fmt.height * 0.2, 'F'); // Bottom Dark
        doc.restoreGraphicsState();
    } else {
        doc.setFillColor(15, 23, 42);
        doc.rect(0, 0, fmt.width, fmt.height, 'F');
    }

    // Cover Typography
    doc.setTextColor(255, 255, 255);
    doc.setFont("times", "bold");
    const titleSize = fmt.fontSize.title * 2.5;
    doc.setFontSize(titleSize);

    const titleLines = doc.splitTextToSize(book.title.toUpperCase(), fmt.width - (marginX * 2));
    const titleY = fmt.height * 0.15;

    // Soft Shadow
    const shadowOffsets = [0.2, 0.4, 0.6, 0.8];
    doc.setTextColor(0, 0, 0);
    shadowOffsets.forEach(off => {
        doc.saveGraphicsState();
        doc.setGState(new (doc as any).GState({ opacity: 0.25 }));
        doc.text(titleLines, (fmt.width / 2) + off, titleY + off, { align: 'center' });
        doc.restoreGraphicsState();
    });

    doc.setTextColor(255, 255, 255);
    doc.text(titleLines, fmt.width / 2, titleY, { align: 'center' });

    doc.setFontSize(fmt.fontSize.title);
    doc.setFont("times", "normal");
    const authorY = fmt.height * 0.9;
    doc.text(book.author || "Author Name", fmt.width / 2, authorY, { align: 'center' });

    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(200, 200, 200);
    doc.text("LuminaBook Edition", fmt.width / 2, authorY + 8, { align: 'center' });


    // --- 2. TITLE PAGE ---
    doc.addPage();
    doc.setTextColor(0, 0, 0);
    let tpCursor = fmt.height * 0.4;

    doc.setFont("times", "bold");
    doc.setFontSize(fmt.fontSize.title);
    doc.text(book.title, fmt.width / 2, tpCursor, { align: 'center' });

    tpCursor += 20;
    doc.setFontSize(fmt.fontSize.chapter);
    doc.setFont("times", "italic");
    doc.text(`by ${book.author}`, fmt.width / 2, tpCursor, { align: 'center' });


    // --- 3. AUTHOR INFO PAGE (New) ---
    // Rule: Only add if image or bio exists
    if (book.authorImageUrl || book.authorBio) {
        doc.addPage();
        let cursorY = marginTop;

        // Author Portrait
        const authorImg = await loadImage(book.authorImageUrl || "");
        if (authorImg) {
            // Circle mask is hard in PDF, so we do specific rectangle or just center it.
            // Let's do a nice square frame centered.
            const imgSize = 60; // mm
            const xPos = (fmt.width - imgSize) / 2;
            doc.addImage(authorImg, 'JPEG', xPos, cursorY, imgSize, imgSize);

            // Frame
            doc.setDrawColor(200, 200, 200);
            doc.setLineWidth(0.5);
            doc.rect(xPos, cursorY, imgSize, imgSize);

            cursorY += imgSize + 15;
        } else {
            cursorY += 20;
        }

        doc.setFont("times", "bold");
        doc.setFontSize(fmt.fontSize.title);
        doc.text("About the Author", fmt.width / 2, cursorY, { align: 'center' });
        cursorY += 15;

        doc.setFont("times", "normal");
        doc.setFontSize(fmt.fontSize.body);
        const bioLines = doc.splitTextToSize(book.authorBio || "Author bio not provided.", fmt.width - (marginX * 3)); // Narrower for bio
        doc.text(bioLines, fmt.width / 2, cursorY, { align: 'center' });
    }


    // --- 4. CHAPTERS ---
    const isSpanish = /cap[ií]tulo|introducc|pr[óo]l/i.test(JSON.stringify(book.chapters));
    const chapterWord = isSpanish ? "Capítulo" : "Chapter";
    let chapterCount = 0;

    for (const chapter of book.chapters) {
        doc.addPage();
        let cursorY = marginTop;

        // Chapter Banner Image
        const chapImg = await loadImage(chapter.imageUrl || "");
        if (chapImg) {
            const imgHeight = (fmt.width - (marginX * 2)) / 3; // 16:3 Approx logic (wider)
            doc.addImage(chapImg, 'JPEG', marginX, cursorY, fmt.width - (marginX * 2), imgHeight);
            cursorY += imgHeight + 10;
        }

        // Smart Header Logic
        const isSpecial = /intro|prologue|prólogo|preface|prefacio/i.test(chapter.title);

        doc.setFont("helvetica", "bold");
        doc.setFontSize(fmt.fontSize.chapter);
        doc.setTextColor(100, 100, 100);

        if (!isSpecial) {
            chapterCount++;
            const startsWithHeader = new RegExp(`^${chapterWord}`, 'i').test(chapter.title);
            if (!startsWithHeader) {
                doc.text(`${chapterWord} ${chapterCount}`, marginX, cursorY);
                cursorY += 8;
            }
        }

        // Chapter Title
        doc.setFont("times", "bold");
        doc.setFontSize(fmt.fontSize.title);
        doc.setTextColor(0, 0, 0);

        const cleanTitle = chapter.title;
        const titleLines = doc.splitTextToSize(cleanTitle, fmt.width - (marginX * 2));
        doc.text(titleLines, marginX, cursorY);
        cursorY += (titleLines.length * 10) + 10;

        // Content
        doc.setFont("times", "normal");
        doc.setFontSize(fmt.fontSize.body);

        const contentParts = doc.splitTextToSize(chapter.content, fmt.width - (marginX * 2));

        for (const line of contentParts) {
            if (cursorY + fmt.lineHeight > fmt.height - marginBottom) {
                doc.addPage();
                cursorY = marginTop;
            }
            doc.text(line, marginX, cursorY);
            cursorY += fmt.lineHeight;
        }
    }


    // --- 5. BACK COVER PAGE (New) ---
    const backCoverImg = await loadImage(book.backCoverImageUrl || "");

    doc.addPage(); // Back Cover is a new page at the very end

    if (backCoverImg) {
        // Full Bleed
        doc.addImage(backCoverImg, 'JPEG', 0, 0, fmt.width, fmt.height);

        // Dark Overlay for Text readability
        doc.saveGraphicsState();
        doc.setGState(new (doc as any).GState({ opacity: 0.85 }));
        doc.setFillColor(10, 10, 10);

        // Central Box for Blurb
        const boxW = fmt.width * 0.7;
        const boxH = fmt.height * 0.5;
        const boxX = (fmt.width - boxW) / 2;
        const boxY = (fmt.height - boxH) / 2;

        // Rounded rect workaround or just rect
        doc.rect(boxX - 5, boxY - 5, boxW + 10, boxH + 10, 'F');
        doc.restoreGraphicsState();
    } else {
        doc.setFillColor(20, 20, 20);
        doc.rect(0, 0, fmt.width, fmt.height, 'F');
    }

    // Back Cover Content
    doc.setTextColor(255, 255, 255);

    // "About the Book"
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.text("ABOUT THE BOOK", fmt.width / 2, (fmt.height * 0.3), { align: 'center' });

    // Description/Blurb
    doc.setFont("times", "italic");
    doc.setFontSize(14);
    const blurbStart = fmt.height * 0.35;
    const blurbWidth = fmt.width * 0.6;
    const blurbLines = doc.splitTextToSize(book.description || "No description available.", blurbWidth);

    doc.text(blurbLines, fmt.width / 2, blurbStart, { align: 'center' });

    // Barcode Simulation
    const bottomY = fmt.height * 0.85;
    doc.setFillColor(255, 255, 255);
    doc.rect((fmt.width / 2) - 20, bottomY, 40, 15, 'F'); // White background for barcode
    doc.setFont("courier", "normal");
    doc.setFontSize(8);
    doc.setTextColor(0, 0, 0);
    doc.text("LUMINABOOK PRESS", fmt.width / 2, bottomY + 20, { align: 'center' });

    const safeTitle = (book.title || "book").replace(/[^a-z0-9]/gi, '_').toLowerCase();
    doc.save(`${safeTitle}_${formatKey}.pdf`);
};
