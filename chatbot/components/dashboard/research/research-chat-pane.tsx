"use client";

import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import { AlertCircle, Bot, KeyRound, Search } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { generateUUID } from "@/lib/utils";
import {
  DEFAULT_RESEARCH_MODEL,
  DEFAULT_RESEARCH_PROVIDER,
} from "@/lib/ai/research-models";
import { ResearchComposer } from "./research-composer";
import { ResearchMessage } from "./research-message";

interface ResearchChatPaneProps {
  chatId: string;
  projectId?: string;
  onTitleUpdate?: (id: string, title: string) => void;
}

export function ResearchChatPane({
  chatId,
  projectId,
  onTitleUpdate,
}: ResearchChatPaneProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const hasNotifiedTitle = useRef(false);
  const [input, setInput] = useState("");
  const [urls, setUrls] = useState<string[]>([]);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [loadingHistory, setLoadingHistory] = useState(true);
  const [selectedProvider, setSelectedProvider] = useState(DEFAULT_RESEARCH_PROVIDER);
  const [selectedModel, setSelectedModel] = useState(DEFAULT_RESEARCH_MODEL);

  // Refs so the transport closure always reads the latest values
  const selectedProviderRef = useRef(selectedProvider);
  const selectedModelRef = useRef(selectedModel);
  useEffect(() => { selectedProviderRef.current = selectedProvider; }, [selectedProvider]);
  useEffect(() => { selectedModelRef.current = selectedModel; }, [selectedModel]);

  const transport = useMemo(
    () =>
      new DefaultChatTransport({
        api: "/api/research/chat",
        prepareSendMessagesRequest(request) {
          return {
            body: {
              id: chatId,
              projectId,
              modelId: selectedModelRef.current,
              providerId: selectedProviderRef.current,
              message: request.messages.at(-1),
            },
          };
        },
      }),
    [chatId, projectId],
  );

  const { messages, setMessages, sendMessage, status, stop } = useChat({
    id: chatId,
    generateId: generateUUID,
    experimental_throttle: 100,
    transport,
    onError: (err) => {
      let msg = err.message || "An error occurred";
      try {
        const parsed = JSON.parse(msg);
        msg = parsed.error || parsed.cause || parsed.message || msg;
      } catch {
        // not JSON, use as-is
      }
      if (msg.includes("OpenRouter") || msg.includes("API key")) {
        setErrorMessage(
          "OpenRouter API key not configured. Add it in Settings > API Keys.",
        );
      } else if (
        msg.includes("unauthorized") ||
        msg.includes("Unauthorized")
      ) {
        setErrorMessage("Session expired. Please refresh the page.");
      } else {
        setErrorMessage(msg);
      }
    },
  });

  // Load existing messages when opening a past conversation
  useEffect(() => {
    let cancelled = false;
    async function loadMessages() {
      try {
        const res = await fetch(`/api/research/chat?id=${chatId}`);
        if (!res.ok) return;
        const data = await res.json();
        if (!cancelled && Array.isArray(data) && data.length > 0) {
          setMessages(data);
        }
      } catch {
        // Silently fail — user can still start a new conversation
      } finally {
        if (!cancelled) setLoadingHistory(false);
      }
    }
    loadMessages();
    return () => { cancelled = true; };
  }, [chatId, setMessages]);

  const isStreaming = status === "streaming" || status === "submitted";

  // Auto-scroll on new messages
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  // Clear error when user starts typing
  useEffect(() => {
    if (input.trim()) {
      setErrorMessage(null);
    }
  }, [input]);

  // Notify parent of title after we get the first assistant response
  useEffect(() => {
    if (!hasNotifiedTitle.current && messages.length >= 2 && onTitleUpdate) {
      const firstUser = messages.find((m) => m.role === "user");
      const hasAssistant = messages.some((m) => m.role === "assistant");
      if (firstUser && hasAssistant) {
        const textPart = firstUser.parts?.find((p) => p.type === "text");
        if (textPart && "text" in textPart) {
          onTitleUpdate(chatId, textPart.text.slice(0, 80));
          hasNotifiedTitle.current = true;
        }
      }
    }
  }, [messages, chatId, onTitleUpdate]);

  // Refresh history when streaming completes
  const prevStatus = useRef(status);
  useEffect(() => {
    if (
      prevStatus.current === "streaming" &&
      status === "ready" &&
      onTitleUpdate
    ) {
      const firstUser = messages.find((m) => m.role === "user");
      if (firstUser) {
        const textPart = firstUser.parts?.find((p) => p.type === "text");
        if (textPart && "text" in textPart) {
          onTitleUpdate(chatId, textPart.text.slice(0, 80));
        }
      }
    }
    prevStatus.current = status;
  }, [status, messages, chatId, onTitleUpdate]);

  const handleAddUrl = useCallback((url: string) => {
    setUrls((prev) => [...prev, url]);
  }, []);

  const handleRemoveUrl = useCallback((index: number) => {
    setUrls((prev) => prev.filter((_, i) => i !== index));
  }, []);

  const handleSubmit = useCallback(() => {
    const text = input.trim();
    if (!text && urls.length === 0) return;
    if (isStreaming) return;
    setErrorMessage(null);

    let messageText = text;
    if (urls.length > 0) {
      const urlContext = urls
        .map((u) => `[Reference URL: ${u}]`)
        .join("\n");
      messageText = urls.length > 0 && text
        ? `${urlContext}\n\n${text}`
        : urlContext + (text ? `\n\n${text}` : "\n\nPlease analyze and summarize the content from the above URL(s).");
    }

    sendMessage({
      role: "user",
      parts: [{ type: "text", text: messageText }],
    });
    setInput("");
    setUrls([]);
  }, [input, urls, isStreaming, sendMessage]);

  return (
    <div className="flex h-full flex-col">
      {/* Messages area */}
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto px-4 py-6 space-y-4"
      >
        {loadingHistory && messages.length === 0 && (
          <div className="flex h-full items-center justify-center">
            <div className="flex items-center gap-2 text-muted-foreground">
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
              <span className="text-sm">Loading conversation...</span>
            </div>
          </div>
        )}

        {!loadingHistory && messages.length === 0 && !errorMessage && (
          <div className="flex h-full flex-col items-center justify-center text-center">
            <Search className="h-10 w-10 text-muted-foreground/40 mb-3" />
            <h3 className="text-sm font-medium text-muted-foreground">
              Research Assistant
            </h3>
            <p className="mt-1 max-w-xs text-xs text-muted-foreground/70">
              Ask any question. I&apos;ll search the web and academic papers to
              give you well-sourced answers.
            </p>
            <p className="mt-2 max-w-xs text-xs text-muted-foreground/50">
              Use the link button to add URLs for papers or articles you want analyzed.
            </p>
          </div>
        )}

        {messages.map((message) => (
          <ResearchMessage
            key={message.id}
            message={message}
            isStreaming={isStreaming}
          />
        ))}

        {/* Thinking indicator */}
        {isStreaming && messages.at(-1)?.role === "user" && (
          <div className="flex gap-3">
            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary/10">
              <Bot className="h-4 w-4 text-primary" />
            </div>
            <div className="rounded-2xl bg-muted px-4 py-3">
              <div className="flex items-center gap-1.5">
                <div className="h-2 w-2 animate-bounce rounded-full bg-muted-foreground/40 [animation-delay:-0.3s]" />
                <div className="h-2 w-2 animate-bounce rounded-full bg-muted-foreground/40 [animation-delay:-0.15s]" />
                <div className="h-2 w-2 animate-bounce rounded-full bg-muted-foreground/40" />
              </div>
            </div>
          </div>
        )}

        {/* Error display */}
        {errorMessage && (
          <div className="mx-auto max-w-lg rounded-lg border border-destructive/30 bg-destructive/5 p-4">
            <div className="flex items-start gap-3">
              {errorMessage.includes("API key") ? (
                <KeyRound className="mt-0.5 h-5 w-5 shrink-0 text-destructive" />
              ) : (
                <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-destructive" />
              )}
              <div>
                <p className="text-sm font-medium text-destructive">
                  {errorMessage.includes("API key")
                    ? "API Key Required"
                    : "Something went wrong"}
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {errorMessage}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Composer */}
      <ResearchComposer
        value={input}
        onChange={setInput}
        onSend={handleSubmit}
        onStop={stop}
        isStreaming={isStreaming}
        urls={urls}
        onAddUrl={handleAddUrl}
        onRemoveUrl={handleRemoveUrl}
        selectedProvider={selectedProvider}
        onProviderChange={setSelectedProvider}
        selectedModel={selectedModel}
        onModelChange={setSelectedModel}
      />
    </div>
  );
}
