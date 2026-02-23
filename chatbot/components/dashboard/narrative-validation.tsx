"use client";

import { Check, X } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import type { CreatorProfile, NarrativeUpdate } from "@/hooks/use-psychology";

interface NarrativeValidationProps {
	updates: NarrativeUpdate[];
	currentProfile: CreatorProfile | null;
	onReview: (updateId: string, approved: boolean) => Promise<any>;
}

export function NarrativeValidation({
	updates,
	currentProfile,
	onReview,
}: NarrativeValidationProps) {
	const [reviewing, setReviewing] = useState<string | null>(null);

	const handleReview = async (updateId: string, approved: boolean) => {
		setReviewing(updateId);
		try {
			await onReview(updateId, approved);
		} finally {
			setReviewing(null);
		}
	};

	return (
		<Card className="border-yellow-200 bg-yellow-50/50 p-6 dark:border-yellow-800 dark:bg-yellow-950/20">
			<h2 className="mb-4 text-lg font-semibold">
				Narrative Updates to Review ({updates.length})
			</h2>
			<p className="mb-4 text-sm text-muted-foreground">
				The AI synthesized your entries. Review proposed changes before they&apos;re applied to your profile.
			</p>

			<div className="space-y-4">
				{updates.map((update) => (
					<div key={update.id} className="rounded-lg border bg-background p-4">
						{/* Narrative summary */}
						{update.narrativeSummary && (
							<p className="mb-3 text-sm">{update.narrativeSummary}</p>
						)}

						{/* Side-by-side diffs */}
						<div className="grid gap-4 md:grid-cols-2">
							{/* Voice delta */}
							{update.voiceDelta && Object.keys(update.voiceDelta).length > 0 && (
								<div>
									<h4 className="mb-1 text-xs font-medium uppercase text-muted-foreground">
										Voice Changes
									</h4>
									<div className="rounded border p-2 text-xs">
										<div className="mb-1 text-muted-foreground">Current:</div>
										<pre className="whitespace-pre-wrap text-red-600 dark:text-red-400">
											{JSON.stringify(currentProfile?.voice || {}, null, 2)}
										</pre>
										<div className="mb-1 mt-2 text-muted-foreground">Proposed:</div>
										<pre className="whitespace-pre-wrap text-green-600 dark:text-green-400">
											{JSON.stringify(update.voiceDelta, null, 2)}
										</pre>
									</div>
								</div>
							)}

							{/* Positioning delta */}
							{update.positioningDelta && Object.keys(update.positioningDelta).length > 0 && (
								<div>
									<h4 className="mb-1 text-xs font-medium uppercase text-muted-foreground">
										Positioning Changes
									</h4>
									<div className="rounded border p-2 text-xs">
										<div className="mb-1 text-muted-foreground">Current:</div>
										<pre className="whitespace-pre-wrap text-red-600 dark:text-red-400">
											{JSON.stringify(currentProfile?.positioning || {}, null, 2)}
										</pre>
										<div className="mb-1 mt-2 text-muted-foreground">Proposed:</div>
										<pre className="whitespace-pre-wrap text-green-600 dark:text-green-400">
											{JSON.stringify(update.positioningDelta, null, 2)}
										</pre>
									</div>
								</div>
							)}
						</div>

						{/* Actions */}
						<div className="mt-3 flex gap-2">
							<Button
								size="sm"
								variant="default"
								onClick={() => handleReview(update.id, true)}
								disabled={reviewing === update.id}
							>
								<Check className="mr-1 h-4 w-4" />
								Approve
							</Button>
							<Button
								size="sm"
								variant="outline"
								onClick={() => handleReview(update.id, false)}
								disabled={reviewing === update.id}
							>
								<X className="mr-1 h-4 w-4" />
								Reject
							</Button>
						</div>
					</div>
				))}
			</div>
		</Card>
	);
}
