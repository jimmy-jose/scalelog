import AsyncStorage from "@react-native-async-storage/async-storage";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { allLevels, campaigns, getLevel } from "@/campaigns";
import { ArchitectureGraph, Award, CampaignCompanyState, Choice, Level, OutcomeSnapshot } from "@/domain/types";
import { getFailureReason, resolveDecision } from "@/domain/simulation";
import { applyArchitectureChanges } from "@/domain/architecture";
import { defaultAudioSettings, type AudioSettings } from "@/game/feedback/feedbackTypes";

interface PlayerState {
  ctoXp: number;
  confidence: number;
  currentLevel: string;
  unlockedLevels: string[];
  awards: Award[];
}

interface CompanyState {
  cash: number;
  monthlyRevenue: number;
  monthlyBurn: number;
  users: number;
  engineers: number;
  customerTrust: number;
  reliability: number;
  complexity: number;
}

interface PlayerProfile { name: string; age: number | null }

interface ProgressState {
  completedLevels: string[];
  selectedChoices: Record<string, string>;
}

interface CampaignSave {
  player: PlayerState;
  company: CompanyState;
  architecture: ArchitectureGraph;
  progress: ProgressState;
  lastOutcome?: OutcomeSnapshot;
  briefSeen: boolean;
  history: OutcomeSnapshot[];
  failureReason?: string;
}

interface GameState extends CampaignSave {
  activeCampaignId: string;
  campaignSaves: Record<string, CampaignSave>;
  profile: PlayerProfile;
  audioSettings: AudioSettings;
  selectCampaign: (campaignId: string) => void;
  resetCampaign: (campaignId: string) => void;
  setProfile: (profile: PlayerProfile) => void;
  markCampaignBriefSeen: (campaignId: string) => void;
  chooseChoice: (level: Level, choice: Choice) => boolean;
  setCurrentLevel: (levelId: string) => void;
  updateAudioSettings: (settings: Partial<AudioSettings>) => void;
}

const initialArchitecture: ArchitectureGraph = {
  nodes: [
    { id: "client", type: "client", label: "Web / Mobile", position: { x: 48, y: 92 }, subtitle: "250 users" },
    { id: "monolith", type: "monolith", label: "Monolith", position: { x: 190, y: 92 }, subtitle: "Laravel/PHP" },
    { id: "postgres", type: "postgres", label: "PostgreSQL", position: { x: 330, y: 92 }, subtitle: "primary" },
  ],
  edges: [{ from: "client", to: "monolith" }, { from: "monolith", to: "postgres" }],
};

function cloneGraph(graph: ArchitectureGraph): ArchitectureGraph {
  return { nodes: graph.nodes.map((node) => ({ ...node, position: { ...node.position } })), edges: graph.edges.map((edge) => ({ ...edge })) };
}

function makeFreshCampaignSave(campaignId: string): CampaignSave {
  const campaign = campaigns.find((item) => item.id === campaignId);
  const firstLevel = allLevels.find((level) => level.campaignId === campaignId);
  const awardId = campaignId === "startup-cto" ? "garage-cto" : `${campaignId}-completion`;
  const awardTitle = campaignId === "startup-cto" ? "Garage CTO" : `${campaign?.title ?? "Campaign"} CTO`;

  return {
    player: {
      ctoXp: 0,
      confidence: 70,
      currentLevel: firstLevel?.id ?? campaign?.levelIds[0] ?? "startup-001",
      unlockedLevels: firstLevel ? [firstLevel.id] : [],
      awards: [{ id: awardId, title: awardTitle, description: "Your first ten levels of deliberate scaling.", requirement: "Complete Level 10", unlocked: false }],
    },
    company: { ...(campaign?.story.startingCompany as CampaignCompanyState | undefined) ?? { cash: 40000, monthlyRevenue: 2000, monthlyBurn: 7800, users: 250, engineers: 2, customerTrust: 72, reliability: 84, complexity: 14 } },
    architecture: cloneGraph(firstLevel?.architectureBefore ?? initialArchitecture),
    progress: { completedLevels: [], selectedChoices: {} },
    lastOutcome: undefined,
    failureReason: undefined,
    briefSeen: false,
    history: [],
  };
}

