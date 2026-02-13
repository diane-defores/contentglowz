"use client";

import { Eye, EyeOff, FolderKanban, Key, Loader2, LogOut, Moon, RotateCcw, Save, Settings, Sun, UserCircle } from "lucide-react";
import Image from "next/image";
import { useState } from "react";
import { useClerk, useUser } from "@clerk/nextjs";
import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
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
import { Switch } from "@/components/ui/switch";
import {
	Tabs,
	TabsContent,
	TabsList,
	TabsTrigger,
} from "@/components/ui/tabs";
import { useOnboarding } from "@/hooks/use-onboarding";
import { useSettings } from "@/hooks/use-settings";
import { SettingsProjectsTab } from "./settings-projects-tab";

const API_KEY_PROVIDERS = [
	{ id: "exa", name: "Exa AI", placeholder: "exa-...", section: "ai" },
	{ id: "firecrawl", name: "Firecrawl", placeholder: "fc-...", section: "ai" },
	{ id: "serper", name: "Serper", placeholder: "serper-...", section: "ai" },
	{ id: "openrouter", name: "OpenRouter", placeholder: "sk-or-...", section: "ai" },
	{ id: "bunnyStorage", name: "Bunny Storage API Key", placeholder: "storage-api-key...", section: "bunny" },
	{ id: "bunnyCdn", name: "Bunny CDN API Key", placeholder: "cdn-api-key...", section: "bunny" },
	{ id: "bunnyCdnHostname", name: "Bunny CDN Hostname", placeholder: "my-zone.b-cdn.net", section: "bunny" },
] as const;

