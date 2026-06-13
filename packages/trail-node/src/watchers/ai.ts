import { MailRecord } from "../store";

export async function processMailWithOllama(mail: MailRecord, rules: string[]) {
  // Production LLM execution: Send mail text and rules to the local Ollama instance running on standard port 11434

  const endpoint = "http://localhost:11434/api/generate";
  const prompt = `You are Trail, an automated local AI watcher that manages incoming email.
Read the following email and determine if it matches any of these rules:
Rules: ${rules.join("; ")}

Email from: ${mail.from}
Email subject: ${mail.subject}
Email body: ${mail.body}

If the email matches a rule, respond with a JSON object containing {"action": "<action>", "reason": "<reason>", "match": true}. Valid actions: flag, label, draft_reply, order_update.
If it does not match, respond with {"match": false}. Do not include markdown formatting or reasoning outside the JSON block.`;

  try {
    const res = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "llama3.2:3b", // Requires this model to be downloaded via Ollama
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
