import { asyncErrorHandler } from "../utils/asyncErrorHandler.js";
import { processAiChat } from "../services/aiChat.service.js";

export const askSaleReportAI = asyncErrorHandler(async (req, res, next) => {
  const { message, conversationHistory, storefrontId } = req.body;

  if (!message || typeof message !== "string" || message.trim().length === 0) {
    return res.status(400).json({
      success: false,
      message: "Message is required and must be a non-empty string.",
    });
  }

  const history = Array.isArray(conversationHistory) ? conversationHistory : [];

  const defaults = {};
  if (storefrontId) defaults.storefrontId = storefrontId;

  const result = await processAiChat(message.trim(), history, defaults);

  res.status(200).json({
    success: true,
    data: result,
  });
});
