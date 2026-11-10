import { createChatService } from "./chatService.js";
import { createGeminiProvider } from "./geminiProvider.js";

/** Server-side integration adapter. Never mount without real authenticated adult verification,
 * shared rate limiting, JSON size limits and a fixed trusted HTTPS origin. Disabled unless
 * the caller explicitly supplies all dependencies. No self-reported age is accepted here. */
export function installSlimMaatChatRoute({ app, ai, model, authorize, limitRequest, allowedOrigin } = {}) {
  if (!app || typeof app.post !== "function" || typeof authorize !== "function" || typeof limitRequest !== "function") throw new TypeError("App, authorization and rate limiter are required");
  let origin;
  try { const parsed = new URL(allowedOrigin); if (parsed.protocol !== "https:" || parsed.origin !== allowedOrigin) throw new Error(); origin = parsed.origin; }
  catch { throw new TypeError("A fixed HTTPS origin is required"); }
  const generate = createGeminiProvider({ ai, model });
  const chat = createChatService({ authorize, generate });
  app.post("/api/slim-maat/chat", async (req, res) => {
    res.set("Cache-Control", "no-store");
    if (req.get("Origin") !== origin || !req.is("application/json")) return res.status(403).json({ error: "Access denied" });
    try {
      // The limiter and authorizer must inspect trusted server-side session state, not the body.
      if (await limitRequest(req) !== true) return res.status(429).json({ error: "Request unavailable" });
      const result = await chat({ context: req, messages: req.body?.messages });
      return result.status === 200 ? res.status(200).json({ reply: result.reply }) : res.status(result.status).json({ error: result.error });
    } catch { return res.status(503).json({ error: "Chat service unavailable" }); }
  });
}
