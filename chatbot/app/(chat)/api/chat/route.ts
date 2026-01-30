/**
 * Chat API Route Handler
 *
 * This is the main endpoint for chat interactions. It handles:
 * - Streaming AI responses to the client via Server-Sent Events (SSE)
 * - Message persistence to the database
 * - Rate limiting based on user entitlements
 * - Tool calls for document creation, weather, and suggestions
 *
 * The response is a streaming response using the AI SDK's UIMessageStream.
 */
import { geolocation } from "@vercel/functions";
import {
	convertToModelMessages,
	createUIMessageStream,
	JsonToSseTransformStream,
	smoothStream,
	stepCountIs,
	streamText,
} from "ai";
import { unstable_cache as cache } from "next/cache";
import { after } from "next/server";
import {
	createResumableStreamContext,
	type ResumableStreamContext,
} from "resumable-stream";
import type { ModelCatalog } from "tokenlens/core";
import { fetchModels } from "tokenlens/fetch";
import { getUsage } from "tokenlens/helpers";
import { auth, type UserType } from "@/app/(auth)/auth";
import type { VisibilityType } from "@/components/visibility-selector";
import { entitlementsByUserType } from "@/lib/ai/entitlements";
import type { ChatModel } from "@/lib/ai/models";
import { type RequestHints, systemPrompt } from "@/lib/ai/prompts";
import { myProvider } from "@/lib/ai/providers";
import { analyzeMeshTool } from "@/lib/ai/tools/analyze-mesh";
import { buildMeshTool } from "@/lib/ai/tools/build-mesh";
import { createDocument } from "@/lib/ai/tools/create-document";
import { getWeather } from "@/lib/ai/tools/get-weather";
import { improveMeshTool } from "@/lib/ai/tools/improve-mesh";
import {
	analyzeInternalLinking,
	applyInternalLinks,
	generateInternalLinkingStrategy,
} from "@/lib/ai/tools/internal-linking-commands";
import { requestSuggestions } from "@/lib/ai/tools/request-suggestions";
import { updateDocument } from "@/lib/ai/tools/update-document";
import { isProductionEnvironment } from "@/lib/constants";
import {
	createStreamId,
	deleteChatById,
	getChatById,
	getMessageCountByUserId,
	getMessagesByChatId,
	saveChat,
	saveMessages,
	updateChatLastContextById,
} from "@/lib/db/queries";
import type { DBMessage } from "@/lib/db/schema";
import { ChatSDKError } from "@/lib/errors";
import type { ChatMessage } from "@/lib/types";
import type { AppUsage } from "@/lib/usage";
import { convertToUIMessages, generateUUID } from "@/lib/utils";
import { generateTitleFromUserMessage } from "../../actions";
import { type PostRequestBody, postRequestBodySchema } from "./schema";

/** Maximum duration for streaming response (Vercel serverless timeout) */
export const maxDuration = 60;

/** Singleton for resumable stream support (requires Redis) */
let globalStreamContext: ResumableStreamContext | null = null;

/**
 * Cached TokenLens model catalog for cost estimation.
 * Revalidates every 24 hours to pick up pricing changes.
 */
const getTokenlensCatalog = cache(
	async (): Promise<ModelCatalog | undefined> => {
		try {
			return await fetchModels();
		} catch (err) {
			console.warn(
				"TokenLens: catalog fetch failed, using default catalog",
				err,
			);
			return; // tokenlens helpers will fall back to defaultCatalog
		}
	},
	["tokenlens-catalog"],
	{ revalidate: 24 * 60 * 60 }, // 24 hours
);

/**
 * Initializes resumable stream support.
 * Requires Redis - gracefully degrades if not configured.
 * Resumable streams allow clients to reconnect and continue receiving data after disconnects.
 */
export function getStreamContext() {
	if (!globalStreamContext) {
		try {
			globalStreamContext = createResumableStreamContext({
				waitUntil: after,
			});
		} catch (error: any) {
			if (error.message.includes("REDIS_URL")) {
				console.log(
					" > Resumable streams are disabled due to missing REDIS_URL",
				);
			} else {
				console.error(error);
			}
		}
	}

	return globalStreamContext;
}

