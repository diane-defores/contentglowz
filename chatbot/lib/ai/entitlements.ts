/**
 * User Entitlements System
 *
 * Defines rate limits and feature access based on user type.
 * This is the central configuration for the tiered access system.
 *
 * User types are determined during authentication (see auth.ts):
 * - "guest": Auto-created ephemeral users for demos
 * - "regular": Users with registered accounts
 */
import type { UserType } from "@/app/(auth)/auth";
import type { ChatModel } from "./models";

type Entitlements = {
  /** Maximum messages allowed per 24-hour rolling window */
  maxMessagesPerDay: number;
  /** Model IDs this user tier can access */
  availableChatModelIds: ChatModel["id"][];
};

/**
 * Entitlements lookup by user type.
 * Add new tiers here (e.g., "premium") as business requirements evolve.
 */
export const entitlementsByUserType: Record<UserType, Entitlements> = {
  /*
   * For users without an account
   */
  guest: {
    maxMessagesPerDay: 20,
    availableChatModelIds: ["chat-model", "chat-model-reasoning"],
  },

  /*
   * For users with an account
   */
  regular: {
    maxMessagesPerDay: 100,
    availableChatModelIds: ["chat-model", "chat-model-reasoning"],
  },

  /*
   * TODO: For users with an account and a paid membership
   */
};
