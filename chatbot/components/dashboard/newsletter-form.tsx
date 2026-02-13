"use client";

import {
	AlertCircle,
	Loader2,
	Plus,
	Sparkles,
	X,
} from "lucide-react";
import { type KeyboardEvent, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
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
import type { NewsletterFormData, SenderInfo } from "@/hooks/use-newsletter";
import { GmailSenderPicker } from "./gmail-sender-picker";

interface NewsletterFormProps {
	formData: NewsletterFormData;
	onFormChange: (data: NewsletterFormData) => void;
	onSubmit: () => void;
	generating: boolean;
	configReady: boolean | null;
	senders: SenderInfo[];
	sendersLoading: boolean;
	sendersError: string | null;
	onScanSenders: () => void;
	gmailConnected?: boolean | null;
	gmailEmail?: string | null;
	onDisconnectGmail?: () => void;
}

export function NewsletterForm({
	formData,
	onFormChange,
	onSubmit,
	generating,
	configReady,
	senders,
	sendersLoading,
	sendersError,
	onScanSenders,
	gmailConnected,
	gmailEmail,
	onDisconnectGmail,
}: NewsletterFormProps) {
	const [topicInput, setTopicInput] = useState("");
	const [competitorInput, setCompetitorInput] = useState("");

	const update = (partial: Partial<NewsletterFormData>) => {
		onFormChange({ ...formData, ...partial });
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
		if (value && !formData.competitor_emails.includes(value)) {
			update({ competitor_emails: [...formData.competitor_emails, value] });
			setCompetitorInput("");
		}
	};

	const removeCompetitor = (email: string) => {
		update({
			competitor_emails: formData.competitor_emails.filter(
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
		if (formData.competitor_emails.includes(email)) {
			update({
				competitor_emails: formData.competitor_emails.filter(
					(e) => e !== email,
				),
			});
		} else {
			update({
				competitor_emails: [...formData.competitor_emails, email],
			});
		}
	};

	const isValid =
		formData.name.trim() !== "" &&
		formData.topics.length > 0 &&
		formData.target_audience.trim() !== "";

	return (
		<Card className="p-6 space-y-6">
			{/* Config warning */}
			{configReady === false && (
				<div className="rounded-lg border border-yellow-200 bg-yellow-50 dark:border-yellow-900 dark:bg-yellow-950/50 p-4">
					<div className="flex items-center gap-3">
						<AlertCircle className="h-5 w-5 text-yellow-600 dark:text-yellow-400 shrink-0" />
						<div>
							<p className="text-sm font-medium text-yellow-800 dark:text-yellow-200">
								Configuration incomplete
							</p>
							<p className="text-sm text-yellow-700 dark:text-yellow-300">
								Some newsletter dependencies are not configured. Generation may
								fail. Check API keys and Gmail setup.
							</p>
						</div>
					</div>
				</div>
			)}

			{/* Newsletter Name */}
			<div className="space-y-2">
				<Label htmlFor="newsletter-name">Newsletter Name</Label>
				<Input
					id="newsletter-name"
					placeholder="e.g. Weekly SEO Insights"
					value={formData.name}
					onChange={(e) => update({ name: e.target.value })}
				/>
			</div>

			{/* Target Audience + Tone */}
			<div className="grid gap-4 sm:grid-cols-2">
				<div className="space-y-2">
					<Label htmlFor="target-audience">Target Audience</Label>
					<Input
						id="target-audience"
						placeholder="e.g. SaaS founders and marketers"
						value={formData.target_audience}
						onChange={(e) => update({ target_audience: e.target.value })}
					/>
				</div>
				<div className="space-y-2">
					<Label htmlFor="tone">Tone</Label>
					<Select
						value={formData.tone}
						onValueChange={(v) =>
							update({
								tone: v as NewsletterFormData["tone"],
							})
						}
					>
						<SelectTrigger id="tone">
							<SelectValue />
						</SelectTrigger>
						<SelectContent>
							<SelectItem value="professional">Professional</SelectItem>
							<SelectItem value="casual">Casual</SelectItem>
							<SelectItem value="friendly">Friendly</SelectItem>
							<SelectItem value="educational">Educational</SelectItem>
						</SelectContent>
					</Select>
				</div>
			</div>

			{/* Topics */}
			<div className="space-y-2">
				<Label>Topics</Label>
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
							<Badge key={topic} variant="secondary" className="gap-1 pr-1">
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
					<Label>Max Sections: {formData.max_sections}</Label>
					<Slider
						value={[formData.max_sections]}
						onValueChange={([v]) => update({ max_sections: v })}
						min={1}
						max={10}
						step={1}
					/>
				</div>
				<div className="flex items-center justify-between space-x-2 pt-6">
					<Label htmlFor="email-insights" className="cursor-pointer">
						Include Email Insights
					</Label>
					<Switch
						id="email-insights"
						checked={formData.include_email_insights}
						onCheckedChange={(v) => update({ include_email_insights: v })}
					/>
				</div>
			</div>

			{/* Competitor Emails */}
			<div className="space-y-4">
				<Label>Competitor Emails (optional)</Label>

				{/* Gmail Sender Picker */}
				<GmailSenderPicker
					senders={senders}
					loading={sendersLoading}
					error={sendersError}
					selectedEmails={formData.competitor_emails}
					onToggle={toggleSender}
					onScan={onScanSenders}
					gmailConnected={gmailConnected}
					gmailEmail={gmailEmail}
					onDisconnectGmail={onDisconnectGmail}
				/>

				{/* Manual input */}
				<div className="space-y-2">
					<Label className="text-xs text-muted-foreground">
						Or type an email address...
					</Label>
					<div className="flex gap-2">
						<Input
							placeholder="competitor@newsletter.com"
							value={competitorInput}
							onChange={(e) => setCompetitorInput(e.target.value)}
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
				</div>

				{/* Selected emails badges */}
				{formData.competitor_emails.length > 0 && (
					<div className="flex flex-wrap gap-2">
						{formData.competitor_emails.map((email) => (
							<Badge key={email} variant="secondary" className="gap-1 pr-1">
								{email}
								<button
									type="button"
									onClick={() => removeCompetitor(email)}
									className="ml-1 rounded-full hover:bg-muted p-0.5"
								>
									<X className="h-3 w-3" />
								</button>
							</Badge>
						))}
					</div>
				)}
			</div>

			{/* Submit */}
			<Button
				onClick={onSubmit}
				disabled={generating || !isValid}
				className="w-full"
				size="lg"
			>
				{generating ? (
					<>
						<Loader2 className="mr-2 h-4 w-4 animate-spin" />
						Generating...
					</>
				) : (
					<>
						<Sparkles className="mr-2 h-4 w-4" />
						Generate Newsletter
					</>
				)}
			</Button>
		</Card>
	);
}