/**
 * Handles incoming chat messages and streams AI responses.
 *
 * Flow:
 * 1. Parse and validate request body
 * 2. Authenticate user and check rate limits
 * 3. Create or load existing chat
 * 4. Save user message to database
 * 5. Stream AI response with tool support
 * 6. Persist AI response on completion
 */
export async function POST(request: Request) {
	let requestBody: PostRequestBody;

	try {
		const json = await request.json();
		requestBody = postRequestBodySchema.parse(json);
	} catch (_) {
		return new ChatSDKError("bad_request:api").toResponse();
	}

	try {
		const {
			id,
			message,
			selectedChatModel,
			selectedVisibilityType,
		}: {
			id: string;
			message: ChatMessage;
			selectedChatModel: ChatModel["id"];
			selectedVisibilityType: VisibilityType;
		} = requestBody;

		const session = await auth();

		if (!session?.user) {
			return new ChatSDKError("unauthorized:chat").toResponse();
		}

		const userType: UserType = session.user.type;

		const messageCount = await getMessageCountByUserId({
			id: session.user.id,
			differenceInHours: 24,
		});

		if (messageCount > entitlementsByUserType[userType].maxMessagesPerDay) {
			return new ChatSDKError("rate_limit:chat").toResponse();
		}

		const chat = await getChatById({ id });
		let messagesFromDb: DBMessage[] = [];

		if (chat) {
			if (chat.userId !== session.user.id) {
				return new ChatSDKError("forbidden:chat").toResponse();
			}
			// Only fetch messages if chat already exists
			messagesFromDb = await getMessagesByChatId({ id });
		} else {
			const title = await generateTitleFromUserMessage({
				message,
			});

			await saveChat({
				id,
				userId: session.user.id,
				title,
				visibility: selectedVisibilityType,
			});
			// New chat - no need to fetch messages, it's empty
		}

		const uiMessages = [...convertToUIMessages(messagesFromDb), message];

		const { longitude, latitude, city, country } = geolocation(request);

		const requestHints: RequestHints = {
			longitude,
			latitude,
			city,
			country,
		};

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

		// Register stream ID for potential resumption after disconnect
		const streamId = generateUUID();
		await createStreamId({ streamId, chatId: id });

		// Tracks final usage data for persistence after stream completes
		let finalMergedUsage: AppUsage | undefined;

		/**
		 * Create the streaming response using AI SDK's UIMessageStream.
		 * This handles the complex orchestration of:
		 * - AI text generation with tool calls
		 * - Smooth streaming (word-by-word) for better UX
		 * - Custom data parts for artifacts and suggestions
		 */
		const stream = createUIMessageStream({
			execute: async ({ writer: dataStream }) => {
				const result = streamText({
					model: myProvider.languageModel(selectedChatModel),
					system: systemPrompt({ selectedChatModel, requestHints }),
					messages: await convertToModelMessages(uiMessages),
					// Limit tool call chains to prevent infinite loops
					stopWhen: stepCountIs(5),
					// Reasoning model doesn't use tools - it focuses on chain-of-thought
					experimental_activeTools:
						selectedChatModel === "chat-model-reasoning"
							? []
							: [
									"getWeather",
									"createDocument",
									"updateDocument",
									"requestSuggestions",
									"analyzeMesh",
									"buildMesh",
									"improveMesh",
									"analyzeInternalLinking",
									"generateInternalLinkingStrategy",
									"applyInternalLinks",
								],
					// Smooth word-by-word streaming for natural feel
					experimental_transform: smoothStream({ chunking: "word" }),
					tools: {
						getWeather,
						createDocument: createDocument({ session, dataStream }),
						updateDocument: updateDocument({ session, dataStream }),
						requestSuggestions: requestSuggestions({
							session,
							dataStream,
						}),
						analyzeMesh: analyzeMeshTool,
						buildMesh: buildMeshTool,
						improveMesh: improveMeshTool,
						analyzeInternalLinking,
						generateInternalLinkingStrategy,
						applyInternalLinks,
					},
					experimental_telemetry: {
						isEnabled: isProductionEnvironment,
						functionId: "stream-text",
					},
					/**
					 * Enriches usage data with cost estimates after AI response completes.
					 * TokenLens provides pricing data; falls back to raw token counts if unavailable.
					 */
					onFinish: async ({ usage }) => {
						try {
							const providers = await getTokenlensCatalog();
							const modelId =
								myProvider.languageModel(selectedChatModel).modelId;
							if (!modelId) {
								finalMergedUsage = usage;
								dataStream.write({
									type: "data-usage",
									data: finalMergedUsage,
								});
								return;
							}

							if (!providers) {
								finalMergedUsage = usage;
								dataStream.write({
									type: "data-usage",
									data: finalMergedUsage,
								});
								return;
							}

							const summary = getUsage({ modelId, usage, providers });
							finalMergedUsage = { ...usage, ...summary, modelId } as AppUsage;
							dataStream.write({ type: "data-usage", data: finalMergedUsage });
						} catch (err) {
							console.warn("TokenLens enrichment failed", err);
							finalMergedUsage = usage;
							dataStream.write({ type: "data-usage", data: finalMergedUsage });
						}
					},
				});

				// Start consuming the stream (required for streaming to proceed)
				result.consumeStream();

				// Merge AI response stream into the UI message stream
				// sendReasoning: true includes chain-of-thought from reasoning model
				dataStream.merge(
					result.toUIMessageStream({
						sendReasoning: true,
					}),
				);
			},
			generateId: generateUUID,
			/**
			 * Persists AI-generated messages after stream completes.
			 * Runs in the background via next/server's `after` callback.
			 */
			onFinish: async ({ messages }) => {
				await saveMessages({
					messages: messages.map((currentMessage) => ({
						id: currentMessage.id,
						role: currentMessage.role,
						parts: currentMessage.parts,
						createdAt: new Date(),
						attachments: [],
						chatId: id,
					})),
				});

				if (finalMergedUsage) {
					try {
						await updateChatLastContextById({
							chatId: id,
							context: finalMergedUsage,
						});
					} catch (err) {
						console.warn("Unable to persist last usage for chat", id, err);
					}
				}
			},
			onError: () => {
				return "Oops, an error occurred!";
			},
		});

		// NOTE: Resumable streams are currently disabled (require Redis setup)
		// Uncomment below to enable reconnection after network interrupts
		// const streamContext = getStreamContext();
		// if (streamContext) {
		//   return new Response(
		//     await streamContext.resumableStream(streamId, () =>
		//       stream.pipeThrough(new JsonToSseTransformStream())
		//     )
		//   );
		// }

		// Transform JSON stream to SSE format for browser consumption
		return new Response(stream.pipeThrough(new JsonToSseTransformStream()));
	} catch (error) {
		const vercelId = request.headers.get("x-vercel-id");

		if (error instanceof ChatSDKError) {
			return error.toResponse();
		}

		// Check for Vercel AI Gateway credit card error
		if (
			error instanceof Error &&
			error.message?.includes(
				"AI Gateway requires a valid credit card on file to service requests",
			)
		) {
			return new ChatSDKError("bad_request:activate_gateway").toResponse();
		}

		console.error("Unhandled error in chat API:", error, { vercelId });
		return new ChatSDKError("offline:chat").toResponse();
	}
}

/** Deletes a chat and all associated data */
export async function DELETE(request: Request) {
	const { searchParams } = new URL(request.url);
	const id = searchParams.get("id");

	if (!id) {
		return new ChatSDKError("bad_request:api").toResponse();
	}

	const session = await auth();

	if (!session?.user) {
		return new ChatSDKError("unauthorized:chat").toResponse();
	}

	const chat = await getChatById({ id });

	if (chat?.userId !== session.user.id) {
		return new ChatSDKError("forbidden:chat").toResponse();
	}

	const deletedChat = await deleteChatById({ id });

	return Response.json(deletedChat, { status: 200 });
}
