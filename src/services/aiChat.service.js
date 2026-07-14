import * as aiSaleReport from "./aiSaleReport.service.js";

const OPENROUTER_API_URL = "https://openrouter.ai/api/v1/chat/completions";
const MODEL = "openai/gpt-4o-mini";

const today = new Date().toISOString().split("T")[0];

const SYSTEM_PROMPT = `You are an AI sales report assistant for an auto shop POS system. You have access to sales data through the following tools. Use them to answer user questions about sales, payments, products, and credit sales.

Today's date is ${today}.

Rules:
- Always use the appropriate tool to fetch real data - never make up numbers or guess.
- If the user asks a question that requires data, use a tool. Do not answer from your training data.
- If no storefront is specified and the user hasn't indicated "all storefronts", ask which storefront they want data for.
- Calculate date ranges yourself from natural language. For example: "last week", "this month", "yesterday", "past 30 days" should be converted to proper startDate/endDate arguments in tool calls.
- Be concise and clear in your responses.
- When showing numbers, round to 2 decimal places.
- Format all currency values with "MMK" prefix (e.g., "MMK 572,724") — this software is used in Myanmar.
- Use the getCreditSaleReport tool when the user asks about credit sales, outstanding balances, remaining payments, or credit-specific breakdowns.
- Use the getPaymentMethodReport tool when the user asks about payment method breakdowns, how customers paid, or paid order details.
- Use the getProductSalesReport tool when the user asks about product performance, best-selling products, revenue by product, or profit analysis.
- Use the getCreditPersonaProductReport tool when the user asks about what a specific credit customer/persona bought.
- Use the getSaleProductsAnalyticsByCreditPerson tool for detailed product-level analytics by credit person.
- The getSaleReport tool provides aggregate totals and is good for general sales questions.`;

