import type React from "react";
import {
    AbsoluteFill,
    Sequence,
    interpolate,
    spring,
    useCurrentFrame,
    useVideoConfig,
} from "remotion";

// --- Component for animating each word ---
const AnimatedWord: React.FC<{ word: string; totalWordDuration: number }> = ({
	word,
	totalWordDuration,
}) => {
	const frame = useCurrentFrame();
	const { fps } = useVideoConfig();

	// Simple spring animation for scale/opacity
	const progress = spring({
		frame,
		fps,
		config: {
			damping: 100,
			stiffness: 150,
		},
		durationInFrames: 10, // Faster animation based on new wordDuration
	});

	const scale = interpolate(progress, [0, 1], [0.8, 1]);
	const opacity = interpolate(progress, [0, 1], [0, 1]);

	// Fade out faster within the shorter word duration
	const fadeOut = interpolate(
		frame,
		// Adjust fade-out for shorter totalWordDuration
		[totalWordDuration * 0.4, totalWordDuration * 0.7],
		[1, 0],
		{
			extrapolateLeft: "clamp",
			extrapolateRight: "clamp",
		},
	);

	return (
		<span
			style={{
				display: "inline-block", // Needed for transform
				margin: "0 5px", // Add slightly more space between words
				color: "#FFFFFF",
				fontSize: 160, // Increase font size significantly
				fontWeight: "bold",
				transform: `scale(${scale})`,
				opacity: opacity * fadeOut, // Combine fade in and fade out
			}}
		>
			{word}
		</span>
	);
};

// --- Main IntroText component ---
interface IntroTextProps {
	text: string;
	// Optional: Allow customizing timings via props later if needed
}

// Calculate duration outside the component to potentially export/use elsewhere
const calculateIntroDuration = (text: string) => {
	const words = text.split(" ");
	const wordDuration = 12; // Frames each word is primarily visible (Shorter)
	const wordDelay = 5; // Frames delay before the next word starts appearing (Faster)
	// Ensure enough time for the last word's animation to complete
	return words.length * wordDelay + wordDuration * 2;
};

export const IntroText: React.FC<IntroTextProps> = ({ text }) => {
	const words = text.split(" ");
	const wordDuration = 12; // Use shorter duration here
	const wordDelay = 5; // Use the faster delay here too

	return (
		<AbsoluteFill
			style={{
				width: "100%",
				height: "100%",
				display: "flex",
				justifyContent: "center",
				alignItems: "center",
			}}
		>
			<div
				style={{
					textAlign: "center",
					fontFamily: "Arial, sans-serif", // Keep font consistent
				}}
			>
				{words.map((word, index) => {
					const wordStartFrame = index * wordDelay;
					// Keep word sequence slightly longer to allow for outro animation
					const wordSequenceDuration = 18; // Based on new wordDuration (12 * 1.5)

					// Use a unique key combining word and index
					const key = `${word}-${index}`;

					return (
						<Sequence
							key={key}
							from={wordStartFrame}
							durationInFrames={wordSequenceDuration}
						>
							<div
								style={{
									width: "100%",
									height: "100%",
									display: "flex",
									justifyContent: "center",
									alignItems: "center",
									fontWeight: "bold",
								}}
							>
								<AnimatedWord word={word} totalWordDuration={wordDuration} />
							</div>
						</Sequence>
					);
				})}
			</div>
		</AbsoluteFill>
	);
};

// Export the calculated duration so QuizVideo can use it for sequencing
export const introDuration = calculateIntroDuration("Welcome to your Remotion template on Railway!");
