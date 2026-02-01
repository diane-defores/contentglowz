"use client";

import {
	Check,
	ChevronDown,
	ChevronRight,
	Copy,
	Edit,
	ExternalLink,
	Loader2,
	MoreHorizontal,
	Search,
	Trash,
} from "lucide-react";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/components/toast";
import { Button } from "@/components/ui/button";
import {
	Collapsible,
	CollapsibleContent,
	CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { Competitor } from "@/lib/db/schema";

interface CompetitorsTableProps {
	competitors: Competitor[];
	analyzing: string | null;
	onEdit: (competitor: Competitor) => void;
	onDelete: (id: string) => void;
	onAnalyze: (id: string) => void;
}

function getPriorityColor(priority: string) {
	switch (priority) {
		case "high":
			return "bg-red-100 text-red-800";
		case "medium":
			return "bg-yellow-100 text-yellow-800";
		case "low":
			return "bg-green-100 text-green-800";
		default:
			return "bg-gray-100 text-gray-800";
	}
}

function getScoreColor(score: number) {
	if (score >= 80) return "text-green-600";
	if (score >= 60) return "text-yellow-600";
	return "text-red-600";
}

export function CompetitorsTable({
	competitors,
	analyzing,
	onEdit,
	onDelete,
	onAnalyze,
}: CompetitorsTableProps) {
	const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());
	const [copiedId, setCopiedId] = useState<string | null>(null);

	const copyUrl = async (id: string, url: string) => {
		try {
			await navigator.clipboard.writeText(url);
			setCopiedId(id);
			toast({ type: "success", description: "URL copiée" });
			setTimeout(() => setCopiedId(null), 2000);
		} catch {
			toast({ type: "error", description: "Impossible de copier l'URL" });
		}
	};

	const toggleRow = (id: string) => {
		setExpandedRows((prev) => {
			const next = new Set(prev);
			if (next.has(id)) {
				next.delete(id);
			} else {
				next.add(id);
			}
			return next;
		});
	};

	if (competitors.length === 0) {
		return (
			<div className="text-center py-12 text-muted-foreground">
				<p>No competitors yet.</p>
				<p className="text-sm">Add your first competitor to start tracking.</p>
			</div>
		);
	}

	return (
		<div className="space-y-2">
			{competitors.map((competitor) => {
				const isExpanded = expandedRows.has(competitor.id);
				const hasAnalysis = competitor.analysisData !== null;

				return (
					<Collapsible
						key={competitor.id}
						open={isExpanded}
						onOpenChange={() => toggleRow(competitor.id)}
					>
						<div className="border rounded-lg">
							<div className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-4 gap-3">
								<div className="flex items-start sm:items-center gap-3 sm:gap-4">
									<CollapsibleTrigger asChild>
										<Button variant="ghost" size="sm" className="p-0 h-auto shrink-0">
											{isExpanded ? (
												<ChevronDown className="h-4 w-4" />
											) : (
												<ChevronRight className="h-4 w-4" />
											)}
										</Button>
									</CollapsibleTrigger>

									<div className="min-w-0 flex-1">
										<div className="flex items-center gap-2 flex-wrap">
											<span className="font-medium truncate">{competitor.name}</span>
											<button
												onClick={(e) => {
													e.stopPropagation();
													copyUrl(competitor.id, competitor.url);
												}}
												className="text-muted-foreground hover:text-foreground shrink-0"
												title="Copier l'URL"
											>
												{copiedId === competitor.id ? (
													<Check className="h-3 w-3 text-green-500" />
												) : (
													<Copy className="h-3 w-3" />
												)}
											</button>
											<a
												href={competitor.url}
												target="_blank"
												rel="noopener noreferrer"
												className="text-muted-foreground hover:text-foreground shrink-0"
												title="Ouvrir dans un nouvel onglet"
											>
												<ExternalLink className="h-3 w-3" />
											</a>
											<Badge className={`${getPriorityColor(competitor.priority)} sm:hidden`}>
												{competitor.priority}
											</Badge>
										</div>
										<p className="text-sm text-muted-foreground truncate">
											{competitor.niche || "No niche specified"}
										</p>
										{/* Mobile-only: show score inline */}
										{hasAnalysis && competitor.analysisData?.score && (
											<div className="sm:hidden mt-1 text-xs text-muted-foreground">
												Score: <span className={`font-bold ${getScoreColor(competitor.analysisData.score)}`}>{competitor.analysisData.score}</span>
											</div>
										)}
									</div>
								</div>

								<div className="flex flex-wrap items-center gap-2 sm:gap-4 pl-7 sm:pl-0">
									<Badge className={`${getPriorityColor(competitor.priority)} hidden sm:inline-flex`}>
										{competitor.priority}
									</Badge>

									{hasAnalysis && competitor.analysisData?.score && (
										<div className="hidden sm:block text-center">
											<div
												className={`text-lg font-bold ${getScoreColor(competitor.analysisData.score)}`}
											>
												{competitor.analysisData.score}
											</div>
											<div className="text-xs text-muted-foreground">Score</div>
										</div>
									)}

									<div className="hidden md:block text-sm text-muted-foreground">
										{competitor.lastAnalyzedAt
											? `Analyzed ${new Date(competitor.lastAnalyzedAt).toLocaleDateString()}`
											: "Not analyzed"}
									</div>

									<Button
										onClick={() => onAnalyze(competitor.id)}
										disabled={analyzing === competitor.id}
										variant="outline"
										size="sm"
										className="text-xs sm:text-sm"
									>
										{analyzing === competitor.id ? (
											<>
												<Loader2 className="mr-1.5 sm:mr-2 h-3.5 w-3.5 sm:h-4 sm:w-4 animate-spin" />
												<span className="hidden sm:inline">Analyzing...</span>
												<span className="sm:hidden">...</span>
											</>
										) : (
											<>
												<Search className="mr-1.5 sm:mr-2 h-3.5 w-3.5 sm:h-4 sm:w-4" />
												Analyze
											</>
										)}
									</Button>

									<DropdownMenu>
										<DropdownMenuTrigger asChild>
											<Button variant="ghost" size="sm">
												<MoreHorizontal className="h-4 w-4" />
											</Button>
										</DropdownMenuTrigger>
										<DropdownMenuContent align="end">
											<DropdownMenuItem onClick={() => copyUrl(competitor.id, competitor.url)}>
												{copiedId === competitor.id ? (
													<Check className="mr-2 h-4 w-4 text-green-500" />
												) : (
													<Copy className="mr-2 h-4 w-4" />
												)}
												Copier l'URL
											</DropdownMenuItem>
											<DropdownMenuItem onClick={() => onEdit(competitor)}>
												<Edit className="mr-2 h-4 w-4" />
												Modifier
											</DropdownMenuItem>
											<DropdownMenuItem
												onClick={() => onDelete(competitor.id)}
												className="text-red-600"
											>
												<Trash className="mr-2 h-4 w-4" />
												Supprimer
											</DropdownMenuItem>
										</DropdownMenuContent>
									</DropdownMenu>
								</div>
							</div>

							<CollapsibleContent>
								<div className="border-t p-4 bg-muted/50">
									{hasAnalysis ? (
										<div className="grid gap-4 md:grid-cols-2">
											{competitor.analysisData?.strengths &&
												competitor.analysisData.strengths.length > 0 && (
													<div>
														<h4 className="font-medium text-green-700 mb-2">
															Strengths
														</h4>
														<ul className="list-disc list-inside space-y-1 text-sm">
															{competitor.analysisData.strengths.map(
																(strength, i) => (
																	<li key={i}>{strength}</li>
																),
															)}
														</ul>
													</div>
												)}

											{competitor.analysisData?.weaknesses &&
												competitor.analysisData.weaknesses.length > 0 && (
													<div>
														<h4 className="font-medium text-red-700 mb-2">
															Weaknesses
														</h4>
														<ul className="list-disc list-inside space-y-1 text-sm">
															{competitor.analysisData.weaknesses.map(
																(weakness, i) => (
																	<li key={i}>{weakness}</li>
																),
															)}
														</ul>
													</div>
												)}

											{competitor.analysisData?.keywords &&
												competitor.analysisData.keywords.length > 0 && (
													<div>
														<h4 className="font-medium mb-2">Top Keywords</h4>
														<div className="flex flex-wrap gap-1">
															{competitor.analysisData.keywords.map(
																(keyword, i) => (
																	<Badge key={i} variant="secondary">
																		{keyword}
																	</Badge>
																),
															)}
														</div>
													</div>
												)}

											{competitor.analysisData?.contentGaps &&
												competitor.analysisData.contentGaps.length > 0 && (
													<div>
														<h4 className="font-medium text-blue-700 mb-2">
															Content Gaps
														</h4>
														<ul className="list-disc list-inside space-y-1 text-sm">
															{competitor.analysisData.contentGaps.map(
																(gap, i) => (
																	<li key={i}>{gap}</li>
																),
															)}
														</ul>
													</div>
												)}
										</div>
									) : (
										<div className="text-center py-4 text-muted-foreground">
											<p>No analysis data available.</p>
											<p className="text-sm">
												Click "Analyze" to get competitor insights.
											</p>
										</div>
									)}

									{competitor.notes && (
										<div className="mt-4 pt-4 border-t">
											<h4 className="font-medium mb-2">Notes</h4>
											<p className="text-sm text-muted-foreground">
												{competitor.notes}
											</p>
										</div>
									)}
								</div>
							</CollapsibleContent>
						</div>
					</Collapsible>
				);
			})}
		</div>
	);
}
