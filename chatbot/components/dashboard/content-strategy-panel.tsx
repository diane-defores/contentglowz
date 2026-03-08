"use client";

import { AlertTriangle, BarChart3, Loader2, RefreshCw } from "lucide-react";
import { useCallback, useState } from "react";
import { toast } from "@/components/toast";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
	type ClusterHealthData,
	type FunnelStageData,
	useContentStrategy,
} from "@/hooks/use-content-strategy";

// ── Funnel stage colors ────────────────────────────────────────────────────────

const FUNNEL_COLORS: Record<string, string> = {
	tofu: "bg-blue-500",
	mofu: "bg-purple-500",
	bofu: "bg-orange-500",
	retention: "bg-green-500",
};

const FUNNEL_TRACK_COLORS: Record<string, string> = {
	tofu: "bg-blue-100 dark:bg-blue-950",
	mofu: "bg-purple-100 dark:bg-purple-950",
	bofu: "bg-orange-100 dark:bg-orange-950",
	retention: "bg-green-100 dark:bg-green-950",
};

// ── Grade badge ────────────────────────────────────────────────────────────────

const GRADE_STYLES: Record<string, { bg: string; text: string }> = {
	A: {
		bg: "bg-green-100 dark:bg-green-950",
		text: "text-green-700 dark:text-green-400",
	},
	"B+": {
		bg: "bg-lime-100 dark:bg-lime-950",
		text: "text-lime-700 dark:text-lime-400",
	},
	B: {
		bg: "bg-yellow-100 dark:bg-yellow-950",
		text: "text-yellow-700 dark:text-yellow-400",
	},
	C: {
		bg: "bg-orange-100 dark:bg-orange-950",
		text: "text-orange-700 dark:text-orange-400",
	},
	D: {
		bg: "bg-red-100 dark:bg-red-950",
		text: "text-red-700 dark:text-red-400",
	},
	F: {
		bg: "bg-red-200 dark:bg-red-900",
		text: "text-red-800 dark:text-red-300",
	},
};

function GradeBadge({ grade }: { grade: string }) {
	const s = GRADE_STYLES[grade] ?? GRADE_STYLES.F;
	return (
		<span
			className={`inline-flex items-center rounded px-2 py-0.5 text-xs font-bold ${s.bg} ${s.text}`}
		>
			{grade}
		</span>
	);
}

// ── Cluster name formatter ─────────────────────────────────────────────────────

function formatClusterName(cluster: string): string {
	const map: Record<string, string> = {
		"tech-ia": "Tech/IA",
		"business-profils": "Business/Profils",
		marketing: "Marketing",
		seo: "SEO",
		affiliation: "Affiliation",
		"e-commerce": "E-commerce",
		"apps-outils": "Apps/Outils",
		finance: "Finance",
		entrepreneuriat: "Entrepreneuriat",
	};
	if (map[cluster]) {
		return map[cluster];
	}
	return cluster
		.split("-")
		.filter((segment) => segment.length > 0)
		.map((segment) => {
			if (segment === "seo" || segment === "ia" || segment === "ai") {
				return segment.toUpperCase();
			}
			return `${segment.charAt(0).toUpperCase()}${segment.slice(1)}`;
		})
		.join(" ");
}

// ── Funnel bar row ─────────────────────────────────────────────────────────────

function FunnelRow({ stage }: { stage: FunnelStageData }) {
	const barColor = FUNNEL_COLORS[stage.stage] ?? "bg-gray-400";
	const trackColor = FUNNEL_TRACK_COLORS[stage.stage] ?? "bg-gray-100";

	return (
		<div className="space-y-1.5">
			<div className="flex items-center justify-between gap-3">
				<div className="flex items-center gap-2 min-w-0">
					<span className="text-sm font-semibold tabular-nums w-28 shrink-0">
						{stage.label}
					</span>
					<span className="text-xs text-muted-foreground">
						{stage.percentage}%
					</span>
					{stage.isGap && (
						<Badge
							variant="outline"
							className="border-orange-300 bg-orange-50 text-orange-700 dark:bg-orange-950 dark:text-orange-400 text-[10px] px-1.5 py-0 h-4"
						>
							<AlertTriangle className="h-2.5 w-2.5 mr-1" />
							GAP
						</Badge>
					)}
				</div>
				<span className="text-sm font-medium tabular-nums shrink-0">
					{stage.count} articles
				</span>
			</div>
			<div
				className={`h-2.5 w-full rounded-full overflow-hidden ${trackColor}`}
			>
				<div
					className={`h-full rounded-full ${barColor} transition-all duration-500`}
					style={{ width: `${Math.min(stage.percentage * 2, 100)}%` }}
				/>
			</div>
		</div>
	);
}

