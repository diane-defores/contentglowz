import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { z } from "zod";

export const reelFromContentSchema = z.object({
  title: z.string().min(1).max(240),
  hook: z.string().max(400).default(""),
  key_points: z.array(z.string().min(1).max(400)).min(1).max(5),
  cta: z.string().max(240).default(""),
});

export type ReelFromContentProps = z.infer<typeof reelFromContentSchema>;

const COLORS = {
  background: "#0f172a",
  panel: "#111827",
  title: "#f8fafc",
  body: "#cbd5e1",
  accent: "#22d3ee",
};

export const ReelFromContent = ({
  title,
  hook,
  key_points,
  cta,
}: ReelFromContentProps) => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();

  const fadeIn = spring({
    frame,
    fps,
    durationInFrames: 30,
    config: { damping: 120 },
  });
  const fadeOut = interpolate(
    frame,
    [durationInFrames - 30, durationInFrames],
    [1, 0],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" },
  );

  return (
    <AbsoluteFill
      style={{
        backgroundColor: COLORS.background,
        color: COLORS.body,
        fontFamily: "Inter, Arial, sans-serif",
        padding: 64,
        opacity: fadeIn * fadeOut,
      }}
    >
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          height: "100%",
          border: `2px solid ${COLORS.accent}`,
          borderRadius: 16,
          padding: 56,
          backgroundColor: COLORS.panel,
          gap: 36,
        }}
      >
        <h1
          style={{
            margin: 0,
            color: COLORS.title,
            fontSize: 64,
            lineHeight: 1.1,
          }}
        >
          {title}
        </h1>
        {hook ? (
          <p style={{ margin: 0, fontSize: 40, lineHeight: 1.2 }}>
            {hook}
          </p>
        ) : null}
        <ol
          style={{
            display: "flex",
            flexDirection: "column",
            margin: 0,
            paddingLeft: 40,
            gap: 18,
            fontSize: 34,
            lineHeight: 1.25,
            flex: 1,
          }}
        >
          {key_points.map((point, index) => (
            <li key={`${index}-${point.slice(0, 20)}`}>{point}</li>
          ))}
        </ol>
        {cta ? (
          <p
            style={{
              margin: 0,
              fontSize: 34,
              fontWeight: 600,
              color: COLORS.title,
            }}
          >
            {cta}
          </p>
        ) : null}
      </div>
    </AbsoluteFill>
  );
};
