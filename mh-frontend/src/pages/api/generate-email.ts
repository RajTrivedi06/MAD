import type { NextApiRequest, NextApiResponse } from "next";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "POST") return res.status(405).end();
  try {
    const { lab, profile } = req.body as { lab: unknown; profile: unknown };

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 20000); // 20s timeout
    const resp = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content:
              "You are an assistant that drafts professional cold emails for research opportunities.",
          },
          {
            role: "user",
            content: `Here is the lab information:\n${JSON.stringify(
              lab
            )}\n\nHere is the user's profile:\n${
              typeof profile === "string" ? profile : JSON.stringify(profile)
            }\n\nGenerate a professional cold email expressing interest in joining the lab.`,
          },
        ],
      }),
      signal: controller.signal,
    }).finally(() => clearTimeout(timeout));

    if (!resp.ok) {
      const text = await resp.text();
      return res.status(500).json({ error: text || "OpenAI request failed" });
    }

    type ChatMessage = { role: string; content: string };
    type ChatChoice = { index: number; message: ChatMessage };
    type ChatCompletionResponse = { id: string; choices: ChatChoice[] };
    const data = (await resp.json()) as ChatCompletionResponse;
    const email = data?.choices?.[0]?.message?.content ?? "";
    return res.status(200).json({ email });
  } catch (error) {
    console.error("OpenAI API Error:", error);
    return res.status(500).json({ error: "Failed to generate email." });
  }
}
