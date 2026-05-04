import OpenAI from "openai";
import { env } from "@/lib/config";

const client = new OpenAI({ apiKey: env.OPENAI_API_KEY });

export async function embedText(input: string): Promise<number[]> {
    const text = input.slice(0, 8000);
    const response = await client.embeddings.create({
        model: "text-embedding-3-small",
        input: text,
    });

    return response.data[0].embedding;
}

export async function synthesizeDecisionTimeline(params: {
    question: string;
    contextBlocks: string[];
}): Promise<string> {
    const prompt = [
        "You are an enterprise decision analyst.",
        "Given the evidence below, write a concise timeline explaining why a decision happened.",
        "Output markdown with these sections: Summary, Timeline, Evidence, Risks.",
        "Do not invent facts. If uncertain, say it clearly.",
        "",
        `Question: ${params.question}`,
        "",
        "Evidence:",
        ...params.contextBlocks.map((block, index) => `(${index + 1}) ${block}`),
    ].join("\n");

    const completion = await client.responses.create({
        model: "gpt-4.1-mini",
        input: prompt,
    });

    return completion.output_text;
}

export async function synthesizeReasoningTrace(params: {
    commitTitle: string;
    commitContent: string;
    evidenceBlocks: string[];
}): Promise<string> {
    const prompt = [
        "You are an enterprise synthesis engine.",
        "Write a short reasoning trace that explains why a GitHub commit happened.",
        "Use only the evidence provided.",
        "Output 2-4 sentences and mention Slack or Gmail only if present in the evidence.",
        "If the evidence is weak, say that the trace is inferred.",
        "",
        `Commit: ${params.commitTitle}`,
        `Details: ${params.commitContent}`,
        "",
        "Evidence:",
        ...params.evidenceBlocks.map((block, index) => `(${index + 1}) ${block}`),
    ].join("\n");

    const completion = await client.responses.create({
        model: "gpt-4.1-mini",
        input: prompt,
    });

    return completion.output_text;
}