/** Rebuilds the company's state just before a level from the campaign's logged decisions. */
export function getCompanyAtLevelStart(
  state: Pick<GameState, "activeCampaignId" | "company" | "progress">,
  levelId: string,
): CompanyState {
  const campaign = campaigns.find((item) => item.id === state.activeCampaignId);
  const levelIndex = campaign?.levelIds.indexOf(levelId) ?? -1;
  if (!campaign || levelIndex < 0) return state.company;

  let company: CompanyState = { ...campaign.story.startingCompany };
  for (const priorLevelId of campaign.levelIds.slice(0, levelIndex)) {
    const priorLevel = getLevel(priorLevelId);
    const selectedChoiceId = state.progress.selectedChoices[priorLevelId];
    const selectedChoice = priorLevel?.choices.find((choice) => choice.id === selectedChoiceId);
    if (priorLevel && selectedChoice) company = resolveDecision(company, 0, 70, priorLevel, selectedChoice).company;
  }
  return company;
}

/** Replays earlier decisions so each level starts with the architecture the player actually built. */
export function getArchitectureAtLevelStart(
  state: Pick<GameState, "activeCampaignId" | "progress">,
  levelId: string,
): ArchitectureGraph {
  const campaign = campaigns.find((item) => item.id === state.activeCampaignId);
  const levelIndex = campaign?.levelIds.indexOf(levelId) ?? -1;
  const level = getLevel(levelId);
  if (!campaign || levelIndex < 0 || !level) return cloneGraph(level?.architectureBefore ?? initialArchitecture);

  const firstLevel = getLevel(campaign.levelIds[0]);
  let architecture = cloneGraph(firstLevel?.architectureBefore ?? level.architectureBefore);

  for (const priorLevelId of campaign.levelIds.slice(0, levelIndex)) {
    const priorLevel = getLevel(priorLevelId);
    const choiceId = state.progress.selectedChoices[priorLevelId];
    const choice = priorLevel?.choices.find((item) => item.id === choiceId);
    if (choice) architecture = applyArchitectureChanges(architecture, choice.architectureChanges);
  }

  // Carry the current incident's live component status onto the player's chosen topology
  // without replacing structural changes such as Laravel -> Go or a service split.
  const incidentNodes = new Map(level.architectureBefore.nodes.map((node) => [node.id, node]));
  return {
    nodes: architecture.nodes.map((node) => {
      const incidentNode = incidentNodes.get(node.id);
      if (!incidentNode) return node;
      return {
        ...node,
        ...(incidentNode.state ? { state: incidentNode.state } : {}),
        ...(incidentNode.subtitle && node.type !== "client" ? { subtitle: incidentNode.subtitle } : {}),
      };
    }),
    edges: architecture.edges,
  };
}

function applyDecision(save: CampaignSave, level: Level, choice: Choice): CampaignSave {
  const result = resolveDecision(save.company, save.player.ctoXp, save.player.confidence, level, choice);
  const nextLevel = result.failureReason ? undefined : level.nextLevel;
  // An unaffordable next incident is also a terminal cash crisis.
  const next = nextLevel ? getLevel(nextLevel) : undefined;
  const failureReason = result.failureReason ?? (next && next.choices.every((item) => result.company.cash < item.cost)
    ? "There is not enough cash to fund any response to the next incident." : undefined);
  const outcome: OutcomeSnapshot = {
    levelId: level.id, choiceId: choice.id, choiceLabel: choice.label,
    title: choice.outcomeTitle, dialogue: choice.outcomeDialogue, emotion: choice.outcomeEmotion,
    note: choice.outcomeNote, lesson: level.lesson, xpEarned: result.xpEarned,
    nextLevel: failureReason ? undefined : nextLevel,
    companyBefore: { ...save.company }, companyAfter: { ...result.company },
    confidenceBefore: save.player.confidence, confidenceAfter: result.confidence,
    operatingCashFlow: result.operatingCashFlow, failureReason,
  };
  return {
    ...save, company: result.company, failureReason,
    architecture: applyArchitectureChanges(save.architecture, choice.architectureChanges),
    player: {
      ...save.player, ctoXp: result.ctoXp, confidence: result.confidence,
      currentLevel: failureReason ? level.id : nextLevel ?? level.id,
      unlockedLevels: failureReason ? save.player.unlockedLevels : Array.from(new Set([...save.player.unlockedLevels, ...level.unlocks, ...(nextLevel ? [nextLevel] : [])])),
      awards: save.player.awards.map((award) => !failureReason && (award.id === "garage-cto" || award.id.endsWith("-completion")) && level.levelNumber >= 10 ? { ...award, unlocked: true } : award),
    },
    progress: { completedLevels: [...save.progress.completedLevels, level.id], selectedChoices: { ...save.progress.selectedChoices, [level.id]: choice.id } },
    lastOutcome: outcome, history: [...save.history, outcome],
  };
}

