"use client";

const STATUS_CONFIG: Record<
	string,
	{ label: string; className: string }
> = {
	todo: {
		label: "To Do",
		className: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300",
	},
	in_progress: {
		label: "In Progress",
		className: "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300",
	},
	generated: {
		label: "Generated",
		className: "bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300",
	},
	pending_review: {
		label: "Pending Review",
		className: "bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300",
	},
	approved: {
		label: "Approved",
		className: "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300",
	},
	rejected: {
		label: "Rejected",
		className: "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300",
	},
	scheduled: {
		label: "Scheduled",
		className: "bg-cyan-100 text-cyan-700 dark:bg-cyan-900 dark:text-cyan-300",
	},
	publishing: {
		label: "Publishing",
		className: "bg-indigo-100 text-indigo-700 dark:bg-indigo-900 dark:text-indigo-300",
	},
	published: {
		label: "Published",
		className: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-300",
	},
	failed: {
		label: "Failed",
		className: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
	},
	archived: {
		label: "Archived",
		className: "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400",
	},
};

interface ContentStatusBadgeProps {
	status: string;
	size?: "sm" | "md";
}

export function ContentStatusBadge({ status, size = "sm" }: ContentStatusBadgeProps) {
	const config = STATUS_CONFIG[status] || {
		label: status,
		className: "bg-gray-100 text-gray-700",
	};

	const sizeClass = size === "sm" ? "text-xs px-2 py-0.5" : "text-sm px-2.5 py-1";

	return (
		<span
			className={`inline-flex items-center rounded-full font-medium ${config.className} ${sizeClass}`}
		>
			{config.label}
		</span>
	);
}
