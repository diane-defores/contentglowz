/**
 * User Entitlements System
 *
 * Defines rate limits and feature access based on user type.
 * This is the central configuration for the tiered access system.
 *
 * All Clerk-authenticated users are "regular" type.
 */
import type { ChatModel } from "./models";

type UserType = "regular";

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
	 * For users with an account
	 */
	regular: {
		maxMessagesPerDay: 100,
		availableChatModelIds: ["chat-model", "chat-model-reasoning"],
	},
};
