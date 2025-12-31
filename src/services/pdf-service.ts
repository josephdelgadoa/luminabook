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

    // --- 1. COVER PAGE (Pro Design Rules) ---
    const coverImage = await loadImage(book.coverImageUrl || "");

    if (coverImage) {
        // Rule: Full Bleed Image
        doc.addImage(coverImage, 'JPEG', 0, 0, fmt.width, fmt.height);

        // Rule: Gradient Overlay / "Negative Space" Technique
        // We darken the top 35% significantly to create a "safe zone" for the title.
        // And the bottom 20% for the author name.

        doc.saveGraphicsState();
        // Top Dark Zone (for Title) - 70% Opacity
        doc.setGState(new (doc as any).GState({ opacity: 0.7 }));
        doc.setFillColor(0, 0, 0);
        doc.rect(0, 0, fmt.width, fmt.height * 0.35, 'F');

        // Bottom Dark Zone (for Author) - 60% Opacity
        doc.setGState(new (doc as any).GState({ opacity: 0.6 }));
        doc.rect(0, fmt.height * 0.8, fmt.width, fmt.height * 0.2, 'F');

        doc.restoreGraphicsState();
    } else {
        // Fallback Dark Background
        doc.setFillColor(15, 23, 42);
        doc.rect(0, 0, fmt.width, fmt.height, 'F');
    }

    // Cover Typography
    doc.setTextColor(255, 255, 255);
    doc.setFont("times", "bold");

    // Rule: Thumbnail Rule / Hierarchy
    // Title should be ~25-40% of visual weight. We scale font size up.
    const titleSize = fmt.fontSize.title * 2.5;
    doc.setFontSize(titleSize);

    const titleLines = doc.splitTextToSize(book.title.toUpperCase(), fmt.width - (marginX * 2));
    const titleY = fmt.height * 0.15; // Start 15% down (centered in top dark zone)

    // Rule: Soft Drop Shadow (No Stroke!)
    // Simulate soft shadow by drawing at multiple offsets with low opacity
    const shadowOffsets = [0.2, 0.4, 0.6, 0.8]; // mm offsets
    doc.setTextColor(0, 0, 0);

    shadowOffsets.forEach(off => {
        doc.saveGraphicsState();
        doc.setGState(new (doc as any).GState({ opacity: 0.25 })); // Low opacity per layer
        doc.text(titleLines, (fmt.width / 2) + off, titleY + off, { align: 'center' });
        doc.restoreGraphicsState();
    });

    // Draw Main Title (Bright White)
    doc.setTextColor(255, 255, 255);
    doc.text(titleLines, fmt.width / 2, titleY, { align: 'center' });

    // Author (Placed in Bottom Dark Zone)
    doc.setFontSize(fmt.fontSize.title); // ~50% of title size
    doc.setFont("times", "normal");
    // Add slight spacing/tracking if possible (jspdf limits), but normal is fine.
    const authorY = fmt.height * 0.9;
    doc.text(book.author || "Author Name", fmt.width / 2, authorY, { align: 'center' });

    // Tagline / Subtitle
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(200, 200, 200);
    doc.text("LuminaBook Edition", fmt.width / 2, authorY + 8, { align: 'center' });


    // --- 2. TITLE PAGE (Standard) ---
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


    // --- 3. CHAPTERS ---
    const isSpanish = /cap[ií]tulo|introducc|pr[óo]l/i.test(JSON.stringify(book.chapters));
    const chapterWord = isSpanish ? "Capítulo" : "Chapter";

    let chapterCount = 0;

    for (const chapter of book.chapters) {
        doc.addPage();
        let cursorY = marginTop;

        // 3.1 Chapter Image
        const chapImg = await loadImage(chapter.imageUrl || "");
        if (chapImg) {
            // Cinematic 2:1 aspect ratio at top of page
            const imgHeight = (fmt.width - (marginX * 2)) / 2;
            doc.addImage(chapImg, 'JPEG', marginX, cursorY, fmt.width - (marginX * 2), imgHeight);
            cursorY += imgHeight + 10;
        }

        // 3.2 Smart Header Logic
        const isSpecial = /intro|prologue|prólogo|preface|prefacio/i.test(chapter.title);

        doc.setFont("helvetica", "bold");
        doc.setFontSize(fmt.fontSize.chapter);
        doc.setTextColor(100, 100, 100); // Grey header

        // Logic: Only add "Chapter X" if the title DOES NOT already start with it.
        if (!isSpecial) {
            chapterCount++;
            // Normalize check
            const startsWithHeader = new RegExp(`^${chapterWord}`, 'i').test(chapter.title);

            if (!startsWithHeader) {
                doc.text(`${chapterWord} ${chapterCount}`, marginX, cursorY);
                cursorY += 8;
            }
        }

        // 3.3 Chapter Title
        doc.setFont("times", "bold");
        doc.setFontSize(fmt.fontSize.title);
        doc.setTextColor(0, 0, 0); // Black

        const cleanTitle = chapter.title;
        const titleLines = doc.splitTextToSize(cleanTitle, fmt.width - (marginX * 2));
        doc.text(titleLines, marginX, cursorY);
        cursorY += (titleLines.length * 10) + 10;

        // 3.4 Content
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

    const safeTitle = (book.title || "book").replace(/[^a-z0-9]/gi, '_').toLowerCase();
    doc.save(`${safeTitle}_${formatKey}.pdf`);
};
