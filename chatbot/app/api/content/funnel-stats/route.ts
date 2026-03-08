import { auth } from "@clerk/nextjs/server";
import { type NextRequest, NextResponse } from "next/server";
import { normalizeContentMetadata } from "@/lib/content-metadata";
import { getContentRecords, getProjectById } from "@/lib/db/queries";

const FUNNEL_LABELS: Record<string, string> = {
	tofu: "AWARENESS",
	mofu: "CONSIDERATION",
	bofu: "DECISION",
	retention: "COMMERCIAL",
};

// Thresholds for cluster SEO health grade
function clusterGrade(count: number): string {
	if (count >= 30) return "A";
	if (count >= 20) return "B+";
	if (count >= 12) return "B";
	if (count >= 6) return "C";
	if (count >= 3) return "D";
	return "F";
}

function clusterProblem(cluster: string, count: number): string | null {
	if (count === 0) return "Aucun article — cluster vide";
	if (count <= 2)
		return `TROU ÉNORME — seulement ${count} article${count > 1 ? "s" : ""}`;
	if (count <= 5) return "Trop peu d'articles pour construire une autorité";
	if (cluster === "affiliation")
		return "Vérifier les liens d'affiliation dans les articles";
	if (cluster === "e-commerce") return "Contenu commercial insuffisant";
	if (cluster === "apps-outils")
		return "Manque de comparatifs et reviews détaillés";
	return null;
}

export async function GET(request: NextRequest) {
	try {
		const { userId } = await auth();
		if (!userId) {
			return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
		}

		const { searchParams } = new URL(request.url);
		const projectId = searchParams.get("projectId") || undefined;
		if (!projectId) {
			return NextResponse.json(
				{ error: "projectId query param is required" },
				{ status: 400 },
			);
		}

		const project = await getProjectById({ id: projectId });
		if (!project || project.userId !== userId) {
			return NextResponse.json({ error: "Project not found" }, { status: 404 });
		}

		// Fetch full corpus for the selected project only.
		const records = await getContentRecords({ projectId, limit: 9999 });

		// Accumulate counts
		const funnelCounts: Record<string, number> = {
			tofu: 0,
			mofu: 0,
			bofu: 0,
			retention: 0,
		};
		const clusterData: Record<string, { count: number; totalScore: number }> =
			{};

		for (const record of records) {
			const { metadata, audit } = normalizeContentMetadata({
				rawMetadata: record.metadata,
				title: record.title,
				tags: record.tags,
				dashboardStatus: record.status,
			});

			// Funnel
			const stage = metadata.funnelStage;
			funnelCounts[stage] = (funnelCounts[stage] ?? 0) + 1;

			// Cluster
			const cluster = metadata.seoCluster;
			if (!clusterData[cluster]) {
				clusterData[cluster] = { count: 0, totalScore: 0 };
			}
			clusterData[cluster].count++;
			clusterData[cluster].totalScore += audit.score;
		}

		const total = records.length;

		const funnelDistribution = Object.entries(funnelCounts).map(
			([stage, count]) => {
				const pct = total > 0 ? Math.round((count / total) * 100) : 0;
				// Flag as GAP if stage is significantly under-represented
				const isGap = pct < 15 && (stage === "mofu" || stage === "retention");
				return {
					stage,
					label: FUNNEL_LABELS[stage] ?? stage.toUpperCase(),
					count,
					percentage: pct,
					isGap,
				};
			},
		);

		const clusterHealth = Object.keys(clusterData)
			.filter((cluster) => cluster !== "uncategorized")
			.map((cluster) => {
				const data = clusterData[cluster];
				if (!data) {
					return null;
				}
				const avgScore =
					data.count > 0 ? Math.round(data.totalScore / data.count) : 0;
				const grade = clusterGrade(data.count);
				const problem = clusterProblem(cluster, data.count);
				return {
					cluster,
					count: data.count,
					avgMetadataScore: avgScore,
					grade,
					problem,
				};
			})
			.filter((entry): entry is NonNullable<typeof entry> => Boolean(entry))
			.sort((a, b) => b.count - a.count);

		// Uncategorized as separate field
		const uncategorized = clusterData.uncategorized?.count ?? 0;

		return NextResponse.json({
			total,
			uncategorized,
			funnelDistribution,
			clusterHealth,
		});
	} catch (error) {
		console.error("Failed to get funnel stats:", error);
		return NextResponse.json(
			{ error: "Failed to get funnel stats" },
			{ status: 500 },
		);
	}
}
