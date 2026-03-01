import { z } from "zod";

export const FUNNEL_STAGES = ["tofu", "mofu", "bofu", "retention"] as const;
export type FunnelStage = (typeof FUNNEL_STAGES)[number];

export const CTA_TYPES = [
	"lead_magnet",
	"newsletter",
	"demo",
	"purchase",
	"contact",
] as const;
export type CtaType = (typeof CTA_TYPES)[number];

export const CONTENT_WORKFLOW_STATUSES = [
	"draft",
	"in_review",
	"approved",
	"scheduled",
	"published",
	"archived",
] as const;
export type ContentWorkflowStatus = (typeof CONTENT_WORKFLOW_STATUSES)[number];

export const QUALITY_STATUSES = ["pending", "passed", "failed"] as const;
export type QualityStatus = (typeof QUALITY_STATUSES)[number];

export const ROBOT_STEPS = [
	"brief",
	"writing",
	"internalLinking",
	"imageGeneration",
	"seoValidation",
	"cmsSync",
] as const;
export type RobotStep = (typeof ROBOT_STEPS)[number];

export const ROBOT_STEP_STATUSES = [
	"pending",
	"in_progress",
	"done",
	"failed",
	"skipped",
] as const;
export type RobotStepStatus = (typeof ROBOT_STEP_STATUSES)[number];

const datePattern = /^\d{4}-\d{2}-\d{2}$/;

const canonicalMetadataSchema = z.object({
	title: z.string().min(1),
	description: z.string().min(1),
	slug: z.string().min(1),
	author: z.string().min(1),
	tags: z.array(z.string().min(1)).min(1),
	pubDate: z.string().regex(datePattern),
	updatedDate: z.string().regex(datePattern).optional(),
	imgUrl: z.string().min(1).optional(),
	metaTitle: z.string().min(1).optional(),
	metaDescription: z.string().min(1).optional(),
	canonicalUrl: z.string().url().optional(),
	draft: z.boolean().default(false),
	locale: z.string().min(2).default("fr"),
	funnelStage: z.enum(FUNNEL_STAGES).default("mofu"),
	targetPersona: z.string().optional(),
	targetKeyword: z.string().optional(),
	ctaType: z.enum(CTA_TYPES).default("newsletter"),
	contentStatus: z.enum(CONTENT_WORKFLOW_STATUSES).default("draft"),
	qualityStatus: z.enum(QUALITY_STATUSES).default("pending"),
	robotStatus: z.record(z.enum(ROBOT_STEPS), z.enum(ROBOT_STEP_STATUSES)),
});

export type CanonicalContentMetadata = z.infer<typeof canonicalMetadataSchema>;

export interface MetadataIssue {
	level: "error" | "warn" | "info";
	field: string;
	message: string;
}

export interface MetadataAudit {
	score: number;
	issues: MetadataIssue[];
	errorCount: number;
	warnCount: number;
	infoCount: number;
	robotProgress: {
		total: number;
		done: number;
		failed: number;
		pending: number;
	};
}

export interface MetadataNormalizationResult {
	metadata: CanonicalContentMetadata;
	audit: MetadataAudit;
}

const funnelAliasMap: Record<string, FunnelStage> = {
	tofu: "tofu",
	top: "tofu",
	top_of_funnel: "tofu",
	awareness: "tofu",
	mofu: "mofu",
	middle: "mofu",
	middle_of_funnel: "mofu",
	consideration: "mofu",
	bofu: "bofu",
	bottom: "bofu",
	bottom_of_funnel: "bofu",
	decision: "bofu",
	retention: "retention",
	loyalty: "retention",
};

const ctaAliasMap: Record<string, CtaType> = {
	"lead-magnet": "lead_magnet",
	lead_magnet: "lead_magnet",
	newsletter: "newsletter",
	demo: "demo",
	achat: "purchase",
	purchase: "purchase",
	contact: "contact",
};

const contentStatusAliasMap: Record<string, ContentWorkflowStatus> = {
	draft: "draft",
	in_review: "in_review",
	review: "in_review",
	approved: "approved",
	scheduled: "scheduled",
	published: "published",
	archived: "archived",
};

const qualityStatusAliasMap: Record<string, QualityStatus> = {
	pending: "pending",
	passed: "passed",
	failed: "failed",
};

