"use client";

import { AlertCircle, Loader2, Plus, RefreshCw } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import type { Competitor } from "@/lib/db/schema";
import {
	useCompetitors,
	type CompetitorFormData,
} from "@/hooks/use-competitors";
import { CompetitorFormModal } from "./competitor-form-modal";
import { CompetitorsTable } from "./competitors-table";

interface CompetitorsTabProps {
	projectId?: string;
}

export function CompetitorsTab({ projectId }: CompetitorsTabProps) {
	const {
		competitors,
		loading,
		analyzing,
		error,
		refresh,
		createCompetitor,
		updateCompetitor,
		deleteCompetitor,
		analyzeCompetitor,
		clearError,
	} = useCompetitors(projectId);

	const [modalOpen, setModalOpen] = useState(false);
	const [editingCompetitor, setEditingCompetitor] = useState<Competitor | null>(
		null,
	);
	const [priorityFilter, setPriorityFilter] = useState<string>("all");

	const handleEdit = (competitor: Competitor) => {
		setEditingCompetitor(competitor);
		setModalOpen(true);
	};

	const handleDelete = async (id: string) => {
		if (confirm("Are you sure you want to delete this competitor?")) {
			await deleteCompetitor(id);
		}
	};

	const handleSubmit = async (data: CompetitorFormData) => {
		if (editingCompetitor) {
			await updateCompetitor(editingCompetitor.id, data);
		} else {
			await createCompetitor(data);
		}
		setEditingCompetitor(null);
	};

	const handleModalClose = (open: boolean) => {
		setModalOpen(open);
		if (!open) {
			setEditingCompetitor(null);
		}
	};

	// Filter competitors
	const filteredCompetitors = competitors.filter((c) => {
		if (priorityFilter !== "all" && c.priority !== priorityFilter) return false;
		return true;
	});

	// Calculate stats
	const analyzedCount = competitors.filter(
		(c) => c.lastAnalyzedAt !== null,
	).length;
	const avgScore =
		competitors.reduce((acc, c) => acc + (c.analysisData?.score || 0), 0) /
		(analyzedCount || 1);

	if (loading) {
		return (
			<div className="flex items-center justify-center py-12">
				<Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
				<span className="ml-3 text-muted-foreground">
					Loading competitors...
				</span>
			</div>
		);
	}

	return (
		<div className="space-y-6">
			{/* Error Banner */}
			{error && (
				<div className="rounded-lg border border-red-200 bg-red-50 p-4">
					<div className="flex items-center gap-3">
						<AlertCircle className="h-5 w-5 text-red-500" />
						<div className="flex-1">
							<p className="text-sm text-red-600">{error}</p>
						</div>
						<Button onClick={clearError} variant="ghost" size="sm">
							Dismiss
						</Button>
					</div>
				</div>
			)}

			{/* Header */}
			<div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
				<div>
					<h2 className="text-xl font-semibold">Competitors</h2>
					<p className="text-sm text-muted-foreground">
						Track and analyze your competitors for SEO insights
					</p>
				</div>
				<div className="flex gap-2">
					<Button onClick={refresh} variant="outline" size="sm">
						<RefreshCw className="mr-2 h-4 w-4" />
						Refresh
					</Button>
					<Button onClick={() => setModalOpen(true)} size="sm">
						<Plus className="mr-2 h-4 w-4" />
						Add Competitor
					</Button>
				</div>
			</div>

			{/* Filters */}
			<div className="flex flex-wrap gap-2 sm:gap-4">
				<Select value={priorityFilter} onValueChange={setPriorityFilter}>
					<SelectTrigger className="w-full sm:w-[150px]">
						<SelectValue placeholder="Priority" />
					</SelectTrigger>
					<SelectContent>
						<SelectItem value="all">All Priority</SelectItem>
						<SelectItem value="high">High</SelectItem>
						<SelectItem value="medium">Medium</SelectItem>
						<SelectItem value="low">Low</SelectItem>
					</SelectContent>
				</Select>
			</div>

			{/* Stats */}
			<div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-4">
				<Card className="p-4">
					<div className="text-2xl font-bold">{competitors.length}</div>
					<div className="text-sm text-muted-foreground">Total Competitors</div>
				</Card>
				<Card className="p-4">
					<div className="text-2xl font-bold text-red-600">
						{competitors.filter((c) => c.priority === "high").length}
					</div>
					<div className="text-sm text-muted-foreground">High Priority</div>
				</Card>
				<Card className="p-4">
					<div className="text-2xl font-bold text-green-600">{analyzedCount}</div>
					<div className="text-sm text-muted-foreground">Analyzed</div>
				</Card>
				<Card className="p-4">
					<div className="text-2xl font-bold text-blue-600">
						{avgScore > 0 ? avgScore.toFixed(0) : "-"}
					</div>
					<div className="text-sm text-muted-foreground">Avg Score</div>
				</Card>
			</div>

			{/* Table */}
			<CompetitorsTable
				competitors={filteredCompetitors}
				analyzing={analyzing}
				onEdit={handleEdit}
				onDelete={handleDelete}
				onAnalyze={analyzeCompetitor}
			/>

			{/* Modal */}
			<CompetitorFormModal
				open={modalOpen}
				onOpenChange={handleModalClose}
				competitor={editingCompetitor}
				onSubmit={handleSubmit}
			/>
		</div>
	);
}
