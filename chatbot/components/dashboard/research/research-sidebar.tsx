"use client";

import { AnimatePresence, motion } from "framer-motion";
import {
  Clock,
  Loader2,
  PanelLeftClose,
  PanelLeftOpen,
  Plus,
  Search,
} from "lucide-react";
import type { ResearchChat } from "@/hooks/use-research-history";
import { ResearchConversationRow } from "./research-conversation-row";
import { ResearchSidebarSection } from "./research-sidebar-section";
import { useState } from "react";

interface ResearchSidebarProps {
  chats: ResearchChat[];
  loading: boolean;
  activeChatId: string | null;
  sidebarCollapsed: boolean;
  onToggleSidebar: () => void;
  onSelectChat: (id: string) => void;
  onNewChat: () => void;
  onDeleteChat: (id: string) => void;
  onOpenSearch: () => void;
}

const SPRING = { type: "spring" as const, stiffness: 260, damping: 28 };

export function ResearchSidebar({
  chats,
  loading,
  activeChatId,
  sidebarCollapsed,
  onToggleSidebar,
  onSelectChat,
  onNewChat,
  onDeleteChat,
  onOpenSearch,
}: ResearchSidebarProps) {
  const [recentCollapsed, setRecentCollapsed] = useState(false);

  // Collapsed state: icon-only rail
  if (sidebarCollapsed) {
    return (
      <motion.aside
        initial={{ width: 320 }}
        animate={{ width: 56 }}
        transition={SPRING}
        className="z-10 flex h-full shrink-0 flex-col border-r bg-background"
      >
        <div className="flex items-center justify-center border-b px-2 py-3">
          <button
            type="button"
            onClick={onToggleSidebar}
            className="rounded-lg p-2 hover:bg-muted transition-colors"
            aria-label="Open sidebar"
            title="Open sidebar"
          >
            <PanelLeftOpen className="h-5 w-5" />
          </button>
        </div>

        <div className="flex flex-1 flex-col items-center gap-2 pt-4">
          <button
            type="button"
            onClick={onNewChat}
            className="rounded-lg p-2.5 hover:bg-muted transition-colors"
            title="New Research"
          >
            <Plus className="h-5 w-5" />
          </button>
          <button
            type="button"
            onClick={onOpenSearch}
            className="rounded-lg p-2.5 hover:bg-muted transition-colors"
            title="Search chats"
          >
            <Search className="h-5 w-5" />
          </button>
        </div>
      </motion.aside>
    );
  }

  // Expanded state: full sidebar
  return (
    <motion.aside
      initial={{ width: 56 }}
      animate={{ width: 320 }}
      transition={SPRING}
      className="z-10 flex h-full shrink-0 flex-col border-r bg-background overflow-hidden"
    >
      {/* Header */}
      <div
        role="button"
        tabIndex={0}
        onClick={onToggleSidebar}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            onToggleSidebar();
          }
        }}
        className="flex cursor-pointer items-center gap-2 border-b px-3 py-3 hover:bg-muted/50 transition-colors"
        title="Collapse sidebar"
      >
        <div className="flex items-center gap-2">
          <div className="grid h-7 w-7 place-items-center rounded-lg bg-primary text-primary-foreground shadow-sm">
            <Search className="h-3.5 w-3.5" />
          </div>
          <span className="text-sm font-semibold tracking-tight">Research</span>
        </div>
        <div className="ml-auto">
          <PanelLeftClose className="h-5 w-5" />
        </div>
      </div>

      {/* Search trigger */}
      <div className="px-3 pt-3">
        <button
          type="button"
          onClick={onOpenSearch}
          className="flex w-full items-center gap-2 rounded-full border bg-background py-2 pl-3 pr-3 text-sm text-muted-foreground hover:bg-muted/50 transition-colors"
        >
          <Search className="h-4 w-4" />
          <span>Search...</span>
        </button>
      </div>

      {/* New chat button */}
      <div className="px-3 pt-3">
        <button
          type="button"
          onClick={onNewChat}
          className="flex w-full items-center justify-center gap-2 rounded-full bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow-sm transition-colors hover:bg-primary/90"
        >
          <Plus className="h-4 w-4" /> Start New Research
        </button>
      </div>

      {/* Chat list */}
      <nav className="mt-4 flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto px-2 pb-4">
        <ResearchSidebarSection
          icon={<Clock className="h-4 w-4" />}
          title="RECENT"
          collapsed={recentCollapsed}
          onToggle={() => setRecentCollapsed((v) => !v)}
        >
          {loading ? (
            <div className="flex items-center justify-center py-6">
              <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
            </div>
          ) : chats.length === 0 ? (
            <div className="select-none rounded-lg border border-dashed px-3 py-3 text-center text-xs text-muted-foreground">
              No conversations yet. Start a new one!
            </div>
          ) : (
            chats.map((chat) => (
              <ResearchConversationRow
                key={chat.id}
                data={chat}
                active={chat.id === activeChatId}
                onSelect={() => onSelectChat(chat.id)}
                onDelete={() => onDeleteChat(chat.id)}
              />
            ))
          )}
        </ResearchSidebarSection>
      </nav>
    </motion.aside>
  );
}
