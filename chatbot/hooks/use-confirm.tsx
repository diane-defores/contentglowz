"use client";

import { useCallback, useRef, useState } from "react";
import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface ConfirmOptions {
	title?: string;
	description: string;
	confirmLabel?: string;
	destructive?: boolean;
}

/**
 * Promise-based confirmation dialog hook.
 *
 * Usage:
 *   const { confirm, ConfirmDialog } = useConfirm();
 *   const ok = await confirm({ description: "Delete this item?" });
 *   // render <ConfirmDialog /> somewhere in your JSX
 */
export function useConfirm() {
	const [open, setOpen] = useState(false);
	const [options, setOptions] = useState<ConfirmOptions>({
		description: "",
	});
	const resolveRef = useRef<((value: boolean) => void) | null>(null);

	const confirm = useCallback((opts: ConfirmOptions) => {
		setOptions(opts);
		setOpen(true);
		return new Promise<boolean>((resolve) => {
			resolveRef.current = resolve;
		});
	}, []);

	const handleAction = useCallback(() => {
		setOpen(false);
		resolveRef.current?.(true);
		resolveRef.current = null;
	}, []);

	const handleCancel = useCallback(() => {
		setOpen(false);
		resolveRef.current?.(false);
		resolveRef.current = null;
	}, []);

	const ConfirmDialog = useCallback(
		() => (
			<AlertDialog open={open} onOpenChange={(v) => !v && handleCancel()}>
				<AlertDialogContent>
					<AlertDialogHeader>
						<AlertDialogTitle>
							{options.title ?? "Are you sure?"}
						</AlertDialogTitle>
						<AlertDialogDescription>
							{options.description}
						</AlertDialogDescription>
					</AlertDialogHeader>
					<AlertDialogFooter>
						<AlertDialogCancel onClick={handleCancel}>
							Cancel
						</AlertDialogCancel>
						<AlertDialogAction
							onClick={handleAction}
							className={
								options.destructive
									? "bg-destructive text-destructive-foreground hover:bg-destructive/90"
									: undefined
							}
						>
							{options.confirmLabel ?? "Continue"}
						</AlertDialogAction>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>
		),
		[open, options, handleAction, handleCancel],
	);

	return { confirm, ConfirmDialog };
}
