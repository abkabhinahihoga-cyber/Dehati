import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { GAWAR_AI_SYSTEM_PROMPT } from "@/lib/gawar-knowledge";

export async function POST(req: NextRequest) {
    try {
        const apiKey = process.env.GEMINI_API_KEY;
        if (!apiKey) {
            return NextResponse.json(
                { reply: "Config Error: GEMINI_API_KEY is missing in .env.local" }, 
                { status: 500 }
            );
        }

        const genAI = new GoogleGenerativeAI(apiKey);
        const { messages } = await req.json();

        // ✅ CORRECT MODEL for the latest SDK version
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

        const chat = model.startChat({
            history: [
                {
                    role: "user",
                    parts: [{ text: GAWAR_AI_SYSTEM_PROMPT }],
                },
                {
                    role: "model",
                    parts: [{ text: "Ram Ram! I am Gawar Ai. How can I help you with Dehati Sathi today?" }],
                },
                ...messages.slice(0, -1).map((m: any) => ({
                    role: m.role === 'user' ? 'user' : 'model',
                    parts: [{ text: m.content || "" }],
                }))
            ],
        });

        const lastMessage = messages[messages.length - 1].content;
        const result = await chat.sendMessage(lastMessage);
        const response = result.response;
        const text = response.text();

        return NextResponse.json({ reply: text });

    } catch (error: any) {
        console.error("AI Error:", error.message);
        return NextResponse.json(
            { reply: "Maaf karna, technical dikkat hai. Please restart your server or check API key." }, 
            { status: 500 }
        );
    }
}