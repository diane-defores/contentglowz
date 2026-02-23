"use client";

import { Cookie, Loader2, Trash2, Upload } from "lucide-react";
import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";

interface ReelsCookieUploadProps {
	hasCookies: boolean;
	username: string | null;
	loading: boolean;
	onUpload: (content: string) => void;
	onDelete: () => void;
}

export function ReelsCookieUpload({
	hasCookies,
	username,
	loading,
	onUpload,
	onDelete,
}: ReelsCookieUploadProps) {
	const fileRef = useRef<HTMLInputElement>(null);
	const [dragOver, setDragOver] = useState(false);

	const handleFile = (file: File) => {
		const reader = new FileReader();
		reader.onload = (e) => {
			const content = e.target?.result as string;
			if (content) onUpload(content);
		};
		reader.readAsText(file);
	};

	const handleDrop = (e: React.DragEvent) => {
		e.preventDefault();
		setDragOver(false);
		const file = e.dataTransfer.files[0];
		if (file) handleFile(file);
	};

	return (
		<div className="flex items-center gap-3 rounded-lg border p-3">
			<div
				className={`h-2.5 w-2.5 rounded-full ${hasCookies ? "bg-green-500" : "bg-red-400"}`}
			/>
			<div className="flex-1 min-w-0">
				{hasCookies ? (
					<p className="text-sm">
						Connected as <span className="font-medium">@{username}</span>
					</p>
				) : (
					<p className="text-sm text-muted-foreground">
						Instagram cookies not set
					</p>
				)}
			</div>

			{loading ? (
				<Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
			) : hasCookies ? (
				<Button variant="ghost" size="sm" onClick={onDelete}>
					<Trash2 className="mr-1 h-3.5 w-3.5" />
					Remove
				</Button>
			) : (
				<>
					<div
						className={`cursor-pointer ${dragOver ? "opacity-70" : ""}`}
						onDragOver={(e) => {
							e.preventDefault();
							setDragOver(true);
						}}
						onDragLeave={() => setDragOver(false)}
						onDrop={handleDrop}
					>
						<Button
							variant="outline"
							size="sm"
							onClick={() => fileRef.current?.click()}
						>
							<Upload className="mr-1 h-3.5 w-3.5" />
							Upload cookies.txt
						</Button>
					</div>
					<input
						ref={fileRef}
						type="file"
						accept=".txt"
						className="hidden"
						onChange={(e) => {
							const file = e.target.files?.[0];
							if (file) handleFile(file);
						}}
					/>
				</>
			)}
		</div>
	);
}
