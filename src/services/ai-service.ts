import type { EBook } from "../types";

// OpenRouter/OpenAI API Configuration
import OpenAI from "openai";

const getApiKey = () => import.meta.env.VITE_OPENROUTER_API_KEY || '';

// Initialize OpenAI client pointing to OpenRouter
const getClient = () => {
    const apiKey = getApiKey();
    if (!apiKey) throw new Error("OpenRouter API Key is missing");

    return new OpenAI({
        baseURL: "https://openrouter.ai/api/v1",
        apiKey: apiKey,
        dangerouslyAllowBrowser: true, // Required for client-side usage
        defaultHeaders: {
            "HTTP-Referer": "https://luminabook.com", // Site URL for rankings
            "X-Title": "Luminabook", // App name for rankings
        }
    });
};

export const analyzeManuscript = async (text: string, language: 'en' | 'es' = 'en'): Promise<Partial<EBook>> => {
    console.log("Analyzing manuscript via OpenRouter (OpenAI SDK)...");

    try {
        const client = getClient();

        const languageInstruction = language === 'es'
            ? "OUTPUT LANGUAGE: SPANISH (Español). ensure all titles, summaries, and descriptions are in Spanish."
            : "OUTPUT LANGUAGE: ENGLISH.";

        const systemPrompt = `
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
        - coverPrompt (string): A detailed, artistic text-to-image prompt (Midjourney style). Describe lighting, mood, artistic style (e.g. 'oil painting', 'cinematic', 'vector'), and composition.
        - chapters (array of objects with id, title, content, summary, imagePrompt)
        
        For 'imagePrompt' in chapters: Generate a specific, highly visual description of a key scene or theme in the chapter. Style should match the book's tone.

        Ensure proper paragraph separation with \\n\\n. 
        Return ONLY raw JSON. No markdown backticks.
        `;

        const completion = await client.chat.completions.create({
            model: "deepseek/deepseek-chat", // Consistent High-Quality Model
            messages: [
                { role: "system", content: systemPrompt },
                { role: "user", content: `INPUT TEXT:\n${text}` }
            ],
            response_format: { type: "json_object" } // DeepSeek supports JSON mode
        });

        const content = completion.choices[0].message.content || "";
        console.log("AI Response received (truncated):", content.substring(0, 100));

        // Clean markdown if present
        const cleanJson = content.replace(/```json/g, '').replace(/```/g, '').trim();

        let json;
        try {
            json = JSON.parse(cleanJson);
        } catch (e) {
            console.error("JSON Parse Error:", e);
            console.error("Raw Content:", content);
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

            // SKIP Image Generation for chapters during initial analysis to save time/cost.
            // User can generate them manually via the UI "Generate" button.
            const imageUrl = "";

            return {
                ...c,
                id,
                title,
                summary,
                imagePrompt,
                imageUrl,
            };
        }));

        // Generate cover if missing (We do this one as it defines the book first impression)
        if (!json.coverImageUrl) {
            const coverPrompt = json.coverPrompt || `Book cover for ${json.title}`;
            try {
                // Cover: Portrait
                json.coverImageUrl = await generateImage(coverPrompt, 800, 1200);
            } catch (imgError) {
                console.error("Failed to generate cover:", imgError);
                json.coverImageUrl = ""; // Fallback to empty (will show placeholder/generator)
            }
        }

        return json;

    } catch (error: any) {
        console.error("AI Analysis CRITICAL FAILURE:", error);

        // Fail-safe
        return {
            title: "Draft Manuscript (Offline Mode)",
            description: "The AI service was temporarily unavailable.",
            author: "Author",
            chapters: [
                {
                    id: Math.random().toString(36).substring(2, 9),
                    title: "Manuscript Content",
                    content: text,
                    summary: "Full original text content.",
                    imagePrompt: "Writing workspace, vintage typewriter",
                    imageUrl: ""
                }
            ],
            coverImageUrl: ""
        };
    }
};

export const generateImage = async (prompt: string, width: number = 1024, height: number = 1024): Promise<string> => {
    try {
        const client = getClient();
        console.log("Generating image via OpenRouter (Flux-Schnell)...", { prompt, width, height });

        const response = await client.images.generate({
            model: "black-forest-labs/flux-1-schnell",
            prompt: prompt,
            // OpenRouter/Flux often ignores these or requires standard sizes.
            // We'll pass standard 1024x1024 to ensure compatibility unless specific aspect support is verified.
            // size: "1024x1024", 
            n: 1,
        });

        const url = response.data[0]?.url;
        if (!url) throw new Error("No image URL returned");

        return url;
    } catch (e) {
        console.error("Image Generation Failed:", e);
        // Fallback to Pollinations if OpenRouter fails (e.g. model not supported/credits issue)
        console.log("Falling back to Pollinations...");
        const seed = Math.floor(Math.random() * 1000000);
        const encodedPrompt = encodeURIComponent(prompt.substring(0, 500));
        return `https://image.pollinations.ai/prompt/${encodedPrompt}?width=${width}&height=${height}&seed=${seed}&nologo=true&model=flux`;
    }
};
