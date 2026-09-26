import { Campaign, Level } from "@/domain/types";
import { startupCtoCampaign, startupCtoLevels, startupCtoLevelMap } from "./startup-cto/campaign";

export const campaigns: Campaign[] = [startupCtoCampaign];
export const allLevels: Level[] = startupCtoLevels;
export const levelMap: Record<string, Level> = startupCtoLevelMap;
export const getLevel = (id: string) => levelMap[id];
