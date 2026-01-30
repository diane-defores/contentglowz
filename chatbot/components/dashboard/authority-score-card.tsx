"use client";

import { Minus, TrendingDown, TrendingUp } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";

interface AuthorityScoreCardProps {
	score: number;
	previousScore?: number;
	maxScore?: number;
	label?: string;
}

export function AuthorityScoreCard({
	score,
	previousScore,
	maxScore = 100,
	label = "Topical Authority",
}: AuthorityScoreCardProps) {
	const percentage = (score / maxScore) * 100;
	const trend = previousScore ? score - previousScore : 0;

	const getScoreColor = (score: number) => {
		if (score >= 80) return "text-green-600";
		if (score >= 60) return "text-yellow-600";
		if (score >= 40) return "text-orange-600";
		return "text-red-600";
	};

	const getTrendIcon = () => {
		if (trend > 0) return <TrendingUp className="h-4 w-4 text-green-600" />;
		if (trend < 0) return <TrendingDown className="h-4 w-4 text-red-600" />;
		return <Minus className="h-4 w-4 text-gray-400" />;
	};

	return (
		<Card className="p-6">
			<div className="space-y-4">
				<div className="flex items-center justify-between">
					<h3 className="text-sm font-medium text-muted-foreground">{label}</h3>
					{previousScore !== undefined && (
						<div className="flex items-center gap-1 text-sm">
							{getTrendIcon()}
							<span
								className={
									trend > 0
										? "text-green-600"
										: trend < 0
											? "text-red-600"
											: "text-gray-400"
								}
							>
								{trend > 0 ? "+" : ""}
								{trend.toFixed(1)}
							</span>
						</div>
					)}
				</div>

				<div className="space-y-2">
					<div className="flex items-baseline gap-2">
						<span className={`text-4xl font-bold ${getScoreColor(score)}`}>
							{score.toFixed(1)}
						</span>
						<span className="text-lg text-muted-foreground">/ {maxScore}</span>
					</div>

					<Progress value={percentage} className="h-2" />

					<div className="flex justify-between text-xs text-muted-foreground">
						<span>Poor</span>
						<span>Average</span>
						<span>Excellent</span>
					</div>
				</div>
			</div>
		</Card>
	);
}
