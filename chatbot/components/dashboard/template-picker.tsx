"use client";

import { LayoutTemplate } from "lucide-react";
import {
	Sheet,
	SheetContent,
	SheetDescription,
	SheetHeader,
	SheetTitle,
} from "@/components/ui/sheet";
import { TemplatesTab } from "./templates-tab";

interface TemplatePickerProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	projectId?: string;
}

export function TemplatePicker({
	open,
	onOpenChange,
	projectId,
}: TemplatePickerProps) {
	return (
		<Sheet open={open} onOpenChange={onOpenChange}>
			<SheetContent side="right" className="w-full sm:max-w-lg overflow-y-auto">
				<SheetHeader>
					<SheetTitle className="flex items-center gap-2">
						<LayoutTemplate className="h-5 w-5" />
						Templates
					</SheetTitle>
					<SheetDescription>
						Pick a template to generate content, or manage your templates.
					</SheetDescription>
				</SheetHeader>
				<div className="mt-4">
					<TemplatesTab projectId={projectId} />
				</div>
			</SheetContent>
		</Sheet>
	);
}
