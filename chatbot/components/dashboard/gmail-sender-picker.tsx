"use client";

import { AlertCircle, Mail, RefreshCw } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import type { SenderInfo } from "@/hooks/use-newsletter";
import { GmailConnectCard } from "./gmail-connect-card";

interface GmailSenderPickerProps {
	senders: SenderInfo[];
	loading: boolean;
	error: string | null;
	selectedEmails: string[];
	onToggle: (email: string) => void;
	onScan: () => void;
	gmailConnected?: boolean | null;
	gmailEmail?: string | null;
	onDisconnectGmail?: () => void;
}

export function GmailSenderPicker({
	senders,
	loading,
	error,
	selectedEmails,
	onToggle,
	onScan,
	gmailConnected,
	gmailEmail,
	onDisconnectGmail,
}: GmailSenderPickerProps) {
	const hasScanned = senders.length > 0 || error !== null;

	// Gmail not connected — show connect card
	if (gmailConnected === false) {
		return (
			<GmailConnectCard
				connected={false}
				onDisconnect={() => {}}
			/>
		);
	}

	// Gmail status loading
	if (gmailConnected === null) {
		return (
			<div className="flex items-center gap-2 py-3">
				<Skeleton className="h-4 w-4 rounded-full" />
				<Skeleton className="h-4 w-32" />
			</div>
		);
	}

	// Error state
	if (error) {
		return (
			<div className="rounded-lg border border-red-200 bg-red-50 dark:border-red-900 dark:bg-red-950/50 p-4 space-y-3">
				<div className="flex items-center gap-2">
					<AlertCircle className="h-4 w-4 text-red-500 shrink-0" />
					<p className="text-sm text-red-600 dark:text-red-400">
						{error}
					</p>
				</div>
				<Button variant="outline" size="sm" onClick={onScan}>
					<RefreshCw className="mr-2 h-3 w-3" />
					Retry
				</Button>
			</div>
		);
	}

	// Loading state
	if (loading) {
		return (
			<div className="space-y-3">
				<p className="text-sm text-muted-foreground">
					Scanning your inbox...
				</p>
				{Array.from({ length: 4 }).map((_, i) => (
					<div key={i} className="flex items-center gap-3">
						<Skeleton className="h-5 w-9 rounded-full" />
						<div className="flex-1 space-y-1.5">
							<Skeleton className="h-4 w-32" />
							<Skeleton className="h-3 w-48" />
						</div>
					</div>
				))}
			</div>
		);
	}

	// Initial state — not yet scanned
	if (!hasScanned) {
		return (
			<Button
				variant="outline"
				className="w-full"
				onClick={onScan}
			>
				<Mail className="mr-2 h-4 w-4" />
				Scan Gmail Inbox
			</Button>
		);
	}

	// Loaded state — sender list
	return (
		<div className="space-y-2">
			<div className="flex items-center justify-between">
				<p className="text-sm text-muted-foreground">
					{senders.length} newsletter sender{senders.length !== 1 ? "s" : ""} found
				</p>
				<Button variant="ghost" size="sm" onClick={onScan}>
					<RefreshCw className="mr-2 h-3 w-3" />
					Rescan
				</Button>
			</div>

			{senders.length === 0 ? (
				<p className="text-sm text-muted-foreground text-center py-4">
					No newsletter senders found in the last 30 days.
				</p>
			) : (
				<ScrollArea className="max-h-[250px]">
					<div className="space-y-1 pr-2">
						{senders.map((sender) => {
							const isSelected = selectedEmails.includes(
								sender.from_email,
							);
							return (
								<label
									key={sender.from_email}
									className="flex items-center gap-3 rounded-lg border p-3 cursor-pointer hover:bg-muted/50 transition-colors"
								>
									<Switch
										checked={isSelected}
										onCheckedChange={() =>
											onToggle(sender.from_email)
										}
									/>
									<div className="min-w-0 flex-1">
										<div className="flex items-center gap-2">
											<span className="text-sm font-medium truncate">
												{sender.from_name ||
													sender.from_email}
											</span>
											<Badge
												variant="secondary"
												className="shrink-0 text-xs"
											>
												{sender.email_count}
											</Badge>
										</div>
										<p className="text-xs text-muted-foreground truncate">
											{sender.latest_subject}
										</p>
									</div>
								</label>
							);
						})}
					</div>
				</ScrollArea>
			)}
		</div>
	);
}
