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
            model: "google/gemini-3-flash-preview", // Updated to latest Gemini model
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
    // List of models to try in order of preference (Quality -> Speed -> Free)
    // 1. Flux 1.1 Pro (Best Quality)
    // 2. Flux 1 Schnell (Standard Paid - Fast)
    // 3. Flux 1 Schnell Free (Free Tier Fallback)
    const models = [
        "black-forest-labs/flux-1.1-pro",
        "black-forest-labs/flux-1-schnell",
        "black-forest-labs/flux-1-schnell-free"
    ];

    console.log("Starting Image Generation waterfall...", { prompt: prompt.substring(0, 50) });

    let lastError: any = null;

    for (const model of models) {
        try {
            console.log(`Attempting generation with model: ${model}...`);
            const client = getClient();

            const response = await client.chat.completions.create({
                model: model,
                messages: [{ role: "user", content: prompt }]
            });

            const content = response.choices[0].message.content || "";
            // console.log(`Response from ${model}:`, content); // Debug log

            // Extract URL (Handles both Markdown ![image](url) and raw URL)
            const urlMatch = content.match(/https?:\/\/[^\s)]+/) || content.match(/\((.*?)\)/);
            let url = urlMatch ? urlMatch[0].replace('(', '').replace(')', '') : null;
            if (url && url.includes('](')) url = url.split('](')[1].replace(')', '');

            if (url && url.startsWith('http')) {
                console.log(`Successfully generated image with ${model}`);
                return url;
            }

            // If we got a response but no URL, treat as failure and try next
            console.warn(`No URL found in response from ${model}`);

        } catch (e: any) {
            console.warn(`Failed with ${model}:`, e.message || e);
            lastError = e;
            // Continue to next model in the list
        }
    }

    console.error("All image generation attempts failed.");
    throw new Error(`All models failed. Last error: ${lastError?.message || "Unknown"}`);
};
