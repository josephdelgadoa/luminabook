
import { GoogleGenerativeAI } from "@google/generative-ai";
import fs from 'fs';
import path from 'path';

// Read .env manually
const envPath = path.resolve(process.cwd(), '.env');
const envContent = fs.readFileSync(envPath, 'utf-8');
const match = envContent.match(/VITE_GEMINI_API_KEY=(.+)/);
const apiKey = match ? match[1].trim() : '';

console.log("Checking models with Key:", apiKey.substring(0, 10) + "...");

const genAI = new GoogleGenerativeAI(apiKey);

async function listModels() {
    try {
        // For many SDK versions, direct list isn't exposed on the main class easily without newer version
        // But let's try the model listing if available, or just try to generate with a known fallback

        // Actually, simply making a request to list models via REST might be easier if SDK is finicky
        // node script

        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`);
        const data = await response.json();

        if (data.models) {
            console.log("\nAVAILABLE MODELS:");
            data.models.forEach(model => {
                if (model.supportedGenerationMethods.includes("generateContent")) {
                    console.log(`- ${model.name}`);
                }
            });
        } else {
            console.log("No models found or error:", data);
        }

    } catch (error) {
        console.error("Error listing models:", error);
    }
}

listModels();
