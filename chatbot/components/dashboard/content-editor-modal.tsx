"use client";

import {
	AlertCircle,
	Check,
	History,
	Loader2,
	RefreshCw,
	Save,
	Send,
} from "lucide-react";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { useContentEditor } from "@/hooks/use-content-editor";
import type { ContentItem } from "@/hooks/use-content-review";
import { ContentEditHistory } from "./content-edit-history";

interface ContentEditorModalProps {
	item: ContentItem;
	open: boolean;
	onClose: () => void;
	onApprove?: (id: string) => Promise<void>;
	onRefresh?: () => void;
}

export function ContentEditorModal({
	item,
	open,
	onClose,
	onApprove,
	onRefresh,
}: ContentEditorModalProps) {
	const {
		body,
		history,
		loading,
		saving,
		error,
		fetchBody,
		saveBody,
		fetchHistory,
		regenerate,
		clearError,
	} = useContentEditor(item.id);

	const [editedBody, setEditedBody] = useState("");
	const [editNote, setEditNote] = useState("");
	const [showHistory, setShowHistory] = useState(false);
	const [showRegenerate, setShowRegenerate] = useState(false);
	const [regenInstructions, setRegenInstructions] = useState("");
	const [approving, setApproving] = useState(false);

	// Load body when modal opens
	useEffect(() => {
		if (open) {
			fetchBody();
			fetchHistory();
		}
	}, [open, fetchBody, fetchHistory]);

	// Sync fetched body to editor
	useEffect(() => {
		if (body) {
			setEditedBody(body.body);
		}
	}, [body]);

	const handleSave = async () => {
		const result = await saveBody(editedBody, editNote || undefined);
		if (result) {
			setEditNote("");
			fetchHistory();
		}
	};

	const handleApprove = async () => {
		if (!onApprove) return;
		// Save first if there are unsaved changes
		if (body && editedBody !== body.body) {
			const saved = await saveBody(editedBody, editNote || "Saved before approval");
			if (!saved) return;
		}
		setApproving(true);
		try {
			await onApprove(item.id);
			onClose();
			onRefresh?.();
		} finally {
			setApproving(false);
		}
	};

	const handleRegenerate = async () => {
		const result = await regenerate(regenInstructions || undefined);
		if (result) {
			setShowRegenerate(false);
			setRegenInstructions("");
			onClose();
			onRefresh?.();
		}
	};

	const handleLoadVersion = async (version: number) => {
		await fetchBody(version);
		setShowHistory(false);
	};

	const hasChanges = body && editedBody !== body.body;

	return (
		<Dialog open={open} onOpenChange={(o) => !o && onClose()}>
			<DialogContent className="max-w-4xl h-[85vh] flex flex-col p-0">
				<DialogHeader className="px-6 pt-6 pb-3 border-b shrink-0">
					<DialogTitle className="flex items-center gap-2 text-base">
						<span className="truncate">{item.title}</span>
						{body && (
							<span className="text-xs text-muted-foreground font-normal shrink-0">
								v{body.version}
							</span>
						)}
					</DialogTitle>
				</DialogHeader>

				{/* Error banner */}
				{error && (
					<div className="mx-6 mt-2 rounded-md border border-red-200 bg-red-50 px-3 py-2 dark:border-red-800 dark:bg-red-950">
						<div className="flex items-center gap-2">
							<AlertCircle className="h-3.5 w-3.5 text-red-500 shrink-0" />
							<span className="text-xs text-red-700 dark:text-red-300 flex-1">
								{error}
							</span>
							<Button
								onClick={clearError}
								variant="ghost"
								size="sm"
								className="h-5 text-xs px-1"
							>
								Dismiss
							</Button>
						</div>
					</div>
				)}

				{/* Main content area */}
				<div className="flex-1 overflow-hidden flex flex-col px-6 py-3 gap-3">
					{loading ? (
						<div className="flex-1 flex items-center justify-center">
							<Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
							<span className="ml-2 text-sm text-muted-foreground">
								Loading content...
							</span>
						</div>
					) : !body ? (
						<div className="flex-1 flex items-center justify-center">
							<p className="text-sm text-muted-foreground">
								No content body found. Content may not have been generated yet.
							</p>
						</div>
					) : (
						<>
							{/* Editor */}
							<textarea
								value={editedBody}
								onChange={(e) => setEditedBody(e.target.value)}
								className="flex-1 w-full resize-none rounded-md border bg-background p-3 font-mono text-sm focus:outline-none focus:ring-2 focus:ring-ring"
								placeholder="Content body (markdown)..."
							/>

							{/* Edit note input */}
							<input
								type="text"
								value={editNote}
								onChange={(e) => setEditNote(e.target.value)}
								placeholder="Edit note (optional)..."
								className="h-8 rounded-md border border-input bg-background px-3 text-sm"
							/>
						</>
					)}

					{/* History panel (toggle) */}
					{showHistory && (
						<div className="border-t pt-3">
							<h4 className="text-xs font-medium mb-2">Edit History</h4>
							<ContentEditHistory
								history={history}
								onLoadVersion={handleLoadVersion}
							/>
						</div>
					)}

					{/* Regenerate panel */}
					{showRegenerate && (
						<div className="border-t pt-3 space-y-2">
							<h4 className="text-xs font-medium">Re-generation Instructions</h4>
							<textarea
								value={regenInstructions}
								onChange={(e) =>
									setRegenInstructions(e.target.value)
								}
								placeholder="Tell the robot what to change..."
								className="w-full h-20 resize-none rounded-md border bg-background p-2 text-sm"
							/>
							<div className="flex gap-2">
								<Button
									size="sm"
									onClick={handleRegenerate}
									className="h-7 text-xs"
								>
									<Send className="h-3 w-3 mr-1" />
									Send to Robot
								</Button>
								<Button
									size="sm"
									variant="ghost"
									onClick={() => setShowRegenerate(false)}
									className="h-7 text-xs"
								>
									Cancel
								</Button>
							</div>
						</div>
					)}
				</div>

				{/* Footer actions */}
				<div className="px-6 pb-4 pt-2 border-t flex items-center gap-2 shrink-0">
					<Button
						variant="outline"
						size="sm"
						onClick={() => setShowHistory(!showHistory)}
						className="h-8"
					>
						<History className="h-3.5 w-3.5 mr-1" />
						History
						{history.length > 0 && (
							<span className="ml-1 text-xs text-muted-foreground">
								({history.length})
							</span>
						)}
					</Button>

					<Button
						variant="outline"
						size="sm"
						onClick={() => setShowRegenerate(!showRegenerate)}
						className="h-8"
						disabled={
							!["generated", "pending_review"].includes(item.status)
						}
					>
						<RefreshCw className="h-3.5 w-3.5 mr-1" />
						Regenerate
					</Button>

					<div className="flex-1" />

					<Button
						variant="outline"
						size="sm"
						onClick={handleSave}
						disabled={saving || !hasChanges}
						className="h-8"
					>
						{saving ? (
							<Loader2 className="h-3.5 w-3.5 mr-1 animate-spin" />
						) : (
							<Save className="h-3.5 w-3.5 mr-1" />
						)}
						Save
					</Button>

					{onApprove &&
						["generated", "pending_review"].includes(item.status) && (
							<Button
								size="sm"
								onClick={handleApprove}
								disabled={approving}
								className="h-8"
							>
								{approving ? (
									<Loader2 className="h-3.5 w-3.5 mr-1 animate-spin" />
								) : (
									<Check className="h-3.5 w-3.5 mr-1" />
								)}
								Approve
							</Button>
						)}
				</div>
			</DialogContent>
		</Dialog>
	);
}
