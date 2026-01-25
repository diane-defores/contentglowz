/**
 * Artifact Class Definition and Types
 *
 * This module defines the Artifact class - a registry pattern for different
 * artifact types (text, code, sheet, image). Each artifact type declares:
 * - How to render its content
 * - Available toolbar actions
 * - Stream handlers for real-time updates
 * - Initialization logic
 *
 * New artifact types are created by instantiating this class with
 * appropriate configuration and registering in artifactDefinitions.
 */
import type { UseChatHelpers } from "@ai-sdk/react";
import type { DataUIPart } from "ai";
import type { ComponentType, Dispatch, ReactNode, SetStateAction } from "react";
import type { Suggestion } from "@/lib/db/schema";
import type { ChatMessage, CustomUIDataTypes } from "@/lib/types";
import type { UIArtifact } from "./artifact";

/** Context passed to artifact action handlers (toolbar buttons) */
export type ArtifactActionContext<M = any> = {
  content: string;
  handleVersionChange: (type: "next" | "prev" | "toggle" | "latest") => void;
  currentVersionIndex: number;
  isCurrentVersion: boolean;
  mode: "edit" | "diff";
  metadata: M;
  setMetadata: Dispatch<SetStateAction<M>>;
};

/** Individual action item (button) in artifact header/toolbar */
type ArtifactAction<M = any> = {
  icon: ReactNode;
  label?: string;
  description: string;
  onClick: (context: ArtifactActionContext<M>) => Promise<void> | void;
  isDisabled?: (context: ArtifactActionContext<M>) => boolean;
};

/** Context for toolbar items (floating action buttons) */
export type ArtifactToolbarContext = {
  sendMessage: UseChatHelpers<ChatMessage>["sendMessage"];
};

/** Toolbar item configuration */
export type ArtifactToolbarItem = {
  description: string;
  icon: ReactNode;
  onClick: (context: ArtifactToolbarContext) => void;
};

/** Props passed to the artifact content renderer component */
type ArtifactContent<M = any> = {
  title: string;
  content: string;
  mode: "edit" | "diff";
  isCurrentVersion: boolean;
  currentVersionIndex: number;
  status: "streaming" | "idle";
  suggestions: Suggestion[];
  onSaveContent: (updatedContent: string, debounce: boolean) => void;
  isInline: boolean;
  getDocumentContentById: (index: number) => string;
  isLoading: boolean;
  metadata: M;
  setMetadata: Dispatch<SetStateAction<M>>;
};

/** Parameters for artifact initialization on mount */
type InitializeParameters<M = any> = {
  documentId: string;
  setMetadata: Dispatch<SetStateAction<M>>;
};

/** Full configuration for an artifact type */
type ArtifactConfig<T extends string, M = any> = {
  /** Unique identifier for this artifact type */
  kind: T;
  /** Human-readable description (shown in AI prompts) */
  description: string;
  /** React component to render artifact content */
  content: ComponentType<ArtifactContent<M>>;
  /** Header action buttons (copy, undo, redo, etc.) */
  actions: ArtifactAction<M>[];
  /** Floating toolbar items (quick actions) */
  toolbar: ArtifactToolbarItem[];
  /** Called when artifact is first opened */
  initialize?: (parameters: InitializeParameters<M>) => void;
  /** Handler for custom streaming data parts */
  onStreamPart: (args: {
    setMetadata: Dispatch<SetStateAction<M>>;
    setArtifact: Dispatch<SetStateAction<UIArtifact>>;
    streamPart: DataUIPart<CustomUIDataTypes>;
  }) => void;
};

/**
 * Artifact class for defining new artifact types.
 *
 * Usage:
 * ```ts
 * export const myArtifact = new Artifact<"myType", MyMetadata>({
 *   kind: "myType",
 *   description: "Description for AI",
 *   content: MyContentComponent,
 *   actions: [...],
 *   toolbar: [...],
 *   onStreamPart: ({ streamPart, setArtifact }) => { ... }
 * });
 * ```
 */
export class Artifact<T extends string, M = any> {
  readonly kind: T;
  readonly description: string;
  readonly content: ComponentType<ArtifactContent<M>>;
  readonly actions: ArtifactAction<M>[];
  readonly toolbar: ArtifactToolbarItem[];
  readonly initialize?: (parameters: InitializeParameters) => void;
  readonly onStreamPart: (args: {
    setMetadata: Dispatch<SetStateAction<M>>;
    setArtifact: Dispatch<SetStateAction<UIArtifact>>;
    streamPart: DataUIPart<CustomUIDataTypes>;
  }) => void;

  constructor(config: ArtifactConfig<T, M>) {
    this.kind = config.kind;
    this.description = config.description;
    this.content = config.content;
    this.actions = config.actions || [];
    this.toolbar = config.toolbar || [];
    this.initialize = config.initialize || (async () => ({}));
    this.onStreamPart = config.onStreamPart;
  }
}
