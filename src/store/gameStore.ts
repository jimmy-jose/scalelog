import AsyncStorage from "@react-native-async-storage/async-storage";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { allLevels, campaigns, getLevel } from "@/campaigns";
import { ArchitectureGraph, Award, CampaignCompanyState, Choice, Level, OutcomeSnapshot } from "@/domain/types";
import { getChoiceBlockReason, getFailureReason, getProgressionFailure, resolveDecision } from "@/domain/simulation";
import { resolveLevel } from "@/domain/levelVariants";
import { applyArchitectureChanges } from "@/domain/architecture";
import { defaultAudioSettings, type AudioSettings } from "@/game/feedback/feedbackTypes";
import { canEarnCertificate, createCampaignCertificate, normalizeCertificateName, normalizeCertificateEmail, CERTIFICATE_NAME_LIMIT, type CampaignCertificate } from "@/domain/certificates";

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
  certificates: Record<string, CampaignCertificate>;
  personalizeCertificate: (campaignId: string, name: string, email?: string) => boolean;
  markCertificateMinted: (campaignId: string, mintedAt?: string) => void;
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
  return { ...graph, ...(graph.capabilities ? { capabilities: [...graph.capabilities] } : {}), nodes: graph.nodes.map((node) => ({ ...node, position: { ...node.position } })), edges: graph.edges.map((edge) => ({ ...edge })) };
}