/** Recalculate legacy saves from their decisions so inflated rewards cannot survive the rules update. */
function rebuildSave(campaignId: string, legacy?: Partial<CampaignSave>): CampaignSave {
  let save = makeFreshCampaignSave(campaignId);
  for (const levelId of campaigns.find((item) => item.id === campaignId)?.levelIds ?? []) {
    const level = getLevel(levelId);
    const choice = level?.choices.find((item) => item.id === legacy?.progress?.selectedChoices[levelId]);
    if (!level || !choice || save.failureReason || save.company.cash < choice.cost) break;
    save = applyDecision(save, level, choice);
  }
  return { ...save, briefSeen: legacy?.briefSeen ?? false };
}

const initialCampaignId = campaigns[0]?.id ?? "startup-cto";
const initialSave = makeFreshCampaignSave(initialCampaignId);
const initialState: Omit<GameState, "selectCampaign" | "resetCampaign" | "setProfile" | "markCampaignBriefSeen" | "chooseChoice" | "setCurrentLevel" | "updateAudioSettings"> = {
  ...initialSave,
  activeCampaignId: initialCampaignId,
  campaignSaves: { [initialCampaignId]: initialSave },
  profile: { name: "", age: null },
  audioSettings: defaultAudioSettings,
};

function snapshotOf(state: CampaignSave): CampaignSave {
  return { player: state.player, company: state.company, architecture: state.architecture, progress: state.progress, lastOutcome: state.lastOutcome, briefSeen: state.briefSeen ?? false, history: state.history, failureReason: state.failureReason };
}

/** Appending content must unlock it for existing saves without replaying any decisions. */
function refreshCampaignProgress(campaignId: string, save: CampaignSave): CampaignSave {
  if (save.failureReason) return save;
  const campaign = campaigns.find((item) => item.id === campaignId);
  const nextIndex = campaign?.levelIds.findIndex((id) => !save.progress.completedLevels.includes(id)) ?? -1;
  if (!campaign || nextIndex < 0) return save;
  const nextLevel = getLevel(campaign.levelIds[nextIndex]);
  if (!nextLevel) return save;
  const failureReason = nextLevel.choices.every((choice) => save.company.cash < choice.cost)
    ? "There is not enough cash to fund any response to the next incident." : undefined;
  const lastOutcome = save.lastOutcome ? {
    ...save.lastOutcome,
    nextLevel: failureReason ? undefined : getLevel(save.lastOutcome.levelId)?.nextLevel,
    failureReason,
  } : undefined;
  return {
    ...save, failureReason, lastOutcome,
    player: {
      ...save.player,
      currentLevel: failureReason ? save.player.currentLevel : nextLevel.id,
      unlockedLevels: failureReason ? save.player.unlockedLevels : campaign.levelIds.slice(0, nextIndex + 1),
    },
  };
}

function updateActiveSave(state: GameState, updates: Partial<CampaignSave>): Partial<GameState> {
  const next = { ...state, ...updates };
  return {
    ...updates,
    campaignSaves: { ...state.campaignSaves, [state.activeCampaignId]: snapshotOf(next) },
  };
}

