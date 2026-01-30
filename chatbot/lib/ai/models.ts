/**
 * Chat Model Configuration
 *
 * Defines the available chat models and their metadata for the model selector UI.
 * Model IDs must match those registered in `providers.ts` for proper routing.
 */
export const DEFAULT_CHAT_MODEL: string = "chat-model";

export type ChatModel = {
	id: string;
	name: string;
	description: string;
};

/**
 * Available chat models exposed to users via the model selector.
 * Each model's `id` corresponds to a key in the `myProvider` language models.
 */
export const chatModels: ChatModel[] = [
	{
		id: "chat-model",
		name: "Grok Vision",
		description: "Advanced multimodal model with vision and text capabilities",
	},
	{
		id: "chat-model-reasoning",
		name: "Grok Reasoning",
		description:
			"Uses advanced chain-of-thought reasoning for complex problems",
	},
];
