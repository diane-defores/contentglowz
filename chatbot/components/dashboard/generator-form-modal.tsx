"use client";

import { ChevronDown, Mail, Plus, X } from "lucide-react";
import { type KeyboardEvent, useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
	Collapsible,
	CollapsibleContent,
	CollapsibleTrigger,
} from "@/components/ui/collapsible";
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
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import type { NewsletterGenerator } from "@/lib/db/schema";
import type { GeneratorFormData } from "@/hooks/use-generators";
import type { SenderInfo } from "@/hooks/use-newsletter";
import { GmailSenderPicker } from "./gmail-sender-picker";

interface GeneratorFormModalProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	generator?: NewsletterGenerator | null;
	onSubmit: (data: GeneratorFormData) => Promise<void>;
	senders: SenderInfo[];
	sendersLoading: boolean;
	sendersError: string | null;
	onScanSenders: () => void;
	gmailConnected?: boolean | null;
	gmailEmail?: string | null;
	onDisconnectGmail?: () => void;
}

const EMPTY_FORM: GeneratorFormData = {
	name: "",
	topics: [],
	targetAudience: "",
	tone: "professional",
	competitorEmails: [],
	includeEmailInsights: true,
	maxSections: 5,
	schedule: "manual",
	status: "active",
};

const WEEKDAYS = [
	"Monday",
	"Tuesday",
	"Wednesday",
	"Thursday",
	"Friday",
	"Saturday",
	"Sunday",
];

