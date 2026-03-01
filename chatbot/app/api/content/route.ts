import { auth } from "@clerk/nextjs/server";
import { type NextRequest, NextResponse } from "next/server";
import { normalizeContentMetadata } from "@/lib/content-metadata";
import { getContentRecords } from "@/lib/db/queries";

export async function GET(request: NextRequest) {
	try {
		const { userId } = await auth();
		if (!userId) {
			return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
		}

		const { searchParams } = new URL(request.url);
		const status = searchParams.get("status") || undefined;
		const contentType = searchParams.get("contentType") || undefined;
		const sourceRobot = searchParams.get("sourceRobot") || undefined;
		const projectId = searchParams.get("projectId") || undefined;
		const funnelStage = searchParams.get("funnelStage") || undefined;
		const limit = Number.parseInt(searchParams.get("limit") || "50", 10);

		const records = await getContentRecords({
			status,
			contentType,
			sourceRobot,
			projectId,
			limit,
		});

		const enrichedRecords = records
			.map((record) => {
				const normalized = normalizeContentMetadata({
					rawMetadata: record.metadata,
					title: record.title,
					tags: record.tags,
					dashboardStatus: record.status,
				});

				return {
					...record,
					normalizedMetadata: normalized.metadata,
					metadataAudit: normalized.audit,
				};
			})
			.filter((record) =>
				funnelStage
					? record.normalizedMetadata.funnelStage === funnelStage
					: true,
			);

		return NextResponse.json(enrichedRecords);
	} catch (error) {
		console.error("Failed to get content records:", error);
		return NextResponse.json(
			{ error: "Failed to get content records" },
			{ status: 500 },
		);
	}
}