// ── Cluster health table ───────────────────────────────────────────────────────

function ClusterTable({ clusters }: { clusters: ClusterHealthData[] }) {
	return (
		<div className="overflow-x-auto">
			<table className="w-full text-sm">
				<thead>
					<tr className="border-b text-left text-xs text-muted-foreground">
						<th className="pb-2 pr-4 font-medium">Cluster</th>
						<th className="pb-2 pr-4 font-medium text-center">Articles</th>
						<th className="pb-2 pr-4 font-medium text-center">Santé SEO</th>
						<th className="pb-2 font-medium">Problème détecté</th>
					</tr>
				</thead>
				<tbody className="divide-y divide-border">
					{clusters.length === 0 ? (
						<tr>
							<td
								colSpan={4}
								className="py-6 text-center text-muted-foreground"
							>
								Aucun cluster détecté pour ce projet
							</td>
						</tr>
					) : (
						clusters.map((c) => (
							<tr key={c.cluster} className="py-2">
								<td className="py-2.5 pr-4 font-medium">
									{formatClusterName(c.cluster)}
								</td>
								<td className="py-2.5 pr-4 text-center tabular-nums">
									{c.count}
								</td>
								<td className="py-2.5 pr-4 text-center">
									<GradeBadge grade={c.grade} />
								</td>
								<td className="py-2.5 text-xs text-muted-foreground">
									{c.problem ? (
										<span className="flex items-center gap-1">
											<AlertTriangle className="h-3 w-3 shrink-0 text-orange-500" />
											{c.problem}
										</span>
									) : (
										<span className="text-green-600 dark:text-green-400">
											OK
										</span>
									)}
								</td>
							</tr>
						))
					)}
				</tbody>
			</table>
		</div>
	);
}

// ── Main component ─────────────────────────────────────────────────────────────

interface ContentStrategyPanelProps {
	projectId?: string;
}

interface FrontmatterAuditIssue {
	filePath: string;
	repo: string;
	branch: string;
	reasons: string[];
	suggested: Record<string, string>;
	metadataSource: "frontmatter" | "typescript";
	fixed: boolean;
	commitSha?: string;
	error?: string;
}

interface FrontmatterAuditResult {
	mode: "audit" | "dry-run" | "autofix";
	sourcesProcessed: number;
	filesScanned: number;
	filesWithIssues: number;
	filesWithFrontmatterIssues: number;
	filesWithTypeScriptMetadataIssues: number;
	filesFixed: number;
	filesFixedFrontmatter: number;
	filesFixedTypeScript: number;
	filesSkippedNoMetadata: number;
	groupedCommits: number;
	issues: FrontmatterAuditIssue[];
	csv?: string;
}

