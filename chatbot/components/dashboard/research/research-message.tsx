"use client";

import type { UIMessage } from "ai";
import { Bot, ExternalLink, Search, User } from "lucide-react";

interface ResearchMessageProps {
  message: UIMessage;
  isStreaming: boolean;
}

export function ResearchMessage({ message, isStreaming }: ResearchMessageProps) {
  const isUser = message.role === "user";

  return (
    <div
      className={`flex gap-3 ${isUser ? "justify-end" : "justify-start"}`}
    >
      {!isUser && (
        <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary/10">
          <Bot className="h-4 w-4 text-primary" />
        </div>
      )}

      <div
        className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 text-sm ${
          isUser
            ? "bg-primary text-primary-foreground"
            : "bg-muted text-foreground"
        }`}
      >
        {message.parts?.map((part, i) => {
          if (part.type === "text") {
            return (
              <div
                key={`text-${i}`}
                className={`whitespace-pre-wrap prose prose-sm max-w-none [&_a]:underline ${
                  isUser
                    ? "prose-invert [&_a]:text-primary-foreground/80"
                    : "dark:prose-invert [&_a]:text-blue-500"
                }`}
                dangerouslySetInnerHTML={{
                  __html: simpleMarkdown(part.text),
                }}
              />
            );
          }

          if (part.type.startsWith("tool-")) {
            const toolPart = part as {
              type: string;
              state: string;
              toolName?: string;
              input?: { query?: string; url?: string };
            };
            const isFetchUrl = toolPart.toolName === "fetchUrl" || toolPart.input?.url;
            const Icon = isFetchUrl ? ExternalLink : Search;
            const label = isFetchUrl
              ? toolPart.state === "result"
                ? `Fetched: ${toolPart.input?.url || "URL"}`
                : `Fetching: ${toolPart.input?.url || "..."}`
              : toolPart.state === "result"
                ? `Searched: ${toolPart.input?.query || "web"}`
                : `Searching: ${toolPart.input?.query || "..."}`;
            return (
              <div
                key={`tool-${i}`}
                className="flex items-center gap-1.5 text-xs text-muted-foreground py-1"
              >
                <Icon
                  className={`h-3 w-3 shrink-0 ${toolPart.state !== "result" ? "animate-pulse" : ""}`}
                />
                <span className="truncate max-w-[400px]">{label}</span>
              </div>
            );
          }

          return null;
        })}
      </div>

      {isUser && (
        <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-muted">
          <User className="h-4 w-4" />
        </div>
      )}
    </div>
  );
}

function simpleMarkdown(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(
      /\[([^\]]+)\]\((https?:\/\/[^)]+)\)/g,
      '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>',
    )
    .replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>")
    .replace(/(?<!\*)\*([^*]+)\*(?!\*)/g, "<em>$1</em>")
    .replace(
      /`([^`]+)`/g,
      '<code class="bg-muted px-1 rounded text-xs">$1</code>',
    )
    .replace(/^### (.+)$/gm, '<h4 class="font-semibold mt-2">$1</h4>')
    .replace(
      /^## (.+)$/gm,
      '<h3 class="font-semibold text-base mt-3">$1</h3>',
    )
    .replace(/^# (.+)$/gm, '<h2 class="font-bold text-lg mt-3">$1</h2>')
    .replace(/\n/g, "<br />");
}
