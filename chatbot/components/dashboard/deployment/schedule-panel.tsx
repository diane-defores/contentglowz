"use client";

import { useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import type { UseSEODeploymentReturn, Schedule } from "@/hooks/use-seo-deployment";

interface SchedulePanelProps {
	deployment: UseSEODeploymentReturn;
}

type ScheduleType = "daily" | "weekly" | "custom";

const CRON_PRESETS: Record<string, string> = {
	daily: "0 9 * * *",
	weekly: "0 9 * * 1",
};

export function SchedulePanel({ deployment }: SchedulePanelProps) {
	const [scheduleType, setScheduleType] = useState<ScheduleType>("daily");
	const [cronExpression, setCronExpression] = useState("0 9 * * *");
	const [topicsText, setTopicsText] = useState("");

	const { schedules, createSchedule, deleteSchedule, toggleSchedule } =
		deployment;

	const topics = topicsText
		.split("\n")
		.map((t) => t.trim())
		.filter((t) => t.length > 0);

	const handleTypeChange = (type: ScheduleType) => {
		setScheduleType(type);
		if (type !== "custom" && CRON_PRESETS[type]) {
			setCronExpression(CRON_PRESETS[type]);
		}
	};

	const handleCreate = async () => {
		if (topics.length === 0) return;
		await createSchedule({
			schedule_type: scheduleType,
			cron_expression: cronExpression,
			topics,
			enabled: true,
		});
		setTopicsText("");
	};

	return (
		<div className="space-y-6 pt-4">
			{/* Create New Schedule */}
			<div className="rounded-lg border p-4 space-y-4">
				<h4 className="font-medium">Create Schedule</h4>

				<div className="grid gap-4 sm:grid-cols-2">
					<div className="space-y-2">
						<Label htmlFor="schedule-type">Schedule Type</Label>
						<Select value={scheduleType} onValueChange={handleTypeChange}>
							<SelectTrigger id="schedule-type">
								<SelectValue placeholder="Select type" />
							</SelectTrigger>
							<SelectContent>
								<SelectItem value="daily">Daily (9 AM)</SelectItem>
								<SelectItem value="weekly">Weekly (Monday 9 AM)</SelectItem>
								<SelectItem value="custom">Custom Cron</SelectItem>
							</SelectContent>
						</Select>
					</div>

					<div className="space-y-2">
						<Label htmlFor="cron">Cron Expression</Label>
						<Input
							id="cron"
							value={cronExpression}
							onChange={(e) => setCronExpression(e.target.value)}
							disabled={scheduleType !== "custom"}
							placeholder="0 9 * * *"
						/>
					</div>
				</div>

				<div className="space-y-2">
					<div className="flex items-center justify-between">
						<Label htmlFor="schedule-topics">Topics (one per line)</Label>
						<span className="text-xs text-muted-foreground">
							{topics.length} topic{topics.length !== 1 ? "s" : ""}
						</span>
					</div>
					<Textarea
						id="schedule-topics"
						placeholder={`topic 1\ntopic 2\ntopic 3`}
						value={topicsText}
						onChange={(e) => setTopicsText(e.target.value)}
						rows={3}
					/>
				</div>

				<Button onClick={handleCreate} disabled={topics.length === 0}>
					<Plus className="mr-2 h-4 w-4" />
					Create Schedule
				</Button>
			</div>

			{/* Existing Schedules */}
			<div className="space-y-3">
				<h4 className="font-medium">Active Schedules</h4>

				{schedules.length === 0 ? (
					<p className="text-sm text-muted-foreground py-4 text-center">
						No schedules configured
					</p>
				) : (
					<div className="space-y-2">
						{schedules.map((schedule) => (
							<ScheduleCard
								key={schedule.id}
								schedule={schedule}
								onToggle={(enabled) => toggleSchedule(schedule.id, enabled)}
								onDelete={() => deleteSchedule(schedule.id)}
							/>
						))}
					</div>
				)}
			</div>
		</div>
	);
}

interface ScheduleCardProps {
	schedule: Schedule;
	onToggle: (enabled: boolean) => void;
	onDelete: () => void;
}

function ScheduleCard({ schedule, onToggle, onDelete }: ScheduleCardProps) {
	return (
		<div className="flex items-center gap-4 rounded-lg border p-3">
			<div className="flex-1 min-w-0">
				<div className="flex items-center gap-2">
					<span className="font-medium text-sm capitalize">
						{schedule.schedule_type}
					</span>
					<code className="text-xs bg-muted px-1.5 py-0.5 rounded">
						{schedule.cron_expression}
					</code>
				</div>
				<p className="text-xs text-muted-foreground truncate mt-1">
					{schedule.topics.length} topic{schedule.topics.length !== 1 ? "s" : ""}
					: {schedule.topics.join(", ")}
				</p>
				{schedule.last_run && (
					<p className="text-xs text-muted-foreground mt-1">
						Last run: {new Date(schedule.last_run).toLocaleString()}
					</p>
				)}
			</div>

			<Switch
				checked={schedule.enabled}
				onCheckedChange={onToggle}
				aria-label="Toggle schedule"
			/>

			<Button
				variant="ghost"
				size="icon"
				onClick={onDelete}
				className="text-muted-foreground hover:text-red-500"
			>
				<Trash2 className="h-4 w-4" />
			</Button>
		</div>
	);
}
