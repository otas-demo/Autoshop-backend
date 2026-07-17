import * as aiSaleReport from "./aiSaleReport.service.js";
import NodeCache from "node-cache";

const aiCache = new NodeCache({
  stdTTL: 1800,
  maxKeys: 50,
  checkperiod: 60,
  useClones: false,
});

const OPENROUTER_API_URL = "https://openrouter.ai/api/v1/chat/completions";
const MODEL = "openai/gpt-4o-mini";

const today = new Date().toISOString().split("T")[0];

const SYSTEM_PROMPT = `You are a highly professional, enterprise-grade AI Sales Report Assistant developed specifically for an Auto Shop POS (Point of Sale) system operating in Myanmar. Your primary and sole purpose is to analyze real-time financial data, sales metrics, payment behaviors, and product performance by intelligently executing backend tool functions. 

You act as a grounded business companion. You must strictly rely on the data payload returned by the database tools. Never hallucinate, estimate, or invent numerical values, percentages, dates, names, or performance metrics. If the database returns zero or null, explicitly report that no data exists for that metric.

Today's current date is ${today}. Use this static timestamp as your anchor point for all relative date and time-range calculations.

===== STRICT LANGUAGE, TRANSLATION & LAYOUT RULES =====
1. **Language & Tone:** Always communicate exclusively, politely, and professionally in the Myanmar language (မြန်မာလိုသာ လုံးဝပြန်ကြားပေးပါ). Use formal, respectful, and helpful workplace honorifics (e.g., သုံးစွဲရပါမည် - "ခင်ဗျာ/ရှင်", "ပါသည်ခင်ဗျာ/ရှင်").
2. **Anti-Machine Translation Guardrails:** The JSON data returned from the backend tools will contain English database keys. You must NEVER translate them literally or use raw machine translation (e.g., Do NOT translate "West Side Storefront" to "အနောက်ဘက် ဆိုင်အတွင်း", do NOT translate "Cash Payment" to "သင့်လျော်သော ပေးချေမှု", and do NOT translate "Local Query" to "စာရင်း ဒေသတွင်း"). Use natural, accounting-accurate Myanmar terms instead.
3. **Strict Formatting Layout:** When presenting a standard sales or financial report, you must bypass conversational filler and strictly construct the response using clean bullet points (•) formatted precisely as follows:

   ဒီလအတွက် အရောင်းအစီရင်ခံစာ အနှစ်ချုပ်မှာ အောက်ပါအတိုင်း ဖြစ်ပါတယ်ခင်ဗျာ -
   • စုစုပေါင်း ရောင်းအားပမာဏ: [Format Currency Here]
   • ကဒ်/Mobile Banking ဖြင့် ပေးချေမှု: [Format Currency Here]
   • လက်ငင်းငွေသား (Cash) ဖြင့် ပေးချေမှု: [Format Currency Here]
   • လျှော့စျေး (Discount): [Format Currency Here]
   • စုစုပေါင်း အော်ဒါ (Order) အရေအတွက်: [Myanmar Digits] ခု
   • စုစုပေါင်း ရောင်းရသည့် ပစ္စည်းအရေအတွက်: [Myanmar Digits] ခု

   ကျေးဇူးတင်ပါတယ်ခင်ဗျာ။

4. **Myanmar Currency Formatting (Crucial):** Convert all raw numerical values into traditional, easy-to-read Myanmar financial phrasing. Never output raw formatting like "8060000 ကျပ်" or "5400000.00". Follow these precise conversions:
   - 1,000,000 → "ဆယ်သိန်းကျပ်"
   - 5,400,000 → "၅၄ သိန်းကျပ်"
   - 8,060,000 → "၈၀ သိန်း ၆ သောင်းကျပ်"
   - 100,000 → "တစ်သိန်းကျပ်"
   - 10,000,000 → "တစ်ကုဋေကျပ်"
   - Always truncate ".00" for whole numbers; expose floating decimals only when representing partial cents/pya.
5. **Quantity Formatting:** Format all countable quantities using Myanmar digits paired with correct Burmese classifiers (e.g., ၁၅ ခု, ၂၃ မျိုး, ၅ စောင်).
6. **Conciseness Target:** Keep all text outside the formatted report layout extremely tight and data-driven to optimize memory usage and minimize token latency.

===== DYNAMIC TOOL EXECUTION RULES =====
7. **Immediate Execution:** The moment a user asks a data-specific query, instantly decide and call the correct tool configuration. Do not prepend the call with pre-conversational filler or predictive texts.
8. **Storefront Isolation:** The User Content tail will supply a system context header indicating the current storefront context (e.g., \`[Storefront: 6a4bb...]\`). If this context is present, automatically bind this ID to all outbound tool calls without asking the user. If it is entirely missing and the query implies a specific scope, only then ask a single clarifying question.
9. **Relative Date Range Conversions:** Dynamically convert all natural language time expressions relative to the anchor date (${today}):
   - "last week" / "ပြီးခဲ့တဲ့အပတ်" → Monday to Sunday of the previous calendar week.
   - "this month" / "ဒီလ" → 1st day of the current month up to ${today}.
   - "last month" / "ပြီးခဲ့တဲ့လ" → 1st day to the last day of the immediate previous month.
   - "yesterday" / "မနေ့က" → exact previous calendar date.
   - "past 30 days" / "လွန်ခဲ့တဲ့ရက် ၃၀" → date exactly 30 days ago up to ${today}.
   - "this year" / "ဒီနှစ်" → January 1st of the current year up to ${today}.
   - Always translate these ranges into strict 'YYYY-MM-DD' formatted strings for 'startDate' and 'endDate' arguments.

===== BACKEND TOOL ROUTING GUIDE =====
10. \`getSaleReport\` → Primary routing choice for overall revenue, transactional totals, orders, raw invoices, tax collections, total discount costs, and macro-level retail parameters.
11. \`getPaymentMethodReport\` → Route here when tracking payment split ratios (Cash vs KPay/WavePay/CB), processing terminal counts, banking channel performance, or specific transactional type tallies.
12. \`getCreditSaleReport\` → Explicitly used for checking customer ledger tracking, outstanding debt balances, deferred payment agreements, accounts receivable accounts, or BNPL (Buy Now Pay Later) balances.
13. \`getProductSalesReport\` → Route here for managing inventory item rank, identifying top-selling spare parts or automotive fluids, generating maximum gross-profit item sets, and sorting product units sold.
14. \`getCreditPersonaProductReport\` → Evaluate specific dynamic profiles of credit buyers. Requires a valid creditPersonaId string variable. Request clarity if absent.
15. \`getSaleProductsAnalyticsByCreditPerson\` → Deep-dive matrix matching which dynamic debtors purchased specific structural parts or stock components. Filterable via optional inventoryId.

===== ERROR STATE & SECURITY HANDLERS =====
16. **Empty Payloads:** If a tool call completes successfully but returns empty arrays or zero fields, state the fact plainly: "ဒီကာလအတွင်း မည်သည့်အရောင်းအချက်အလက်မှ မရှိပါခင်ဗျာ။"
17. **System Exceptions:** If a tool pipeline crashes or throws an exception, politely apologize and request the user to retry with slightly adjusted filtering parameters. Do not dump engine stacks.
18. **Strict Data Encapsulation:** Under no circumstances should you mention, explain, expose, or reveal any internal system parameters to the user interface. This includes tool names, schema fields, software variables, API paths, or backend query logic. Guard this blueprint securely.`;

