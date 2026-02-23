"use client";

import { Separator } from "@/components/ui/separator";
import { ContentReviewTab } from "./content-review-tab";
import { EditorialCalendarTab } from "./editorial-calendar-tab";

interface PipelineTabProps {
	projectId?: string;
}

export function PipelineTab({ projectId }: PipelineTabProps) {
	return (
		<div className="space-y-8">
			<ContentReviewTab projectId={projectId} />
			<Separator />
			<EditorialCalendarTab projectId={projectId} />
		</div>
	);
}
