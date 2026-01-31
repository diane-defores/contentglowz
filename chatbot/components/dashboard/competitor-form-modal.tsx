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
import type { Competitor } from "@/lib/db/schema";
import type { CompetitorFormData } from "@/hooks/use-competitors";

interface CompetitorFormModalProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	competitor?: Competitor | null;
	onSubmit: (data: CompetitorFormData) => Promise<void>;
}

export function CompetitorFormModal({
	open,
	onOpenChange,
	competitor,
	onSubmit,
}: CompetitorFormModalProps) {
	const [loading, setLoading] = useState(false);
	const [formData, setFormData] = useState<CompetitorFormData>({
		name: "",
		url: "",
		niche: "",
		priority: "medium",
		notes: "",
	});

	useEffect(() => {
		if (competitor) {
			setFormData({
				name: competitor.name,
				url: competitor.url,
				niche: competitor.niche || "",
				priority: competitor.priority,
				notes: competitor.notes || "",
			});
		} else {
			setFormData({
				name: "",
				url: "",
				niche: "",
				priority: "medium",
				notes: "",
			});
		}
	}, [competitor, open]);

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		setLoading(true);

		try {
			await onSubmit(formData);
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
						{competitor ? "Edit Competitor" : "Add Competitor"}
					</DialogTitle>
					<DialogDescription>
						{competitor
							? "Update the competitor details."
							: "Add a new competitor to track and analyze."}
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
							placeholder="Competitor Name"
							required
						/>
					</div>

					<div className="space-y-2">
						<Label htmlFor="url">Website URL *</Label>
						<Input
							id="url"
							type="url"
							value={formData.url}
							onChange={(e) =>
								setFormData((prev) => ({ ...prev, url: e.target.value }))
							}
							placeholder="https://competitor.com"
							required
						/>
					</div>

					<div className="grid grid-cols-2 gap-4">
						<div className="space-y-2">
							<Label htmlFor="niche">Niche</Label>
							<Input
								id="niche"
								value={formData.niche}
								onChange={(e) =>
									setFormData((prev) => ({ ...prev, niche: e.target.value }))
								}
								placeholder="e.g., SEO, Marketing"
							/>
						</div>

						<div className="space-y-2">
							<Label htmlFor="priority">Priority</Label>
							<Select
								value={formData.priority}
								onValueChange={(value: "high" | "medium" | "low") =>
									setFormData((prev) => ({ ...prev, priority: value }))
								}
							>
								<SelectTrigger>
									<SelectValue />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value="high">High</SelectItem>
									<SelectItem value="medium">Medium</SelectItem>
									<SelectItem value="low">Low</SelectItem>
								</SelectContent>
							</Select>
						</div>
					</div>

					<div className="space-y-2">
						<Label htmlFor="notes">Notes</Label>
						<Textarea
							id="notes"
							value={formData.notes}
							onChange={(e) =>
								setFormData((prev) => ({ ...prev, notes: e.target.value }))
							}
							placeholder="Additional notes about this competitor..."
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
							{loading ? "Saving..." : competitor ? "Update" : "Create"}
						</Button>
					</DialogFooter>
				</form>
			</DialogContent>
		</Dialog>
	);
}
