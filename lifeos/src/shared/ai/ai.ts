// sendMessageToAI: Backend caller (FastAPI on localhost:8000)
// No API keys in frontend - all AI calls go through backend

export type AISuggestedAction = {
  type: string;
  label: string;
};

export type AIResponse = {
  reply: string;
  action?: AISuggestedAction | null;
};

export async function sendMessageToAI(message: string, context?: any): Promise<AIResponse> {
  const url = "http://localhost:8000/chat";
  
  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ message, context }),
  });

  if (!res.ok) {
    throw new Error(`Backend error: ${res.status}`);
  }

  const data = await res.json();
  const reply = data?.reply;
  const action = data?.action ?? null;

  if (!reply || typeof reply !== "string") {
    throw new Error("Invalid backend response");
  }

  return { reply: reply.trim(), action };
}
