import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  contentFlowTimelinePropsSchema,
  deriveTimelineMetadata,
} from "./ContentFlowTimelineVideo";
import { landscapeTimelineFixture, verticalTimelineFixture } from "./timeline-fixtures";

describe("ContentFlow timeline props", () => {
  it("accepts vertical and landscape fixtures", () => {
    assert.equal(contentFlowTimelinePropsSchema.safeParse(verticalTimelineFixture).success, true);
    assert.equal(contentFlowTimelinePropsSchema.safeParse(landscapeTimelineFixture).success, true);
  });

  it("derives Remotion metadata from validated timeline props", () => {
    assert.deepEqual(deriveTimelineMetadata(landscapeTimelineFixture), {
      width: 1920,
      height: 1080,
      fps: 30,
      durationInFrames: 300,
    });
  });

  it("rejects unsupported fps and overlong timelines", () => {
    const parsed = contentFlowTimelinePropsSchema.safeParse({
      ...verticalTimelineFixture,
      format: {
        ...verticalTimelineFixture.format,
        fps: 60,
        duration_in_frames: 5401,
      },
    });

    assert.equal(parsed.success, false);
  });

  it("falls back to safe vertical metadata for invalid props", () => {
    assert.deepEqual(deriveTimelineMetadata({}), {
      width: 1080,
      height: 1920,
      fps: 30,
      durationInFrames: 180,
    });
  });
});
