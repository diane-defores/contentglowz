/**
 * AI Provider Configuration
 *
 * This module abstracts AI model access through a custom provider pattern.
 * It routes model requests through the Vercel AI Gateway in production,
 * while providing mock implementations during testing.
 *
 * Key models available via `myProvider.languageModel(modelId)`:
 * - "chat-model": Vision-enabled model for general chat (Grok 2 Vision)
 * - "chat-model-reasoning": Chain-of-thought reasoning model (Grok 3 Mini)
 * - "title-model": Optimized for generating chat titles
 * - "artifact-model": Used for document/artifact operations
 *
 * IMPORTANT: Always use `myProvider.languageModel(modelId)` instead of
 * direct provider calls to ensure proper test mocking and model resolution.
 */
import { gateway } from "@ai-sdk/gateway";
import {
	customProvider,
	extractReasoningMiddleware,
	wrapLanguageModel,
} from "ai";
import { isTestEnvironment } from "../constants";

/**
 * Unified AI provider that abstracts model access across environments.
 * In test environment, uses mock models for deterministic testing.
 * In production, routes through Vercel AI Gateway to xAI Grok models.
 */
export const myProvider = isTestEnvironment
	? (() => {
			const {
				artifactModel,
				chatModel,
				reasoningModel,
				titleModel,
			} = require("./models.mock");
			return customProvider({
				languageModels: {
					"chat-model": chatModel,
					"chat-model-reasoning": reasoningModel,
					"title-model": titleModel,
					"artifact-model": artifactModel,
				},
			});
		})()
	: customProvider({
			languageModels: {
				// Default multimodal chat model with vision capabilities
				"chat-model": gateway.languageModel("xai/grok-2-vision-1212"),
				// Reasoning model wrapped with middleware to extract chain-of-thought
				// The <think> tags are parsed out and surfaced to the UI separately
				"chat-model-reasoning": wrapLanguageModel({
					model: gateway.languageModel("xai/grok-3-mini"),
					middleware: extractReasoningMiddleware({ tagName: "think" }),
				}),
				// Lightweight model for generating concise chat titles
				"title-model": gateway.languageModel("xai/grok-2-1212"),
				// Model used for artifact generation and document operations
				"artifact-model": gateway.languageModel("xai/grok-2-1212"),
			},
		});
