/**
 * Research Models & Providers Configuration
 *
 * Available AI models (via OpenRouter) and search providers
 * for the research assistant.
 */

export interface ResearchModel {
	id: string;
	name: string;
	description: string;
}

export interface ResearchProvider {
	id: string;
	name: string;
	description: string;
}

export const researchModels: ResearchModel[] = [
	{
		id: "anthropic/claude-sonnet-4",
		name: "Claude Sonnet 4",
		description: "Fast, balanced intelligence",
	},
	{
		id: "anthropic/claude-opus-4",
		name: "Claude Opus 4",
		description: "Most capable, deep reasoning",
	},
	{
		id: "openai/gpt-4o",
		name: "GPT-4o",
		description: "OpenAI multimodal flagship",
	},
	{
		id: "google/gemini-2.5-pro-preview",
		name: "Gemini 2.5 Pro",
		description: "Google's advanced reasoning model",
	},
	{
		id: "deepseek/deepseek-r1",
		name: "DeepSeek R1",
		description: "Open-source reasoning model",
	},
];

export const researchProviders: ResearchProvider[] = [
	{
		id: "exa",
		name: "Exa",
		description: "Neural web search + academic papers",
	},
	{
		id: "consensus",
		name: "Consensus",
		description: "Scientific consensus from peer-reviewed papers",
	},
	{
		id: "tavily",
		name: "Tavily",
		description: "AI-optimized web search with answer synthesis",
	},
];

export const DEFAULT_RESEARCH_MODEL = "anthropic/claude-sonnet-4";
export const DEFAULT_RESEARCH_PROVIDER = "exa";
