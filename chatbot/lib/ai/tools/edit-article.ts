/**
 * Edit Article Tool
 *
 * Fetches an article's full content from the backend and opens it
 * in the artifact panel so the user can edit it directly.
 * Triggered when the user clicks "Éditer" on a validation card.
 */
import { tool } from "ai";
import { z } from "zod";

const BACKEND_URL = process.env.BACKEND_URL ?? "http://localhost:8000";

export const editArticle = tool({
  description:
    "Open an article in the editor for the user to read and edit. " +
    "Call this when the user wants to edit a specific article by ID or title. " +
    "Fetches the full markdown content and opens it in the artifact panel.",
  inputSchema: z.object({
    content_id: z.string().describe("The article content ID from the validation queue"),
    title: z.string().describe("Article title for display"),
  }),
  execute: async ({ content_id, title }) => {
    try {
      const res = await fetch(`${BACKEND_URL}/api/content/${content_id}`, {
        next: { revalidate: 0 },
      });

      if (!res.ok) {
        return { error: `Could not load article (${res.status})`, content_id };
      }

      const data = await res.json();
      const fullContent: string = data.full_content ?? data.preview ?? "";

      return {
        content_id,
        title,
        content: fullContent,
        content_path: data.content_path,
        cluster: data.cluster,
        scheduled_pub_date: data.scheduled_pub_date,
      };
    } catch (err) {
      return { error: String(err), content_id };
    }
  },
});
