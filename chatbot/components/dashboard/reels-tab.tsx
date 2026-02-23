"use client";

import {
	AlertCircle,
	Download,
	Film,
	Loader2,
	RotateCcw,
} from "lucide-react";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useReels } from "@/hooks/use-reels";
import { ReelsAudioRecorder } from "./reels-audio-recorder";
import { ReelsCookieUpload } from "./reels-cookie-upload";
import { ReelsCopyEditor } from "./reels-copy-editor";
import { ReelsPipelineStepper } from "./reels-pipeline-stepper";

const IG_URL_REGEX =
	/^https?:\/\/(www\.)?instagram\.com\/(reel|reels|p)\/[A-Za-z0-9_-]+/;

export function ReelsTab() {
	const {
		step,
		error,
		reelData,
		transcription,
		rewrite,
		editedCopy,
		setEditedCopy,
		userAudioUrl,
		userTranscription,
		cookieStatus,
		cookieLoading,
		checkCookies,
		uploadCookies,
		deleteCookies,
		downloadReel,
		finishEditing,
		uploadUserAudio,
		generateSrt,
		reset,
		clearError,
	} = useReels();

	const [url, setUrl] = useState("");
	const [uploading, setUploading] = useState(false);
	const isValidUrl = IG_URL_REGEX.test(url);

	useEffect(() => {
		checkCookies();
	}, [checkCookies]);

	const handleStart = () => {
		if (isValidUrl) downloadReel(url);
	};

	const handleUploadAudio = async (blob: Blob) => {
		if (!reelData) return;
		setUploading(true);
		await uploadUserAudio(blob, reelData.reelId);
		setUploading(false);
	};

	const handleDownloadSrt = () => {
		if (!userTranscription) return;
		const srt = generateSrt(userTranscription.words);
		const blob = new Blob([srt], { type: "text/srt" });
		const url = URL.createObjectURL(blob);
		const a = document.createElement("a");
		a.href = url;
		a.download = `${reelData?.reelId || "reel"}.srt`;
		a.click();
		URL.revokeObjectURL(url);
	};

	const handleDownloadText = () => {
		const blob = new Blob([editedCopy], { type: "text/plain" });
		const url = URL.createObjectURL(blob);
		const a = document.createElement("a");
		a.href = url;
		a.download = `${reelData?.reelId || "reel"}-script.txt`;
		a.click();
		URL.revokeObjectURL(url);
	};

	return (
		<div className="space-y-6">
			{/* Header */}
			<div className="flex items-center justify-between">
				<div>
					<h2 className="text-2xl font-bold tracking-tight">Reels Repurpose</h2>
					<p className="text-sm text-muted-foreground">
						Download a Reel, rewrite the script, record your voice, get subtitles
					</p>
				</div>
				{step !== "idle" && (
					<Button variant="outline" size="sm" onClick={reset}>
						<RotateCcw className="mr-1 h-4 w-4" />
						Start Over
					</Button>
				)}
			</div>

			{/* Error banner */}
			{error && (
				<div className="rounded-lg border border-red-200 bg-red-50 p-3 dark:border-red-800 dark:bg-red-950/30">
					<div className="flex items-center gap-2">
						<AlertCircle className="h-4 w-4 text-red-500" />
						<p className="flex-1 text-sm text-red-700 dark:text-red-400">
							{error}
						</p>
						<Button
							variant="ghost"
							size="sm"
							onClick={clearError}
							className="h-7 text-xs"
						>
							Dismiss
						</Button>
					</div>
				</div>
			)}

			{/* Cookie setup */}
			<ReelsCookieUpload
				hasCookies={cookieStatus.hasCookies}
				username={cookieStatus.username}
				loading={cookieLoading}
				onUpload={uploadCookies}
				onDelete={deleteCookies}
			/>

			{/* Pipeline stepper */}
			<ReelsPipelineStepper currentStep={step} />

			{/* Step 1: URL Input */}
			{(step === "idle" || step === "downloading") && (
				<Card className="p-4">
					<Label htmlFor="reel-url" className="mb-2 block">
						Instagram Reel URL
					</Label>
					<div className="flex gap-2">
						<Input
							id="reel-url"
							placeholder="https://www.instagram.com/reel/..."
							value={url}
							onChange={(e) => setUrl(e.target.value)}
							disabled={step === "downloading"}
						/>
						<Button
							onClick={handleStart}
							disabled={
								!isValidUrl ||
								!cookieStatus.hasCookies ||
								step === "downloading"
							}
						>
							{step === "downloading" ? (
								<Loader2 className="mr-2 h-4 w-4 animate-spin" />
							) : (
								<Film className="mr-2 h-4 w-4" />
							)}
							Start
						</Button>
					</div>
					{url && !isValidUrl && (
						<p className="mt-1 text-xs text-red-500">
							Enter a valid Instagram Reel URL
						</p>
					)}
					{!cookieStatus.hasCookies && (
						<p className="mt-1 text-xs text-muted-foreground">
							Upload Instagram cookies first
						</p>
					)}
				</Card>
			)}

			{/* Video preview (shown after download) */}
			{reelData && (
				<Card className="p-4">
					<div className="flex items-start gap-4">
						<div className="w-48 shrink-0">
							<video
								src={reelData.videoUrl}
								controls
								className="w-full rounded-lg"
								muted={step === "done"}
							/>
						</div>
						<div className="flex-1 space-y-1 text-sm">
							{reelData.author && (
								<p>
									<span className="text-muted-foreground">Author:</span>{" "}
									@{reelData.author}
								</p>
							)}
							{reelData.duration && (
								<p>
									<span className="text-muted-foreground">Duration:</span>{" "}
									{Math.round(reelData.duration)}s
								</p>
							)}
							{reelData.caption && (
								<p className="line-clamp-3 text-muted-foreground">
									{reelData.caption}
								</p>
							)}
						</div>
					</div>
				</Card>
			)}

			{/* Transcription display */}
			{step === "transcribing" && (
				<Card className="flex items-center gap-3 p-4">
					<Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
					<p className="text-sm text-muted-foreground">
						Transcribing audio...
					</p>
				</Card>
			)}

			{/* Rewriting display */}
			{step === "rewriting" && (
				<Card className="flex items-center gap-3 p-4">
					<Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
					<p className="text-sm text-muted-foreground">
						AI is rewriting the script...
					</p>
				</Card>
			)}

			{/* Step 4: Copy editor */}
			{step === "editing" && transcription && rewrite && (
				<Card className="p-4">
					<ReelsCopyEditor
						originalText={transcription.text}
						editedText={editedCopy}
						onTextChange={setEditedCopy}
						aiText={rewrite.rewrittenText}
						onContinue={finishEditing}
					/>
				</Card>
			)}

			{/* Step 5: Audio recorder */}
			{step === "recording" && (
				<Card className="p-4">
					<ReelsAudioRecorder
						scriptText={editedCopy}
						onUpload={handleUploadAudio}
						uploading={uploading}
					/>
				</Card>
			)}

			{/* Step 6: Re-transcribing */}
			{step === "retranscribing" && (
				<Card className="flex items-center gap-3 p-4">
					<Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
					<p className="text-sm text-muted-foreground">
						Syncing subtitles to your voice...
					</p>
				</Card>
			)}

			{/* Final output */}
			{step === "done" && reelData && userTranscription && (
				<Card className="space-y-4 p-4">
					<h3 className="text-lg font-semibold">Your Repurposed Reel</h3>

					{/* Video preview with user audio + subtitles */}
					<div className="relative w-full max-w-md mx-auto">
						<video
							src={reelData.videoUrl}
							controls
							muted
							className="w-full rounded-lg"
						/>
						{userAudioUrl && (
							<audio src={userAudioUrl} controls className="mt-2 w-full" />
						)}
						<p className="mt-1 text-xs text-muted-foreground text-center">
							Video (muted) + your audio. Download SRT for subtitles.
						</p>
					</div>

					{/* Download buttons */}
					<div className="flex flex-wrap gap-2">
						<Button variant="outline" size="sm" onClick={handleDownloadSrt}>
							<Download className="mr-1 h-4 w-4" />
							Download SRT
						</Button>
						<Button variant="outline" size="sm" onClick={handleDownloadText}>
							<Download className="mr-1 h-4 w-4" />
							Download Script
						</Button>
						{userAudioUrl && (
							<Button variant="outline" size="sm" asChild>
								<a href={userAudioUrl} download>
									<Download className="mr-1 h-4 w-4" />
									Download Audio
								</a>
							</Button>
						)}
					</div>

					{/* Transcript preview */}
					<div className="rounded-lg border p-3">
						<p className="text-xs font-medium text-muted-foreground mb-2">
							Word-level timestamps ({userTranscription.words.length} words)
						</p>
						<p className="text-sm text-muted-foreground line-clamp-4">
							{userTranscription.text}
						</p>
					</div>
				</Card>
			)}
		</div>
	);
}
