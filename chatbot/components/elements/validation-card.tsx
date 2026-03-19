"use client";

import { useState } from "react";
import { useChatActions } from "@/components/chat-actions-context";
import {
  CheckIcon,
  XIcon,
  PencilIcon,
  SparklesIcon,
  CalendarIcon,
  TagIcon,
  FolderIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { PendingArticle } from "@/lib/ai/tools/get-pending-validations";

const BACKEND_URL =
  typeof window !== "undefined"
    ? process.env.NEXT_PUBLIC_BACKEND_URL ?? "http://localhost:8000"
    : "";

type ValidationStatus = "pending" | "approved" | "rejected";

function ArticleCard({
  article,
  onApprove,
  onReject,
}: {
  article: PendingArticle;
  onApprove: () => void;
  onReject: () => void;
}) {
  const [status, setStatus] = useState<ValidationStatus>("pending");
  const [loading, setLoading] = useState(false);
  const { sendMessage } = useChatActions();

  const handleApprove = async () => {
    setLoading(true);
    try {
      await fetch(`${BACKEND_URL}/api/content/${article.id}/approve`, {
        method: "POST",
      });
      setStatus("approved");
      onApprove();
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  };

  const handleReject = async () => {
    setLoading(true);
    try {
      await fetch(`${BACKEND_URL}/api/content/${article.id}/reject`, {
        method: "POST",
      });
      setStatus("rejected");
      onReject();
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className={cn(
        "rounded-xl border bg-card p-4 transition-all",
        status === "approved" && "border-green-500/50 bg-green-500/5",
        status === "rejected" && "border-red-500/30 bg-red-500/5 opacity-60",
      )}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p className="truncate font-medium text-sm">{article.title}</p>
          <div className="mt-1 flex flex-wrap items-center gap-2 text-muted-foreground text-xs">
            <span className="flex items-center gap-1">
              <FolderIcon className="size-3" />
              {article.cluster}
            </span>
            {article.scheduled_pub_date && (
              <span className="flex items-center gap-1">
                <CalendarIcon className="size-3" />
                {article.scheduled_pub_date}
              </span>
            )}
            {article.project_name && (
              <Badge variant="secondary" className="text-xs px-1.5 py-0">
                {article.project_name}
              </Badge>
            )}
          </div>
        </div>

        {/* Status badge */}
        {status === "approved" && (
          <Badge className="bg-green-500/20 text-green-600 border-green-500/30">
            ✓ Validé
          </Badge>
        )}
        {status === "rejected" && (
          <Badge variant="destructive" className="opacity-70">
            Rejeté
          </Badge>
        )}
      </div>

      {/* Tags */}
      {article.tags.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-1">
          {article.tags.slice(0, 4).map((tag) => (
            <span
              key={tag}
              className="inline-flex items-center gap-0.5 rounded-md bg-secondary px-1.5 py-0.5 text-muted-foreground text-xs"
            >
              <TagIcon className="size-2.5" />
              {tag}
            </span>
          ))}
        </div>
      )}

      {/* Preview */}
      {article.preview && (
        <p className="mt-2 line-clamp-2 text-muted-foreground text-xs leading-relaxed">
          {article.preview}
        </p>
      )}

      {/* Actions */}
      {status === "pending" && (
        <div className="mt-3 flex items-center gap-2">
          <Button
            size="sm"
            variant="outline"
            className="h-7 gap-1.5 border-green-500/50 text-green-600 hover:bg-green-500/10 text-xs"
            onClick={handleApprove}
            disabled={loading}
          >
            <CheckIcon className="size-3" />
            Valider
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="h-7 gap-1.5 text-xs"
            onClick={() =>
              sendMessage?.({
                role: "user",
                parts: [{ type: "text", text: `Ouvre l'article pour édition — id: ${article.id}, titre: "${article.title}"` }],
              })
            }
            disabled={loading}
          >
            <PencilIcon className="size-3" />
            Éditer
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="h-7 gap-1.5 text-xs"
            onClick={() =>
              sendMessage?.({
                role: "user",
                parts: [{ type: "text", text: `Améliore le texte de cet article et propose une version optimisée — id: ${article.id}, titre: "${article.title}"` }],
              })
            }
            disabled={loading}
          >
            <SparklesIcon className="size-3" />
            IA
          </Button>
          <Button
            size="sm"
            variant="ghost"
            className="ml-auto h-7 gap-1.5 text-muted-foreground text-xs hover:text-red-500"
            onClick={handleReject}
            disabled={loading}
          >
            <XIcon className="size-3" />
            Rejeter
          </Button>
        </div>
      )}
    </div>
  );
}

type Props = {
  articles: PendingArticle[];
};

export function ValidationTaskList({ articles }: Props) {
  const [approved, setApproved] = useState(0);

  if (!articles || articles.length === 0) {
    return (
      <div className="rounded-xl border bg-card px-4 py-6 text-center text-muted-foreground text-sm">
        ✅ Aucun article à valider pour l&apos;instant.
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between px-0.5">
        <p className="font-medium text-sm">
          📋 {articles.length} article{articles.length > 1 ? "s" : ""} à valider
        </p>
        {approved > 0 && (
          <span className="text-muted-foreground text-xs">
            {approved}/{articles.length} validés
          </span>
        )}
      </div>
      {articles.map((article) => (
        <ArticleCard
          key={article.id}
          article={article}
          onApprove={() => setApproved((n) => n + 1)}
          onReject={() => {}}
        />
      ))}
    </div>
  );
}
