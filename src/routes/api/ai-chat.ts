import { createFileRoute } from "@tanstack/react-router";

type ChatMessage = { role: "system" | "user" | "assistant"; content: string };

export const Route = createFileRoute("/api/ai-chat")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        try {
          const body = (await request.json()) as {
            messages?: ChatMessage[];
            systemPrompt?: string;
          };
          const apiKey = process.env.LOVABLE_API_KEY;
          if (!apiKey) {
            return Response.json({ error: "AI not configured" }, { status: 500 });
          }
          const messages: ChatMessage[] = [];
          if (body.systemPrompt) messages.push({ role: "system", content: body.systemPrompt });
          if (Array.isArray(body.messages)) messages.push(...body.messages);

          const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "Lovable-API-Key": apiKey,
            },
            body: JSON.stringify({
              model: "google/gemini-2.5-flash",
              messages,
            }),
          });

          if (!res.ok) {
            const text = await res.text();
            if (res.status === 429) return Response.json({ error: "Rate limit exceeded. Try again shortly." }, { status: 429 });
            if (res.status === 402) return Response.json({ error: "AI credits exhausted. Please add credits in your workspace." }, { status: 402 });
            return Response.json({ error: `AI error: ${text.slice(0, 200)}` }, { status: 500 });
          }
          const data = (await res.json()) as { choices?: Array<{ message?: { content?: string } }> };
          const reply = data.choices?.[0]?.message?.content ?? "";
          return Response.json({ reply });
        } catch (err) {
          return Response.json({ error: (err as Error).message || "Unknown error" }, { status: 500 });
        }
      },
    },
  },
});