/** Overlay incident diagnostics without replacing the player's chosen topology. */
function withIncidentState(architecture: ArchitectureGraph, level: Level): ArchitectureGraph {
  const incidentNodes = new Map(level.architectureBefore.nodes.map((node) => [node.id, node]));
  return {
    ...architecture,
    nodes: architecture.nodes.map((node) => {
      const incidentNode = incidentNodes.get(node.id);
      if (!incidentNode) return node;
      return {
        ...node,
        ...(incidentNode.state ? { state: incidentNode.state } : {}),
        ...(incidentNode.subtitle && node.type !== "client" ? { subtitle: incidentNode.subtitle } : {}),
      };
    }),
  };
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

/** Saved financial snapshots are authoritative; replay is a fallback for legacy history. */
export function getCompanyAtLevelStart(
  state: Pick<GameState, "activeCampaignId" | "company" | "progress"> & Partial<Pick<GameState, "history">>,
  levelId: string,
): CompanyState {
  const campaign = campaigns.find((item) => item.id === state.activeCampaignId);
  const levelIndex = campaign?.levelIds.indexOf(levelId) ?? -1;
  if (!campaign || levelIndex < 0) return state.company;
  const recorded = state.history?.find((entry) => entry.levelId === levelId);
  if (recorded) return { ...recorded.companyBefore };
  if (campaign.levelIds.find((id) => !state.progress.completedLevels.includes(id)) === levelId) return { ...state.company };

  let company: CompanyState = { ...campaign.story.startingCompany };
  let architecture = cloneGraph(getLevel(campaign.levelIds[0])?.architectureBefore ?? initialArchitecture);
  for (const priorLevelId of campaign.levelIds.slice(0, levelIndex)) {
    const priorLevel = getLevel(priorLevelId);
    const selectedChoiceId = state.progress.selectedChoices[priorLevelId];
    const resolved = priorLevel ? resolveLevel(priorLevel, architecture) : undefined;
    const selectedChoice = resolved?.choices.find((choice) => choice.id === selectedChoiceId);
    if (resolved && selectedChoice) {
      company = resolveDecision(company, 0, 70, resolved, selectedChoice).company;
      architecture = applyArchitectureChanges(architecture, selectedChoice.architectureChanges);
    }
  }
  return company;
}

/** Prefer recorded/live topology so content updates cannot silently rewrite an existing run. */
export function getArchitectureAtLevelStart(
  state: Pick<GameState, "activeCampaignId" | "progress"> & Partial<Pick<GameState, "history" | "architecture">>,
  levelId: string,
): ArchitectureGraph {
  const campaign = campaigns.find((item) => item.id === state.activeCampaignId);
  const levelIndex = campaign?.levelIds.indexOf(levelId) ?? -1;
  const level = getLevel(levelId);
  if (!campaign || levelIndex < 0 || !level) return cloneGraph(level?.architectureBefore ?? initialArchitecture);

  const firstLevel = getLevel(campaign.levelIds[0]);
  const entry = state.history?.find((item) => item.levelId === levelId);
  const recorded = entry?.incidentArchitectureBefore ?? entry?.architectureBefore;
  if (recorded) return cloneGraph(recorded);
  const isCurrent = campaign.levelIds.find((id) => !state.progress.completedLevels.includes(id)) === levelId;
  const snapshot = isCurrent ? state.architecture : undefined;
  let architecture = cloneGraph(snapshot ?? firstLevel?.architectureBefore ?? level.architectureBefore);

  for (const priorLevelId of snapshot ? [] : campaign.levelIds.slice(0, levelIndex)) {
    const priorLevel = getLevel(priorLevelId);
    const choiceId = state.progress.selectedChoices[priorLevelId];
    const choice = priorLevel ? resolveLevel(priorLevel, architecture).choices.find((item) => item.id === choiceId) : undefined;
    if (priorLevel && choice) architecture = applyArchitectureChanges(withIncidentState(architecture, priorLevel), choice.architectureChanges);
  }

  return withIncidentState(architecture, level);
}

/** Resolve the same state-dependent incident used by the gameplay screen. */
export function getLevelAtStart(state: Pick<GameState, "activeCampaignId" | "progress"> & Partial<Pick<GameState, "history" | "architecture">>, levelId: string): Level | undefined {
  const level = getLevel(levelId);
  if (!level) return undefined;
  const resolved = resolveLevel(level, getArchitectureAtLevelStart(state, levelId));
  const recordedDescription = state.history?.find((entry) => entry.levelId === levelId)?.incidentDescription;
  return recordedDescription === undefined ? resolved : { ...resolved, description: recordedDescription };
}

function applyDecision(save: CampaignSave, level: Level, choice: Choice): CampaignSave {
  const result = resolveDecision(save.company, save.player.ctoXp, save.player.confidence, level, choice);
  const nextLevel = result.failureReason ? undefined : level.nextLevel;
  // A next incident with no eligible response must end explicitly rather than soft-lock.
  const incidentArchitecture = withIncidentState(cloneGraph(save.architecture), level);
  const architecture = applyArchitectureChanges(incidentArchitecture, choice.architectureChanges);
  const nextSource = nextLevel ? getLevel(nextLevel) : undefined;
  const next = nextSource ? resolveLevel(nextSource, architecture) : undefined;
  const failureReason = result.failureReason ?? (next ? getProgressionFailure(result.company, next) : undefined);
  const outcome: OutcomeSnapshot = {
    levelId: level.id, choiceId: choice.id, choiceLabel: choice.label, choiceCost: choice.cost,
    title: choice.outcomeTitle, dialogue: choice.outcomeDialogue, emotion: choice.outcomeEmotion,
    note: choice.outcomeNote, lesson: level.lesson, xpEarned: result.xpEarned,
    nextLevel: failureReason ? undefined : nextLevel,
    architectureBefore: cloneGraph(save.architecture), architectureAfter: cloneGraph(architecture), incidentDescription: level.description,
    incidentArchitectureBefore: cloneGraph(incidentArchitecture),
    companyBefore: { ...save.company }, companyAfter: { ...result.company },
    confidenceBefore: save.player.confidence, confidenceAfter: result.confidence,
    operatingCashFlow: result.operatingCashFlow, failureReason,
  };
  return {
    ...save, company: result.company, failureReason,
    architecture,
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
    const source = getLevel(levelId);
    const level = source ? resolveLevel(source, save.architecture) : undefined;
    const choice = level?.choices.find((item) => item.id === legacy?.progress?.selectedChoices[levelId]);
    if (!level || !choice || save.failureReason || getChoiceBlockReason(save.company, choice)) break;
    save = applyDecision(save, level, choice);
  }
  return { ...save, briefSeen: legacy?.briefSeen ?? false };
}

const initialCampaignId = campaigns[0]?.id ?? "startup-cto";
const initialSave = makeFreshCampaignSave(initialCampaignId);
// Keep storage lifecycle outside the persisted store: reporting a read failure
// must not write a fresh campaign over the save that could not be loaded.
export const useSaveStatus = create<{ status: "loading" | "ready" | "error" }>(() => ({ status: "loading" }));
const initialState: Omit<GameState, "selectCampaign" | "resetCampaign" | "setProfile" | "markCampaignBriefSeen" | "chooseChoice" | "setCurrentLevel" | "updateAudioSettings" | "personalizeCertificate" | "markCertificateMinted"> = {
  ...initialSave,
  activeCampaignId: initialCampaignId,
  campaignSaves: { [initialCampaignId]: initialSave },
  profile: { name: "", age: null },
  audioSettings: defaultAudioSettings,
  certificates: {},
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
  const nextSource = getLevel(campaign.levelIds[nextIndex]);
  const nextLevel = nextSource ? resolveLevel(nextSource, save.architecture) : undefined;
  if (!nextLevel) return save;
  const failureReason = getProgressionFailure(save.company, nextLevel);
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
      personalizeCertificate: (campaignId, name, email) => {
        const recipientName = normalizeCertificateName(name);
        const certificate = get().certificates[campaignId];
        if (!certificate || !recipientName || recipientName.length > CERTIFICATE_NAME_LIMIT) return false;
        const recipientEmail = typeof email === "string" ? normalizeCertificateEmail(email) : certificate.recipientEmail;
        set((state) => ({
          certificates: {
            ...state.certificates,
            [campaignId]: {
              ...certificate,
              recipientName,
              recipientEmail,
            },
          },
        }));
        return true;
      },
      markCertificateMinted: (campaignId, mintedAt = new Date().toISOString()) => {
        const certificate = get().certificates[campaignId];
        if (!certificate) return;
        set((state) => ({
          certificates: {
            ...state.certificates,
            [campaignId]: {
              ...certificate,
              isMinted: true,
              mintedAt,
            },
          },
        }));
      },
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
        const source = getLevel(level.id);
        const canonicalLevel = source ? resolveLevel(source, state.architecture) : undefined;
        const canonicalChoice = canonicalLevel?.choices.find((item) => item.id === choice.id);
        if (!canonicalLevel || !canonicalChoice || canonicalLevel.campaignId !== state.activeCampaignId ||
          state.failureReason || getFailureReason(state.company, state.player.confidence) ||
          !state.player.unlockedLevels.includes(level.id) || state.progress.completedLevels.includes(level.id) ||
          getChoiceBlockReason(state.company, canonicalChoice)) return false;
        const save = applyDecision(state, canonicalLevel, canonicalChoice);
        const campaign = campaigns.find((item) => item.id === state.activeCampaignId);
        const certificate = !state.certificates[state.activeCampaignId] && canEarnCertificate(campaign, save)
          ? createCampaignCertificate(campaign, state.profile.name) : undefined;
        set({ ...updateActiveSave(state, save), ...(certificate ? {
          certificates: { ...state.certificates, [certificate.campaignId]: certificate },
        } : {}) });
        return true;
      },
    }),
    {
      name: "scalelog-progress",
      version: 6,
      storage: createJSONStorage(() => AsyncStorage),
      onRehydrateStorage: () => {
        useSaveStatus.setState({ status: "loading" });
        return (_state, error) => useSaveStatus.setState({ status: error ? "error" : "ready" });
      },
      merge: (persistedState, currentState) => {
        const merged = { ...currentState, ...(persistedState as Partial<GameState>) };
        const campaignSaves = Object.fromEntries(Object.entries(merged.campaignSaves).map(([id, save]) => [id, refreshCampaignProgress(id, save)]));
        const activeSave = refreshCampaignProgress(merged.activeCampaignId, snapshotOf(merged));
        const saves = { ...campaignSaves, [merged.activeCampaignId]: activeSave };
        const certificates = { ...merged.certificates };
        // Existing completed saves earn the same free certificate on their next load.
        for (const campaign of campaigns) {
          const save = saves[campaign.id];
          if (!certificates[campaign.id] && save && canEarnCertificate(campaign, save)) {
            certificates[campaign.id] = createCampaignCertificate(campaign, merged.profile.name);
          }
        }
        return { ...merged, ...activeSave, campaignSaves: saves, certificates };
      },
      migrate: (persistedState, version) => {
        const persisted = (persistedState ?? {}) as Partial<GameState>;
        // Version 5 already has authoritative snapshots. Add certificates without
        // replaying decisions; persist will save the backfilled award after merge.
        if (version === 5) return { ...initialState, ...persisted, certificates: persisted.certificates ?? {} };
        const activeCampaignId = persisted.activeCampaignId ?? initialCampaignId;
        const campaignSaves = Object.fromEntries(campaigns.map((campaign) => [
          campaign.id, rebuildSave(campaign.id, campaign.id === activeCampaignId ? persisted.campaignSaves?.[campaign.id] ?? persisted : persisted.campaignSaves?.[campaign.id]),
        ]));
        const validCampaignId = campaignSaves[activeCampaignId] ? activeCampaignId : initialCampaignId;
        return {
          ...initialState, ...campaignSaves[validCampaignId], activeCampaignId: validCampaignId,
          profile: persisted.profile ?? initialState.profile,
          audioSettings: { ...defaultAudioSettings, ...persisted.audioSettings }, campaignSaves,
          certificates: persisted.certificates ?? {},
        };
      },
    },
  ),
);

export const selectCurrentLevel = (state: GameState) => getLevelAtStart(state, state.player.currentLevel);
