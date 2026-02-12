import { z } from "zod";

export const ConfigSchema = z.object({
  TEAMS_WINDOW_KEYWORDS: z.array(z.string()).min(1, "At least one keyword is required"),
  POLL_INTERVAL_ACTIVE: z.number().min(1).max(60),
  POLL_INTERVAL_INACTIVE: z.number().min(10).max(300),
  STABILITY_CHECK_DELAY: z.number().min(1).max(20),
  EXPORT_FOLDER: z.string().optional(),
});

export type ConfigValues = z.infer<typeof ConfigSchema>;
