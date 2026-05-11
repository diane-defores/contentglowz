import type React from 'react';
import {
    AbsoluteFill,
    Img,
    interpolate,
    spring,
    staticFile,
    useCurrentFrame,
    useVideoConfig,
} from 'remotion';

import { introDuration } from './IntroText';

type HeroLogoProps = {};

const IMAGE_SIZE = 850;
const SLIDE_DURATION_FRAMES = 20;

export const HeroLogo: React.FC<HeroLogoProps> = () => {
    const frame = useCurrentFrame();
    const { fps } = useVideoConfig();
    const sequenceDuration = introDuration;

    const slideIn = spring({
        frame,
        fps,
        config: { damping: 100, stiffness: 100 },
        durationInFrames: SLIDE_DURATION_FRAMES,
    });
    const translateYIn = interpolate(slideIn, [0, 1], [IMAGE_SIZE, 0]);

    const slideOutStartFrame = sequenceDuration - SLIDE_DURATION_FRAMES;
    const slideOutProgress = spring({
        frame: frame - slideOutStartFrame,
        fps,
        config: { damping: 100, stiffness: 100 },
        durationInFrames: SLIDE_DURATION_FRAMES,
        delay: 0,
    });

    const translateYOut = interpolate(
        slideOutProgress,
        [0, 1],
        [0, IMAGE_SIZE],
        { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }
    );

    const finalTranslateY = frame >= slideOutStartFrame ? translateYOut : translateYIn;

    const opacity = interpolate(
        frame,
        [0, SLIDE_DURATION_FRAMES, slideOutStartFrame, sequenceDuration],
        [0, 1, 1, 0],
        { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }
    );

    return (
        <AbsoluteFill
            style={{
                display: 'flex',
                justifyContent: 'flex-end',
                alignItems: 'flex-end',
            }}
        >
            <div
                style={{
                    transform: `translateY(${finalTranslateY}px)`,
                    opacity: opacity,
                    marginRight: '30px',
                    marginBottom: '-90px',
                }}
            >
                <Img
                    src={staticFile('logo-placeholder.webp')}
                    style={{
                        width: IMAGE_SIZE,
                        height: IMAGE_SIZE,
                        objectFit: 'cover',
                    }}
                />
            </div>
        </AbsoluteFill>
    );
};


