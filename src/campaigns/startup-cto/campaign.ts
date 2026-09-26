import { Campaign } from "@/domain/types";
import { level001 } from "./levels/level-001";
import { level002 } from "./levels/level-002";
import { level003 } from "./levels/level-003";
import { defineCampaignLevels } from "@/domain/campaignLevels";

// Add new level imports to this ordered manifest; links and unlocks are generated.
export const startupCtoLevels = defineCampaignLevels("startup-cto", [level001, level002, level003]);

export const startupCtoCampaign: Campaign = {
  id: "startup-cto", title: "Startup CTO", subtitle: "From garage to growth",
  description: "Turn a tiny MVP into a resilient product without burning the company to the ground.", accent: "#8CF4D2", levelIds: startupCtoLevels.map((level) => level.id), totalLevels: 50,
  story: {
    companyName: "Cartline",
    product: "An order and storefront dashboard for independent retailers.",
    situation: "At the campaign’s starting line, Cartline’s beta has 250 users. Two engineers ship a Laravel (PHP) monolith backed by PostgreSQL. One codebase and one deploy keep delivery quick, but every feature shares the same release and failure boundary. Your decisions may change that architecture as the company grows.",
    objective: "Grow toward 100,000 users without letting database incidents, operating costs, or reliability outpace the team.",
    startingCompany: { cash: 40000, monthlyRevenue: 2000, monthlyBurn: 7800, users: 250, engineers: 2, customerTrust: 72, reliability: 84, complexity: 14 },
  },
};

export const startupCtoLevelMap = Object.fromEntries(startupCtoLevels.map((level) => [level.id, level]));
