"use client";

import {
  CalendarIcon,
  CheckIcon,
  ClipboardListIcon,
  FolderIcon,
  XIcon,
  RefreshCwIcon,
} from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL ?? "http://localhost:8000";

type Article = {
  id: string;
  title: string;
  cluster: string;
  project_name: string;
  scheduled_pub_date: string | null;
  tags: string[];
};

type Status = "pending" | "approved" | "rejected";

function ArticleRow({
  article,
  onApprove,
  onReject,
}: {
  article: Article;
  onApprove: () => void;
  onReject: () => void;
}) {
  const [status, setStatus] = useState<Status>("pending");
  const [busy, setBusy] = useState(false);

  const act = async (action: "approve" | "reject") => {
    setBusy(true);
    try {
      await fetch(`${BACKEND_URL}/api/content/${article.id}/${action}`, {
        method: "POST",
      });
      setStatus(action === "approve" ? "approved" : "rejected");
      action === "approve" ? onApprove() : onReject();
    } finally {
      setBusy(false);
    }
  };

  return (
    <div
      className={cn(
        "rounded-lg border p-3 transition-all",
        status === "approved" && "border-green-500/40 bg-green-500/5 opacity-70",
        status === "rejected" && "opacity-40",
      )}
    >
      <p className="truncate text-sm font-medium leading-snug">{article.title}</p>

      <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
        {article.cluster && (
          <span className="flex items-center gap-0.5">
            <FolderIcon className="size-3" />
            {article.cluster}
          </span>
        )}
        {article.scheduled_pub_date && (
          <span className="flex items-center gap-0.5">
            <CalendarIcon className="size-3" />
            {article.scheduled_pub_date}
          </span>
        )}
        {article.project_name && (
          <Badge variant="secondary" className="px-1 py-0 text-xs">
            {article.project_name}
          </Badge>
        )}
      </div>

      {status === "pending" && (
        <div className="mt-2 flex gap-1.5">
          <Button
            size="sm"
            variant="outline"
            className="h-6 flex-1 gap-1 border-green-500/50 text-green-600 hover:bg-green-500/10 text-xs"
            disabled={busy}
            onClick={() => act("approve")}
          >
            <CheckIcon className="size-3" />
            Valider
          </Button>
          <Button
            size="sm"
            variant="ghost"
            className="h-6 px-2 text-muted-foreground hover:text-red-500 text-xs"
            disabled={busy}
            onClick={() => act("reject")}
          >
            <XIcon className="size-3" />
          </Button>
        </div>
      )}

      {status === "approved" && (
        <p className="mt-1.5 text-xs text-green-600">✓ Validé</p>
      )}
    </div>
  );
}

export function DailyTasksWidget({
  projectId,
  daysAhead = 7,
}: {
  projectId?: string;
  daysAhead?: number;
}) {
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [approved, setApproved] = useState(0);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ days_ahead: String(daysAhead) });
      if (projectId) params.set("project_id", projectId);
      const res = await fetch(
        `${BACKEND_URL}/api/content/pending-validations?${params}`,
      );
      if (!res.ok) return;
      const data = await res.json();
      setArticles(data.articles ?? []);
    } finally {
      setLoading(false);
    }
  }, [projectId, daysAhead]);

  useEffect(() => {
    load();
  }, [load]);

  const pending = articles.length - approved;

  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="flex items-center gap-2 font-semibold text-sm">
          <ClipboardListIcon className="size-4 text-blue-500" />
          À valider
          {pending > 0 && (
            <Badge className="bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 px-1.5 py-0 text-xs">
              {pending}
            </Badge>
          )}
        </h3>
        <Button
          variant="ghost"
          size="sm"
          className="h-6 w-6 p-0 text-muted-foreground"
          onClick={load}
        >
          <RefreshCwIcon className={cn("size-3", loading && "animate-spin")} />
        </Button>
      </div>

      {/* Content */}
      {loading && (
        <div className="space-y-2">
          {[1, 2].map((i) => (
            <div key={i} className="h-16 animate-pulse rounded-lg bg-muted" />
          ))}
        </div>
      )}

      {!loading && articles.length === 0 && (
        <p className="rounded-lg border border-dashed py-4 text-center text-xs text-muted-foreground">
          ✅ Aucune tâche en attente
        </p>
      )}

      {!loading && articles.length > 0 && (
        <div className="space-y-2">
          {articles.slice(0, 5).map((article) => (
            <ArticleRow
              key={article.id}
              article={article}
              onApprove={() => setApproved((n) => n + 1)}
              onReject={() => {}}
            />
          ))}
          {articles.length > 5 && (
            <p className="text-center text-xs text-muted-foreground">
              +{articles.length - 5} autres articles
            </p>
          )}
        </div>
      )}
    </div>
  );
}
