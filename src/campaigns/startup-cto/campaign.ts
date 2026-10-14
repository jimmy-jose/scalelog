import { Campaign } from "@/domain/types";
import { level001 } from "./levels/level-001";
import { level002 } from "./levels/level-002";
import { level003 } from "./levels/level-003";
import { level004 } from "./levels/level-004";
import { level005 } from "./levels/level-005";
import { level006 } from "./levels/level-006";
import { level007 } from "./levels/level-007";
import { level008 } from "./levels/level-008";
import { level009 } from "./levels/level-009";
import { level010 } from "./levels/level-010";
import { level011 } from "./levels/level-011";
import { level012 } from "./levels/level-012";
import { level013 } from "./levels/level-013";
import { level014 } from "./levels/level-014";
import { level015 } from "./levels/level-015";
import { level016 } from "./levels/level-016";
import { level017 } from "./levels/level-017";
import { level018 } from "./levels/level-018";
import { level019 } from "./levels/level-019";
import { level020 } from "./levels/level-020";
import { level021 } from "./levels/level-021";
import { level022 } from "./levels/level-022";
import { level023 } from "./levels/level-023";
import { level024 } from "./levels/level-024";
import { level025 } from "./levels/level-025";
import { level026 } from "./levels/level-026";
import { level027 } from "./levels/level-027";
import { level028 } from "./levels/level-028";
import { level029 } from "./levels/level-029";
import { level030 } from "./levels/level-030";
import { level031 } from "./levels/level-031";
import { level032 } from "./levels/level-032";
import { level033 } from "./levels/level-033";
import { level034 } from "./levels/level-034";
import { level035 } from "./levels/level-035";
import { level036 } from "./levels/level-036";
import { defineCampaignLevels } from "@/domain/campaignLevels";

// Add new level imports to this ordered manifest; links and unlocks are generated.
export const startupCtoLevels = defineCampaignLevels("startup-cto", [
  level001, level002, level003, level004, level005, level006, level007, level008, level009, level010, level011, level012, level013, level014, level015, level016, level017, level018, level019, level020, level021, level022, level023, level024, level025, level026, level027, level028, level029, level030, level031, level032, level033, level034, level035, level036
]);

export const startupCtoCampaign: Campaign = {
  id: "startup-cto", title: "Startup CTO", subtitle: "From garage to growth",
  description: "Turn a tiny MVP into a resilient product without burning the company to the ground.", accent: "#8CF4D2", levelIds: startupCtoLevels.map((level) => level.id), totalLevels: 36,
  story: {
    companyName: "Cartline",
    product: "An order and storefront dashboard for independent retailers.",
    situation: "At the campaign’s starting line, Cartline’s beta has 250 users. Two engineers ship a Laravel (PHP) monolith backed by PostgreSQL. One codebase and one deploy keep delivery quick, but every feature shares the same release and failure boundary. Your decisions may change that architecture as the company grows.",
    objective: "Grow toward four million registered users by proving a bounded workload, consistency, cost and recovery contract with the architecture you actually build.",
    startingCompany: { cash: 40000, monthlyRevenue: 2000, monthlyBurn: 7800, users: 250, engineers: 2, customerTrust: 72, reliability: 84, complexity: 14 },
  },
};

export const startupCtoLevelMap = Object.fromEntries(startupCtoLevels.map((level) => [level.id, level]));
