import type { FC } from 'react'; // Import FC type separately
import { AbsoluteFill } from 'remotion';
import { CircleCountdown } from './CircleCountdown';
// import React from 'react'; // Remove explicit Rea

interface CountdownProps {
  durationInFrames: number;
  // Optional: Pass size, colors, etc. if you want to customize further
}

export const Countdown: FC<CountdownProps> = ({ durationInFrames }) => {
  return (
    // Use AbsoluteFill to easily position it within a parent Sequence/Composition
    <AbsoluteFill style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <CircleCountdown durationInFrames={durationInFrames} />
    </AbsoluteFill>
  );
}; 