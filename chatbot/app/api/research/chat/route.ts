/**
 * Research Chat API Route
 *
 * Streaming chat endpoint for the research assistant.
 * Uses OpenRouter (Claude Sonnet 4) with Exa AI search tools.
 */
import {
	convertToModelMessages,
	createUIMessageStream,
	JsonToSseTransformStream,
	smoothStream,
	stepCountIs,
	streamText,
} from "ai";
import { z } from "zod";
import { auth } from "@clerk/nextjs/server";
import { createResearchProvider } from "@/lib/ai/research-provider";
import {
	DEFAULT_RESEARCH_MODEL,
	DEFAULT_RESEARCH_PROVIDER,
	researchModels,
	researchProviders,
} from "@/lib/ai/research-models";
import { researchSystemPrompt } from "@/lib/ai/research-prompts";
import { createExtraResearchTools } from "@/lib/ai/tools/research-extra-tools";
import { createResearchTools } from "@/lib/ai/tools/research-web-search";
import {
	getChatById,
	getMessagesByChatId,
	getUserSettings,
	saveChat,
	saveMessages,
} from "@/lib/db/queries";
import { ChatSDKError } from "@/lib/errors";
import type { ChatMessage } from "@/lib/types";
import { convertToUIMessages, generateUUID } from "@/lib/utils";

export const maxDuration = 60;

export async function GET(request: Request) {
	const { searchParams } = new URL(request.url);
	const id = searchParams.get("id");

	if (!id) {
		return new ChatSDKError("bad_request:api").toResponse();
	}

	try {
		const { userId } = await auth();
		if (!userId) {
			return new ChatSDKError("unauthorized:chat").toResponse();
		}

		const chat = await getChatById({ id });
		if (!chat) {
			return Response.json([], { status: 200 });
		}
		if (chat.userId !== userId) {
			return new ChatSDKError("forbidden:chat").toResponse();
		}

		const messagesFromDb = await getMessagesByChatId({ id });
		const uiMessages = convertToUIMessages(messagesFromDb);
		return Response.json(uiMessages, { status: 200 });
	} catch (error) {
		if (error instanceof ChatSDKError) {
			return error.toResponse();
		}
		console.error("Research chat GET error:", error);
		return new ChatSDKError("offline:chat").toResponse();
	}
}

const textPartSchema = z.object({
	type: z.enum(["text"]),
	text: z.string().min(1).max(4000),
});

const validModelIds = researchModels.map((m) => m.id);
const validProviderIds = researchProviders.map((p) => p.id);

const requestSchema = z.object({
	id: z.string().uuid(),
	projectId: z.string().uuid().optional(),
	modelId: z.string().optional(),
	providerId: z.string().optional(),
	message: z.object({
		id: z.string().uuid(),
		role: z.enum(["user"]),
		parts: z.array(textPartSchema),
	}),
});

export async function POST(request: Request) {
	let body: z.infer<typeof requestSchema>;

	try {
		const json = await request.json();
		body = requestSchema.parse(json);
	} catch {
		return new ChatSDKError("bad_request:api").toResponse();
	}

	try {
		const { id, projectId, message, modelId: rawModelId, providerId: rawProviderId } = body;
		const modelId = rawModelId && validModelIds.includes(rawModelId) ? rawModelId : DEFAULT_RESEARCH_MODEL;
		const providerId = rawProviderId && validProviderIds.includes(rawProviderId) ? rawProviderId : DEFAULT_RESEARCH_PROVIDER;
		const { userId } = await auth();

		if (!userId) {
			return new ChatSDKError("unauthorized:chat").toResponse();
		}

		// Get user's API keys
		const settings = await getUserSettings({ userId });
		const apiKeys = settings.apiKeys || {};

		if (!apiKeys.openrouter) {
			return new Response(
				JSON.stringify({
					error:
						"OpenRouter API key not configured. Add it in Settings > API Keys.",
				}),
				{ status: 400, headers: { "Content-Type": "application/json" } },
			);
		}

		// Load or create chat
		const chat = await getChatById({ id });
		let messagesFromDb: Awaited<ReturnType<typeof getMessagesByChatId>> = [];

		if (chat) {
			if (chat.userId !== userId) {
				return new ChatSDKError("forbidden:chat").toResponse();
			}
			messagesFromDb = await getMessagesByChatId({ id });
		} else {
			// Create a new research chat
			const title =
				(message.parts.find((p) => p.type === "text") as { text: string })
					?.text?.slice(0, 80) || "Research";
			await saveChat({
				id,
				userId,
				projectId,
				title,
				visibility: "private",
				type: "research",
			});
		}

		const uiMessages = [
			...convertToUIMessages(messagesFromDb),
			message as ChatMessage,
		];

		await saveMessages({
			messages: [
				{
					chatId: id,
					id: message.id,
					role: "user",
					parts: message.parts,
					attachments: [],
					createdAt: new Date(),
				},
			],
		});

		const model = createResearchProvider(apiKeys.openrouter, modelId);
		const tools = createResearchTools({
			exa: apiKeys.exa,
			consensus: apiKeys.consensus,
			tavily: apiKeys.tavily,
			providerId,
		});
		const extraTools = createExtraResearchTools();

		const stream = createUIMessageStream({
			execute: async ({ writer: dataStream }) => {
				const result = streamText({
					model,
					system: researchSystemPrompt,
					messages: await convertToModelMessages(uiMessages),
					stopWhen: stepCountIs(5),
					experimental_activeTools: [
						"searchWeb",
						"searchAcademic",
						"fetchUrl",
						"youtubeTranscript",
						"wikipediaSearch",
						"semanticScholar",
					],
					experimental_transform: smoothStream({ chunking: "word" }),
					tools: {
						searchWeb: tools.searchWeb,
						searchAcademic: tools.searchAcademic,
						fetchUrl: tools.fetchUrl,
						youtubeTranscript: extraTools.youtubeTranscript,
						wikipediaSearch: extraTools.wikipediaSearch,
						semanticScholar: extraTools.semanticScholar,
					},
				});

				result.consumeStream();
				dataStream.merge(result.toUIMessageStream());
			},
			generateId: generateUUID,
			onFinish: async ({ messages }) => {
				await saveMessages({
					messages: messages.map((msg) => ({
						id: msg.id,
						role: msg.role,
						parts: msg.parts,
						createdAt: new Date(),
						attachments: [],
						chatId: id,
					})),
				});
			},
			onError: () => "Oops, an error occurred!",
		});

		return new Response(stream.pipeThrough(new JsonToSseTransformStream()));
	} catch (error) {
		if (error instanceof ChatSDKError) {
			return error.toResponse();
		}
		console.error("Research chat error:", error);
		return new ChatSDKError("offline:chat").toResponse();
	}
}
