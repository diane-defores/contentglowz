"use client";

import {
	Check,
	Clock,
	Copy,
	FileText,
	Globe,
	Mail,
	Sparkles,
} from "lucide-react";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
	Collapsible,
	CollapsibleContent,
	CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import type { NewsletterResult } from "@/hooks/use-newsletter";

interface NewsletterResultProps {
	result: NewsletterResult;
	onNewNewsletter: () => void;
}

export function NewsletterResultView({
	result,
	onNewNewsletter,
}: NewsletterResultProps) {
	const [copied, setCopied] = useState(false);
	const [rawOpen, setRawOpen] = useState(false);

	const handleCopy = async () => {
		try {
			await navigator.clipboard.writeText(result.content);
			setCopied(true);
			setTimeout(() => setCopied(false), 2000);
		} catch {
			// Clipboard API may not be available
		}
	};

	const formattedDate = new Date(result.created_at).toLocaleDateString(
		undefined,
		{
			year: "numeric",
			month: "long",
			day: "numeric",
			hour: "2-digit",
			minute: "2-digit",
		},
	);

	return (
		<div className="space-y-4">
			{/* Header Card */}
			<Card className="p-6">
				<div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
					<div className="space-y-2 min-w-0 flex-1">
						<h3 className="text-lg font-semibold">{result.subject_line}</h3>
						<p className="text-sm text-muted-foreground">
							{result.preview_text}
						</p>
						<div className="flex flex-wrap gap-2 mt-2">
							<Badge variant="secondary" className="gap-1">
								<FileText className="h-3 w-3" />
								{result.word_count} words
							</Badge>
							<Badge variant="secondary" className="gap-1">
								<Clock className="h-3 w-3" />
								{result.read_time_minutes} min read
							</Badge>
							<Badge variant="outline" className="text-xs">
								{result.newsletter_id}
							</Badge>
						</div>
						<p className="text-xs text-muted-foreground mt-1">
							{formattedDate}
						</p>
					</div>
					<div className="flex gap-2 shrink-0">
						<Button
							variant="outline"
							size="sm"
							onClick={handleCopy}
						>
							{copied ? (
								<>
									<Check className="mr-1.5 h-3.5 w-3.5" />
									Copied!
								</>
							) : (
								<>
									<Copy className="mr-1.5 h-3.5 w-3.5" />
									Copy
								</>
							)}
						</Button>
						<Button size="sm" onClick={onNewNewsletter}>
							<Sparkles className="mr-1.5 h-3.5 w-3.5" />
							New
						</Button>
					</div>
				</div>
			</Card>

			{/* Sections */}
			{result.sections.length > 0 && (
				<div className="space-y-3">
					{result.sections.map((section, i) => (
						<Card key={`${section.title}-${i}`} className="p-5">
							<h4 className="font-semibold mb-2">{section.title}</h4>
							<p className="text-sm text-muted-foreground whitespace-pre-wrap">
								{section.content}
							</p>
						</Card>
					))}
				</div>
			)}

			{/* Raw Content */}
			<Collapsible open={rawOpen} onOpenChange={setRawOpen}>
				<CollapsibleTrigger asChild>
					<Button variant="ghost" size="sm" className="w-full">
						<FileText className="mr-2 h-4 w-4" />
						{rawOpen ? "Hide" : "View"} Raw Content
					</Button>
				</CollapsibleTrigger>
				<CollapsibleContent>
					<Card className="mt-2 p-4">
						<ScrollArea className="h-[400px]">
							<pre className="text-xs whitespace-pre-wrap font-mono">
								{result.content}
							</pre>
						</ScrollArea>
					</Card>
				</CollapsibleContent>
			</Collapsible>

			{/* Sources */}
			{(result.sources.emails.length > 0 ||
				result.sources.web.length > 0) && (
				<Card className="p-5">
					<h4 className="font-semibold mb-3">Sources</h4>
					<div className="space-y-3">
						{result.sources.emails.length > 0 && (
							<div>
								<div className="flex items-center gap-2 mb-1.5">
									<Mail className="h-4 w-4 text-muted-foreground" />
									<span className="text-sm font-medium">Email Sources</span>
								</div>
								<div className="flex flex-wrap gap-1.5">
									{result.sources.emails.map((src) => (
										<Badge key={src} variant="outline" className="text-xs">
											{src}
										</Badge>
									))}
								</div>
							</div>
						)}
						{result.sources.emails.length > 0 &&
							result.sources.web.length > 0 && <Separator />}
						{result.sources.web.length > 0 && (
							<div>
								<div className="flex items-center gap-2 mb-1.5">
									<Globe className="h-4 w-4 text-muted-foreground" />
									<span className="text-sm font-medium">Web Sources</span>
								</div>
								<div className="flex flex-wrap gap-1.5">
									{result.sources.web.map((src) => (
										<Badge key={src} variant="outline" className="text-xs">
											{src}
										</Badge>
									))}
								</div>
							</div>
						)}
					</div>
				</Card>
			)}
		</div>
	);
}
