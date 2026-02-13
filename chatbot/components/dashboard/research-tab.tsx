"use client";

import { Search } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { useResearchHistory } from "@/hooks/use-research-history";
import { generateUUID } from "@/lib/utils";
import { ResearchChatPane } from "./research/research-chat-pane";
import { ResearchSearchModal } from "./research/research-search-modal";
import { ResearchSidebar } from "./research/research-sidebar";

interface ResearchTabProps {
	projectId?: string;
}

const SIDEBAR_KEY = "research-sidebar-collapsed";

export function ResearchTab({ projectId }: ResearchTabProps) {
	const history = useResearchHistory(projectId);
	const [activeChatId, setActiveChatId] = useState<string | null>(null);
	const [showSearchModal, setShowSearchModal] = useState(false);
	const [sidebarCollapsed, setSidebarCollapsed] = useState(() => {
		if (typeof window === "undefined") return false;
		return localStorage.getItem(SIDEBAR_KEY) === "true";
	});

	// Persist sidebar collapse state
	useEffect(() => {
		localStorage.setItem(SIDEBAR_KEY, String(sidebarCollapsed));
	}, [sidebarCollapsed]);

	const handleNewChat = useCallback(() => {
		const id = generateUUID();
		setActiveChatId(id);
	}, []);

	const handleSelectChat = useCallback((id: string) => {
		setActiveChatId(id);
	}, []);

	const handleDeleteChat = useCallback(
		(id: string) => {
			history.deleteChat(id);
			if (activeChatId === id) {
				setActiveChatId(null);
			}
		},
		[history, activeChatId],
	);

	const handleTitleUpdate = useCallback(
		(_id: string, _title: string) => {
			history.refresh();
		},
		[history],
	);

	const handleToggleSidebar = useCallback(() => {
		setSidebarCollapsed((v) => !v);
	}, []);

	return (
		<div className="flex h-[calc(100vh-7rem)] overflow-hidden rounded-lg border bg-background">
			{/* Sidebar */}
			<ResearchSidebar
				chats={history.chats}
				loading={history.loading}
				activeChatId={activeChatId}
				sidebarCollapsed={sidebarCollapsed}
				onToggleSidebar={handleToggleSidebar}
				onSelectChat={handleSelectChat}
				onNewChat={handleNewChat}
				onDeleteChat={handleDeleteChat}
				onOpenSearch={() => setShowSearchModal(true)}
			/>

			{/* Chat area */}
			<div className="flex min-w-0 flex-1 flex-col">
				{activeChatId ? (
					<ResearchChatPane
						key={activeChatId}
						chatId={activeChatId}
						projectId={projectId}
						onTitleUpdate={handleTitleUpdate}
					/>
				) : (
					<div className="flex flex-1 flex-col items-center justify-center text-center p-6">
						<Search className="h-12 w-12 text-muted-foreground/30 mb-4" />
						<h3 className="text-sm font-medium">
							Start a new research conversation
						</h3>
						<p className="mt-1 max-w-sm text-xs text-muted-foreground">
							Click &quot;Start New Research&quot; to begin. Your
							conversations are saved and accessible from the
							sidebar.
						</p>
						<button
							type="button"
							onClick={handleNewChat}
							className="mt-4 inline-flex items-center gap-1.5 rounded-full bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
						>
							<Search className="h-4 w-4" />
							New Research
						</button>
					</div>
				)}
			</div>

			{/* Search modal */}
			<ResearchSearchModal
				isOpen={showSearchModal}
				onClose={() => setShowSearchModal(false)}
				chats={history.chats}
				activeChatId={activeChatId}
				onSelectChat={handleSelectChat}
				onNewChat={handleNewChat}
			/>
		</div>
	);
}
