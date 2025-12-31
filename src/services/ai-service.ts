import type { EBook } from "../types";
import OpenAI from "openai";

// Configuration
const getApiKey = () => import.meta.env.VITE_OPENROUTER_API_KEY || '';

// Initialize OpenAI client for OpenRouter
const getClient = () => {
    const apiKey = getApiKey();
    if (!apiKey) throw new Error("OpenRouter API Key is missing");

    return new OpenAI({
        baseURL: "https://openrouter.ai/api/v1",
        apiKey: apiKey,
        dangerouslyAllowBrowser: true, // We are running client-side for this demo
        defaultHeaders: {
            "HTTP-Referer": "https://luminabook.com",
            "X-Title": "Luminabook",
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

        const completion = await client.chat.completions.create({
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
            response_format: { type: "json_object" }
        });

        const content = completion.choices[0].message.content || "{}";
        const json = JSON.parse(content.replace(/```json/g, '').replace(/```/g, '').trim());

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
    console.log("Generating Image via Pollinations.ai (Flux)...", { prompt: prompt.substring(0, 50) });

    // OpenRouter currently lists NO image models via API, causing 400 errors with their chat endpoint.
    // We strictly default to Pollinations (Flux) which is free, fast, and reliable.
    try {
        const encodedPrompt = encodeURIComponent(prompt);
        // Use Flux model via Pollinations
        // Adding seed randomizer to ensure new images on similar prompts if needed, but for now standard is fine.
        const seed = Math.floor(Math.random() * 1000000);
        const url = `https://image.pollinations.ai/prompt/${encodedPrompt}?width=${width}&height=${height}&model=flux&nologo=true&seed=${seed}`;

        return url;

    } catch (e: any) {
        console.error("Pollinations Generation Failed:", e);
        throw new Error(`Image Generation Failed: ${e.message || "Unknown Error"}`);
    }
};
