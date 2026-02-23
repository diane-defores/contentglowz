"use client";

import { Clock, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

interface ReelsCopyEditorProps {
	originalText: string;
	editedText: string;
	onTextChange: (text: string) => void;
	aiText: string;
	onContinue: () => void;
}

export function ReelsCopyEditor({
	originalText,
	editedText,
	onTextChange,
	aiText,
	onContinue,
}: ReelsCopyEditorProps) {
	const wordCount = editedText.trim().split(/\s+/).filter(Boolean).length;
	const charCount = editedText.length;
	// Rough estimate: ~150 words per minute for reading aloud
	const readingTime = Math.ceil(wordCount / 150);

	return (
		<div className="space-y-4">
			<div className="grid grid-cols-1 gap-4 md:grid-cols-2">
				{/* Original transcript (read-only) */}
				<div className="space-y-2">
					<Label className="text-muted-foreground">Original Transcript</Label>
					<Textarea
						value={originalText}
						readOnly
						className="min-h-[200px] resize-none bg-muted/50 text-sm"
					/>
				</div>

				{/* Editable rewrite */}
				<div className="space-y-2">
					<div className="flex items-center justify-between">
						<Label>Your Script</Label>
						<Button
							variant="ghost"
							size="sm"
							onClick={() => onTextChange(aiText)}
							className="h-7 text-xs"
						>
							<RotateCcw className="mr-1 h-3 w-3" />
							Reset to AI version
						</Button>
					</div>
					<Textarea
						value={editedText}
						onChange={(e) => onTextChange(e.target.value)}
						className="min-h-[200px] resize-none text-sm"
						placeholder="Edit your script here..."
					/>
				</div>
			</div>

			{/* Stats bar */}
			<div className="flex items-center justify-between">
				<div className="flex items-center gap-4 text-xs text-muted-foreground">
					<span>{wordCount} words</span>
					<span>{charCount} chars</span>
					<span className="flex items-center gap-1">
						<Clock className="h-3 w-3" />
						~{readingTime} min read
					</span>
				</div>
				<Button onClick={onContinue} disabled={!editedText.trim()}>
					Continue to Recording
				</Button>
			</div>
		</div>
	);
}
