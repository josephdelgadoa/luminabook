// DeepSeek API Configuration
const DEEPSEEK_API_URL = "https://api.deepseek.com/chat/completions";
const getApiKey = () => import.meta.env.VITE_DEEPSEEK_API_KEY || '';

export const analyzeManuscript = async (text: string, language: 'en' | 'es' = 'en'): Promise<Partial<EBook>> => {
    console.log("Analyzing manuscript via DeepSeek-V3...");
    const apiKey = getApiKey();

    if (!apiKey) {
        console.error("Missing DeepSeek API Key");
        throw new Error("DeepSeek API Key is missing. Please check .env file.");
    }

    try {
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

        const userMessage = `INPUT TEXT:\n${text}`;

        const response = await fetch(DEEPSEEK_API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`
            },
            body: JSON.stringify({
                model: "deepseek-chat",
                messages: [
                    { role: "system", content: systemPrompt },
                    { role: "user", content: userMessage }
                ],
                stream: false
            })
        });

        if (!response.ok) {
            const errText = await response.text();
            console.error("DeepSeek API Error:", response.status, errText);
            throw new Error(`DeepSeek API Failed: ${response.status}`);
        }

        const data = await response.json();
        const content = data.choices[0]?.message?.content || "";

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

            // Generate visual placeholder if missing
            // Chapter: Ultra-Wide (16:3), e.g., 1600x300
            const imageUrl = await generateImage(imagePrompt, 1600, 300);

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
            // Cover: Portrait (2:3 approx), e.g., 800x1200
            json.coverImageUrl = await generateImage(coverPrompt, 800, 1200);
        }

        return json;

    } catch (error: any) {
        console.error("AI Analysis CRITICAL FAILURE:", error);

        // Fail-safe: Return clean structure instead of scary error
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
                    imagePrompt: "Writing workspace, vintage typewriter",
                    imageUrl: await generateImage("Writing workspace, vintage typewriter", 1600, 300)
                }
            ],
            coverImageUrl: await generateImage("Minimalist book cover, abstract", 800, 1200)
        };
    }
};

// Helper to generate a random seed
const generateSeed = () => Math.floor(Math.random() * 1000000);

export const generateImage = async (prompt: string, width: number = 1024, height: number = 1024): Promise<string> => {
    // We use Pollinations.ai for real generative images
    // Append a random seed to ensure regeneration works
    const seed = generateSeed();
    const encodedPrompt = encodeURIComponent(prompt.substring(0, 500)); // Limit prompt length safely

    // Pollinations URL format: https://image.pollinations.ai/prompt/{prompt}?width={width}&height={height}&seed={seed}&nologo=true
    return `https://image.pollinations.ai/prompt/${encodedPrompt}?width=${width}&height=${height}&seed=${seed}&nologo=true&model=flux`;
};
