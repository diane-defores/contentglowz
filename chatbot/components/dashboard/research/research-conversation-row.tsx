"use client";

import { Trash2 } from "lucide-react";
import type { ResearchChat } from "@/hooks/use-research-history";
import { timeAgo } from "./research-utils";

interface ResearchConversationRowProps {
  data: ResearchChat;
  active: boolean;
  onSelect: () => void;
  onDelete: () => void;
}

export function ResearchConversationRow({
  data,
  active,
  onSelect,
  onDelete,
}: ResearchConversationRowProps) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={`group flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-left transition-colors ${
        active
          ? "bg-muted text-foreground"
          : "hover:bg-muted/50 text-foreground/80"
      }`}
      title={data.title}
    >
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className="truncate text-sm font-medium">{data.title}</span>
          <span className="shrink-0 text-[11px] text-muted-foreground">
            {timeAgo(data.createdAt)}
          </span>
        </div>
      </div>

      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          onDelete();
        }}
        className="rounded-md p-1 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100 hover:bg-destructive/10 hover:text-destructive"
        aria-label="Delete chat"
      >
        <Trash2 className="h-3.5 w-3.5" />
      </button>
    </button>
  );
}