export function GeneratorFormModal({
	open,
	onOpenChange,
	generator,
	onSubmit,
	senders,
	sendersLoading,
	sendersError,
	onScanSenders,
	gmailConnected,
	gmailEmail,
	onDisconnectGmail,
}: GeneratorFormModalProps) {
	const [loading, setLoading] = useState(false);
	const [formData, setFormData] = useState<GeneratorFormData>(EMPTY_FORM);
	const [topicInput, setTopicInput] = useState("");
	const [competitorInput, setCompetitorInput] = useState("");

	useEffect(() => {
		if (generator) {
			setFormData({
				name: generator.name,
				topics: generator.topics || [],
				targetAudience: generator.targetAudience,
				tone: generator.tone,
				competitorEmails: generator.competitorEmails || [],
				includeEmailInsights: generator.includeEmailInsights,
				maxSections: generator.maxSections,
				schedule: generator.schedule,
				scheduleDay: generator.scheduleDay ?? undefined,
				scheduleTime: generator.scheduleTime ?? undefined,
				status: generator.status,
			});
		} else {
			setFormData(EMPTY_FORM);
		}
		setTopicInput("");
		setCompetitorInput("");
	}, [generator, open]);

	const update = (partial: Partial<GeneratorFormData>) => {
		setFormData((prev) => ({ ...prev, ...partial }));
	};

	const addTopic = () => {
		const value = topicInput.trim();
		if (value && !formData.topics.includes(value)) {
			update({ topics: [...formData.topics, value] });
			setTopicInput("");
		}
	};

	const removeTopic = (topic: string) => {
		update({ topics: formData.topics.filter((t) => t !== topic) });
	};

	const handleTopicKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
		if (e.key === "Enter" || e.key === ",") {
			e.preventDefault();
			addTopic();
		}
	};

	const addCompetitor = () => {
		const value = competitorInput.trim();
		if (value && !formData.competitorEmails.includes(value)) {
			update({
				competitorEmails: [...formData.competitorEmails, value],
			});
			setCompetitorInput("");
		}
	};

	const removeCompetitor = (email: string) => {
		update({
			competitorEmails: formData.competitorEmails.filter(
				(e) => e !== email,
			),
		});
	};

	const handleCompetitorKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
		if (e.key === "Enter" || e.key === ",") {
			e.preventDefault();
			addCompetitor();
		}
	};

	const toggleSender = (email: string) => {
		if (formData.competitorEmails.includes(email)) {
			update({
				competitorEmails: formData.competitorEmails.filter(
					(e) => e !== email,
				),
			});
		} else {
			update({
				competitorEmails: [...formData.competitorEmails, email],
			});
		}
	};

	const isValid =
		formData.name.trim() !== "" &&
		formData.topics.length > 0 &&
		formData.targetAudience.trim() !== "";

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		setLoading(true);

		try {
			await onSubmit(formData);
			onOpenChange(false);
		} catch {
			// Error is shown in the parent error banner; keep modal open
		} finally {
			setLoading(false);
		}
	};

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
				<DialogHeader>
					<DialogTitle>
						{generator
							? "Edit Generator"
							: "Register Newsletter Generator"}
					</DialogTitle>
					<DialogDescription>
						{generator
							? "Update the generator configuration."
							: "Configure a newsletter generator that can be scheduled or run on demand."}
					</DialogDescription>
				</DialogHeader>

				<form onSubmit={handleSubmit} className="space-y-4">
					{/* Name */}
					<div className="space-y-2">
						<Label htmlFor="gen-name">Name *</Label>
						<Input
							id="gen-name"
							placeholder="e.g. Weekly SEO Insights"
							value={formData.name}
							onChange={(e) => update({ name: e.target.value })}
							required
						/>
					</div>

					{/* Target Audience + Tone */}
					<div className="grid gap-4 sm:grid-cols-2">
						<div className="space-y-2">
							<Label htmlFor="gen-audience">
								Target Audience *
							</Label>
							<Input
								id="gen-audience"
								placeholder="e.g. SaaS founders and marketers"
								value={formData.targetAudience}
								onChange={(e) =>
									update({
										targetAudience: e.target.value,
									})
								}
								required
							/>
						</div>
						<div className="space-y-2">
							<Label htmlFor="gen-tone">Tone</Label>
							<Select
								value={formData.tone}
								onValueChange={(v) =>
									update({
										tone: v as GeneratorFormData["tone"],
									})
								}
							>
								<SelectTrigger id="gen-tone">
									<SelectValue />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value="professional">
										Professional
									</SelectItem>
									<SelectItem value="casual">
										Casual
									</SelectItem>
									<SelectItem value="friendly">
										Friendly
									</SelectItem>
									<SelectItem value="educational">
										Educational
									</SelectItem>
								</SelectContent>
							</Select>
						</div>
					</div>

					{/* Topics */}
					<div className="space-y-2">
						<Label>Topics *</Label>
						<div className="flex gap-2">
							<Input
								placeholder="Add a topic and press Enter"
								value={topicInput}
								onChange={(e) => setTopicInput(e.target.value)}
								onKeyDown={handleTopicKeyDown}
							/>
							<Button
								type="button"
								variant="outline"
								size="icon"
								onClick={addTopic}
								disabled={!topicInput.trim()}
							>
								<Plus className="h-4 w-4" />
							</Button>
						</div>
						{formData.topics.length > 0 && (
							<div className="flex flex-wrap gap-2 mt-2">
								{formData.topics.map((topic) => (
									<Badge
										key={topic}
										variant="secondary"
										className="gap-1 pr-1"
									>
										{topic}
										<button
											type="button"
											onClick={() => removeTopic(topic)}
											className="ml-1 rounded-full hover:bg-muted p-0.5"
										>
											<X className="h-3 w-3" />
										</button>
									</Badge>
								))}
							</div>
						)}
					</div>

					{/* Max Sections + Include Email Insights */}
					<div className="grid gap-4 sm:grid-cols-2">
						<div className="space-y-2">
							<Label>
								Max Sections: {formData.maxSections}
							</Label>
							<Slider
								value={[formData.maxSections]}
								onValueChange={([v]) =>
									update({ maxSections: v })
								}
								min={1}
								max={10}
								step={1}
							/>
						</div>
						<div className="flex items-center justify-between space-x-2 pt-6">
							<Label
								htmlFor="gen-email-insights"
								className="cursor-pointer"
							>
								Email Insights
							</Label>
							<Switch
								id="gen-email-insights"
								checked={formData.includeEmailInsights}
								onCheckedChange={(v) =>
									update({ includeEmailInsights: v })
								}
							/>
						</div>
					</div>

					{/* Competitor Emails */}
					<div className="space-y-3">
						<Label>Competitor Emails (optional)</Label>
						<div className="flex gap-2">
							<Input
								placeholder="competitor@newsletter.com"
								value={competitorInput}
								onChange={(e) =>
									setCompetitorInput(e.target.value)
								}
								onKeyDown={handleCompetitorKeyDown}
							/>
							<Button
								type="button"
								variant="outline"
								size="icon"
								onClick={addCompetitor}
								disabled={!competitorInput.trim()}
							>
								<Plus className="h-4 w-4" />
							</Button>
						</div>
						{formData.competitorEmails.length > 0 && (
							<div className="flex flex-wrap gap-2">
								{formData.competitorEmails.map((email) => (
									<Badge
										key={email}
										variant="secondary"
										className="gap-1 pr-1"
									>
										{email}
										<button
											type="button"
											onClick={() =>
												removeCompetitor(email)
											}
											className="ml-1 rounded-full hover:bg-muted p-0.5"
										>
											<X className="h-3 w-3" />
										</button>
									</Badge>
								))}
							</div>
						)}

						{/* Gmail scanner — collapsible, requires backend */}
						<Collapsible>
							<CollapsibleTrigger asChild>
								<Button
									type="button"
									variant="ghost"
									size="sm"
									className="w-full justify-between text-xs text-muted-foreground"
								>
									<span className="flex items-center gap-1.5">
										<Mail className="h-3.5 w-3.5" />
										Import from Gmail inbox
									</span>
									<ChevronDown className="h-3.5 w-3.5" />
								</Button>
							</CollapsibleTrigger>
							<CollapsibleContent className="pt-2">
								<GmailSenderPicker
									senders={senders}
									loading={sendersLoading}
									error={sendersError}
									selectedEmails={
										formData.competitorEmails
									}
									onToggle={toggleSender}
									onScan={onScanSenders}
									gmailConnected={gmailConnected}
									gmailEmail={gmailEmail}
									onDisconnectGmail={onDisconnectGmail}
								/>
							</CollapsibleContent>
						</Collapsible>
					</div>

					{/* Schedule */}
					<div className="space-y-3 border-t pt-4">
						<Label className="text-base font-semibold">
							Schedule
						</Label>
						<div className="grid gap-4 sm:grid-cols-2">
							<div className="space-y-2">
								<Label htmlFor="gen-schedule">Frequency</Label>
								<Select
									value={formData.schedule}
									onValueChange={(v) =>
										update({
											schedule:
												v as GeneratorFormData["schedule"],
											scheduleDay: undefined,
											scheduleTime: undefined,
										})
									}
								>
									<SelectTrigger id="gen-schedule">
										<SelectValue />
									</SelectTrigger>
									<SelectContent>
										<SelectItem value="manual">
											Manual
										</SelectItem>
										<SelectItem value="daily">
											Daily
										</SelectItem>
										<SelectItem value="weekly">
											Weekly
										</SelectItem>
										<SelectItem value="monthly">
											Monthly
										</SelectItem>
									</SelectContent>
								</Select>
							</div>

							{formData.schedule === "weekly" && (
								<div className="space-y-2">
									<Label htmlFor="gen-day">Day</Label>
									<Select
										value={String(
											formData.scheduleDay ?? 0,
										)}
										onValueChange={(v) =>
											update({
												scheduleDay: Number(v),
											})
										}
									>
										<SelectTrigger id="gen-day">
											<SelectValue />
										</SelectTrigger>
										<SelectContent>
											{WEEKDAYS.map((day, i) => (
												<SelectItem
													key={day}
													value={String(i)}
												>
													{day}
												</SelectItem>
											))}
										</SelectContent>
									</Select>
								</div>
							)}

							{formData.schedule === "monthly" && (
								<div className="space-y-2">
									<Label htmlFor="gen-day-month">
										Day of Month
									</Label>
									<Select
										value={String(
											formData.scheduleDay ?? 1,
										)}
										onValueChange={(v) =>
											update({
												scheduleDay: Number(v),
											})
										}
									>
										<SelectTrigger id="gen-day-month">
											<SelectValue />
										</SelectTrigger>
										<SelectContent>
											{Array.from(
												{ length: 28 },
												(_, i) => (
													<SelectItem
														key={i + 1}
														value={String(i + 1)}
													>
														{i + 1}
													</SelectItem>
												),
											)}
										</SelectContent>
									</Select>
								</div>
							)}
						</div>

						{formData.schedule !== "manual" && (
							<div className="space-y-2">
								<Label htmlFor="gen-time">Time</Label>
								<Input
									id="gen-time"
									type="time"
									value={formData.scheduleTime || "09:00"}
									onChange={(e) =>
										update({
											scheduleTime: e.target.value,
										})
									}
								/>
							</div>
						)}
					</div>

					<DialogFooter>
						<Button
							type="button"
							variant="outline"
							onClick={() => onOpenChange(false)}
						>
							Cancel
						</Button>
						<Button
							type="submit"
							disabled={loading || !isValid}
						>
							{loading
								? "Saving..."
								: generator
									? "Update"
									: "Create"}
						</Button>
					</DialogFooter>
				</form>
			</DialogContent>
		</Dialog>
	);
}
