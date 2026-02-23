/**
 * Research AI Provider — OpenRouter via @ai-sdk/openai
 *
 * Uses the user's OpenRouter API key to access AI models for
 * web research conversations.
 */
import { createOpenAI } from "@ai-sdk/openai";
import { DEFAULT_RESEARCH_MODEL } from "./research-models";

export function createResearchProvider(
	apiKey: string,
	modelId: string = DEFAULT_RESEARCH_MODEL,
) {
	const openrouter = createOpenAI({
		baseURL: "https://openrouter.ai/api/v1",
		apiKey,
	});

	return openrouter(modelId);
}