const robotStepStatusAliasMap: Record<string, RobotStepStatus> = {
	pending: "pending",
	in_progress: "in_progress",
	done: "done",
	failed: "failed",
	skipped: "skipped",
};

function toSafeObject(input: unknown): Record<string, unknown> {
	if (!input || typeof input !== "object") {
		return {};
	}
	return input as Record<string, unknown>;
}

function asString(value: unknown): string | undefined {
	if (typeof value !== "string") {
		return undefined;
	}
	const trimmed = value.trim();
	return trimmed.length > 0 ? trimmed : undefined;
}

function asStringArray(value: unknown): string[] | undefined {
	if (!Array.isArray(value)) {
		return undefined;
	}
	const cleaned = value
		.map((entry) => asString(entry))
		.filter((entry): entry is string => typeof entry === "string");
	return cleaned.length > 0 ? cleaned : undefined;
}

function asBoolean(value: unknown): boolean | undefined {
	if (typeof value === "boolean") {
		return value;
	}
	if (typeof value === "string") {
		if (value.toLowerCase() === "true") return true;
		if (value.toLowerCase() === "false") return false;
	}
	return undefined;
}

function toDateString(value: unknown): string | undefined {
	if (value instanceof Date) {
		return value.toISOString().slice(0, 10);
	}
	const candidate = asString(value);
	if (!candidate) {
		return undefined;
	}
	if (datePattern.test(candidate)) {
		return candidate;
	}
	const parsed = new Date(candidate);
	if (Number.isNaN(parsed.getTime())) {
		return undefined;
	}
	return parsed.toISOString().slice(0, 10);
}

