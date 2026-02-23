"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Bot, Check, ChevronDown, Link2, Search, Send, Square, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  researchModels,
  researchProviders,
  type ResearchModel,
  type ResearchProvider,
} from "@/lib/ai/research-models";

interface ResearchComposerProps {
  value: string;
  onChange: (value: string) => void;
  onSend: () => void;
  onStop?: () => void;
  isStreaming: boolean;
  urls: string[];
  onAddUrl: (url: string) => void;
  onRemoveUrl: (index: number) => void;
  selectedProvider: string;
  onProviderChange: (id: string) => void;
  selectedModel: string;
  onModelChange: (id: string) => void;
}

export function ResearchComposer({
  value,
  onChange,
  onSend,
  onStop,
  isStreaming,
  urls,
  onAddUrl,
  onRemoveUrl,
  selectedProvider,
  onProviderChange,
  selectedModel,
  onModelChange,
}: ResearchComposerProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const urlInputRef = useRef<HTMLInputElement>(null);
  const [showUrlInput, setShowUrlInput] = useState(false);
  const [urlDraft, setUrlDraft] = useState("");

  const currentProvider = researchProviders.find((p) => p.id === selectedProvider) || researchProviders[0];
  const currentModel = researchModels.find((m) => m.id === selectedModel) || researchModels[0];

  useEffect(() => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const lineHeight = 24;
    const minHeight = 24;

    textarea.style.height = "auto";
    const scrollHeight = textarea.scrollHeight;
    const calculatedLines = Math.max(1, Math.ceil(scrollHeight / lineHeight));

    if (calculatedLines <= 12) {
      textarea.style.height = `${Math.max(minHeight, scrollHeight)}px`;
      textarea.style.overflowY = "hidden";
    } else {
      textarea.style.height = `${12 * lineHeight}px`;
      textarea.style.overflowY = "auto";
    }
  }, [value]);

  useEffect(() => {
    if (showUrlInput) {
      urlInputRef.current?.focus();
    }
  }, [showUrlInput]);

  const hasContent = value.trim().length > 0 || urls.length > 0;

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (hasContent && !isStreaming) {
        onSend();
      }
    }
  };

  const handleAddUrl = () => {
    const trimmed = urlDraft.trim();
    if (!trimmed) return;
    try {
      new URL(trimmed);
      onAddUrl(trimmed);
      setUrlDraft("");
      setShowUrlInput(false);
    } catch {
      // invalid URL - try adding https
      try {
        new URL(`https://${trimmed}`);
        onAddUrl(`https://${trimmed}`);
        setUrlDraft("");
        setShowUrlInput(false);
      } catch {
        // still invalid, ignore
      }
    }
  };

  const handleUrlKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleAddUrl();
    }
    if (e.key === "Escape") {
      setShowUrlInput(false);
      setUrlDraft("");
    }
  };

  return (
    <div className="border-t p-4">
      <div className="mx-auto flex max-w-3xl flex-col rounded-2xl border bg-background shadow-sm transition-all">
        {/* URL chips */}
        <AnimatePresence>
          {urls.length > 0 && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden"
            >
              <div className="flex flex-wrap gap-1.5 px-4 pt-3">
                {urls.map((url, i) => (
                  <span
                    key={`${url}-${i}`}
                    className="inline-flex items-center gap-1 rounded-full bg-muted px-2.5 py-1 text-xs"
                  >
                    <Link2 className="h-3 w-3 text-muted-foreground" />
                    <span className="max-w-[200px] truncate">{url}</span>
                    <button
                      type="button"
                      onClick={() => onRemoveUrl(i)}
                      className="rounded-full p-0.5 hover:bg-background transition-colors"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* URL input row */}
        <AnimatePresence>
          {showUrlInput && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden"
            >
              <div className="flex items-center gap-2 px-4 pt-3">
                <Link2 className="h-4 w-4 shrink-0 text-muted-foreground" />
                <input
                  ref={urlInputRef}
                  type="url"
                  value={urlDraft}
                  onChange={(e) => setUrlDraft(e.target.value)}
                  onKeyDown={handleUrlKeyDown}
                  placeholder="Paste a URL (article, paper, webpage)..."
                  className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
                />
                <button
                  type="button"
                  onClick={() => {
                    setShowUrlInput(false);
                    setUrlDraft("");
                  }}
                  className="rounded-full p-1 hover:bg-muted transition-colors text-muted-foreground"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Textarea */}
        <div className="flex-1 px-4 pt-3 pb-2">
          <textarea
            ref={textareaRef}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask a research question..."
            rows={1}
            className="w-full resize-none bg-transparent text-sm outline-none placeholder:text-muted-foreground min-h-[24px] leading-6"
          />
        </div>

        {/* Bottom toolbar */}
        <div className="flex items-center justify-between px-3 pb-3">
          <div className="flex items-center gap-1">
            {/* Link button */}
            <button
              type="button"
              onClick={() => setShowUrlInput((v) => !v)}
              className={`inline-flex shrink-0 items-center justify-center rounded-full p-2 transition-colors ${
                showUrlInput || urls.length > 0
                  ? "text-primary bg-primary/10"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              }`}
              title="Add URL for context"
            >
              <Link2 className="h-4.5 w-4.5" />
            </button>

            {/* Provider selector */}
            <ProviderDropdown
              providers={researchProviders}
              current={currentProvider}
              onSelect={onProviderChange}
            />

            {/* Model selector */}
            <ModelDropdown
              models={researchModels}
              current={currentModel}
              onSelect={onModelChange}
            />
          </div>

          <div className="flex items-center gap-1">
            {isStreaming ? (
              <button
                type="button"
                onClick={onStop}
                className="inline-flex shrink-0 items-center justify-center rounded-full p-2.5 bg-destructive text-destructive-foreground transition-colors hover:bg-destructive/90"
                title="Stop generating"
              >
                <Square className="h-4 w-4" />
              </button>
            ) : (
              <button
                type="button"
                onClick={onSend}
                disabled={!hasContent}
                className={`inline-flex shrink-0 items-center justify-center rounded-full p-2.5 transition-colors ${
                  hasContent
                    ? "bg-primary text-primary-foreground hover:bg-primary/90"
                    : "bg-muted text-muted-foreground cursor-not-allowed"
                }`}
                title="Send message"
              >
                <Send className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="mx-auto mt-2 max-w-3xl px-1 text-center text-[11px] text-muted-foreground">
        AI can make mistakes. Check important info.
      </div>
    </div>
  );
}

function ProviderDropdown({
  providers,
  current,
  onSelect,
}: {
  providers: ResearchProvider[];
  current: ResearchProvider;
  onSelect: (id: string) => void;
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          className="inline-flex items-center gap-1 rounded-full px-2.5 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          title="Search provider"
        >
          <Search className="h-3.5 w-3.5" />
          <span>{current.name}</span>
          <ChevronDown className="h-3 w-3" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="min-w-[220px]">
        {providers.map((provider) => (
          <DropdownMenuItem
            key={provider.id}
            onSelect={() => onSelect(provider.id)}
            className="flex items-center justify-between gap-3"
          >
            <div className="flex flex-col gap-0.5">
              <span className="text-sm font-medium">{provider.name}</span>
              <span className="text-xs text-muted-foreground">
                {provider.description}
              </span>
            </div>
            {provider.id === current.id && (
              <Check className="h-4 w-4 shrink-0 text-primary" />
            )}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function ModelDropdown({
  models,
  current,
  onSelect,
}: {
  models: ResearchModel[];
  current: ResearchModel;
  onSelect: (id: string) => void;
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          className="inline-flex items-center gap-1 rounded-full px-2.5 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          title="AI model"
        >
          <Bot className="h-3.5 w-3.5" />
          <span>{current.name}</span>
          <ChevronDown className="h-3 w-3" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="min-w-[250px]">
        {models.map((model) => (
          <DropdownMenuItem
            key={model.id}
            onSelect={() => onSelect(model.id)}
            className="flex items-center justify-between gap-3"
          >
            <div className="flex flex-col gap-0.5">
              <span className="text-sm font-medium">{model.name}</span>
              <span className="text-xs text-muted-foreground">
                {model.description}
              </span>
            </div>
            {model.id === current.id && (
              <Check className="h-4 w-4 shrink-0 text-primary" />
            )}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
