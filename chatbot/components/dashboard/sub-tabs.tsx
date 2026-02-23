"use client";

import { cn } from "@/lib/utils";

export interface SubTab {
	id: string;
	label: string;
	icon: React.ReactNode;
}

interface SubTabsProps {
	tabs: SubTab[];
	activeTab: string;
	onTabChange: (id: string) => void;
}

export function SubTabs({ tabs, activeTab, onTabChange }: SubTabsProps) {
	return (
		<div className="flex items-center gap-1 border-b mb-4">
			{tabs.map((tab) => (
				<button
					key={tab.id}
					type="button"
					onClick={() => onTabChange(tab.id)}
					className={cn(
						"flex items-center gap-1.5 px-3 py-2 text-sm font-medium border-b-2 transition-colors -mb-px",
						activeTab === tab.id
							? "border-primary text-foreground"
							: "border-transparent text-muted-foreground hover:text-foreground hover:border-muted-foreground/30",
					)}
				>
					{tab.icon}
					{tab.label}
				</button>
			))}
		</div>
	);
}