function slugify(input: string): string {
	return input
		.toLowerCase()
		.trim()
		.replace(/['’]/g, "")
		.replace(/[^a-z0-9]+/g, "-")
		.replace(/^-+|-+$/g, "")
		.replace(/-{2,}/g, "-");
}

function normalizeFunnelStage(value: unknown): FunnelStage {
	const candidate = asString(value)?.toLowerCase().replace(/\s+/g, "_");
	if (!candidate) {
		return "mofu";
	}
	return funnelAliasMap[candidate] ?? "mofu";
}

function normalizeCtaType(value: unknown): CtaType {
	const candidate = asString(value)?.toLowerCase().replace(/\s+/g, "_");
	if (!candidate) {
		return "newsletter";
	}
	return ctaAliasMap[candidate] ?? "newsletter";
}

function normalizeContentStatus(value: unknown): ContentWorkflowStatus {
	const candidate = asString(value)?.toLowerCase().replace(/\s+/g, "_");
	if (!candidate) {
		return "draft";
	}
	return contentStatusAliasMap[candidate] ?? "draft";
}

function normalizeQualityStatus(value: unknown): QualityStatus {
	const candidate = asString(value)?.toLowerCase().replace(/\s+/g, "_");
	if (!candidate) {
		return "pending";
	}
	return qualityStatusAliasMap[candidate] ?? "pending";
}

function normalizeRobotStatus(
	value: unknown,
): Record<RobotStep, RobotStepStatus> {
	const obj = toSafeObject(value);
	const normalized: Record<RobotStep, RobotStepStatus> = {
		brief: "pending",
		writing: "pending",
		internalLinking: "pending",
		imageGeneration: "pending",
		seoValidation: "pending",
		cmsSync: "pending",
	};

	for (const step of ROBOT_STEPS) {
		const raw = obj[step];
		const candidate = asString(raw)?.toLowerCase().replace(/\s+/g, "_");
		if (!candidate) {
			continue;
		}
		normalized[step] = robotStepStatusAliasMap[candidate] ?? "pending";
	}

	return normalized;
}

function buildAudit(metadata: CanonicalContentMetadata): MetadataAudit {
	const issues: MetadataIssue[] = [];

	if (!metadata.title) {
		issues.push({
			level: "error",
			field: "title",
			message: "title is required",
		});
	}
	if (!metadata.description) {
		issues.push({
			level: "error",
			field: "description",
			message: "description is required",
		});
	}
	if (!metadata.author) {
		issues.push({
			level: "error",
			field: "author",
			message: "author is required",
		});
	}
	if (metadata.tags.length === 0) {
		issues.push({
			level: "error",
			field: "tags",
			message: "at least one tag is required",
		});
	}
	if (!datePattern.test(metadata.pubDate)) {
		issues.push({
			level: "error",
			field: "pubDate",
			message: "pubDate must use YYYY-MM-DD",
		});
	}

	if (metadata.metaTitle && metadata.metaTitle.length > 60) {
		issues.push({
			level: "warn",
			field: "metaTitle",
			message: "metaTitle should be <= 60 chars",
		});
	}
	if (metadata.metaDescription && metadata.metaDescription.length > 160) {
		issues.push({
			level: "warn",
			field: "metaDescription",
			message: "metaDescription should be <= 160 chars",
		});
	}
	if (!metadata.imgUrl) {
		issues.push({
			level: "warn",
			field: "imgUrl",
			message: "cover image is missing",
		});
	}
	if (!metadata.canonicalUrl) {
		issues.push({
			level: "warn",
			field: "canonicalUrl",
			message: "canonicalUrl is not set",
		});
	}

	if (!metadata.updatedDate) {
		issues.push({
			level: "info",
			field: "updatedDate",
			message: "updatedDate is not set",
		});
	}

	let score = 100;
	for (const issue of issues) {
		if (issue.level === "error") score -= 20;
		if (issue.level === "warn") score -= 8;
		if (issue.level === "info") score -= 2;
	}
	if (score < 0) {
		score = 0;
	}

	const robotValues = Object.values(metadata.robotStatus);
	const done = robotValues.filter((status) => status === "done").length;
	const failed = robotValues.filter((status) => status === "failed").length;
	const pending = robotValues.filter(
		(status) => status === "pending" || status === "in_progress",
	).length;

	const errorCount = issues.filter((issue) => issue.level === "error").length;
	const warnCount = issues.filter((issue) => issue.level === "warn").length;
	const infoCount = issues.filter((issue) => issue.level === "info").length;

	return {
		score,
		issues,
		errorCount,
		warnCount,
		infoCount,
		robotProgress: {
			total: ROBOT_STEPS.length,
			done,
			failed,
			pending,
		},
	};
}

export function normalizeContentMetadata(params: {
	rawMetadata: unknown;
	title: string;
	tags?: string[] | null;
	dashboardStatus?: string;
}): MetadataNormalizationResult {
	const raw = toSafeObject(params.rawMetadata);

	const title = asString(raw.title) ?? asString(params.title) ?? "Untitled";
	const description =
		asString(raw.description) ??
		asString(raw.excerpt) ??
		asString(raw.summary) ??
		"";
	const author = asString(raw.author) ?? asString(raw.byline) ?? "";
	const tags =
		asStringArray(raw.tags) ??
		(params.tags && params.tags.length > 0 ? params.tags : []) ??
		[];

	const metadata: CanonicalContentMetadata = {
		title,
		description,
		slug: asString(raw.slug) ?? slugify(title),
		author,
		tags,
		pubDate:
			toDateString(raw.pubDate) ??
			toDateString(raw.publishDate) ??
			toDateString(raw.date) ??
			new Date().toISOString().slice(0, 10),
		updatedDate:
			toDateString(raw.updatedDate) ?? toDateString(raw.modifiedDate),
		imgUrl:
			asString(raw.imgUrl) ??
			asString(raw.image) ??
			asString(raw.heroImage) ??
			asString(raw.coverImage),
		metaTitle: asString(raw.metaTitle) ?? title,
		metaDescription: asString(raw.metaDescription) ?? description,
		canonicalUrl: asString(raw.canonicalUrl),
		draft: asBoolean(raw.draft) ?? false,
		locale: asString(raw.locale) ?? "fr",
		funnelStage: normalizeFunnelStage(raw.funnelStage ?? raw.funnel_stage),
		targetPersona: asString(raw.targetPersona) ?? asString(raw.target_persona),
		targetKeyword: asString(raw.targetKeyword) ?? asString(raw.target_keyword),
		ctaType: normalizeCtaType(raw.ctaType ?? raw.cta_type),
		contentStatus: normalizeContentStatus(
			raw.contentStatus ?? raw.workflowStatus ?? params.dashboardStatus,
		),
		qualityStatus: normalizeQualityStatus(raw.qualityStatus),
		robotStatus: normalizeRobotStatus(raw.robotStatus),
	};

	const parsed = canonicalMetadataSchema.safeParse(metadata);
	const safeMetadata = parsed.success ? parsed.data : metadata;
	const audit = buildAudit(safeMetadata);

	return {
		metadata: safeMetadata,
		audit,
	};
}
