import { sendMessageToAI } from "../shared/ai/ai";

export async function generateLifeResponse(userMessage: string): Promise<string> {
  return sendMessageToAI(userMessage);
}
