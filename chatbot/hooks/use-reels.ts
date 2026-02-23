"use client";

import { useCallback, useState } from "react";

export interface WordTimestamp {
	word: string;
	start: number;
	end: number;
}

export interface ReelData {
	reelId: string;
	videoUrl: string;
	audioUrl: string;
	duration: number | null;
	caption: string | null;
	author: string | null;
}

export interface TranscriptionResult {
	text: string;
	words: WordTimestamp[];
	language: string;
	duration: number;
}

export interface RewriteResult {
	rewrittenText: string;
	model: string;
}

export type PipelineStep =
	| "idle"
	| "downloading"
	| "transcribing"
	| "rewriting"
	| "editing"
	| "recording"
	| "retranscribing"
	| "done";

export function useReels() {
	const [step, setStep] = useState<PipelineStep>("idle");
	const [error, setError] = useState<string | null>(null);
	const [reelData, setReelData] = useState<ReelData | null>(null);
	const [transcription, setTranscription] =
		useState<TranscriptionResult | null>(null);
	const [rewrite, setRewrite] = useState<RewriteResult | null>(null);
	const [editedCopy, setEditedCopy] = useState<string>("");
	const [userAudioUrl, setUserAudioUrl] = useState<string | null>(null);
	const [userTranscription, setUserTranscription] =
		useState<TranscriptionResult | null>(null);

	// Cookie status
	const [cookieStatus, setCookieStatus] = useState<{
		hasCookies: boolean;
		username: string | null;
	}>({ hasCookies: false, username: null });
	const [cookieLoading, setCookieLoading] = useState(false);

	const checkCookies = useCallback(async () => {
		setCookieLoading(true);
		try {
			const res = await fetch("/api/reels/cookies");
			if (res.ok) {
				const data = await res.json();
				setCookieStatus({
					hasCookies: data.has_cookies,
					username: data.username,
				});
			}
		} catch {
			// Silent fail — cookie check is non-critical
		} finally {
			setCookieLoading(false);
		}
	}, []);

	const uploadCookies = useCallback(async (content: string) => {
		setCookieLoading(true);
		setError(null);
		try {
			const res = await fetch("/api/reels/cookies", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ cookiesContent: content }),
			});
			if (!res.ok) {
				const data = await res.json();
				throw new Error(data.error || "Failed to upload cookies");
			}
			await checkCookies();
		} catch (err) {
			setError(err instanceof Error ? err.message : "Cookie upload failed");
		} finally {
			setCookieLoading(false);
		}
	}, [checkCookies]);

	const deleteCookies = useCallback(async () => {
		setCookieLoading(true);
		try {
			await fetch("/api/reels/cookies", { method: "DELETE" });
			setCookieStatus({ hasCookies: false, username: null });
		} catch {
			// Silent fail
		} finally {
			setCookieLoading(false);
		}
	}, []);

	// Step 1: Download reel
	const downloadReel = useCallback(async (url: string) => {
		setStep("downloading");
		setError(null);
		setReelData(null);
		setTranscription(null);
		setRewrite(null);
		setEditedCopy("");
		setUserAudioUrl(null);
		setUserTranscription(null);

		try {
			const res = await fetch("/api/reels/download", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ url }),
			});
			if (!res.ok) {
				const data = await res.json();
				throw new Error(data.error || "Download failed");
			}
			const data = await res.json();
			setReelData({
				reelId: data.reel_id,
				videoUrl: data.video_url,
				audioUrl: data.audio_url,
				duration: data.duration,
				caption: data.caption,
				author: data.author,
			});

			// Auto-trigger transcription
			await transcribeAudio(data.audio_url);
		} catch (err) {
			setError(err instanceof Error ? err.message : "Download failed");
			setStep("idle");
		}
	}, []);

	// Step 2: Transcribe original audio
	const transcribeAudio = useCallback(async (audioUrl: string) => {
		setStep("transcribing");
		try {
			const res = await fetch("/api/reels/transcribe", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ audioUrl }),
			});
			if (!res.ok) {
				const data = await res.json();
				throw new Error(data.error || "Transcription failed");
			}
			const data = await res.json();
			setTranscription(data);

			// Auto-trigger rewrite
			await rewriteTranscript(data.text, data.language);
		} catch (err) {
			setError(err instanceof Error ? err.message : "Transcription failed");
			setStep("idle");
		}
	}, []);

	// Step 3: Rewrite transcript
	const rewriteTranscript = useCallback(
		async (text: string, language?: string) => {
			setStep("rewriting");
			try {
				const res = await fetch("/api/reels/rewrite", {
					method: "POST",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify({
						transcript: text,
						language,
					}),
				});
				if (!res.ok) {
					const data = await res.json();
					throw new Error(data.error || "Rewrite failed");
				}
				const data = await res.json();
				setRewrite(data);
				setEditedCopy(data.rewrittenText);
				setStep("editing");
			} catch (err) {
				setError(err instanceof Error ? err.message : "Rewrite failed");
				setStep("idle");
			}
		},
		[],
	);

	// Step 4: User finishes editing
	const finishEditing = useCallback(() => {
		setStep("recording");
	}, []);

	// Step 5: Upload user's recorded audio
	const uploadUserAudio = useCallback(
		async (audioBlob: Blob, reelId: string) => {
			setError(null);
			try {
				const formData = new FormData();
				formData.append("audio", audioBlob, "user-voice.webm");
				formData.append("reelId", reelId);

				const res = await fetch("/api/reels/upload-audio", {
					method: "POST",
					body: formData,
				});
				if (!res.ok) {
					const data = await res.json();
					throw new Error(data.error || "Audio upload failed");
				}
				const data = await res.json();
				setUserAudioUrl(data.audioUrl);

				// Auto-trigger re-transcription
				await retranscribeUserAudio(data.audioUrl);
			} catch (err) {
				setError(
					err instanceof Error ? err.message : "Audio upload failed",
				);
			}
		},
		[],
	);

	// Step 6: Re-transcribe user's audio for word-level timestamps
	const retranscribeUserAudio = useCallback(async (audioUrl: string) => {
		setStep("retranscribing");
		try {
			const res = await fetch("/api/reels/transcribe", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ audioUrl }),
			});
			if (!res.ok) {
				const data = await res.json();
				throw new Error(data.error || "Re-transcription failed");
			}
			const data = await res.json();
			setUserTranscription(data);
			setStep("done");
		} catch (err) {
			setError(
				err instanceof Error ? err.message : "Re-transcription failed",
			);
			setStep("recording");
		}
	}, []);

	// Generate SRT from word timestamps
	const generateSrt = useCallback(
		(words: WordTimestamp[]): string => {
			const lines: string[] = [];
			const WORDS_PER_LINE = 4;
			let index = 1;

			for (let i = 0; i < words.length; i += WORDS_PER_LINE) {
				const chunk = words.slice(i, i + WORDS_PER_LINE);
				const start = formatSrtTime(chunk[0].start);
				const end = formatSrtTime(chunk[chunk.length - 1].end);
				const text = chunk.map((w) => w.word).join(" ");

				lines.push(`${index}`);
				lines.push(`${start} --> ${end}`);
				lines.push(text);
				lines.push("");
				index++;
			}

			return lines.join("\n");
		},
		[],
	);

	const reset = useCallback(() => {
		setStep("idle");
		setError(null);
		setReelData(null);
		setTranscription(null);
		setRewrite(null);
		setEditedCopy("");
		setUserAudioUrl(null);
		setUserTranscription(null);
	}, []);

	return {
		// State
		step,
		error,
		reelData,
		transcription,
		rewrite,
		editedCopy,
		setEditedCopy,
		userAudioUrl,
		userTranscription,
		// Cookie management
		cookieStatus,
		cookieLoading,
		checkCookies,
		uploadCookies,
		deleteCookies,
		// Pipeline actions
		downloadReel,
		finishEditing,
		uploadUserAudio,
		generateSrt,
		reset,
		clearError: () => setError(null),
	};
}

function formatSrtTime(seconds: number): string {
	const h = Math.floor(seconds / 3600);
	const m = Math.floor((seconds % 3600) / 60);
	const s = Math.floor(seconds % 60);
	const ms = Math.round((seconds % 1) * 1000);
	return `${pad(h)}:${pad(m)}:${pad(s)},${pad(ms, 3)}`;
}

function pad(n: number, len = 2): string {
	return n.toString().padStart(len, "0");
}
