import { GoogleGenerativeAI } from "@google/generative-ai";
import type { EBook } from "../types";

// Initialize client
const apiKey = import.meta.env.VITE_GEMINI_API_KEY || '';
const genAI = new GoogleGenerativeAI(apiKey);
console.log("AI Service Initialized. Key present:", !!apiKey, "Length:", apiKey.length);

export const analyzeManuscript = async (text: string, language: 'en' | 'es' = 'en'): Promise<Partial<EBook>> => {
    console.log("Analyzing manuscript via Gemini-2.5-flash...");

    try {
        // Verified available model: gemini-2.5-flash
        const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

        const languageInstruction = language === 'es'
            ? "OUTPUT LANGUAGE: SPANISH (Español). ensure all titles, summaries, and descriptions are in Spanish."
            : "OUTPUT LANGUAGE: ENGLISH.";

        const prompt = `
        You are an Elite Book Designer. Your task is to structure a book based on the user's input.
        
        ${languageInstruction}

        INPUT ANALYSIS:
        1. Check if the input is a full manuscript or a concept/outline.
        
        EXECUTION RULES:
        - If Manuscript: You act as a FORMATTER. You must split the content into logical chapters. 
          CRITICAL: You MUST PRESERVE the ORIGINAL TEXT of the input in the 'content' field. 
          Do NOT rewrite, summarize, or translate the content body unless it is a summary. Keep it exactly as is, just organized. 
        - If Concept/Topic: Creatively generate a comprehensive 10-12 chapter outline expanding on the theme.
        - STRUCTURE: 
           - Look for "Introduction", "Prologue", "Introducción", "Prólogo". treat them as distinct sections, NOT "Chapter 1".
           - The first "Chapter 1" should be the actual start of the story/content after any intro.

        OUTPUT FORMAT:
        Return a valid JSON object with: 
        - title (string)
        - description (string)
        - coverPrompt (string)
        - chapters (array of objects with id, title, content, summary, imagePrompt)

        Ensure proper paragraph separation with \\n\\n. 
        Return ONLY raw JSON. No markdown backticks.

        INPUT TEXT:
        ${text}
        `;

        const result = await model.generateContent(prompt);
        const response = await result.response;
        const textResponse = response.text();

        console.log("AI Response received (truncated):", textResponse.substring(0, 100));

        // Clean markdown if present
        const cleanJson = textResponse.replace(/```json/g, '').replace(/```/g, '').trim();

        let json;
        try {
            json = JSON.parse(cleanJson);
        } catch (e) {
            console.error("JSON Parse Error:", e);
            throw new Error("Invalid JSON response from AI");
        }

        // Post-Processing: Ensure structure and defaults
        const generateId = () => Math.random().toString(36).substring(2, 9);

        // Ensure core fields
        if (!json.title) json.title = "Untitled Draft";
        if (!json.description) json.description = "A manuscript draft processed by Luminabook.";

        // Ensure chapters array
        if (!json.chapters || !Array.isArray(json.chapters)) {
            json.chapters = [{
                id: generateId(),
                title: "Introduction",
                content: text,
                summary: "Full text content.",
                imagePrompt: "Abstract book concept"
            }];
        }

        // Processing chapters
        json.chapters = await Promise.all(json.chapters.map(async (c: any) => {
            const id = c.id || generateId();
            const title = c.title || `Chapter ${Math.random().toString().substring(2, 5)}`;
            const summary = c.summary || `A section covering ${title}.`;
            const imagePrompt = c.imagePrompt || `Artistic illustration for ${title}`;

            // Generate visual placeholder if missing
            const imageUrl = await generateImage(imagePrompt);

            return {
                ...c,
                id,
                title,
                summary,
                imagePrompt,
                imageUrl, // Assign the generated image URL (which helps UI show something immediately)
            };
        }));

        // Generate cover if missing
        if (!json.coverImageUrl) {
            const coverPrompt = json.coverPrompt || `Book cover for ${json.title}`;
            json.coverImageUrl = await generateImage(coverPrompt);
        }

        return json;

    } catch (error: any) {
        console.error("AI Analysis CRITICAL FAILURE:", error);

        const errorMessage = error instanceof Error ? error.message : String(error);

        // Fail-safe: Return clean structure instead of scary error
        // This allows the user to continue working even if AI failed
        return {
            title: "Draft Manuscript (Offline Mode)",
            description: "The AI service was temporarily unavailable, but your manuscript has been safely loaded into the editor.",
            author: "Author",
            chapters: [
                {
                    id: Math.random().toString(36).substring(2, 9),
                    title: "Manuscript Content",
                    content: text,
                    summary: "Full original text content (Raw Import).",
                    imagePrompt: "Writing workspace, vintage typewritter",
                    imageUrl: await generateImage("Writing workspace, vintage typewritter")
                }
            ],
            coverImageUrl: await generateImage("Minimalist book cover, abstract")
        };
    }
};

// Deterministic color generator string -> hex
const stringToColor = (str: string) => {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        hash = str.charCodeAt(i) + ((hash << 5) - hash);
    }
    const c = (hash & 0x00FFFFFF).toString(16).toUpperCase();
    return "00000".substring(0, 6 - c.length) + c;
};

export const generateImage = async (prompt: string): Promise<string> => {
    // Generate a unique, deterministic placeholder based on the prompt
    // This ensures different chapters get different colored/styled placeholders
    const bgColor = stringToColor(prompt);

    // Invert for text color (simple logic)
    const r = parseInt(bgColor.substr(0, 2), 16);
    const g = parseInt(bgColor.substr(2, 2), 16);
    const b = parseInt(bgColor.substr(4, 2), 16);
    const yiq = ((r * 299) + (g * 587) + (b * 114)) / 1000;
    const textColor = (yiq >= 128) ? '000000' : 'ffffff';

    const encodedText = encodeURIComponent(prompt.substring(0, 20) + (prompt.length > 20 ? "..." : ""));

    return `https://placehold.co/1024x1024/${bgColor}/${textColor}?text=${encodedText}`;
};
