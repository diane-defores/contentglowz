/**
 * Research AI Provider — OpenRouter via @ai-sdk/openai
 *
 * Uses the user's OpenRouter API key to access Claude Sonnet 4 for
 * web research conversations. Falls back to error if no key is configured.
 */
import { createOpenAI } from "@ai-sdk/openai";

export function createResearchProvider(apiKey: string) {
	const openrouter = createOpenAI({
		baseURL: "https://openrouter.ai/api/v1",
		apiKey,
	});

	return openrouter("anthropic/claude-sonnet-4");
}
