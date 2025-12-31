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
        dangerouslyAllowBrowser: true,
        defaultHeaders: {
            "HTTP-Referer": "https://luminabook.com",
            "X-Title": "Luminabook",
        }
    });
};

export const analyzeManuscript = async (text: string, language: 'en' | 'es' = 'en'): Promise<Partial<EBook>> => {
    console.log("Analyzing manuscript via OpenRouter...");
    try {
        const client = getClient();
        const languageInstruction = language === 'es'
            ? "OUTPUT LANGUAGE: SPANISH (Español)."
            : "OUTPUT LANGUAGE: ENGLISH.";

        const completion = await client.chat.completions.create({
            model: "deepseek/deepseek-chat",
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
    } catch (error) {
        console.error("Analysis Failed:", error);
        throw error;
    }
};

export const generateImage = async (prompt: string, _width: number = 1024, _height: number = 1024): Promise<string> => {
    console.log("Generating Image via Flux 1.1 Pro...", { prompt: prompt.substring(0, 50) });

    try {
        const client = getClient();

        // User's recommended robust implementation for Flux 1.1 Pro
        const response = await client.chat.completions.create({
            model: "black-forest-labs/flux-1.1-pro", // Top Quality Model
            messages: [
                {
                    role: "user",
                    content: prompt
                }
            ],
            // Note: modalities param might be needed for strict parsing, 
            // but OpenAI Node SDK types might not strictly support it yet. 
            // OpenRouter infers image generation from this model ID.
        });

        const content = response.choices[0].message.content;

        // Flux via OpenRouter/Chat usually returns the URL directly in content 
        // OR a Markdown link ![image](url)
        console.log("Flux Response:", content);

        if (!content) throw new Error("No content received from specific model");

        // Extract URL
        const urlMatch = content.match(/https?:\/\/[^\s)]+/) || content.match(/\((.*?)\)/);
        let url = urlMatch ? urlMatch[0].replace('(', '').replace(')', '') : null;

        if (url && url.includes('](')) {
            url = url.split('](')[1].replace(')', '');
        }

        if (!url || !url.startsWith('http')) {
            throw new Error("Could not parse Image URL from response: " + content);
        }

        return url;

    } catch (e: any) {
        console.error("Flux 1.1 Pro Generation Failed:", e);

        // Fallback to Schnell if Pro fails (e.g. permissions/cost)
        // This is the "Speed" option recommended by user
        try {
            console.log("Falling back to Flux 1 Schnell...", e.message);
            const client = getClient();
            const response = await client.chat.completions.create({
                model: "black-forest-labs/flux-1-schnell",
                messages: [{ role: "user", content: prompt }]
            });
            const content = response.choices[0].message.content || "";
            const urlMatch = content.match(/https?:\/\/[^\s)]+/) || content.match(/\((.*?)\)/);
            let url = urlMatch ? urlMatch[0].replace('(', '').replace(')', '') : null;
            if (url && url.includes('](')) url = url.split('](')[1].replace(')', '');

            if (url) return url;
        } catch (fallbackError) {
            console.error("Fallback Failed:", fallbackError);
        }

        throw new Error(`Generation Failed: ${e.message || "Unknown Error"}`);
    }
};
