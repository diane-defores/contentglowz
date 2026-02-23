"use client";

import { Loader2, Mic, Pause, Play, RotateCcw, Upload } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";

interface ReelsAudioRecorderProps {
	scriptText: string;
	onUpload: (blob: Blob) => void;
	uploading?: boolean;
}

export function ReelsAudioRecorder({
	scriptText,
	onUpload,
	uploading,
}: ReelsAudioRecorderProps) {
	const [recording, setRecording] = useState(false);
	const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
	const [audioUrl, setAudioUrl] = useState<string | null>(null);
	const [duration, setDuration] = useState(0);
	const [permissionError, setPermissionError] = useState<string | null>(null);

	const mediaRecorderRef = useRef<MediaRecorder | null>(null);
	const chunksRef = useRef<Blob[]>([]);
	const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
	const audioRef = useRef<HTMLAudioElement>(null);

	// Cleanup on unmount
	useEffect(() => {
		return () => {
			if (timerRef.current) clearInterval(timerRef.current);
			if (audioUrl) URL.revokeObjectURL(audioUrl);
			if (mediaRecorderRef.current?.state === "recording") {
				mediaRecorderRef.current.stop();
			}
		};
	}, [audioUrl]);

	const startRecording = useCallback(async () => {
		setPermissionError(null);
		setAudioBlob(null);
		if (audioUrl) URL.revokeObjectURL(audioUrl);
		setAudioUrl(null);
		setDuration(0);
		chunksRef.current = [];

		try {
			const stream = await navigator.mediaDevices.getUserMedia({
				audio: true,
			});

			const recorder = new MediaRecorder(stream, {
				mimeType: "audio/webm;codecs=opus",
			});

			recorder.ondataavailable = (e) => {
				if (e.data.size > 0) chunksRef.current.push(e.data);
			};

			recorder.onstop = () => {
				stream.getTracks().forEach((t) => t.stop());
				const blob = new Blob(chunksRef.current, {
					type: "audio/webm;codecs=opus",
				});
				setAudioBlob(blob);
				setAudioUrl(URL.createObjectURL(blob));
				if (timerRef.current) clearInterval(timerRef.current);
			};

			mediaRecorderRef.current = recorder;
			recorder.start(250);
			setRecording(true);

			// Timer
			const startTime = Date.now();
			timerRef.current = setInterval(() => {
				setDuration(Math.floor((Date.now() - startTime) / 1000));
			}, 1000);
		} catch (err) {
			setPermissionError(
				"Microphone access denied. Please allow microphone in your browser settings.",
			);
		}
	}, [audioUrl]);

	const stopRecording = useCallback(() => {
		if (mediaRecorderRef.current?.state === "recording") {
			mediaRecorderRef.current.stop();
		}
		setRecording(false);
	}, []);

	const formatTime = (s: number) => {
		const m = Math.floor(s / 60);
		const sec = s % 60;
		return `${m}:${sec.toString().padStart(2, "0")}`;
	};

	return (
		<div className="space-y-4">
			{/* Teleprompter */}
			<div className="rounded-lg border bg-muted/30 p-6">
				<p className="text-xs font-medium text-muted-foreground mb-3">
					TELEPROMPTER — Read this aloud
				</p>
				<div className="max-h-[300px] overflow-y-auto">
					<p className="text-lg leading-relaxed whitespace-pre-wrap">
						{scriptText}
					</p>
				</div>
			</div>

			{/* Recording controls */}
			<div className="flex items-center gap-3">
				{!recording && !audioBlob && (
					<Button onClick={startRecording} size="lg">
						<Mic className="mr-2 h-5 w-5" />
						Start Recording
					</Button>
				)}

				{recording && (
					<>
						<Button
							onClick={stopRecording}
							variant="destructive"
							size="lg"
						>
							<Pause className="mr-2 h-5 w-5" />
							Stop
						</Button>
						<div className="flex items-center gap-2">
							<div className="h-3 w-3 animate-pulse rounded-full bg-red-500" />
							<span className="font-mono text-sm">
								{formatTime(duration)}
							</span>
						</div>
					</>
				)}

				{audioBlob && !recording && (
					<>
						<Button
							variant="outline"
							size="lg"
							onClick={startRecording}
						>
							<RotateCcw className="mr-2 h-5 w-5" />
							Re-record
						</Button>
						<Button
							size="lg"
							onClick={() => onUpload(audioBlob)}
							disabled={uploading}
						>
							{uploading ? (
								<Loader2 className="mr-2 h-5 w-5 animate-spin" />
							) : (
								<Upload className="mr-2 h-5 w-5" />
							)}
							Upload & Continue
						</Button>
					</>
				)}
			</div>

			{/* Playback preview */}
			{audioUrl && (
				<div className="rounded-lg border p-3">
					<audio ref={audioRef} src={audioUrl} controls className="w-full" />
					<p className="mt-1 text-xs text-muted-foreground">
						Duration: {formatTime(duration)}
					</p>
				</div>
			)}

			{/* Permission error */}
			{permissionError && (
				<p className="text-sm text-red-500">{permissionError}</p>
			)}
		</div>
	);
}
