/* Server-side only. Caller configures the SDK and model; never ship credentials to a client. Not connected to a route. */
export function createGeminiProvider({ ai, model } = {}) {
  if (!ai || typeof ai.models?.generateContent !== "function" || typeof model !== "string" || !model.trim()) throw new TypeError("A configured server-side provider and model are required");
  return async ({ system, messages }) => {
    const result = await ai.models.generateContent({
      model,
      contents: messages.map(message => ({ role: message.role === "assistant" ? "model" : "user", parts: [{ text: message.text }] })),
      config: { systemInstruction: system }
    });
    return result?.text;
  };
}
