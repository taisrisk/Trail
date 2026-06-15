import { readTrailState, MailRecord } from "../store";

export async function processMailWithOllama(mail: MailRecord, rules: string[]) {
  const endpoint = "http://localhost:11434/api/generate";
  const prompt = `Read the following email and determine if it matches any of these user-defined rules. Also calculate a spam score (0-10, where 10 is obvious spam/phishing) and an importance score (0-10, where 10 is highly urgent or a direct request from a boss/VIP).

Rules: ${rules.join("; ")}

Email from: ${mail.from}
Email subject: ${mail.subject}
Email body: ${mail.body}

Respond strictly with a valid JSON object matching this schema exactly:
{
  "match": boolean, // true if it matches a rule
  "action": "flag" | "label" | "draft_reply" | "order_update" | null,
  "reason": "string explaining the match or null",
  "spamScore": number,
  "importanceScore": number,
  "notifyUser": "string containing a short desktop notification message to show the user if importance is high or a specific task was triggered, or null"
}`;

  try {

    const state = await readTrailState();
    const activeModelRecord = state.localModels.find(m => m.purpose === "watchers" && m.provider === "ollama");
    const activeModel = activeModelRecord ? activeModelRecord.model : "trail-watcher";

    const res = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: activeModel,
        prompt,
        stream: false,
        format: "json"
      }),
    });

    if (!res.ok) {
      console.warn(`[AI Watcher] Ollama request failed with status: ${res.status}. Is Ollama running locally?`);
      return null;
    }

    const data = await res.json();
    return JSON.parse(data.response);
  } catch (err: unknown) {
    console.warn("[AI Watcher] Could not connect to local Ollama instance.", err instanceof Error ? err.message : String(err));
    return null;
  }
}
