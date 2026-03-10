/**
 * Get Pending Validations Tool
 *
 * Fetches articles scheduled for the coming days that need manual validation.
 * Returns a structured list the AI can present as interactive validation cards.
 */
import { tool } from "ai";
import { z } from "zod";

const BACKEND_URL = process.env.BACKEND_URL ?? "http://localhost:8000";

export type PendingArticle = {
  id: string;
  title: string;
  cluster: string;
  project_id: string;
  project_name: string;
  content_path: string;
  scheduled_pub_date: string | null;
  tags: string[];
  preview: string;
};

export const getPendingValidations = tool({
  description:
    "Fetch articles pending manual validation for a project. " +
    "Call this when the user asks about their daily tasks, content to review, " +
    "or articles to validate. Returns a list of articles with scheduled publish dates.",
  inputSchema: z.object({
    project_id: z
      .string()
      .optional()
      .describe("Project ID to filter by. Omit to get all projects."),
    days_ahead: z
      .number()
      .optional()
      .default(7)
      .describe("How many days ahead to look for scheduled articles (default: 7)"),
  }),
  execute: async ({ project_id, days_ahead = 7 }) => {
    try {
      const params = new URLSearchParams({ days_ahead: String(days_ahead) });
      if (project_id) params.set("project_id", project_id);

      const res = await fetch(
        `${BACKEND_URL}/api/content/pending-validations?${params}`,
        { next: { revalidate: 0 } },
      );

      if (!res.ok) {
        return { error: `Backend returned ${res.status}`, articles: [] };
      }

      const data = await res.json();
      return data as { articles: PendingArticle[]; total: number };
    } catch (err) {
      return { error: String(err), articles: [] };
    }
  },
});
