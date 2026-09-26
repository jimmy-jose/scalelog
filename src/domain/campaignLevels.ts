import { levelSchema } from "./schemas";
import type { Level } from "./types";

/** The ordered manifest is the single source of truth for this linear campaign. */
export function defineCampaignLevels(campaignId: string, manifest: Level[]): Level[] {
  const ids = new Set<string>();
  return manifest.map((source, index) => {
    if (source.campaignId !== campaignId || source.levelNumber !== index + 1 || ids.has(source.id)) {
      throw new Error(`Invalid campaign level ${source.id}: use unique IDs, the matching campaignId, and consecutive level numbers in manifest order.`);
    }
    ids.add(source.id);
    const nextLevel = manifest[index + 1]?.id;
    return levelSchema.parse({ ...source, nextLevel, unlocks: nextLevel ? [nextLevel] : [] });
  });
}
