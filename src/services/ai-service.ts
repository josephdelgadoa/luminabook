import { OpenAI } from "openai";
import type { EBook } from "../types";

// NOTE: We are using the OpenAI SDK compatible endpoint for OpenRouter.
// This is the industry standard way to interact with OpenRouter models.
// The @openrouter/sdk package is installed but we use the robust OpenAI client for completions.

const getApiKey = () => import.meta.env.VITE_OPENROUTER_API_KEY || '';

const getClient = () => {
    const apiKey = getApiKey();
    if (!apiKey) throw new Error("OpenRouter API Key is missing");

    return new OpenAI({
        apiKey: apiKey,
        baseURL: "https://openrouter.ai/api/v1", // Correct OpenRouter Endpoint
        dangerouslyAllowBrowser: true, // Needed for client manual trigger
        defaultHeaders: {
            "HTTP-Referer": "https://luminabook.app", // Required by OpenRouter
            "X-Title": "LuminaBook", // Optional
        }
    });
};

export const analyzeManuscript = async (text: string, language: 'en' | 'es' = 'en'): Promise<Partial<EBook>> => {
    console.log("Analyzing manuscript via OpenRouter (Gemini 3 Flash)...");

    try {
        const client = getClient();
        const languageInstruction = language === 'es'
            ? "OUTPUT LANGUAGE: SPANISH (Español)."
            : "OUTPUT LANGUAGE: ENGLISH.";

        const response = await client.chat.completions.create({
            model: "google/gemini-3-flash-preview",
            messages: [
                {
                    role: "system",
                    content: `You are an Elite Book Designer. Structure a book from input. ${languageInstruction}
                    RETURN JSON ONLY. 
                    Format: {
                      title: string,
                      description: string,
                      coverPrompt: string (Artistic, Midjourney style),
                      chapters: [{ id: string, title: string, content: string, summary: string, imagePrompt: string }]
                    }`
                },
                { role: "user", content: `INPUT TEXT:\n${text}` }
            ],
            response_format: { type: "json_object" } // OpenRouter/Gemini usually supports this
        });

        const content = response.choices[0].message.content || "{}";
        const json = JSON.parse(content);

        // Basic Defaults
        if (!json.title) json.title = "Untitled Draft";
        if (!json.chapters) json.chapters = [];

        // Generate IDs
        json.chapters = json.chapters.map((c: any) => ({
            ...c,
            id: c.id || Math.random().toString(36).substring(2, 9),
            imageUrl: ""
        }));

        // Cover Generation (Auto-Start)
        if (!json.coverImageUrl && json.coverPrompt) {
            try {
                json.coverImageUrl = await generateImage(json.coverPrompt);
            } catch (e) {
                console.error("Auto-Cover Failed:", e);
                json.coverImageUrl = "";
            }
        }

        return json;
    } catch (error: any) {
        console.error("Analysis Failed:", error);
        throw error;
    }
};

export const generateImage = async (prompt: string, width: number = 1024, height: number = 1024): Promise<string> => {
    console.log("Generating Image...", { prompt: prompt.substring(0, 50) });

    // Primary: Try OpenRouter (Flux 1.1 Pro)
    // Now using the "Correct" OpenAI Client configuration for OpenRouter
    try {
        console.log("Attempting OpenRouter (Flux 1.1 Pro)...");
        const client = getClient();

        const response = await client.chat.completions.create({
            model: "black-forest-labs/flux-1.1-pro",
            messages: [{ role: "user", content: prompt }]
        });

        // OpenRouter Image models usually return the URL in the content or as a markdown image
        const content = response.choices[0].message.content || "";
        console.log("OpenRouter Response:", content.substring(0, 100));

        // Parse Markdown Image or plain URL
        const urlMatch = content.match(/https?:\/\/[^\s)]+/) || content.match(/\((.*?)\)/);
        let url = urlMatch ? urlMatch[0].replace('(', '').replace(')', '') : null;
        if (url && url.includes('](')) url = url.split('](')[1].replace(')', ''); // Handle [alt](url)

        if (url && url.startsWith('http')) {
            console.log("OpenRouter Success!");
            return url;
        }

        // Sometimes OpenRouter returns generation ID? 
        // For now, if no URL, throw.
        throw new Error("No URL returned from specific model");

    } catch (e: any) {
        console.warn("OpenRouter Flux Failed (Falling back to Pollinations):", e.message);

        // Fallback: Pollinations.ai (Reliable)
        try {
            const encodedPrompt = encodeURIComponent(prompt);
            const seed = Math.floor(Math.random() * 1000000);
            // We use Pollinations 'flux' model which is free and reliable
            const url = `https://image.pollinations.ai/prompt/${encodedPrompt}?width=${width}&height=${height}&model=flux&nologo=true&seed=${seed}`;
            return url;
        } catch (innerE: any) {
            throw new Error(`All Image Generation Failed. Fallback Error: ${innerE.message}`);
        }
    }
};
