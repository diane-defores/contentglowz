"use client";

import { Link, Settings, Target, TrendingUp, Zap } from "lucide-react";
import { useEffect, useState } from "react";
import { InternalLinkingConfigModal } from "@/components/dashboard/internal-linking-config";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { useInternalLinking } from "@/hooks/use-internal-linking";

type InternalLinkingCardProps = {
	repoUrl: string;
	authToken?: string;
};

export function InternalLinkingCard({
	repoUrl,
	authToken,
}: InternalLinkingCardProps) {
	const [configOpen, setConfigOpen] = useState(false);
	const {
		analysis,
		config,
		loading,
		error,
		setConfig,
		analyzeLinking,
		generateLinkingStrategy,
		applyLinks,
	} = useInternalLinking(repoUrl, authToken);

	const hasData = analysis && analysis.totalOpportunities > 0;
	const isLoading = loading;

	// Trigger initial analysis when component mounts
	useEffect(() => {
		if (!analysis && !loading && !error) {
			analyzeLinking();
		}
	}, [analysis, loading, error, analyzeLinking]);

	return (
		<Card className="w-full">
			<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
				<div>
					<CardTitle className="flex items-center gap-2">
						<Link className="h-5 w-5" />
						Internal Linking
					</CardTitle>
					<CardDescription>
						Optimize site structure for SEO and conversions
					</CardDescription>
				</div>
				<Button variant="ghost" size="icon" onClick={() => setConfigOpen(true)}>
					<Settings className="h-4 w-4" />
				</Button>
			</CardHeader>

			<CardContent className="space-y-4">
				{hasData ? (
					<>
						{/* Quick Stats */}
						<div className="grid grid-cols-2 gap-4">
							<div className="space-y-1">
								<div className="flex items-center justify-between">
									<span className="text-sm font-medium">Opportunities</span>
									<Badge variant="outline">{analysis.totalOpportunities}</Badge>
								</div>
								<Progress
									value={
										(analysis.seoOpportunities / analysis.totalOpportunities) *
										100
									}
								/>
								<div className="text-xs text-muted-foreground">
									{analysis.seoOpportunities} SEO •{" "}
									{analysis.conversionOpportunities} Conversion
								</div>
							</div>

							<div className="space-y-1">
								<div className="flex items-center justify-between">
									<span className="text-sm font-medium">Linking Density</span>
									<Badge
										variant={
											analysis.linkingDensity >= 2 ? "default" : "destructive"
										}
									>
										{analysis.linkingDensity.toFixed(1)}
									</Badge>
								</div>
								<Progress
									value={Math.min((analysis.linkingDensity / 3) * 100, 100)}
								/>
								<div className="text-xs text-muted-foreground">
									Target: ≥2.0
								</div>
							</div>
						</div>

						{/* Impact Metrics */}
						<div className="grid grid-cols-2 gap-4">
							<div className="text-center">
								<div className="flex items-center justify-center gap-1">
									<TrendingUp className="h-4 w-4 text-blue-500" />
									<span className="text-lg font-bold">
										+{analysis.authorityImpact}%
									</span>
								</div>
								<div className="text-xs text-muted-foreground">
									Authority Impact
								</div>
							</div>

							<div className="text-center">
								<div className="flex items-center justify-center gap-1">
									<Zap className="h-4 w-4 text-green-500" />
									<span className="text-lg font-bold">
										+{analysis.conversionImpact}%
									</span>
								</div>
								<div className="text-xs text-muted-foreground">
									Conversion Impact
								</div>
							</div>
						</div>

						{/* Action Buttons */}
						<div className="flex gap-2">
							<Button
								variant="outline"
								size="sm"
								onClick={() => analyzeLinking()}
								disabled={isLoading}
							>
								Re-analyze
							</Button>
							<Button
								size="sm"
								onClick={() => applyLinks()}
								disabled={isLoading}
							>
								Apply Recommendations
							</Button>
						</div>
					</>
				) : (
					<div className="text-center py-8">
						<Target className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
						<p className="mb-4 text-sm text-muted-foreground">
							No internal linking data available
						</p>
						<Button onClick={() => analyzeLinking()} disabled={isLoading}>
							{isLoading ? "Analyzing..." : "Analyze Linking"}
						</Button>
					</div>
				)}
			</CardContent>

			<InternalLinkingConfigModal
				open={configOpen}
				onOpenChange={setConfigOpen}
				config={config}
				onConfigChange={setConfig}
				onSave={() => {
					generateLinkingStrategy(repoUrl, config.strategyType, {
						targetAuthority: config.targetAuthority,
						targetConversionRate: config.targetConversionRate,
						priorityPages: config.priorityPages,
						excludedPages: config.excludedPages,
					});
					setConfigOpen(false);
				}}
			/>
		</Card>
	);
}
