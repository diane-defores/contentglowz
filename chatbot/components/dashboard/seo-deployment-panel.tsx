"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useSEODeployment } from "@/hooks/use-seo-deployment";
import { SingleRunPanel } from "./deployment/single-run-panel";
import { BatchPanel } from "./deployment/batch-panel";
import { SchedulePanel } from "./deployment/schedule-panel";
import { LogViewerPanel } from "./deployment/log-viewer-panel";

export function SEODeploymentPanel() {
	const deployment = useSEODeployment();

	return (
		<div className="space-y-4">
			<Tabs defaultValue="single" className="w-full">
				<TabsList className="grid w-full grid-cols-4">
					<TabsTrigger value="single">Single Run</TabsTrigger>
					<TabsTrigger value="batch">Batch</TabsTrigger>
					<TabsTrigger value="schedule">Schedule</TabsTrigger>
					<TabsTrigger value="logs">Logs</TabsTrigger>
				</TabsList>
				<TabsContent value="single">
					<SingleRunPanel deployment={deployment} />
				</TabsContent>
				<TabsContent value="batch">
					<BatchPanel deployment={deployment} />
				</TabsContent>
				<TabsContent value="schedule">
					<SchedulePanel deployment={deployment} />
				</TabsContent>
				<TabsContent value="logs">
					<LogViewerPanel deployment={deployment} />
				</TabsContent>
			</Tabs>
		</div>
	);
}
