"use client";

import { Clock, User } from "lucide-react";
import type { ContentEditEntry } from "@/hooks/use-content-editor";

interface ContentEditHistoryProps {
	history: ContentEditEntry[];
	onLoadVersion: (version: number) => void;
}

export function ContentEditHistory({
	history,
	onLoadVersion,
}: ContentEditHistoryProps) {
	if (history.length === 0) {
		return (
			<p className="text-xs text-muted-foreground py-2">
				No edit history yet
			</p>
		);
	}

	return (
		<div className="space-y-2 max-h-60 overflow-y-auto">
			{history.map((entry) => {
				const date = new Date(entry.created_at);
				return (
					<button
						key={entry.id}
						type="button"
						onClick={() => onLoadVersion(entry.new_version)}
						className="w-full text-left rounded-md border p-2 hover:bg-muted/50 transition-colors cursor-pointer"
					>
						<div className="flex items-center justify-between">
							<span className="text-xs font-medium">
								v{entry.previous_version} → v{entry.new_version}
							</span>
							<span className="flex items-center gap-1 text-xs text-muted-foreground">
								<Clock className="h-3 w-3" />
								{date.toLocaleDateString()}{" "}
								{date.toLocaleTimeString([], {
									hour: "2-digit",
									minute: "2-digit",
								})}
							</span>
						</div>
						<div className="flex items-center gap-1 mt-1">
							<User className="h-3 w-3 text-muted-foreground" />
							<span className="text-xs text-muted-foreground">
								{entry.edited_by}
							</span>
						</div>
						{entry.edit_note && (
							<p className="text-xs text-muted-foreground mt-1 truncate">
								{entry.edit_note}
							</p>
						)}
					</button>
				);
			})}
		</div>
	);
}
