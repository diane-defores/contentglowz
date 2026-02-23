"use client";

import { AlertCircle, Loader2, Plus, RefreshCw } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useConfirm } from "@/hooks/use-confirm";
import { Card } from "@/components/ui/card";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import type { AffiliateLink } from "@/lib/db/schema";
import {
	useAffiliations,
	type AffiliationFormData,
} from "@/hooks/use-affiliations";
import { AffiliationFormModal } from "./affiliation-form-modal";
import { AffiliationsTable } from "./affiliations-table";

interface AffiliationsTabProps {
	projectId?: string;
}

export function AffiliationsTab({ projectId }: AffiliationsTabProps) {
	const {
		affiliations,
		loading,
		error,
		refresh,
		createAffiliation,
		updateAffiliation,
		deleteAffiliation,
		clearError,
	} = useAffiliations(projectId);

	const [modalOpen, setModalOpen] = useState(false);
	const [editingAffiliation, setEditingAffiliation] =
		useState<AffiliateLink | null>(null);
	const [statusFilter, setStatusFilter] = useState<string>("all");
	const [categoryFilter, setCategoryFilter] = useState<string>("all");
	const { confirm, ConfirmDialog } = useConfirm();

	const handleEdit = (affiliation: AffiliateLink) => {
		setEditingAffiliation(affiliation);
		setModalOpen(true);
	};

	const handleDelete = async (id: string) => {
		const ok = await confirm({
			title: "Delete affiliate link",
			description: "Are you sure you want to delete this affiliate link?",
			confirmLabel: "Delete",
			destructive: true,
		});
		if (ok) await deleteAffiliation(id);
	};

	const handleSubmit = async (data: AffiliationFormData) => {
		if (editingAffiliation) {
			await updateAffiliation(editingAffiliation.id, data);
		} else {
			await createAffiliation(data);
		}
		setEditingAffiliation(null);
	};

	const handleModalClose = (open: boolean) => {
		setModalOpen(open);
		if (!open) {
			setEditingAffiliation(null);
		}
	};

	// Filter affiliations
	const filteredAffiliations = affiliations.filter((a) => {
		if (statusFilter !== "all" && a.status !== statusFilter) return false;
		if (categoryFilter !== "all" && a.category !== categoryFilter) return false;
		return true;
	});

	// Get unique categories
	const categories = [
		...new Set(affiliations.map((a) => a.category).filter(Boolean)),
	] as string[];

	if (loading) {
		return (
			<div className="flex items-center justify-center py-12">
				<Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
				<span className="ml-3 text-muted-foreground">
					Loading affiliate links...
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
					<h2 className="text-xl font-semibold">Affiliate Links</h2>
					<p className="text-sm text-muted-foreground">
						Manage affiliate links that AI can include in generated content
					</p>
				</div>
				<div className="flex gap-2">
					<Button onClick={refresh} variant="outline" size="sm">
						<RefreshCw className="mr-2 h-4 w-4" />
						Refresh
					</Button>
					<Button onClick={() => setModalOpen(true)} size="sm">
						<Plus className="mr-2 h-4 w-4" />
						Add Link
					</Button>
				</div>
			</div>

			{/* Filters */}
			<div className="flex flex-col sm:flex-row gap-2 sm:gap-4">
				<Select value={statusFilter} onValueChange={setStatusFilter}>
					<SelectTrigger className="w-full sm:w-[150px]">
						<SelectValue placeholder="Status" />
					</SelectTrigger>
					<SelectContent>
						<SelectItem value="all">All Status</SelectItem>
						<SelectItem value="active">Active</SelectItem>
						<SelectItem value="paused">Paused</SelectItem>
						<SelectItem value="expired">Expired</SelectItem>
					</SelectContent>
				</Select>

				<Select value={categoryFilter} onValueChange={setCategoryFilter}>
					<SelectTrigger className="w-full sm:w-[150px]">
						<SelectValue placeholder="Category" />
					</SelectTrigger>
					<SelectContent>
						<SelectItem value="all">All Categories</SelectItem>
						{categories.map((cat) => (
							<SelectItem key={cat} value={cat}>
								{cat.charAt(0).toUpperCase() + cat.slice(1)}
							</SelectItem>
						))}
					</SelectContent>
				</Select>
			</div>

			{/* Stats */}
			<div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-4">
				<Card className="p-4">
					<div className="text-2xl font-bold">{affiliations.length}</div>
					<div className="text-sm text-muted-foreground">Total Links</div>
				</Card>
				<Card className="p-4">
					<div className="text-2xl font-bold text-green-600">
						{affiliations.filter((a) => a.status === "active").length}
					</div>
					<div className="text-sm text-muted-foreground">Active</div>
				</Card>
				<Card className="p-4">
					<div className="text-2xl font-bold text-yellow-600">
						{affiliations.filter((a) => a.status === "paused").length}
					</div>
					<div className="text-sm text-muted-foreground">Paused</div>
				</Card>
				<Card className="p-4">
					<div className="text-2xl font-bold text-red-600">
						{affiliations.filter((a) => a.status === "expired").length}
					</div>
					<div className="text-sm text-muted-foreground">Expired</div>
				</Card>
			</div>

			{/* Table */}
			<Card className="p-6">
				<AffiliationsTable
					affiliations={filteredAffiliations}
					onEdit={handleEdit}
					onDelete={handleDelete}
				/>
			</Card>

			{/* Modal */}
			<AffiliationFormModal
				open={modalOpen}
				onOpenChange={handleModalClose}
				affiliation={editingAffiliation}
				onSubmit={handleSubmit}
			/>

			<ConfirmDialog />
		</div>
	);
}
