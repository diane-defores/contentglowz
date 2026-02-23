"use client";

import { markdown } from "@codemirror/lang-markdown";
import { EditorState } from "@codemirror/state";
import { oneDark } from "@codemirror/theme-one-dark";
import { EditorView } from "@codemirror/view";
import { basicSetup } from "codemirror";
import { ArrowLeft, Loader2, Save } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/components/toast";
import { useConfirm } from "@/hooks/use-confirm";
import { useGitHub } from "@/hooks/use-github";

interface GitHubFileEditorProps {
	owner: string;
	repo: string;
	filePath: string;
	onClose: () => void;
	onSaved?: () => void;
}

export function GitHubFileEditor({
	owner,
	repo,
	filePath,
	onClose,
	onSaved,
}: GitHubFileEditorProps) {
	const { fetchFile, saveFile } = useGitHub();
	const containerRef = useRef<HTMLDivElement>(null);
	const editorRef = useRef<EditorView | null>(null);

	const [loading, setLoading] = useState(true);
	const [saving, setSaving] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [sha, setSha] = useState<string>("");
	const [originalContent, setOriginalContent] = useState<string>("");
	const [dirty, setDirty] = useState(false);
	const { confirm, ConfirmDialog } = useConfirm();
	const [commitMessage, setCommitMessage] = useState(
		`Update ${filePath.split("/").pop()}`,
	);
	const [conflict, setConflict] = useState(false);

	const fileName = filePath.split("/").pop() || filePath;
	const breadcrumb = filePath.split("/");

	// Load file content
	useEffect(() => {
		let cancelled = false;

		async function load() {
			setLoading(true);
			setError(null);
			setConflict(false);

			try {
				const file = await fetchFile(owner, repo, filePath);
				if (cancelled) return;

				setSha(file.sha);
				setOriginalContent(file.content);

				// Initialize CodeMirror
				if (containerRef.current) {
					if (editorRef.current) {
						editorRef.current.destroy();
					}

					const updateListener = EditorView.updateListener.of(
						(update) => {
							if (update.docChanged) {
								const current =
									update.state.doc.toString();
								setDirty(current !== file.content);
							}
						},
					);

					const state = EditorState.create({
						doc: file.content,
						extensions: [
							basicSetup,
							markdown(),
							oneDark,
							updateListener,
							EditorView.lineWrapping,
						],
					});

					editorRef.current = new EditorView({
						state,
						parent: containerRef.current,
					});
				}
			} catch (err) {
				if (!cancelled) {
					setError(
						err instanceof Error
							? err.message
							: "Failed to load file",
					);
				}
			} finally {
				if (!cancelled) setLoading(false);
			}
		}

		load();

		return () => {
			cancelled = true;
			if (editorRef.current) {
				editorRef.current.destroy();
				editorRef.current = null;
			}
		};
	}, [owner, repo, filePath, fetchFile]);

	const handleSave = useCallback(async () => {
		if (!editorRef.current || !sha) return;

		const content = editorRef.current.state.doc.toString();
		setSaving(true);
		setConflict(false);

		try {
			const result = await saveFile(
				owner,
				repo,
				filePath,
				content,
				sha,
				commitMessage,
			);
			setSha(result.sha);
			setOriginalContent(content);
			setDirty(false);
			toast({
				type: "success",
				description: `Committed: ${commitMessage}`,
			});
			onSaved?.();
		} catch (err: any) {
			if (err.status === 409) {
				setConflict(true);
				toast({
					type: "error",
					description:
						"File was modified externally. Please reload.",
				});
			} else {
				toast({
					type: "error",
					description:
						err instanceof Error
							? err.message
							: "Failed to save file",
				});
			}
		} finally {
			setSaving(false);
		}
	}, [
		sha,
		owner,
		repo,
		filePath,
		commitMessage,
		saveFile,
		onSaved,
	]);

	const handleReload = useCallback(async () => {
		setConflict(false);
		setLoading(true);
		try {
			const file = await fetchFile(owner, repo, filePath);
			setSha(file.sha);
			setOriginalContent(file.content);
			setDirty(false);

			if (editorRef.current) {
				const transaction = editorRef.current.state.update({
					changes: {
						from: 0,
						to: editorRef.current.state.doc.length,
						insert: file.content,
					},
				});
				editorRef.current.dispatch(transaction);
			}
		} catch (err) {
			setError(
				err instanceof Error ? err.message : "Failed to reload file",
			);
		} finally {
			setLoading(false);
		}
	}, [owner, repo, filePath, fetchFile]);

	const handleClose = useCallback(async () => {
		if (dirty) {
			const ok = await confirm({
				title: "Unsaved changes",
				description: "You have unsaved changes. Discard them?",
				confirmLabel: "Discard",
				destructive: true,
			});
			if (!ok) return;
		}
		onClose();
	}, [dirty, onClose, confirm]);

	if (loading) {
		return (
			<div className="flex items-center justify-center py-12">
				<Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
			</div>
		);
	}

	if (error) {
		return (
			<div className="space-y-4 py-8 text-center">
				<p className="text-sm text-destructive">{error}</p>
				<Button variant="outline" size="sm" onClick={onClose}>
					<ArrowLeft className="mr-2 h-4 w-4" />
					Back to tree
				</Button>
			</div>
		);
	}

	return (
		<div className="flex flex-col h-full gap-3">
			{/* Header */}
			<div className="flex items-center gap-2">
				<Button variant="ghost" size="sm" onClick={handleClose}>
					<ArrowLeft className="h-4 w-4" />
				</Button>
				<div className="flex items-center gap-1 text-xs text-muted-foreground overflow-hidden">
					{breadcrumb.map((part, i) => (
						<span key={i} className="flex items-center gap-1">
							{i > 0 && <span>/</span>}
							<span
								className={
									i === breadcrumb.length - 1
										? "text-foreground font-medium"
										: ""
								}
							>
								{part}
							</span>
						</span>
					))}
				</div>
			</div>

			{/* Conflict banner */}
			{conflict && (
				<div className="flex items-center justify-between rounded-md border border-destructive bg-destructive/10 px-3 py-2 text-sm">
					<span>File was modified externally.</span>
					<Button variant="outline" size="sm" onClick={handleReload}>
						Reload
					</Button>
				</div>
			)}

			{/* Editor */}
			<div
				ref={containerRef}
				className="flex-1 min-h-0 overflow-auto rounded-md border text-sm [&_.cm-editor]:h-full [&_.cm-scroller]:!overflow-auto"
			/>

			{/* Commit controls */}
			<div className="flex items-end gap-2">
				<div className="flex-1 space-y-1">
					<Label htmlFor="commit-msg" className="text-xs">
						Commit message
					</Label>
					<Input
						id="commit-msg"
						value={commitMessage}
						onChange={(e) => setCommitMessage(e.target.value)}
						placeholder="Update file..."
						className="h-8 text-sm"
					/>
				</div>
				<Button
					size="sm"
					onClick={handleSave}
					disabled={!dirty || saving || !commitMessage}
				>
					{saving ? (
						<Loader2 className="mr-2 h-4 w-4 animate-spin" />
					) : (
						<Save className="mr-2 h-4 w-4" />
					)}
					{saving ? "Saving..." : "Save & Commit"}
				</Button>
			</div>

			<ConfirmDialog />
		</div>
	);
}
