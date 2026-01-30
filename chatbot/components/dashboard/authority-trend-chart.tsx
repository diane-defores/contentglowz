"use client";

import {
	CartesianGrid,
	Legend,
	Line,
	LineChart,
	ResponsiveContainer,
	Tooltip,
	XAxis,
	YAxis,
} from "recharts";
import { Card } from "@/components/ui/card";

interface AuthorityTrendChartProps {
	data: Array<{
		date: string;
		authority: number;
		target?: number;
	}>;
}

export function AuthorityTrendChart({ data }: AuthorityTrendChartProps) {
	return (
		<Card className="p-6">
			<div className="space-y-4">
				<div>
					<h3 className="text-lg font-semibold">Authority Trend</h3>
					<p className="text-sm text-muted-foreground">
						Topical authority score over time
					</p>
				</div>

				<ResponsiveContainer width="100%" height={300}>
					<LineChart data={data}>
						<CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
						<XAxis
							dataKey="date"
							className="text-xs"
							tick={{ fill: "hsl(var(--muted-foreground))" }}
						/>
						<YAxis
							domain={[0, 100]}
							className="text-xs"
							tick={{ fill: "hsl(var(--muted-foreground))" }}
						/>
						<Tooltip
							contentStyle={{
								backgroundColor: "hsl(var(--background))",
								border: "1px solid hsl(var(--border))",
								borderRadius: "8px",
							}}
						/>
						<Legend />
						<Line
							type="monotone"
							dataKey="authority"
							stroke="hsl(var(--primary))"
							strokeWidth={2}
							name="Current Authority"
							dot={{ fill: "hsl(var(--primary))" }}
						/>
						{data.some((d) => d.target) && (
							<Line
								type="monotone"
								dataKey="target"
								stroke="hsl(var(--muted-foreground))"
								strokeWidth={2}
								strokeDasharray="5 5"
								name="Target"
								dot={false}
							/>
						)}
					</LineChart>
				</ResponsiveContainer>
			</div>
		</Card>
	);
}
