import type { CSSProperties } from 'react';
import { interpolate, useCurrentFrame, useVideoConfig } from 'remotion';

interface CircleCountdownProps {
  durationInFrames: number;
  // Add any other props needed like size, colors, etc.
}

// Define styles directly or import from a CSS module
const styles: { [key: string]: CSSProperties } = {
  container: {
    position: 'relative',
    width: '320px', // Adjust size as needed
    height: '320px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  frame: {
    position: 'absolute',
    inset: '2rem', // Corresponds to inset-8 tailwind
    borderRadius: '50%',
    background: 'rgba(255, 255, 255, 0.1)', // Semi-transparent white circle background
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  numberText: {
    fontSize: '6rem', // Corresponds to text-9xl? Adjust as needed
    fontWeight: 'bold',
    color: '#FFFFFF', // Keep text white
  },
  svg: {
    position: 'absolute',
    inset: 0,
    width: '100%',
    height: '100%',
    transform: 'rotate(-90deg)',
  },
  circleTrack: {
    fill: 'none',
    stroke: 'rgba(255, 255, 255, 0.3)', // Semi-transparent white track
  },
  circleProgress: {
    fill: 'none',
    stroke: '#FFFFFF', // White progress
    strokeLinecap: 'round',
  },
};


export const CircleCountdown: React.FC<CircleCountdownProps> = ({
  durationInFrames,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const durationInSeconds = durationInFrames / fps;

  // Circle properties
  const radius = 110;
  const strokeWidth = 15;
  const circumference = 2 * Math.PI * radius;

  // Calculate progress (0 to 1) based on current frame
  // Ensure progress doesn't go below 0 or above 1
   const progress = interpolate(
    frame,
    [0, durationInFrames],
    [1, 0], // Interpolate from 1 (start) down to 0 (end)
    { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }
  );


  // Calculate the number to display (ceil rounds up, making 10 display longer)
  // We want to show the number *until* the next second starts
  const secondsElapsed = frame / fps;
  const secondsRemaining = Math.ceil(durationInSeconds - secondsElapsed);
  const displaySeconds = Math.max(0, secondsRemaining); // Ensure it doesn't go negative

  // Calculate stroke dash offset based on progress
  const strokeDashoffset = circumference * (1 - progress);

   // Revised Completion Animation to better match keyframes
   // Scale up quickly then scale down and fade
   const completionThreshold = durationInFrames - fps * 0.7; // Start animation slightly earlier
   const peakScaleFrame = durationInFrames - fps * 0.3; // Point where scale reaches max

   const completionScale = interpolate(
    frame,
    [completionThreshold, peakScaleFrame, durationInFrames],
    [1, 1.2, 0.8], // Scale up to 1.2, then down to 0.8
    { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }
   );

   const completionOpacity = interpolate(
    frame,
    [completionThreshold, durationInFrames], // Fade out over the entire animation duration
    [1, 0], 
    { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }
   );


  return (
    <div style={styles.container}>
      {/* Frame */}
      <div style={styles.frame}>
        {/* Number display */}
        <div
          style={{
            ...styles.numberText,
            transform: `scale(${completionScale})`,
             opacity: completionOpacity,
          }}
        >
          {displaySeconds}
        </div>
      </div>

      {/* SVG circular progress */}
      <svg
        style={styles.svg}
        viewBox={`0 0 ${radius * 2 + strokeWidth} ${radius * 2 + strokeWidth}`}
        role="img" // Add role for accessibility
      >
        <title>Circular Countdown Timer</title> { /* Add title for accessibility */ }
        {/* Background track */}
        <circle
          cx={radius + strokeWidth / 2}
          cy={radius + strokeWidth / 2}
          r={radius}
          strokeWidth={strokeWidth}
          style={styles.circleTrack}
        />
        {/* Progress indicator */}
        <circle
          cx={radius + strokeWidth / 2}
          cy={radius + strokeWidth / 2}
          r={radius}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          style={styles.circleProgress}
        />
      </svg>
    </div>
  );
}; 