"use client";

import { CalendarDays, Clock, Loader2 } from "lucide-react";
import { useState } from "react";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import type { ContentItem } from "@/hooks/use-content-review";

interface ScheduleContentModalProps {
	item: ContentItem;
	open: boolean;
	onClose: () => void;
	onSchedule: (contentId: string, scheduledFor: string) => Promise<boolean>;
}

export function ScheduleContentModal({
	item,
	open,
	onClose,
	onSchedule,
}: ScheduleContentModalProps) {
	const [date, setDate] = useState(
		format(new Date(), "yyyy-MM-dd"),
	);
	const [time, setTime] = useState("09:00");
	const [scheduling, setScheduling] = useState(false);
	const [error, setError] = useState<string | null>(null);

	const handleSchedule = async () => {
		setScheduling(true);
		setError(null);

		const scheduledFor = `${date}T${time}:00`;

		try {
			const success = await onSchedule(item.id, scheduledFor);
			if (success) {
				onClose();
			} else {
				setError("Failed to schedule content");
			}
		} catch (err) {
			setError(
				err instanceof Error
					? err.message
					: "Failed to schedule content",
			);
		} finally {
			setScheduling(false);
		}
	};

	return (
		<Dialog open={open} onOpenChange={(o) => !o && onClose()}>
			<DialogContent className="max-w-md">
				<DialogHeader>
					<DialogTitle className="flex items-center gap-2 text-base">
						<CalendarDays className="h-4 w-4" />
						Schedule Content
					</DialogTitle>
				</DialogHeader>

				<div className="space-y-4">
					{/* Content summary */}
					<div className="rounded-md border p-3">
						<h4 className="text-sm font-medium truncate">
							{item.title}
						</h4>
						<p className="text-xs text-muted-foreground mt-1">
							{item.contentType} by {item.sourceRobot}
						</p>
					</div>

					{/* Date picker */}
					<div className="space-y-2">
						<label className="text-sm font-medium flex items-center gap-1">
							<CalendarDays className="h-3.5 w-3.5" />
							Date
						</label>
						<input
							type="date"
							value={date}
							onChange={(e) => setDate(e.target.value)}
							min={format(new Date(), "yyyy-MM-dd")}
							className="w-full h-9 rounded-md border border-input bg-background px-3 text-sm"
						/>
					</div>

					{/* Time picker */}
					<div className="space-y-2">
						<label className="text-sm font-medium flex items-center gap-1">
							<Clock className="h-3.5 w-3.5" />
							Time
						</label>
						<input
							type="time"
							value={time}
							onChange={(e) => setTime(e.target.value)}
							className="w-full h-9 rounded-md border border-input bg-background px-3 text-sm"
						/>
					</div>

					{/* Error */}
					{error && (
						<p className="text-xs text-red-600 dark:text-red-400">
							{error}
						</p>
					)}

					{/* Actions */}
					<div className="flex gap-2 justify-end">
						<Button
							variant="outline"
							size="sm"
							onClick={onClose}
							className="h-8"
						>
							Cancel
						</Button>
						<Button
							size="sm"
							onClick={handleSchedule}
							disabled={scheduling || !date || !time}
							className="h-8"
						>
							{scheduling ? (
								<Loader2 className="h-3.5 w-3.5 mr-1 animate-spin" />
							) : (
								<CalendarDays className="h-3.5 w-3.5 mr-1" />
							)}
							Schedule
						</Button>
					</div>
				</div>
			</DialogContent>
		</Dialog>
	);
}
