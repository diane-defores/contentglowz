"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Clock, Plus, Search, X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import type { ResearchChat } from "@/hooks/use-research-history";
import { getTimeGroup } from "./research-utils";

interface ResearchSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  chats: ResearchChat[];
  activeChatId: string | null;
  onSelectChat: (id: string) => void;
  onNewChat: () => void;
}

export function ResearchSearchModal({
  isOpen,
  onClose,
  chats,
  activeChatId,
  onSelectChat,
  onNewChat,
}: ResearchSearchModalProps) {
  const [query, setQuery] = useState("");

  const filteredChats = useMemo(() => {
    if (!query.trim()) return chats;
    const q = query.toLowerCase();
    return chats.filter((c) => c.title.toLowerCase().includes(q));
  }, [chats, query]);

  const groupedChats = useMemo(() => {
    const groups: Record<string, ResearchChat[]> = {
      Today: [],
      Yesterday: [],
      "Previous 7 Days": [],
      Older: [],
    };

    [...filteredChats]
      .sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      )
      .forEach((chat) => {
        const group = getTimeGroup(chat.createdAt);
        groups[group].push(chat);
      });

    return groups;
  }, [filteredChats]);

  const handleClose = () => {
    setQuery("");
    onClose();
  };

  const handleSelect = (id: string) => {
    onSelectChat(id);
    handleClose();
  };

  const handleNewChat = () => {
    onNewChat();
    handleClose();
  };

  // Escape to close
  useEffect(() => {
    if (!isOpen) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") handleClose();
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [isOpen]);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/60"
            onClick={handleClose}
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -20 }}
            className="fixed left-1/2 top-[20%] z-50 w-full max-w-2xl -translate-x-1/2 rounded-2xl border bg-background shadow-2xl"
          >
            {/* Search header */}
            <div className="flex items-center gap-3 border-b p-4">
              <Search className="h-5 w-5 text-muted-foreground" />
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search research chats..."
                className="flex-1 bg-transparent text-lg outline-none placeholder:text-muted-foreground"
                autoFocus
              />
              <button
                type="button"
                onClick={handleClose}
                className="rounded-lg p-1.5 hover:bg-muted"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Results */}
            <div className="max-h-[60vh] overflow-y-auto">
              {/* New chat option */}
              <div className="border-b p-2">
                <button
                  type="button"
                  onClick={handleNewChat}
                  className="flex w-full items-center gap-3 rounded-lg p-3 text-left hover:bg-muted"
                >
                  <Plus className="h-5 w-5 text-muted-foreground" />
                  <span className="font-medium">New Research</span>
                </button>
              </div>

              {/* Grouped conversations */}
              {Object.entries(groupedChats).map(([groupName, groupChats]) => {
                if (groupChats.length === 0) return null;
                return (
                  <div
                    key={groupName}
                    className="border-b p-2 last:border-b-0"
                  >
                    <div className="px-3 py-2 text-xs font-medium text-muted-foreground">
                      {groupName}
                    </div>
                    <div className="space-y-1">
                      {groupChats.map((chat) => (
                        <button
                          key={chat.id}
                          type="button"
                          onClick={() => handleSelect(chat.id)}
                          className={`flex w-full items-center gap-3 rounded-lg p-3 text-left hover:bg-muted ${
                            chat.id === activeChatId ? "bg-muted" : ""
                          }`}
                        >
                          <Clock className="h-4 w-4 shrink-0 text-muted-foreground" />
                          <span className="min-w-0 flex-1 truncate font-medium">
                            {chat.title}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>
                );
              })}

              {/* Empty state */}
              {filteredChats.length === 0 && query.trim() && (
                <div className="p-8 text-center">
                  <Search className="mx-auto h-12 w-12 text-muted-foreground/30" />
                  <div className="mt-4 text-lg font-medium">
                    No chats found
                  </div>
                  <div className="mt-2 text-sm text-muted-foreground">
                    Try searching with different keywords
                  </div>
                </div>
              )}

              {!query.trim() && chats.length === 0 && (
                <div className="p-8 text-center">
                  <div className="text-lg font-medium">
                    No conversations yet
                  </div>
                  <div className="mt-2 text-sm text-muted-foreground">
                    Start a new research to begin
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
