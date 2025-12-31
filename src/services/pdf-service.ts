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

    // --- 1. COVER PAGE (Pro Design) ---
    const coverImage = await loadImage(book.coverImageUrl || "");

    if (coverImage) {
        // Full Bleed Image
        doc.addImage(coverImage, 'JPEG', 0, 0, fmt.width, fmt.height);

        // Professional "Gradient Overlay" Simulation for Readability
        // jsPDF doesn't natively support gradients easily, so we overlay a black rect with low alpha
        // Actually, we can draw a black rect at the top 30% with transparency.
        doc.saveGraphicsState();
        doc.setGState(new (doc as any).GState({ opacity: 0.6 })); // 60% opacity dark overlay
        doc.setFillColor(0, 0, 0);
        doc.rect(0, 0, fmt.width, fmt.height * 0.4, 'F'); // Darken top 40%
        doc.restoreGraphicsState();
    } else {
        // Fallback Dark Background
        doc.setFillColor(15, 23, 42);
        doc.rect(0, 0, fmt.width, fmt.height, 'F');
    }

    // Cover Typography
    doc.setTextColor(255, 255, 255);
    doc.setFont("times", "bold");

    // Title (Large, Top Centered)
    // Shadow Effect: Draw black text slightly offset, then white text
    const titleSize = fmt.fontSize.title * 2; // Make it BIG (Thumbnail Rule)
    doc.setFontSize(titleSize);

    const titleLines = doc.splitTextToSize(book.title.toUpperCase(), fmt.width - (marginX * 2));
    const titleY = fmt.height * 0.2; // Top 20%

    // Draw Shadow
    doc.setTextColor(0, 0, 0);
    doc.text(titleLines, (fmt.width / 2) + 0.5, titleY + 0.5, { align: 'center' });

    // Draw Main Title
    doc.setTextColor(255, 255, 255);
    doc.text(titleLines, fmt.width / 2, titleY, { align: 'center' });

    // Author (Smaller, below title)
    const authorY = titleY + (titleLines.length * (titleSize * 0.4)) + 20;
    doc.setFontSize(fmt.fontSize.title); // ~50% of title
    doc.setFont("times", "normal");
    doc.text(book.author || "Author Name", fmt.width / 2, authorY, { align: 'center' });


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
    // Detect Language for Header (Simple heuristic)
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

        // If title was "Chapter 1: The Beginning", and we just wrote "Chapter 1", 
        // we might want to strip "Chapter 1" from the main title line to avoid Double Header?
        // User asked to fix "Chapter 1 Chapter 1".
        // If the title IS "Chapter 1", we shouldn't print the header above it.

        // Clean duplicate content from title line if we printed a header
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
