import { cookies } from "next/headers";
import { notFound } from "next/navigation";
import { Suspense } from "react";

import { auth } from "@clerk/nextjs/server";
import { Chat } from "@/components/chat";
import { DataStreamHandler } from "@/components/data-stream-handler";
import { DEFAULT_CHAT_MODEL } from "@/lib/ai/models";
import { getChatById, getMessagesByChatId } from "@/lib/db/queries";
import { convertToUIMessages } from "@/lib/utils";

export default function Page(props: { params: Promise<{ id: string }> }) {
	return (
		<Suspense fallback={<div className="flex h-dvh" />}>
			<ChatPage params={props.params} />
		</Suspense>
	);
}

async function ChatPage({ params }: { params: Promise<{ id: string }> }) {
	const { id } = await params;
	const chat = await getChatById({ id });

	if (!chat) {
		notFound();
	}

	const { userId } = await auth();

	if (!userId) {
		return notFound();
	}

	if (chat.visibility === "private") {
		if (userId !== chat.userId) {
			return notFound();
		}
	}

	const messagesFromDb = await getMessagesByChatId({
		id,
	});

	const uiMessages = convertToUIMessages(messagesFromDb);

	const cookieStore = await cookies();
	const chatModelFromCookie = cookieStore.get("chat-model");

	if (!chatModelFromCookie) {
		return (
			<>
				<Chat
					autoResume={true}
					id={chat.id}
					projectId={chat.projectId ?? undefined}
					initialChatModel={DEFAULT_CHAT_MODEL}
					initialLastContext={chat.lastContext ?? undefined}
					initialMessages={uiMessages}
					initialVisibilityType={chat.visibility}
					isReadonly={userId !== chat.userId}
				/>
				<DataStreamHandler />
			</>
		);
	}

	return (
		<>
			<Chat
				autoResume={true}
				id={chat.id}
				projectId={chat.projectId ?? undefined}
				initialChatModel={chatModelFromCookie.value}
				initialLastContext={chat.lastContext ?? undefined}
				initialMessages={uiMessages}
				initialVisibilityType={chat.visibility}
				isReadonly={userId !== chat.userId}
			/>
			<DataStreamHandler />
		</>
	);
}
