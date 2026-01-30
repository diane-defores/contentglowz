/**
 * Token Usage Tracking Type
 *
 * Extends the base AI SDK usage with TokenLens enrichment data.
 * Used for displaying cost estimates and token counts in the UI.
 */
import type { LanguageModelUsage } from "ai";
import type { UsageData } from "tokenlens/helpers";

/**
 * Server-merged usage object combining:
 * - Base token counts from AI SDK (promptTokens, completionTokens)
 * - TokenLens cost/pricing data when available
 * - Model identifier for display purposes
 */
export type AppUsage = LanguageModelUsage & UsageData & { modelId?: string };
