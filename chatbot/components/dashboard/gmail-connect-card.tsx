"use client";

import { Loader2, LogOut, Mail } from "lucide-react";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

interface GmailConnectCardProps {
	connected: boolean;
	email?: string | null;
	onDisconnect: () => void;
}

export function GmailConnectCard({
	connected,
	email,
	onDisconnect,
}: GmailConnectCardProps) {
	const [loading, setLoading] = useState(false);

	const handleConnect = async () => {
		setLoading(true);
		try {
			const res = await fetch("/api/gmail/auth");
			if (!res.ok) throw new Error("Failed to get auth URL");
			const { url } = await res.json();
			window.location.href = url;
		} catch {
			setLoading(false);
		}
	};

	if (connected) {
		return (
			<div className="flex items-center justify-between rounded-lg border bg-green-50 dark:bg-green-950/30 border-green-200 dark:border-green-900 p-3">
				<div className="flex items-center gap-2 min-w-0">
					<Mail className="h-4 w-4 text-green-600 dark:text-green-400 shrink-0" />
					<span className="text-sm text-green-700 dark:text-green-300 truncate">
						Connected
					</span>
					{email && (
						<Badge variant="secondary" className="text-xs truncate max-w-[180px]">
							{email}
						</Badge>
					)}
				</div>
				<Button
					variant="ghost"
					size="sm"
					onClick={onDisconnect}
					className="text-muted-foreground hover:text-destructive shrink-0"
				>
					<LogOut className="h-3.5 w-3.5 mr-1" />
					Disconnect
				</Button>
			</div>
		);
	}

	return (
		<div className="rounded-lg border border-dashed p-4 space-y-3 text-center">
			<div className="flex justify-center">
				<div className="rounded-full bg-muted p-2.5">
					<Mail className="h-5 w-5 text-muted-foreground" />
				</div>
			</div>
			<div>
				<p className="text-sm font-medium">Connect Gmail Account</p>
				<p className="text-xs text-muted-foreground mt-1">
					Sign in with Google to import competitor newsletters from your inbox
				</p>
			</div>
			<Button
				onClick={handleConnect}
				disabled={loading}
				variant="outline"
				className="w-full"
			>
				{loading ? (
					<Loader2 className="mr-2 h-4 w-4 animate-spin" />
				) : (
					<Mail className="mr-2 h-4 w-4" />
				)}
				Connect Gmail
			</Button>
		</div>
	);
}