const toolDefinitions = [
  {
    type: "function",
    function: {
      name: "getSaleReport",
      description: "Get aggregate sale totals including finalAmount, paidAmount, subTotal, tax, discount, extraChange, and order counts (total, credit, paid orders). Good for general sales overview.",
      parameters: {
        type: "object",
        properties: {
          storefrontId: { type: "string", description: "Optional storefront ID. Omit for all storefronts." },
          startDate: { type: "string", description: "Optional start date (YYYY-MM-DD format)." },
          endDate: { type: "string", description: "Optional end date (YYYY-MM-DD format)." },
        },
      },
    },
  },
  {
    type: "function",
    function: {
      name: "getPaymentMethodReport",
      description: "Get payment method breakdown for paid (non-credit) orders. Returns totals per payment method (cash, bank transfer, etc.) with paidAmount per method.",
      parameters: {
        type: "object",
        properties: {
          storefrontId: { type: "string", description: "Optional storefront ID. Omit for all storefronts." },
          startDate: { type: "string", description: "Optional start date (YYYY-MM-DD format)." },
          endDate: { type: "string", description: "Optional end date (YYYY-MM-DD format)." },
        },
      },
    },
  },
  {
    type: "function",
    function: {
      name: "getCreditSaleReport",
      description: "Get credit sale summary with total amounts, paid amounts, remaining balances, and order count. No per-payment-method breakdown.",
      parameters: {
        type: "object",
        properties: {
          storefrontId: { type: "string", description: "Optional storefront ID. Omit for all storefronts." },
          startDate: { type: "string", description: "Optional start date (YYYY-MM-DD format)." },
          endDate: { type: "string", description: "Optional end date (YYYY-MM-DD format)." },
        },
      },
    },
  },
  {
    type: "function",
    function: {
      name: "getProductSalesReport",
      description: "Get top selling products with productName, totalQuantity, totalRevenue, and totalProfit. Returns only top 5 products plus aggregate totals. Good for best-sellers and profit analysis.",
      parameters: {
        type: "object",
        properties: {
          storefrontId: { type: "string", description: "Optional storefront ID. Omit for all storefronts." },
          startDate: { type: "string", description: "Optional start date (YYYY-MM-DD format)." },
          endDate: { type: "string", description: "Optional end date (YYYY-MM-DD format)." },
        },
      },
    },
  },
  {
    type: "function",
    function: {
      name: "getCreditPersonaProductReport",
      description: "Get top 5 products purchased by a specific credit persona/customer. Returns productName and totalQuantity only. Requires creditPersonaId.",
      parameters: {
        type: "object",
        properties: {
          creditPersonaId: { type: "string", description: "Required. The credit persona/customer ID." },
          storefrontId: { type: "string", description: "Optional storefront ID. Omit for all storefronts." },
          startDate: { type: "string", description: "Optional start date (YYYY-MM-DD format)." },
          endDate: { type: "string", description: "Optional end date (YYYY-MM-DD format)." },
        },
        required: ["creditPersonaId"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "getSaleProductsAnalyticsByCreditPerson",
      description: "Get top 5 products sold on credit with productName, totalQuantity, and uniqueCreditPersonsCount. No per-person details.",
      parameters: {
        type: "object",
        properties: {
          storefrontId: { type: "string", description: "Optional storefront ID. Omit for all storefronts." },
          inventoryId: { type: "string", description: "Optional inventory/product ID to filter by specific product." },
          startDate: { type: "string", description: "Optional start date (YYYY-MM-DD format)." },
          endDate: { type: "string", description: "Optional end date (YYYY-MM-DD format)." },
        },
      },
    },
  },
];

async function callOpenRouter(messages, tools = null) {
  const body = {
    model: MODEL,
    messages,
  };
  if (tools) {
    body.tools = tools;
    body.tool_choice = "auto";
  }

  const response = await fetch(OPENROUTER_API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
      "HTTP-Referer": "https://autoshop-pos.app",
      "X-Title": "AutoShop POS",
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`OpenRouter API error (${response.status}): ${errorText}`);
  }

  return response.json();
}

async function executeTool(toolName, args) {
  const { storefrontId, startDate, endDate, creditPersonaId, inventoryId } = args || {};

  switch (toolName) {
    case "getSaleReport":
      return aiSaleReport.getSaleReportSummary(storefrontId, startDate, endDate);
    case "getPaymentMethodReport":
      return aiSaleReport.getPaymentMethodReport(storefrontId, startDate, endDate);
    case "getCreditSaleReport":
      return aiSaleReport.getCreditSaleReport(storefrontId, startDate, endDate);
    case "getProductSalesReport":
      return aiSaleReport.getProductSalesReport(storefrontId, startDate, endDate);
    case "getCreditPersonaProductReport":
      return aiSaleReport.getCreditPersonaProductReport(creditPersonaId, storefrontId, startDate, endDate);
    case "getSaleProductsAnalyticsByCreditPerson":
      return aiSaleReport.getSaleProductsAnalyticsByCreditPerson(storefrontId, inventoryId, startDate, endDate);
    default:
      throw new Error(`Unknown tool: ${toolName}`);
  }
}

export async function processAiChat(message, conversationHistory = [], defaults = {}) {
  const contextMessages = [];
  if (defaults.storefrontId) {
    contextMessages.push({
      role: "system",
      content: `The user has specified storefront ID: ${defaults.storefrontId} as their current context. Use this storefrontId when calling tools unless the user explicitly asks for a different storefront or all storefronts.`,
    });
  }

  const messages = [
    { role: "system", content: SYSTEM_PROMPT },
    ...contextMessages,
    ...conversationHistory,
    { role: "user", content: message },
  ];

  let currentMessages = [...messages];
  let toolCallsUsed = [];

  const maxIterations = 5;

  for (let i = 0; i < maxIterations; i++) {
    const response = await callOpenRouter(currentMessages, toolDefinitions);
    const choice = response.choices?.[0];
    if (!choice) {
      throw new Error("No response from AI");
    }

    const assistantMessage = choice.message;
    currentMessages.push(assistantMessage);

    if (!assistantMessage.tool_calls || assistantMessage.tool_calls.length === 0) {
      return {
        response: assistantMessage.content || "I don't have enough information to answer that.",
        toolCalls: toolCallsUsed,
      };
    }

    for (const toolCall of assistantMessage.tool_calls) {
      const toolName = toolCall.function.name;
      let args;
      try {
        args = JSON.parse(toolCall.function.arguments);
      } catch {
        args = {};
      }

      const mergedArgs = { ...defaults, ...args };
      const result = await executeTool(toolName, mergedArgs);
      toolCallsUsed.push(toolName);

      currentMessages.push({
        role: "tool",
        tool_call_id: toolCall.id,
        content: JSON.stringify(result),
      });
    }
  }

  const finalResponse = currentMessages[currentMessages.length - 1];
  return {
    response: finalResponse.content || "I processed your request but couldn't generate a proper response.",
    toolCalls: toolCallsUsed,
  };
}