export function SettingsModal() {
	const { settings, loading, saving, updateSettings, updateApiKey } = useSettings();
	const onboarding = useOnboarding("croissance");
	const { user } = useUser();
	const { signOut } = useClerk();
	const [open, setOpen] = useState(false);
	const [showKeys, setShowKeys] = useState<Record<string, boolean>>({});
	const [keyInputs, setKeyInputs] = useState<Record<string, string>>({});
	const [savingKey, setSavingKey] = useState<string | null>(null);

	const handleThemeChange = async (theme: "light" | "dark" | "system") => {
		await updateSettings({ theme });
	};

	const handleNotificationsChange = async (enabled: boolean) => {
		await updateSettings({ emailNotifications: enabled });
	};

	const handleWebhookChange = async (url: string) => {
		await updateSettings({ webhookUrl: url || null });
	};

	const handleSaveApiKey = async (provider: typeof API_KEY_PROVIDERS[number]["id"]) => {
		setSavingKey(provider);
		try {
			await updateApiKey(provider, keyInputs[provider] || null);
			setKeyInputs((prev) => ({ ...prev, [provider]: "" }));
		} finally {
			setSavingKey(null);
		}
	};

	const handleRemoveApiKey = async (provider: typeof API_KEY_PROVIDERS[number]["id"]) => {
		setSavingKey(provider);
		try {
			await updateApiKey(provider, null);
		} finally {
			setSavingKey(null);
		}
	};

	const toggleShowKey = (provider: string) => {
		setShowKeys((prev) => ({ ...prev, [provider]: !prev[provider] }));
	};

	const hasApiKey = (provider: string) => {
		return settings?.apiKeys?.[provider as keyof typeof settings.apiKeys] === "••••••••";
	};

	return (
		<Dialog open={open} onOpenChange={setOpen}>
			<DialogTrigger asChild>
				<Button variant="ghost" size="icon" className="h-9 w-9 [&_svg]:size-5" title="Settings">
					<Settings className="h-5 w-5" />
				</Button>
			</DialogTrigger>
			<DialogContent className="max-w-2xl">
				<DialogHeader>
					<DialogTitle>Settings</DialogTitle>
					<DialogDescription>
						Manage your preferences and API keys.
					</DialogDescription>
				</DialogHeader>

				{loading ? (
					<div className="flex items-center justify-center py-8">
						<Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
					</div>
				) : (
					<Tabs defaultValue="preferences" className="mt-4">
						<TabsList className="grid w-full grid-cols-4">
							<TabsTrigger value="preferences">Preferences</TabsTrigger>
							<TabsTrigger value="api-keys">API Keys</TabsTrigger>
							<TabsTrigger value="projects">
								<FolderKanban className="mr-2 h-4 w-4" />
								Projects
							</TabsTrigger>
							<TabsTrigger value="account">
								<UserCircle className="mr-2 h-4 w-4" />
								Account
							</TabsTrigger>
						</TabsList>

						<TabsContent value="preferences" className="space-y-6 pt-4">
							{/* Theme */}
							<div className="flex items-center justify-between">
								<div className="space-y-1">
									<Label htmlFor="theme">Theme</Label>
									<p className="text-sm text-muted-foreground">
										Choose your preferred color scheme
									</p>
								</div>
								<Select
									value={settings?.theme || "system"}
									onValueChange={handleThemeChange}
									disabled={saving}
								>
									<SelectTrigger className="w-32">
										<SelectValue />
									</SelectTrigger>
									<SelectContent>
										<SelectItem value="light">
											<span className="flex items-center gap-2">
												<Sun className="h-4 w-4" />
												Light
											</span>
										</SelectItem>
										<SelectItem value="dark">
											<span className="flex items-center gap-2">
												<Moon className="h-4 w-4" />
												Dark
											</span>
										</SelectItem>
										<SelectItem value="system">System</SelectItem>
									</SelectContent>
								</Select>
							</div>

							{/* Email Notifications */}
							<div className="flex items-center justify-between">
								<div className="space-y-1">
									<Label htmlFor="notifications">Email Notifications</Label>
									<p className="text-sm text-muted-foreground">
										Receive email updates about your projects
									</p>
								</div>
								<Switch
									id="notifications"
									checked={settings?.emailNotifications ?? true}
									onCheckedChange={handleNotificationsChange}
									disabled={saving}
								/>
							</div>

							{/* Webhook URL */}
							<div className="space-y-2">
								<Label htmlFor="webhook">Webhook URL (optional)</Label>
								<p className="text-sm text-muted-foreground">
									Receive notifications via webhook
								</p>
								<Input
									id="webhook"
									type="url"
									placeholder="https://example.com/webhook"
									defaultValue={settings?.webhookUrl || ""}
									onBlur={(e) => handleWebhookChange(e.target.value)}
									disabled={saving}
								/>
							</div>

							{/* Restart Onboarding */}
							<div className="flex items-center justify-between border-t pt-6">
								<div className="space-y-1">
									<Label>Visite guidée</Label>
									<p className="text-sm text-muted-foreground">
										Relancez le tour d'introduction
									</p>
								</div>
								<Button
									variant="outline"
									size="sm"
									onClick={() => {
										onboarding.reset();
										setOpen(false);
									}}
								>
									<RotateCcw className="mr-2 h-4 w-4" />
									Relancer
								</Button>
							</div>
						</TabsContent>

						<TabsContent value="api-keys" className="space-y-6 pt-4">
							<p className="text-sm text-muted-foreground">
								Add your own API keys to use the robots without usage limits.
								Keys are stored securely and never exposed.
							</p>

							{/* AI Provider Keys */}
							<div className="space-y-4">
								<h4 className="text-sm font-medium text-foreground">AI Providers</h4>
								{API_KEY_PROVIDERS.filter((p) => p.section === "ai").map((provider) => (
									<div key={provider.id} className="space-y-2">
										<Label htmlFor={`key-${provider.id}`}>{provider.name}</Label>
										<div className="flex gap-2">
											{hasApiKey(provider.id) ? (
												<>
													<Input
														id={`key-${provider.id}`}
														type="text"
														value="••••••••••••••••"
														disabled
														className="flex-1"
													/>
													<Button
														variant="destructive"
														size="sm"
														onClick={() => handleRemoveApiKey(provider.id)}
														disabled={savingKey === provider.id}
													>
														{savingKey === provider.id ? (
															<Loader2 className="h-4 w-4 animate-spin" />
														) : (
															"Remove"
														)}
													</Button>
												</>
											) : (
												<>
													<div className="relative flex-1">
														<Input
															id={`key-${provider.id}`}
															type={showKeys[provider.id] ? "text" : "password"}
															placeholder={provider.placeholder}
															value={keyInputs[provider.id] || ""}
															onChange={(e) =>
																setKeyInputs((prev) => ({
																	...prev,
																	[provider.id]: e.target.value,
																}))
															}
															className="pr-10"
														/>
														<button
															type="button"
															onClick={() => toggleShowKey(provider.id)}
															className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
														>
															{showKeys[provider.id] ? (
																<EyeOff className="h-4 w-4" />
															) : (
																<Eye className="h-4 w-4" />
															)}
														</button>
													</div>
													<Button
														size="sm"
														onClick={() => handleSaveApiKey(provider.id)}
														disabled={!keyInputs[provider.id] || savingKey === provider.id}
													>
														{savingKey === provider.id ? (
															<Loader2 className="h-4 w-4 animate-spin" />
														) : (
															<Save className="h-4 w-4" />
														)}
													</Button>
												</>
											)}
										</div>
									</div>
								))}
							</div>

							{/* Bunny CDN Keys */}
							<div className="space-y-4 border-t pt-4">
								<h4 className="text-sm font-medium text-foreground">Bunny CDN (Image Robot)</h4>
								<p className="text-xs text-muted-foreground">
									Configure Bunny.net for image optimization and CDN delivery.
								</p>
								{API_KEY_PROVIDERS.filter((p) => p.section === "bunny").map((provider) => (
									<div key={provider.id} className="space-y-2">
										<Label htmlFor={`key-${provider.id}`}>{provider.name}</Label>
										<div className="flex gap-2">
											{hasApiKey(provider.id) ? (
												<>
													<Input
														id={`key-${provider.id}`}
														type="text"
														value="••••••••••••••••"
														disabled
														className="flex-1"
													/>
													<Button
														variant="destructive"
														size="sm"
														onClick={() => handleRemoveApiKey(provider.id)}
														disabled={savingKey === provider.id}
													>
														{savingKey === provider.id ? (
															<Loader2 className="h-4 w-4 animate-spin" />
														) : (
															"Remove"
														)}
													</Button>
												</>
											) : (
												<>
													<div className="relative flex-1">
														<Input
															id={`key-${provider.id}`}
															type={showKeys[provider.id] ? "text" : "password"}
															placeholder={provider.placeholder}
															value={keyInputs[provider.id] || ""}
															onChange={(e) =>
																setKeyInputs((prev) => ({
																	...prev,
																	[provider.id]: e.target.value,
																}))
															}
															className="pr-10"
														/>
														<button
															type="button"
															onClick={() => toggleShowKey(provider.id)}
															className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
														>
															{showKeys[provider.id] ? (
																<EyeOff className="h-4 w-4" />
															) : (
																<Eye className="h-4 w-4" />
															)}
														</button>
													</div>
													<Button
														size="sm"
														onClick={() => handleSaveApiKey(provider.id)}
														disabled={!keyInputs[provider.id] || savingKey === provider.id}
													>
														{savingKey === provider.id ? (
															<Loader2 className="h-4 w-4 animate-spin" />
														) : (
															<Save className="h-4 w-4" />
														)}
													</Button>
												</>
											)}
										</div>
									</div>
								))}
							</div>
						</TabsContent>

						<TabsContent value="projects" className="pt-4">
							<SettingsProjectsTab />
						</TabsContent>

						<TabsContent value="account" className="space-y-6 pt-4">
							{user ? (
								<>
									<div className="flex items-center gap-4">
										{user.imageUrl ? (
											<Image
												alt={user.primaryEmailAddress?.emailAddress ?? "Avatar"}
												className="rounded-full"
												height={48}
												src={user.imageUrl}
												width={48}
											/>
										) : (
											<div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted text-lg font-medium">
												{(user.primaryEmailAddress?.emailAddress ?? "?")[0].toUpperCase()}
											</div>
										)}
										<div className="flex-1">
											<p className="font-medium">{user.primaryEmailAddress?.emailAddress}</p>
											<span className="inline-block mt-1 rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-800 dark:bg-green-900/30 dark:text-green-400">
												Registered
											</span>
										</div>
									</div>

									<div className="border-t pt-4">
										<Button
											variant="destructive"
											onClick={() => signOut({ redirectUrl: "/" })}
											className="w-full"
										>
											<LogOut className="mr-2 h-4 w-4" />
											Sign Out
										</Button>
									</div>

									<p className="text-xs text-muted-foreground">
										User ID: {user.id}
									</p>
								</>
							) : (
								<p className="text-sm text-muted-foreground">Not signed in.</p>
							)}
						</TabsContent>
					</Tabs>
				)}
			</DialogContent>
		</Dialog>
	);
}
