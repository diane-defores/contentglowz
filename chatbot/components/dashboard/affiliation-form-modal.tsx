"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import type { AffiliateLink } from "@/lib/db/schema";
import type { AffiliationFormData } from "@/hooks/use-affiliations";

interface AffiliationFormModalProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	affiliation?: AffiliateLink | null;
	onSubmit: (data: AffiliationFormData) => Promise<void>;
}

const categories = [
	"tech",
	"finance",
	"lifestyle",
	"health",
	"education",
	"travel",
	"food",
	"fashion",
	"sports",
	"other",
];

export function AffiliationFormModal({
	open,
	onOpenChange,
	affiliation,
	onSubmit,
}: AffiliationFormModalProps) {
	const [loading, setLoading] = useState(false);
	const [formData, setFormData] = useState<AffiliationFormData>({
		name: "",
		url: "",
		category: "",
		commission: "",
		keywords: [],
		status: "active",
		notes: "",
		expiresAt: "",
	});
	const [keywordsInput, setKeywordsInput] = useState("");

	useEffect(() => {
		if (affiliation) {
			setFormData({
				name: affiliation.name,
				url: affiliation.url,
				category: affiliation.category || "",
				commission: affiliation.commission || "",
				keywords: affiliation.keywords || [],
				status: affiliation.status,
				notes: affiliation.notes || "",
				expiresAt: affiliation.expiresAt
					? new Date(affiliation.expiresAt).toISOString().split("T")[0]
					: "",
			});
			setKeywordsInput(affiliation.keywords?.join(", ") || "");
		} else {
			setFormData({
				name: "",
				url: "",
				category: "",
				commission: "",
				keywords: [],
				status: "active",
				notes: "",
				expiresAt: "",
			});
			setKeywordsInput("");
		}
	}, [affiliation, open]);

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		setLoading(true);

		try {
			const keywords = keywordsInput
				.split(",")
				.map((k) => k.trim())
				.filter(Boolean);

			await onSubmit({
				...formData,
				keywords,
			});
			onOpenChange(false);
		} finally {
			setLoading(false);
		}
	};

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="max-w-md">
				<DialogHeader>
					<DialogTitle>
						{affiliation ? "Edit Affiliate Link" : "Add Affiliate Link"}
					</DialogTitle>
					<DialogDescription>
						{affiliation
							? "Update the affiliate link details."
							: "Add a new affiliate link to be used by AI when generating content."}
					</DialogDescription>
				</DialogHeader>

				<form onSubmit={handleSubmit} className="space-y-4">
					<div className="space-y-2">
						<Label htmlFor="name">Name *</Label>
						<Input
							id="name"
							value={formData.name}
							onChange={(e) =>
								setFormData((prev) => ({ ...prev, name: e.target.value }))
							}
							placeholder="Amazon Associates"
							required
						/>
					</div>

					<div className="space-y-2">
						<Label htmlFor="url">URL *</Label>
						<Input
							id="url"
							type="url"
							value={formData.url}
							onChange={(e) =>
								setFormData((prev) => ({ ...prev, url: e.target.value }))
							}
							placeholder="https://affiliate.example.com/ref=123"
							required
						/>
					</div>

					<div className="grid grid-cols-2 gap-4">
						<div className="space-y-2">
							<Label htmlFor="category">Category</Label>
							<Select
								value={formData.category}
								onValueChange={(value) =>
									setFormData((prev) => ({ ...prev, category: value }))
								}
							>
								<SelectTrigger>
									<SelectValue placeholder="Select category" />
								</SelectTrigger>
								<SelectContent>
									{categories.map((cat) => (
										<SelectItem key={cat} value={cat}>
											{cat.charAt(0).toUpperCase() + cat.slice(1)}
										</SelectItem>
									))}
								</SelectContent>
							</Select>
						</div>

						<div className="space-y-2">
							<Label htmlFor="commission">Commission</Label>
							<Input
								id="commission"
								value={formData.commission}
								onChange={(e) =>
									setFormData((prev) => ({ ...prev, commission: e.target.value }))
								}
								placeholder="5% or $10/sale"
							/>
						</div>
					</div>

					<div className="space-y-2">
						<Label htmlFor="keywords">Keywords (comma-separated)</Label>
						<Input
							id="keywords"
							value={keywordsInput}
							onChange={(e) => setKeywordsInput(e.target.value)}
							placeholder="hosting, wordpress, website"
						/>
						<p className="text-xs text-muted-foreground">
							AI will use these keywords to match content topics
						</p>
					</div>

					<div className="grid grid-cols-2 gap-4">
						<div className="space-y-2">
							<Label htmlFor="status">Status</Label>
							<Select
								value={formData.status}
								onValueChange={(value: "active" | "expired" | "paused") =>
									setFormData((prev) => ({ ...prev, status: value }))
								}
							>
								<SelectTrigger>
									<SelectValue />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value="active">Active</SelectItem>
									<SelectItem value="paused">Paused</SelectItem>
									<SelectItem value="expired">Expired</SelectItem>
								</SelectContent>
							</Select>
						</div>

						<div className="space-y-2">
							<Label htmlFor="expiresAt">Expires</Label>
							<Input
								id="expiresAt"
								type="date"
								value={formData.expiresAt}
								onChange={(e) =>
									setFormData((prev) => ({ ...prev, expiresAt: e.target.value }))
								}
							/>
						</div>
					</div>

					<div className="space-y-2">
						<Label htmlFor="notes">Notes for AI</Label>
						<Textarea
							id="notes"
							value={formData.notes}
							onChange={(e) =>
								setFormData((prev) => ({ ...prev, notes: e.target.value }))
							}
							placeholder="Instructions for when and how to use this link..."
							rows={3}
						/>
					</div>

					<DialogFooter>
						<Button
							type="button"
							variant="outline"
							onClick={() => onOpenChange(false)}
						>
							Cancel
						</Button>
						<Button type="submit" disabled={loading}>
							{loading ? "Saving..." : affiliation ? "Update" : "Create"}
						</Button>
					</DialogFooter>
				</form>
			</DialogContent>
		</Dialog>
	);
}
