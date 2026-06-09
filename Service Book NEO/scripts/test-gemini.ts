
import { GoogleGenerativeAI } from "@google/generative-ai";


async function main() {
    const apiKey = process.env.GEMINI_API_KEY;
    console.log("Checking GEMINI_API_KEY...");
    if (!apiKey) {
        console.error("❌ GEMINI_API_KEY is missing in .env");
        process.exit(1);
    }
    console.log("Key found (starts with):", apiKey.substring(0, 5) + "...");


    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-flash-latest" });

    console.log("Sending test prompt to gemini-flash-latest...");
    try {
        const result = await model.generateContent("Hello! Are you working?");
        const response = result.response;
        const text = response.text();
        console.log("✅ API Success! Response:", text);
    } catch (error) {
        console.error("❌ API Error:", error);
    }

    // List models to debug
    try {
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`);
        const data = await response.json();
        interface GeminiModel { name: string }
        const { models } = data as { models: GeminiModel[] };
        console.log("All Models:", JSON.stringify(models.map((m) => m.name), null, 2));
    } catch (e) {
        console.error("List models failed", e);
    }
}

main();
