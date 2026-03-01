"use client";

import { useMemo, useState } from "react";
import { formatDistanceToNow, format } from "date-fns";
import {
	ArrowUpDown,
	ArrowUp,
	ArrowDown,
	MoreHorizontal,
	CheckCircle2,
	XCircle,
	Calendar,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { ContentItem } from "@/hooks/use-content-review";
import { TYPE_LABELS } from "@/hooks/use-pipeline";
import { ContentStatusBadge } from "./content-status-badge";

// ─── Types ──────────────────────────────────────────

type SortField =
	| "title"
	| "contentType"
	| "status"
	| "sourceRobot"
	| "priority"
	| "createdAt"
	| "scheduledFor";
type SortDir = "asc" | "desc";

interface PipelineTableViewProps {
	items: ContentItem[];
	onApprove: (id: string, note?: string) => Promise<void>;
	onReject: (id: string, note: string) => Promise<void>;
	onRefresh: () => void;
}

// ─── Sort helpers ───────────────────────────────────

function compare(a: string | number | null, b: string | number | null): number {
	if (a == null && b == null) return 0;
	if (a == null) return 1;
	if (b == null) return -1;
	if (typeof a === "string" && typeof b === "string")
		return a.localeCompare(b);
	return (a as number) - (b as number);
}

// ─── Component ──────────────────────────────────────

export function PipelineTableView({
	items,
	onApprove,
	onReject,
	onRefresh,
}: PipelineTableViewProps) {
	const [sortField, setSortField] = useState<SortField>("createdAt");
	const [sortDir, setSortDir] = useState<SortDir>("desc");

	const toggleSort = (field: SortField) => {
		if (sortField === field) {
			setSortDir((d) => (d === "asc" ? "desc" : "asc"));
		} else {
			setSortField(field);
			setSortDir("asc");
		}
	};

	const sorted = useMemo(() => {
		const copy = [...items];
		copy.sort((a, b) => {
			let result: number;
			switch (sortField) {
				case "title":
					result = compare(a.title, b.title);
					break;
				case "contentType":
					result = compare(a.contentType, b.contentType);
					break;
				case "status":
					result = compare(a.status, b.status);
					break;
				case "sourceRobot":
					result = compare(a.sourceRobot, b.sourceRobot);
					break;
				case "priority":
					result = compare(a.priority, b.priority);
					break;
				case "createdAt":
					result = compare(a.createdAt, b.createdAt);
					break;
				case "scheduledFor":
					result = compare(a.scheduledFor, b.scheduledFor);
					break;
				default:
					result = 0;
			}
			return sortDir === "desc" ? -result : result;
		});
		return copy;
	}, [items, sortField, sortDir]);

	const SortIcon = ({ field }: { field: SortField }) => {
		if (sortField !== field)
			return <ArrowUpDown className="h-3 w-3 text-muted-foreground/50" />;
		return sortDir === "asc" ? (
			<ArrowUp className="h-3 w-3" />
		) : (
			<ArrowDown className="h-3 w-3" />
		);
	};

	const headerClass =
		"text-left text-xs font-medium text-muted-foreground px-3 py-2 cursor-pointer select-none hover:text-foreground transition-colors";

	return (
		<div className="rounded-lg border overflow-x-auto">
			<table className="w-full text-sm">
				<thead className="border-b bg-muted/30">
					<tr>
						<th
							className={`${headerClass} min-w-[200px]`}
							onClick={() => toggleSort("title")}
						>
							<span className="flex items-center gap-1">
								Title <SortIcon field="title" />
							</span>
						</th>
						<th className={headerClass} onClick={() => toggleSort("contentType")}>
							<span className="flex items-center gap-1">
								Type <SortIcon field="contentType" />
							</span>
						</th>
						<th className={headerClass} onClick={() => toggleSort("status")}>
							<span className="flex items-center gap-1">
								Status <SortIcon field="status" />
							</span>
						</th>
						<th className={headerClass} onClick={() => toggleSort("sourceRobot")}>
							<span className="flex items-center gap-1">
								Robot <SortIcon field="sourceRobot" />
							</span>
						</th>
						<th className={headerClass} onClick={() => toggleSort("priority")}>
							<span className="flex items-center gap-1">
								Priority <SortIcon field="priority" />
							</span>
						</th>
						<th className={headerClass} onClick={() => toggleSort("createdAt")}>
							<span className="flex items-center gap-1">
								Created <SortIcon field="createdAt" />
							</span>
						</th>
						<th
							className={headerClass}
							onClick={() => toggleSort("scheduledFor")}
						>
							<span className="flex items-center gap-1">
								Scheduled <SortIcon field="scheduledFor" />
							</span>
						</th>
						<th className="text-left text-xs font-medium text-muted-foreground px-3 py-2">
							Actions
						</th>
					</tr>
				</thead>
				<tbody className="divide-y">
					{sorted.length === 0 ? (
						<tr>
							<td
								colSpan={8}
								className="text-center py-8 text-sm text-muted-foreground"
							>
								No content items found.
							</td>
						</tr>
					) : (
						sorted.map((item) => (
							<tr
								key={item.id}
								className="hover:bg-muted/30 transition-colors"
							>
								<td className="px-3 py-2">
									<span className="font-medium truncate block max-w-[250px]">
										{item.title}
									</span>
								</td>
								<td className="px-3 py-2 text-xs text-muted-foreground">
									{TYPE_LABELS[item.contentType] || item.contentType}
								</td>
								<td className="px-3 py-2">
									<ContentStatusBadge status={item.status} />
								</td>
								<td className="px-3 py-2 text-xs text-muted-foreground">
									{item.sourceRobot || "—"}
								</td>
								<td className="px-3 py-2">
									{item.priority ? (
										<span className="text-xs font-mono bg-muted rounded px-1.5 py-0.5">
											P{item.priority}
										</span>
									) : (
										<span className="text-muted-foreground">—</span>
									)}
								</td>
								<td className="px-3 py-2 text-xs text-muted-foreground whitespace-nowrap">
									{formatDistanceToNow(new Date(item.createdAt), {
										addSuffix: true,
									})}
								</td>
								<td className="px-3 py-2 text-xs text-muted-foreground whitespace-nowrap">
									{item.scheduledFor
										? format(new Date(item.scheduledFor), "MMM d, HH:mm")
										: "—"}
								</td>
								<td className="px-3 py-2">
									<RowActions
										item={item}
										onApprove={onApprove}
										onReject={onReject}
									/>
								</td>
							</tr>
						))
					)}
				</tbody>
			</table>
		</div>
	);
}

// ─── Row Actions Dropdown ───────────────────────────

function RowActions({
	item,
	onApprove,
	onReject,
}: {
	item: ContentItem;
	onApprove: (id: string, note?: string) => Promise<void>;
	onReject: (id: string, note: string) => Promise<void>;
}) {
	const canApprove = item.status === "pending_review";
	const canReject = item.status === "pending_review";

	return (
		<DropdownMenu>
			<DropdownMenuTrigger asChild>
				<Button variant="ghost" size="icon" className="h-7 w-7">
					<MoreHorizontal className="h-4 w-4" />
				</Button>
			</DropdownMenuTrigger>
			<DropdownMenuContent align="end">
				{canApprove && (
					<DropdownMenuItem onClick={() => onApprove(item.id)}>
						<CheckCircle2 className="h-4 w-4 mr-2 text-green-500" />
						Approve
					</DropdownMenuItem>
				)}
				{canReject && (
					<DropdownMenuItem
						onClick={() => onReject(item.id, "Rejected from table")}
					>
						<XCircle className="h-4 w-4 mr-2 text-red-500" />
						Reject
					</DropdownMenuItem>
				)}
				{item.scheduledFor && (
					<DropdownMenuItem disabled>
						<Calendar className="h-4 w-4 mr-2" />
						{format(new Date(item.scheduledFor), "MMM d, HH:mm")}
					</DropdownMenuItem>
				)}
			</DropdownMenuContent>
		</DropdownMenu>
	);
}