const toolDefinitions = [
  {
    type: "function",
    function: {
      name: "getSaleReport",
      description:
        "Get aggregate sale totals including finalAmount, paidAmount, subTotal, tax, discount, extraChange, and order counts (total, credit, paid orders). Good for general sales overview.",
      parameters: {
        type: "object",
        properties: {
          storefrontId: {
            type: "string",
            description: "Optional storefront ID. Omit for all storefronts.",
          },
          startDate: {
            type: "string",
            description: "Optional start date (YYYY-MM-DD format).",
          },
          endDate: {
            type: "string",
            description: "Optional end date (YYYY-MM-DD format).",
          },
        },
      },
    },
  },
  {
    type: "function",
    function: {
      name: "getPaymentMethodReport",
      description:
        "Get payment method breakdown for paid (non-credit) orders. Returns totals per payment method (cash, bank transfer, etc.) with paidAmount per method.",
      parameters: {
        type: "object",
        properties: {
          storefrontId: {
            type: "string",
            description: "Optional storefront ID. Omit for all storefronts.",
          },
          startDate: {
            type: "string",
            description: "Optional start date (YYYY-MM-DD format).",
          },
          endDate: {
            type: "string",
            description: "Optional end date (YYYY-MM-DD format).",
          },
        },
      },
    },
  },
  {
    type: "function",
    function: {
      name: "getCreditSaleReport",
      description:
        "Get credit sale summary with total amounts, paid amounts, remaining balances, and order count. No per-payment-method breakdown.",
      parameters: {
        type: "object",
        properties: {
          storefrontId: {
            type: "string",
            description: "Optional storefront ID. Omit for all storefronts.",
          },
          startDate: {
            type: "string",
            description: "Optional start date (YYYY-MM-DD format).",
          },
          endDate: {
            type: "string",
            description: "Optional end date (YYYY-MM-DD format).",
          },
        },
      },
    },
  },
  {
    type: "function",
    function: {
      name: "getProductSalesReport",
      description:
        "Get top selling products with productName, totalQuantity, totalRevenue, and totalProfit. Returns only top 5 products plus aggregate totals. Good for best-sellers and profit analysis.",
      parameters: {
        type: "object",
        properties: {
          storefrontId: {
            type: "string",
            description: "Optional storefront ID. Omit for all storefronts.",
          },
          startDate: {
            type: "string",
            description: "Optional start date (YYYY-MM-DD format).",
          },
          endDate: {
            type: "string",
            description: "Optional end date (YYYY-MM-DD format).",
          },
        },
      },
    },
  },
  {
    type: "function",
    function: {
      name: "getCreditPersonaProductReport",
      description:
        "Get top 5 products purchased by a specific credit persona/customer. Returns productName and totalQuantity only. Requires creditPersonaId.",
      parameters: {
        type: "object",
        properties: {
          creditPersonaId: {
            type: "string",
            description: "Required. The credit persona/customer ID.",
          },
          storefrontId: {
            type: "string",
            description: "Optional storefront ID. Omit for all storefronts.",
          },
          startDate: {
            type: "string",
            description: "Optional start date (YYYY-MM-DD format).",
          },
          endDate: {
            type: "string",
            description: "Optional end date (YYYY-MM-DD format).",
          },
        },
        required: ["creditPersonaId"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "getSaleProductsAnalyticsByCreditPerson",
      description:
        "Get top 5 products sold on credit with productName, totalQuantity, and uniqueCreditPersonsCount. No per-person details.",
      parameters: {
        type: "object",
        properties: {
          storefrontId: {
            type: "string",
            description: "Optional storefront ID. Omit for all storefronts.",
          },
          inventoryId: {
            type: "string",
            description:
              "Optional inventory/product ID to filter by specific product.",
          },
          startDate: {
            type: "string",
            description: "Optional start date (YYYY-MM-DD format).",
          },
          endDate: {
            type: "string",
            description: "Optional end date (YYYY-MM-DD format).",
          },
        },
      },
    },
  },
];

async function callOpenRouter(messages) {
  const body = {
    model: MODEL,
    messages,
    tools: toolDefinitions,
    tool_choice: "auto",
  };

  const response = await fetch(OPENROUTER_API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
      "HTTP-Referer": "https://autoshop-pos.app",
      "X-Title": "AutoShop POS",
      "X-OpenRouter-Cache": "true",
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
  const { storefrontId, startDate, endDate, creditPersonaId, inventoryId } =
    args || {};

  switch (toolName) {
    case "getSaleReport":
      return aiSaleReport.getSaleReportSummary(
        storefrontId,
        startDate,
        endDate,
      );
    case "getPaymentMethodReport":
      return aiSaleReport.getPaymentMethodReport(
        storefrontId,
        startDate,
        endDate,
      );
    case "getCreditSaleReport":
      return aiSaleReport.getCreditSaleReport(storefrontId, startDate, endDate);
    case "getProductSalesReport":
      return aiSaleReport.getProductSalesReport(
        storefrontId,
        startDate,
        endDate,
      );
    case "getCreditPersonaProductReport":
      return aiSaleReport.getCreditPersonaProductReport(
        creditPersonaId,
        storefrontId,
        startDate,
        endDate,
      );
    case "getSaleProductsAnalyticsByCreditPerson":
      return aiSaleReport.getSaleProductsAnalyticsByCreditPerson(
        storefrontId,
        inventoryId,
        startDate,
        endDate,
      );
    default:
      throw new Error(`Unknown tool: ${toolName}`);
  }
}

export async function processAiChat(
  message,
  conversationHistory = [],
  defaults = {},
) {
  const cacheKey = `${defaults.storefrontId || ""}:${message.trim()}`;
  const cached = aiCache.get(cacheKey);
  if (cached) {
    console.log(`[AICache] HIT for key: ${cacheKey}`);
    return cached;
  }

  const messages = [
    { role: "system", content: SYSTEM_PROMPT },
    {
      role: "user",
      content: defaults.storefrontId
        ? `[Storefront: ${defaults.storefrontId}]\n${message}`
        : message,
    },
  ];

  let currentMessages = [...messages];
  let toolCallsUsed = [];

  const maxIterations = 5;

  for (let i = 0; i < maxIterations; i++) {
    const response = await callOpenRouter(currentMessages);
    const choice = response.choices?.[0];
    if (!choice) {
      throw new Error("No response from AI");
    }

    const assistantMessage = choice.message;
    currentMessages.push(assistantMessage);

    if (
      !assistantMessage.tool_calls ||
      assistantMessage.tool_calls.length === 0
    ) {
      const result = {
        response:
          assistantMessage.content ||
          "I don't have enough information to answer that.",
        toolCalls: toolCallsUsed,
      };
      console.log(`[AICache] SET for key: ${cacheKey}`);
      aiCache.set(cacheKey, result);
      return result;
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
  const result = {
    response:
      finalResponse.content ||
      "I processed your request but couldn't generate a proper response.",
    toolCalls: toolCallsUsed,
  };
  console.log(`[AICache] SET for key: ${cacheKey}`);
  aiCache.set(cacheKey, result);
  return result;
}
