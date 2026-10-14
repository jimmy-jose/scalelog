import type { ArchitectureGraph, Level } from "./types";

/** Pure resolution shared by preview, acceptance, historical replay and save migration. */
export function resolveLevel(level: Level, architecture: ArchitectureGraph): Level {
  const capabilities = new Set(architecture.capabilities ?? []);
  const variant = level.variants?.find(({ when }) =>
    ((!when.missingAny && !when.hasAny) || when.missingAny?.some((capability) => !capabilities.has(capability)) || when.hasAny?.some((capability) => capabilities.has(capability))) &&
    (!when.hasAll || when.hasAll.every((capability) => capabilities.has(capability))));
  const resolved = variant ? {
    ...level, description: variant.description, metrics: variant.metrics, dialogue: variant.dialogue,
    choices: variant.choices ?? level.choices,
  } : level;
  const repairs = level.recoveries?.filter((repair) => !capabilities.has(repair.capability)) ?? [];
  if (!repairs.length) return resolved;
  const descriptions = repairs.map((repair) => repair.description);
  return {
    ...resolved,
    description: `${resolved.description} Prerequisite work: ${descriptions.join(" ")}`,
    dialogue: [...resolved.dialogue, { character: "byte", emotion: "concerned", text: `We still owe this work: ${descriptions.join(" ")} Its cost is included in the affected responses.` }],
    choices: resolved.choices.map((choice) => {
      const needed = repairs.filter((repair) => repair.choiceIds.includes(choice.id));
      if (!needed.length) return choice;
      const cost = choice.cost + needed.reduce((sum, repair) => sum + repair.cost, 0);
      const explanation = needed.map((repair) => `${repair.description} (+$${repair.cost.toLocaleString()} upfront, +$${repair.monthlyBurn.toLocaleString()}/month)`).join(" ");
      return {
        ...choice, cost,
        description: `${choice.description} ${explanation}`,
        effects: {
          ...choice.effects,
          ...(choice.effects.cash === undefined ? {} : { cash: -cost }),
          monthlyBurn: (choice.effects.monthlyBurn ?? 0) + needed.reduce((sum, repair) => sum + repair.monthlyBurn, 0),
          complexity: (choice.effects.complexity ?? 0) + needed.reduce((sum, repair) => sum + repair.complexity, 0),
        },
        architectureChanges: [...needed.flatMap((repair) => repair.architectureChanges), ...(choice.architectureChanges ?? [])],
        tradeoff: { ...choice.tradeoff, downside: `${choice.tradeoff.downside} ${explanation}`, effectReasons: {
          ...choice.tradeoff.effectReasons, upfrontCost: `${choice.tradeoff.effectReasons.upfrontCost ?? ""} ${explanation}`,
          monthlyBurn: `${choice.tradeoff.effectReasons.monthlyBurn ?? ""} Prerequisite operating costs: ${explanation}`,
          complexity: `${choice.tradeoff.effectReasons.complexity ?? ""} Prerequisite work adds ${needed.reduce((sum, repair) => sum + repair.complexity, 0)} operations-load points.`,
        } },
        outcomeNote: `${choice.outcomeNote} Prerequisite work completed: ${explanation}`,
      };
    }),
  };
}