export const useGameStore = create<GameState>()(
  persist(
    (set, get) => ({
      ...initialState,
      selectCampaign: (campaignId) => set((state) => {
        if (!campaigns.some((campaign) => campaign.id === campaignId)) return {};
        const campaignSaves = { ...state.campaignSaves, [state.activeCampaignId]: snapshotOf(state) };
        const nextSave = refreshCampaignProgress(campaignId, campaignSaves[campaignId] ?? makeFreshCampaignSave(campaignId));
        return { ...nextSave, failureReason: nextSave.failureReason, lastOutcome: nextSave.lastOutcome, activeCampaignId: campaignId, campaignSaves: { ...campaignSaves, [campaignId]: nextSave } };
      }),
      resetCampaign: (campaignId) => set((state) => {
        if (!campaigns.some((campaign) => campaign.id === campaignId)) return {};
        const freshSave = makeFreshCampaignSave(campaignId);
        const campaignSaves = { ...state.campaignSaves, [campaignId]: freshSave };
        return state.activeCampaignId === campaignId ? { ...freshSave, campaignSaves } : { campaignSaves };
      }),
      setProfile: (profile) => set({ profile: { name: profile.name.trim(), age: profile.age } }),
      updateAudioSettings: (updates) => set((state) => ({
        audioSettings: {
          ...state.audioSettings,
          ...updates,
          sfxVolume: Math.max(0, Math.min(1, updates.sfxVolume ?? state.audioSettings.sfxVolume)),
          musicVolume: Math.max(0, Math.min(1, updates.musicVolume ?? state.audioSettings.musicVolume)),
        },
      })),
      markCampaignBriefSeen: (campaignId) => set((state) => {
        if (!campaigns.some((campaign) => campaign.id === campaignId)) return {};
        const current = campaignId === state.activeCampaignId ? snapshotOf(state) : state.campaignSaves[campaignId] ?? makeFreshCampaignSave(campaignId);
        const nextSave = { ...current, briefSeen: true };
        return campaignId === state.activeCampaignId
          ? { ...nextSave, campaignSaves: { ...state.campaignSaves, [campaignId]: nextSave } }
          : { campaignSaves: { ...state.campaignSaves, [campaignId]: nextSave } };
      }),
      setCurrentLevel: (levelId) => set((state) => {
        const level = getLevel(levelId);
        if (!level || level.campaignId !== state.activeCampaignId || state.failureReason || !state.player.unlockedLevels.includes(levelId) || state.progress.completedLevels.includes(levelId)) return {};
        return updateActiveSave(state, { player: { ...state.player, currentLevel: levelId } });
      }),
      chooseChoice: (level, choice) => {
        const state = get();
        const canonicalLevel = getLevel(level.id);
        const canonicalChoice = canonicalLevel?.choices.find((item) => item.id === choice.id);
        if (!canonicalLevel || !canonicalChoice || canonicalLevel.campaignId !== state.activeCampaignId ||
          state.failureReason || getFailureReason(state.company, state.player.confidence) ||
          !state.player.unlockedLevels.includes(level.id) || state.progress.completedLevels.includes(level.id) ||
          state.company.cash < canonicalChoice.cost || canonicalChoice.requirements?.some((requirement) =>
            (requirement.min !== undefined && state.company[requirement.stat] < requirement.min) ||
            (requirement.max !== undefined && state.company[requirement.stat] > requirement.max))) return false;
        set(updateActiveSave(state, applyDecision(state, canonicalLevel, canonicalChoice)));
        return true;
      },
    }),
    {
      name: "scalelog-progress",
      version: 5,
      storage: createJSONStorage(() => AsyncStorage),
      merge: (persistedState, currentState) => {
        const merged = { ...currentState, ...(persistedState as Partial<GameState>) };
        const campaignSaves = Object.fromEntries(Object.entries(merged.campaignSaves).map(([id, save]) => [id, refreshCampaignProgress(id, save)]));
        const activeSave = refreshCampaignProgress(merged.activeCampaignId, snapshotOf(merged));
        return { ...merged, ...activeSave, campaignSaves: { ...campaignSaves, [merged.activeCampaignId]: activeSave } };
      },
      migrate: (persistedState) => {
        const persisted = (persistedState ?? {}) as Partial<GameState>;
        const activeCampaignId = persisted.activeCampaignId ?? initialCampaignId;
        const campaignSaves = Object.fromEntries(campaigns.map((campaign) => [
          campaign.id, rebuildSave(campaign.id, campaign.id === activeCampaignId ? persisted.campaignSaves?.[campaign.id] ?? persisted : persisted.campaignSaves?.[campaign.id]),
        ]));
        const validCampaignId = campaignSaves[activeCampaignId] ? activeCampaignId : initialCampaignId;
        return {
          ...initialState, ...campaignSaves[validCampaignId], activeCampaignId: validCampaignId,
          profile: persisted.profile ?? initialState.profile,
          audioSettings: { ...defaultAudioSettings, ...persisted.audioSettings }, campaignSaves,
        };
      },
    },
  ),
);

export const selectCurrentLevel = (state: GameState) => getLevel(state.player.currentLevel);