export function ContentStrategyPanel({ projectId }: ContentStrategyPanelProps) {
	const { data, loading, error, refresh } = useContentStrategy(projectId);
	const [auditLoading, setAuditLoading] = useState<
		"audit" | "dry-run" | "autofix" | null
	>(null);
	const [auditResult, setAuditResult] = useState<FrontmatterAuditResult | null>(
		null,
	);
	const [auditCsv, setAuditCsv] = useState<string | null>(null);

	const downloadTextFile = useCallback((filename: string, content: string) => {
		const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
		const objectUrl = URL.createObjectURL(blob);
		const link = document.createElement("a");
		link.href = objectUrl;
		link.download = filename;
		link.click();
		URL.revokeObjectURL(objectUrl);
	}, []);

	const runFrontmatterAudit = useCallback(
		async (mode: "audit" | "dry-run" | "autofix") => {
			if (!projectId) return;

			setAuditLoading(mode);
			try {
				const res = await fetch("/api/content/frontmatter-audit", {
					method: "POST",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify({ projectId, mode, includeCsv: true }),
				});
				if (!res.ok) {
					const payload = await res.json().catch(() => ({}));
					throw new Error(payload.error || `HTTP ${res.status}`);
				}

				const result = (await res.json()) as FrontmatterAuditResult;
				setAuditResult(result);
				setAuditCsv(result.csv ?? null);

				if (mode === "autofix") {
					toast({
						type: "success",
						description: `${result.filesFixed} file(s) fixed (${result.filesFixedFrontmatter} frontmatter · ${result.filesFixedTypeScript} TS) in ${result.groupedCommits} grouped commit(s)`,
					});
					await refresh();
				} else if (mode === "dry-run") {
					toast({
						type: "success",
						description: `${result.filesWithIssues} issue file(s) detected (${result.filesWithFrontmatterIssues} frontmatter · ${result.filesWithTypeScriptMetadataIssues} TS)`,
					});
				} else {
					toast({
						type: "success",
						description: `${result.filesWithIssues} issue file(s) detected over ${result.filesScanned} scanned`,
					});
				}
			} catch (auditError) {
				toast({
					type: "error",
					description:
						auditError instanceof Error
							? auditError.message
							: "Metadata audit failed",
				});
			} finally {
				setAuditLoading(null);
			}
		},
		[projectId, refresh],
	);

	if (!projectId) {
		return (
			<div className="flex flex-col items-center justify-center rounded-lg border border-dashed py-12 text-center gap-2">
				<p className="text-sm font-medium">
					Sélectionne un projet pour afficher la stratégie
				</p>
				<p className="text-xs text-muted-foreground">
					Les métriques funnel et clusters sont calculées projet par projet.
				</p>
			</div>
		);
	}

	if (loading) {
		return (
			<div className="flex items-center justify-center py-16">
				<Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
				<span className="ml-2 text-sm text-muted-foreground">
					Analyse du corpus…
				</span>
			</div>
		);
	}

	if (error) {
		return (
			<div className="flex flex-col items-center justify-center rounded-lg border border-dashed py-12 text-center gap-3">
				<p className="text-sm text-muted-foreground">{error}</p>
				<Button variant="outline" size="sm" onClick={refresh}>
					<RefreshCw className="h-3.5 w-3.5 mr-1.5" />
					Réessayer
				</Button>
			</div>
		);
	}

	if (!data) return null;

	const gapStages = data.funnelDistribution.filter((s) => s.isGap);

	return (
		<div className="space-y-6">
			{/* Header */}
			<div className="flex items-center justify-between">
				<div className="flex items-center gap-2">
					<BarChart3 className="h-5 w-5 text-muted-foreground" />
					<div>
						<h2 className="text-lg font-semibold">Stratégie de contenu</h2>
						<p className="text-sm text-muted-foreground">
							{data.total} articles analysés
							{data.uncategorized > 0 &&
								` · ${data.uncategorized} non classifiés`}
						</p>
					</div>
				</div>
				<div className="flex items-center gap-2">
					<Button
						variant="outline"
						size="sm"
						onClick={() => runFrontmatterAudit("audit")}
						disabled={auditLoading !== null}
					>
						{auditLoading === "audit" ? (
							<Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />
						) : (
							<AlertTriangle className="h-3.5 w-3.5 mr-1.5" />
						)}
						Audit metadata
					</Button>
					<Button
						variant="outline"
						size="sm"
						onClick={() => runFrontmatterAudit("dry-run")}
						disabled={auditLoading !== null}
					>
						{auditLoading === "dry-run" ? (
							<Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />
						) : (
							<BarChart3 className="h-3.5 w-3.5 mr-1.5" />
						)}
						Dry-run
					</Button>
					<Button
						size="sm"
						onClick={() => runFrontmatterAudit("autofix")}
						disabled={auditLoading !== null}
					>
						{auditLoading === "autofix" ? (
							<Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />
						) : (
							<BarChart3 className="h-3.5 w-3.5 mr-1.5" />
						)}
						Autofix
					</Button>
					<Button variant="outline" size="sm" onClick={refresh}>
						<RefreshCw className="h-3.5 w-3.5 mr-1.5" />
						Actualiser
					</Button>
				</div>
			</div>

			{/* Gap alert */}
			{gapStages.length > 0 && (
				<div className="rounded-lg border border-orange-200 bg-orange-50 dark:border-orange-800 dark:bg-orange-950/30 p-4">
					<div className="flex items-start gap-3">
						<AlertTriangle className="h-4 w-4 text-orange-500 shrink-0 mt-0.5" />
						<div>
							<p className="text-sm font-medium text-orange-800 dark:text-orange-200">
								Gaps de contenu détectés
							</p>
							{gapStages.map((s) => (
								<p
									key={s.stage}
									className="text-sm text-orange-700 dark:text-orange-300 mt-0.5"
								>
									<strong>{s.label}</strong> sous-représenté ({s.percentage}% ·{" "}
									{s.count} articles) — les visiteurs arrivent mais ne trouvent
									pas assez de contenu pour avancer dans leur décision.
								</p>
							))}
						</div>
					</div>
				</div>
			)}

			{data.total === 0 && (
				<div className="rounded-lg border border-dashed p-4 text-sm text-muted-foreground">
					Aucun contenu syncé pour ce projet. Ajoute un `Content Source`, puis
					lance `Sync All` dans le Repo Browser.
				</div>
			)}

			{auditResult && (
				<Card>
					<CardHeader className="pb-3">
						<div className="flex items-center justify-between gap-2">
							<CardTitle className="text-sm font-semibold">
								Metadata Audit
							</CardTitle>
							<div className="flex items-center gap-2">
								<Button
									variant="outline"
									size="sm"
									disabled={!auditResult}
									onClick={() =>
										auditResult &&
										downloadTextFile(
											`metadata-audit-${projectId}.json`,
											JSON.stringify(auditResult, null, 2),
										)
									}
								>
									Export JSON
								</Button>
								<Button
									variant="outline"
									size="sm"
									disabled={!auditCsv}
									onClick={() =>
										auditCsv &&
										downloadTextFile(
											`metadata-audit-${projectId}.csv`,
											auditCsv,
										)
									}
								>
									Export CSV
								</Button>
							</div>
						</div>
					</CardHeader>
					<CardContent className="space-y-3">
						<p className="text-sm text-muted-foreground">
							{auditResult.filesScanned} scanned · {auditResult.filesWithIssues}{" "}
							with issues ({auditResult.filesWithFrontmatterIssues} frontmatter
							· {auditResult.filesWithTypeScriptMetadataIssues} TS) ·{" "}
							{auditResult.filesFixed} fixed (
							{auditResult.filesFixedFrontmatter} frontmatter ·{" "}
							{auditResult.filesFixedTypeScript} TS) ·{" "}
							{auditResult.filesSkippedNoMetadata} TS without metadata block ·{" "}
							{auditResult.sourcesProcessed} source(s) ·{" "}
							{auditResult.groupedCommits} grouped commit(s)
						</p>
						{auditResult.issues.length > 0 ? (
							<div className="overflow-x-auto">
								<table className="w-full text-xs">
									<thead>
										<tr className="border-b text-left text-muted-foreground">
											<th className="pb-2 pr-3 font-medium">File</th>
											<th className="pb-2 pr-3 font-medium">Type</th>
											<th className="pb-2 pr-3 font-medium">Issue</th>
											<th className="pb-2 pr-3 font-medium">Suggested</th>
											<th className="pb-2 font-medium text-center">Status</th>
										</tr>
									</thead>
									<tbody className="divide-y divide-border">
										{auditResult.issues.slice(0, 12).map((issue) => (
											<tr
												key={`${issue.repo}:${issue.filePath}`}
												className="align-top"
											>
												<td className="py-2 pr-3 font-mono text-[11px]">
													<div>
														{issue.repo}@{issue.branch}
													</div>
													<div className="text-muted-foreground">
														{issue.filePath}
													</div>
												</td>
												<td className="py-2 pr-3">
													<Badge variant="outline" className="text-[10px]">
														{issue.metadataSource === "typescript"
															? "TypeScript"
															: "Frontmatter"}
													</Badge>
												</td>
												<td className="py-2 pr-3">
													{issue.reasons.join(", ")}
													{issue.error && (
														<div className="text-red-500 mt-1">
															{issue.error}
														</div>
													)}
												</td>
												<td className="py-2 pr-3">
													{Object.entries(issue.suggested).length > 0 ? (
														Object.entries(issue.suggested).map(
															([key, value]) => (
																<div key={key}>
																	{key}: {value}
																</div>
															),
														)
													) : (
														<span className="text-muted-foreground">—</span>
													)}
												</td>
												<td className="py-2 text-center">
													{issue.fixed
														? "Fixed"
														: issue.error
															? "Error"
															: "Pending"}
												</td>
											</tr>
										))}
									</tbody>
								</table>
							</div>
						) : (
							<p className="text-sm text-green-600 dark:text-green-400">
								No issue detected.
							</p>
						)}
						{auditResult.issues.length > 12 && (
							<p className="text-xs text-muted-foreground">
								Showing first 12 files out of {auditResult.issues.length}.
							</p>
						)}
					</CardContent>
				</Card>
			)}

			<div className="grid gap-6 lg:grid-cols-2">
				{/* Funnel distribution */}
				<Card>
					<CardHeader className="pb-3">
						<CardTitle className="text-sm font-semibold">
							Distribution par étape du funnel
						</CardTitle>
					</CardHeader>
					<CardContent className="space-y-4">
						{data.funnelDistribution.map((stage) => (
							<FunnelRow key={stage.stage} stage={stage} />
						))}
					</CardContent>
				</Card>

				{/* Cluster health */}
				<Card>
					<CardHeader className="pb-3">
						<CardTitle className="text-sm font-semibold">
							Santé SEO par cluster
						</CardTitle>
					</CardHeader>
					<CardContent>
						<ClusterTable clusters={data.clusterHealth} />
					</CardContent>
				</Card>
			</div>
		</div>
	);
}
