"use client";

import { AlertCircle, ExternalLink, GitBranch, Loader2 } from "lucide-react";
import { useCallback, useState } from "react";
import { useReverification, useUser } from "@clerk/nextjs";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/toast";

const GITHUB_RETURN_KEY = "github_connect_return";

/**
 * Stores a flag in sessionStorage so the sheet can auto-reopen
 * after the OAuth redirect brings the user back.
 */
export function setGitHubReturnFlag() {
	try {
		sessionStorage.setItem(GITHUB_RETURN_KEY, "1");
	} catch {}
}

/**
 * Checks and clears the return flag. Returns true if the user
 * just came back from the GitHub OAuth flow.
 */
export function consumeGitHubReturnFlag(): boolean {
	try {
		if (sessionStorage.getItem(GITHUB_RETURN_KEY)) {
			sessionStorage.removeItem(GITHUB_RETURN_KEY);
			return true;
		}
	} catch {}
	return false;
}

interface GitHubConnectPromptProps {
	onConnected?: () => void;
	/** When true, disconnects existing GitHub before reconnecting (to refresh scopes) */
	reconnect?: boolean;
}

export function GitHubConnectPrompt({ onConnected, reconnect }: GitHubConnectPromptProps) {
	const { user } = useUser();
	const [connecting, setConnecting] = useState(false);

	// Wrap createExternalAccount with reverification so Clerk
	// automatically prompts the user to confirm their identity.
	const createExternalAccount = useReverification(
		(params: {
			strategy: "oauth_github";
			redirectUrl: string;
			additionalScopes: string[];
		}) => user?.createExternalAccount(params),
	);

	const handleConnect = useCallback(async () => {
		if (!user) return;

		// Check if already connected
		const existing = user.externalAccounts?.find(
			(a) => a.provider === "github",
		);
		if (existing && !reconnect) {
			onConnected?.();
			return;
		}

		setConnecting(true);
		try {
			// In reconnect mode, reauthorize the existing account to request new scopes
			// (avoids needing to destroy + recreate, which requires extra reverification)
			if (existing && reconnect) {
				const result = await existing.reauthorize({
					additionalScopes: ["repo"],
					redirectUrl: window.location.href,
				});

				const verifyUrl =
					result.verification?.externalVerificationRedirectURL;
				if (verifyUrl) {
					setGitHubReturnFlag();
					window.location.href = verifyUrl.href;
				} else {
					toast({
						type: "error",
						description: "Could not start GitHub reauthorization.",
					});
					setConnecting(false);
				}
				return;
			}

			const externalAccount = await createExternalAccount({
				strategy: "oauth_github",
				redirectUrl: window.location.href,
				additionalScopes: ["repo"],
			});

			// User may have cancelled the reverification modal
			if (!externalAccount) {
				setConnecting(false);
				return;
			}

			const verifyUrl =
				externalAccount.verification?.externalVerificationRedirectURL;
			if (verifyUrl) {
				// Store flag so the sheet re-opens after redirect
				setGitHubReturnFlag();
				window.location.href = verifyUrl.href;
			} else {
				toast({
					type: "error",
					description:
						"Could not start GitHub connection. Make sure GitHub is enabled as a social provider in your Clerk dashboard.",
				});
				setConnecting(false);
			}
		} catch (err) {
			console.error("GitHub connect error:", err);
			toast({
				type: "error",
				description:
					err instanceof Error
						? err.message
						: "Failed to connect GitHub. Check that GitHub is enabled in Clerk dashboard.",
			});
			setConnecting(false);
		}
	}, [user, onConnected, reconnect, createExternalAccount]);

	return (
		<div className="flex flex-col items-center justify-center gap-4 py-12 text-center">
			<div className="flex items-center gap-2 text-muted-foreground">
				<GitBranch className="h-8 w-8" />
				<AlertCircle className="h-5 w-5" />
			</div>
			<div className="space-y-2">
				<h3 className="text-lg font-semibold">
					{reconnect ? "Reconnect GitHub" : "GitHub Not Connected"}
				</h3>
				<p className="text-sm text-muted-foreground max-w-sm">
					{reconnect
						? "Your current GitHub token may lack the required permissions. Reconnect to request the \"repo\" scope for private repository access."
						: "Connect your GitHub account to browse repository files, edit content, and map directories as content sources."}
				</p>
			</div>
			<Button onClick={handleConnect} disabled={connecting || !user}>
				{connecting ? (
					<>
						<Loader2 className="mr-2 h-4 w-4 animate-spin" />
						{reconnect ? "Reconnecting..." : "Connecting..."}
					</>
				) : (
					<>
						<ExternalLink className="mr-2 h-4 w-4" />
						{reconnect ? "Reconnect GitHub" : "Connect GitHub"}
					</>
				)}
			</Button>
			<p className="text-xs text-muted-foreground">
				You&apos;ll be redirected to GitHub to authorize access.
			</p>
		</div>
	);
}
