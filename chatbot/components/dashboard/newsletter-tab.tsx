"use client";

import {
	AlertCircle,
	Clock,
	FileText,
	History,
	LayoutTemplate,
	Sparkles,
	Trash2,
	X,
} from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useGenerators, type GeneratorFormData } from "@/hooks/use-generators";
import { useNewsletter } from "@/hooks/use-newsletter";
import type { NewsletterGenerator } from "@/lib/db/schema";
import { GeneratorFormModal } from "./generator-form-modal";
import { GeneratorsList } from "./generators-list";
import { NewsletterResultView } from "./newsletter-result";
import { TemplatePicker } from "./template-picker";

interface NewsletterTabProps {
	projectId?: string;
}

export function NewsletterTab({ projectId }: NewsletterTabProps) {
	const {
		history,
		error: newsletterError,
		configReady,
		configChecks,
		backendReachable,
		saveToHistory,
		loadFromHistory,
		deleteHistoryItem,
		clearError: clearNewsletterError,
		senders,
		sendersLoading,
		sendersError,
		fetchSenders,
		gmailConnected,
		gmailEmail,
		disconnectGmail,
	} = useNewsletter();

	const {
		generators,
		loading: generatorsLoading,
		generatingId,
		jobStatus,
		generationResult,
		error: generatorsError,
		createGenerator,
		updateGenerator,
		deleteGenerator,
		generateNow,
		clearGenerationResult,
		clearError: clearGeneratorsError,
	} = useGenerators();

	const [modalOpen, setModalOpen] = useState(false);
	const [editingGenerator, setEditingGenerator] =
		useState<NewsletterGenerator | null>(null);
	const [result, setResult] = useState<ReturnType<typeof loadFromHistory> | null>(null);
	const [templatePickerOpen, setTemplatePickerOpen] = useState(false);

	// When generation completes, save to history and show result
	const prevResultIdRef = useRef<string | null>(null);
	useEffect(() => {
		if (
			generationResult &&
			generationResult.newsletter_id !== prevResultIdRef.current
		) {
			prevResultIdRef.current = generationResult.newsletter_id;
			saveToHistory(generationResult);
			setResult(generationResult);
		}
	}, [generationResult, saveToHistory]);

	const error = newsletterError || generatorsError;

	const clearError = useCallback(() => {
		clearNewsletterError();
		clearGeneratorsError();
	}, [clearNewsletterError, clearGeneratorsError]);

	const handleCreateNew = useCallback(() => {
		setEditingGenerator(null);
		setModalOpen(true);
	}, []);

	const handleEdit = useCallback((generator: NewsletterGenerator) => {
		setEditingGenerator(generator);
		setModalOpen(true);
	}, []);

	const handleDelete = useCallback(
		async (id: string) => {
			await deleteGenerator(id);
		},
		[deleteGenerator],
	);

	const handleToggleStatus = useCallback(
		async (generator: NewsletterGenerator) => {
			const newStatus =
				generator.status === "active" ? "paused" : "active";
			await updateGenerator(generator.id, { status: newStatus });
		},
		[updateGenerator],
	);

	const handleModalSubmit = useCallback(
		async (data: GeneratorFormData) => {
			let result: unknown;
			if (editingGenerator) {
				result = await updateGenerator(editingGenerator.id, data);
			} else {
				result = await createGenerator(data);
			}
			// If the hook returned null, it means an error occurred —
			// throw so the modal stays open instead of closing
			if (result === null) {
				throw new Error("Save failed");
			}
		},
		[editingGenerator, updateGenerator, createGenerator],
	);

	const handleLoadFromHistory = useCallback(
		(item: Parameters<typeof loadFromHistory>[0]) => {
			const res = loadFromHistory(item);
			setResult(res);
		},
		[loadFromHistory],
	);

	const handleClearResult = useCallback(() => {
		setResult(null);
		clearGenerationResult();
	}, [clearGenerationResult]);

	return (
		<div className="space-y-6">
			{/* Error Banner */}
			{error && (
				<div className="rounded-lg border border-red-200 bg-red-50 dark:border-red-900 dark:bg-red-950/50 p-4">
					<div className="flex items-center gap-3">
						<AlertCircle className="h-5 w-5 text-red-500 shrink-0" />
						<p className="text-sm text-red-600 dark:text-red-400 flex-1">
							{error}
						</p>
						<Button onClick={clearError} variant="ghost" size="sm">
							<X className="h-4 w-4" />
						</Button>
					</div>
				</div>
			)}

			{/* Config warning — only when backend is unreachable */}
			{backendReachable === false && (
				<div className="rounded-lg border border-red-200 bg-red-50 dark:border-red-900 dark:bg-red-950/50 p-4">
					<div className="flex items-center gap-3">
						<AlertCircle className="h-5 w-5 text-red-500 shrink-0" />
						<div>
							<p className="text-sm font-medium text-red-800 dark:text-red-200">
								Newsletter backend not available
							</p>
							<p className="text-sm text-red-700 dark:text-red-300">
								Cannot reach the Python API server. You can still register generators &mdash; generation will work once the backend is running.
							</p>
						</div>
					</div>
				</div>
			)}

			{/* Config incomplete — backend reachable but missing keys */}
			{backendReachable === true && configReady === false && configChecks && (
				<div className="rounded-lg border border-yellow-200 bg-yellow-50 dark:border-yellow-900 dark:bg-yellow-950/50 p-4">
					<div className="flex items-center gap-3">
						<AlertCircle className="h-5 w-5 text-yellow-600 dark:text-yellow-400 shrink-0" />
						<div>
							<p className="text-sm font-medium text-yellow-800 dark:text-yellow-200">
								Newsletter configuration incomplete
							</p>
							<p className="text-sm text-yellow-700 dark:text-yellow-300">
								Missing:{" "}
								{Object.entries(configChecks)
									.filter(([, ok]) => !ok)
									.map(([key]) =>
										key
											.replace("_configured", "")
											.replace(/_/g, " "),
									)
									.join(", ")}
							</p>
						</div>
					</div>
				</div>
			)}

			{/* Header */}
			<div className="flex items-start justify-between">
				<div>
					<h2 className="text-xl font-semibold flex items-center gap-2">
						<Sparkles className="h-5 w-5 text-purple-500" />
						Newsletter Generator
					</h2>
					<p className="text-sm text-muted-foreground mt-1">
						Register newsletter generators, schedule them, or run on demand
					</p>
				</div>
				<Button
					variant="outline"
					size="sm"
					onClick={() => setTemplatePickerOpen(true)}
				>
					<LayoutTemplate className="mr-1.5 h-3.5 w-3.5" />
					From template
				</Button>
			</div>

			{/* Main Grid */}
			<div className="grid gap-6 lg:grid-cols-[1fr,350px]">
				{/* Left Column */}
				<div className="space-y-6">
					{/* Generators list */}
					<GeneratorsList
						generators={generators}
						loading={generatorsLoading}
						generatingId={generatingId}
						jobStatus={jobStatus}
						onGenerateNow={generateNow}
						onEdit={handleEdit}
						onDelete={handleDelete}
						onToggleStatus={handleToggleStatus}
						onCreateNew={handleCreateNew}
					/>

					{/* Result view — shown when a generation completes or loaded from history */}
					{result && (
						<NewsletterResultView
							result={result}
							onNewNewsletter={handleClearResult}
						/>
					)}
				</div>

				{/* Right Column — History Sidebar */}
				<div>
					<Card className="p-4">
						<h3 className="font-semibold flex items-center gap-2 mb-3">
							<History className="h-4 w-4 text-muted-foreground" />
							History
						</h3>
						{history.length === 0 ? (
							<p className="text-sm text-muted-foreground text-center py-6">
								No newsletters generated yet
							</p>
						) : (
							<ScrollArea className="h-[500px]">
								<div className="space-y-2 pr-2">
									{history.map((item) => (
										<button
											key={item.id}
											type="button"
											onClick={() =>
												handleLoadFromHistory(item)
											}
											className="w-full text-left rounded-lg border p-3 hover:bg-muted/50 transition-colors group"
										>
											<div className="flex items-start justify-between gap-2">
												<div className="min-w-0 flex-1">
													<p className="text-sm font-medium truncate">
														{item.subject_line}
													</p>
													<div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
														<span className="flex items-center gap-1">
															<FileText className="h-3 w-3" />
															{item.word_count}w
														</span>
														<span className="flex items-center gap-1">
															<Clock className="h-3 w-3" />
															{new Date(
																item.created_at,
															).toLocaleDateString()}
														</span>
													</div>
												</div>
												<button
													type="button"
													onClick={(e) => {
														e.stopPropagation();
														deleteHistoryItem(
															item.id,
														);
													}}
													className="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-destructive/10 rounded"
												>
													<Trash2 className="h-3.5 w-3.5 text-destructive" />
												</button>
											</div>
										</button>
									))}
								</div>
							</ScrollArea>
						)}
					</Card>
				</div>
			</div>

			{/* Generator form modal */}
			<GeneratorFormModal
				open={modalOpen}
				onOpenChange={setModalOpen}
				generator={editingGenerator}
				onSubmit={handleModalSubmit}
				senders={senders}
				sendersLoading={sendersLoading}
				sendersError={sendersError}
				onScanSenders={fetchSenders}
				gmailConnected={gmailConnected}
				gmailEmail={gmailEmail}
				onDisconnectGmail={disconnectGmail}
			/>

			{/* Template picker sheet */}
			<TemplatePicker
				open={templatePickerOpen}
				onOpenChange={setTemplatePickerOpen}
				projectId={projectId}
			/>
		</div>
	);
}
