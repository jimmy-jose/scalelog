import { Image, ImageBackground, Pressable, StyleSheet, Text, View, useWindowDimensions } from "react-native";
import { router } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import Animated, { FadeInDown } from "react-native-reanimated";
import Svg, { Circle, Path, Rect } from "react-native-svg";
import { allLevels, campaigns } from "@/campaigns";
import { CampaignResetButton } from "@/ui/components/CampaignResetButton";
import { SettingsButton } from "@/ui/components/SettingsButton";
import { Screen } from "@/ui/components/Screen";
import { TopBar } from "@/ui/components/TopBar";
import { Button } from "@/ui/components/Button";
import { ProgressMeter } from "@/ui/components/ProgressMeter";
import { Pill } from "@/ui/components/Pill";
import { useGameStore } from "@/store/gameStore";
import { colors, radii, spacing } from "@/ui/theme";
import { gameFeedback } from "@/game/feedback/GameFeedbackManager";

const noCompletedLevels: string[] = [];
const noUnlockedLevels: string[] = [];

export default function CampaignSelectionScreen() {
  return <Screen>
    <TopBar title="Campaigns" right={<View style={styles.headerActions}><Pill color={colors.blue}>{String(campaigns.length).padStart(2, "0")} AVAILABLE</Pill><SettingsButton /></View>} />
    <View style={styles.intro}>
      <Text style={styles.eyebrow}>SCALELOG CAMPAIGNS</Text>
      <Text style={styles.title}>Choose the system you’ll own.</Text>
    </View>
    <View style={styles.campaignList}>
      {campaigns.map((campaign, index) => <CampaignHubCard key={campaign.id} campaign={campaign} index={index} />)}
    </View>
    <View style={styles.futureNote}><View style={styles.futureRule} /><Text style={styles.futureText}>MORE CAMPAIGNS WILL BE ADDED HERE</Text><View style={styles.futureRule} /></View>
  </Screen>;
}

function CampaignHubCard({ campaign, index }: { campaign: (typeof campaigns)[number]; index: number }) {
  const { width } = useWindowDimensions();
  const wide = width >= 900;
  const activeCampaignId = useGameStore((state) => state.activeCampaignId);
  const completedLevels = useGameStore((state) => state.activeCampaignId === campaign.id ? state.progress.completedLevels : state.campaignSaves[campaign.id]?.progress.completedLevels ?? noCompletedLevels);
  const unlockedLevels = useGameStore((state) => state.activeCampaignId === campaign.id ? state.player.unlockedLevels : state.campaignSaves[campaign.id]?.player.unlockedLevels ?? noUnlockedLevels);
  const briefSeen = useGameStore((state) => state.campaignSaves[campaign.id]?.briefSeen ?? (state.activeCampaignId === campaign.id && state.briefSeen));
  const profileReady = useGameStore((state) => Boolean(state.profile.name.trim()));
  const selectCampaign = useGameStore((state) => state.selectCampaign);
  const levels = allLevels.filter((level) => level.campaignId === campaign.id);
  const failureReason = useGameStore((state) => state.activeCampaignId === campaign.id ? state.failureReason : state.campaignSaves[campaign.id]?.failureReason);
  const completedCount = levels.filter((level) => completedLevels.includes(level.id)).length;
  const nextLevel = failureReason ? undefined : levels.find((level) => unlockedLevels.includes(level.id) && !completedLevels.includes(level.id));

  const nextIndex = nextLevel ? levels.indexOf(nextLevel) : Math.max(0, completedCount - 1);
  const previewStart = Math.max(0, Math.min(nextIndex, levels.length - 3));
  const previewLevels = levels.slice(previewStart, previewStart + 3);

  const enterBrief = () => {
    selectCampaign(campaign.id);
    if (briefSeen && profileReady) {
      router.push("/levels");
      return;
    }
    router.push({ pathname: "/campaign/[campaignId]", params: { campaignId: campaign.id } });
  };

  const openLevel = (levelId: string) => {
    gameFeedback.trigger("uiTap");
    selectCampaign(campaign.id);
    if (!briefSeen || !profileReady) {
      router.push({ pathname: "/campaign/[campaignId]", params: { campaignId: campaign.id, startLevel: levelId } });
      return;
    }
    router.push({ pathname: "/game/[levelId]", params: { levelId } });
  };

  const campaignAction = failureReason ? "REVIEW RUN" : completedCount === levels.length ? "REVIEW CAMPAIGN" : !briefSeen ? "START CAMPAIGN" : profileReady ? "CONTINUE CAMPAIGN" : "SET UP PROFILE";

  return <Animated.View entering={FadeInDown.delay(index * 80).duration(320)} style={[styles.hub, wide && styles.hubWide, { borderColor: `${campaign.accent}55` }]}>
    <View style={styles.featureColumn}>
      <ImageBackground source={require("../assets/scenes/startup_office_background.png")} resizeMode="cover" style={styles.feature} imageStyle={styles.featureImage}>
        <LinearGradient colors={["rgba(5,12,23,0.30)", "rgba(5,12,23,0.74)", "rgba(5,12,23,0.96)"]} start={{ x: 0.55, y: 0 }} end={{ x: 0.45, y: 1 }} style={StyleSheet.absoluteFill} />
        <View style={styles.featureHeader}>
          <View style={styles.activeLabel}><View style={[styles.activeDot, { backgroundColor: campaign.accent }]} /><Text style={styles.activeText}>{campaign.id === activeCampaignId ? "ACTIVE RUN" : `CAMPAIGN ${String(index + 1).padStart(2, "0")}`}</Text></View>
          <CampaignResetButton campaignId={campaign.id} campaignTitle={campaign.title} />
        </View>
        <Image source={require("../assets/characters/jimmy_thinking.png")} resizeMode="contain" style={styles.jimmy} accessibilityLabel="Jimmy, your AI assistant" />
        <View style={styles.featureCopy}>
          <Text style={styles.featureEyebrow}>{campaign.title.toUpperCase()}</Text>
          <Text style={styles.featureTitle}>{campaign.subtitle}</Text>
          <Text style={styles.featureDescription}>{campaign.description}</Text>
          <View style={styles.jimmyByline}><View style={styles.jimmyStatus} /><Text style={styles.jimmyBylineText}>JIMMY  ·  YOUR AI ASSISTANT</Text></View>
          <Button style={{ alignSelf: "flex-start", marginTop: 16 }} onPress={enterBrief}>{campaignAction} →</Button>
        </View>
      </ImageBackground>
      <View style={styles.progressBlock}>
        <View style={styles.progressTop}><Text style={styles.progressLabel}>YOUR PROGRESS</Text><Text style={styles.progressCount}>{completedCount} <Text style={styles.progressSlash}>/</Text> {levels.length} INCIDENTS</Text></View>
        <ProgressMeter label={`${campaign.title} progress`} value={completedCount} max={levels.length} color={campaign.accent} />
      </View>
    </View>

    <View style={[styles.runLog, wide ? styles.runLogWide : styles.runLogStack]}>
      <View style={styles.logHeader}><View><Text style={styles.logEyebrow}>MISSION SELECT</Text><Text style={styles.logTitle}>{failureReason ? "Run debrief" : nextLevel ? "Your next moves" : "Final incidents"}</Text></View><Text style={styles.logCount}>{String(levels.length).padStart(2, "0")} CASES</Text></View>
      <View style={styles.levelList}>
        {previewLevels.map((level, previewIndex) => {
          const levelIndex = levels.indexOf(level);
          const complete = completedLevels.includes(level.id);
          const unlocked = complete || (!failureReason && unlockedLevels.includes(level.id));
          const status = complete ? "CLEARED" : unlocked ? "READY" : "LOCKED";
          const statusTone = complete ? "complete" : unlocked ? "ready" : "locked";
          return <Pressable
            key={level.id}
            accessibilityRole="button"
            accessibilityLabel={`Level ${level.levelNumber}, ${level.title}, ${status.toLowerCase()}`}
            accessibilityHint={unlocked ? "Open this incident" : "Complete the previous incident to unlock"}
            disabled={!unlocked}
            onPress={() => openLevel(level.id)}
            style={({ pressed }) => [styles.levelRow, previewIndex < previewLevels.length - 1 && styles.levelRowDivider, !unlocked && styles.levelLocked, pressed && styles.levelPressed]}
          >
            <View style={[styles.levelIcon, styles[`${statusTone}Icon` as "completeIcon" | "readyIcon" | "lockedIcon"]]}><ScenarioIcon index={levelIndex} color={complete ? colors.blue : unlocked ? colors.mint : colors.dim} /></View>
            <View style={styles.levelCopy}>
              <View style={styles.levelMeta}><Text style={styles.levelNumber}>{String(level.levelNumber).padStart(2, "0")}</Text><Text style={[styles.levelState, styles[`${statusTone}Text` as "completeText" | "readyText" | "lockedText"]]}>{status}</Text></View>
              <Text style={[styles.levelTitle, !unlocked && styles.levelTitleLocked]}>{level.title}</Text>
              <Text numberOfLines={1} style={styles.levelSummary}>{level.kicker.replace(/^CHAPTER\s+\d+\s*·\s*/i, "")}</Text>
            </View>
            {unlocked && <ArrowIcon color={complete ? colors.blue : colors.mint} />}
            {!unlocked && <LockIcon />}
          </Pressable>;
        })}
      </View>
      <Button variant="ghost" onPress={enterBrief}>View campaign map →</Button>
      <View style={styles.logFooter}><Text style={styles.logFooterText}>{nextLevel ? `UP NEXT  ·  ${nextLevel.title}` : failureReason ? "RUN ENDED · REVIEW YOUR DECISIONS" : "ALL INCIDENTS CLEARED"}</Text></View>
    </View>
  </Animated.View>;
}

function ScenarioIcon({ index, color }: { index: number; color: string }) {
  if (index === 1) return <Svg width={20} height={20} viewBox="0 0 24 24" fill="none"><Path d="M4 6.5C4 4.6 7.6 3 12 3s8 1.6 8 3.5S16.4 10 12 10 4 8.4 4 6.5Z" stroke={color} strokeWidth={1.6} /><Path d="M4 6.5v10C4 18.4 7.6 20 12 20m8-13.5v3m-16 2C4 13.4 7.6 15 12 15m6-1 2 2 3-4" stroke={color} strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round" /></Svg>;
  if (index === 2) return <Svg width={20} height={20} viewBox="0 0 24 24" fill="none"><Circle cx="6" cy="6" r="2.3" stroke={color} strokeWidth={1.6} /><Circle cx="18" cy="6" r="2.3" stroke={color} strokeWidth={1.6} /><Circle cx="12" cy="18" r="2.3" stroke={color} strokeWidth={1.6} /><Path d="M7.7 7.5 10.8 16m5.5-8.5L13.2 16M8.5 6h7" stroke={color} strokeWidth={1.6} strokeLinecap="round" /></Svg>;
  return <Svg width={20} height={20} viewBox="0 0 24 24" fill="none"><Rect x="4" y="4" width="16" height="16" rx="3" stroke={color} strokeWidth={1.6} /><Path d="M8.5 9 6 12l2.5 3m7-6 2.5 3-2.5 3m-3.5-7-1.5 8" stroke={color} strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round" /></Svg>;
}

function ArrowIcon({ color }: { color: string }) {
  return <Svg width={17} height={17} viewBox="0 0 20 20" fill="none"><Path d="M3 10h13m-5-5 5 5-5 5" stroke={color} strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round" /></Svg>;
}

function LockIcon() {
  return <Svg width={15} height={15} viewBox="0 0 16 16" fill="none"><Rect x="3.5" y="7" width="9" height="7" rx="1.5" stroke="#64748B" strokeWidth={1.4} /><Path d="M5.5 7V5a2.5 2.5 0 0 1 5 0v2" stroke="#64748B" strokeWidth={1.4} strokeLinecap="round" /></Svg>;
}

const styles = StyleSheet.create({
  headerActions: { flexDirection: "row", alignItems: "center", gap: 8 },
  intro: { paddingTop: spacing.sm, paddingBottom: spacing.md },
  eyebrow: { color: colors.mint, fontSize: 8, fontWeight: "900", letterSpacing: 1.4 },
  title: { color: colors.white, fontSize: 22, lineHeight: 28, fontWeight: "800", letterSpacing: -0.45, marginTop: 6 },
  campaignList: { gap: 14 },
  hub: { borderWidth: 1, borderRadius: radii.lg, backgroundColor: "#0D192A", overflow: "hidden" },
  hubWide: { flexDirection: "row" },
  featureColumn: { flex: 1.08, minWidth: 0 },
  feature: { minHeight: 340, overflow: "hidden", justifyContent: "space-between", padding: 17, backgroundColor: "#15243A" },
  featureImage: { opacity: 0.78 },
  featureHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", zIndex: 3 },
  activeLabel: { flexDirection: "row", alignItems: "center", gap: 7 },
  activeDot: { width: 6, height: 6, borderRadius: 3 },
  activeText: { color: "#DBE5F1", fontSize: 8, fontWeight: "900", letterSpacing: 1 },
  jimmy: { position: "absolute", right: -15, bottom: 0, width: 190, height: 245, zIndex: 1 },
  featureCopy: { width: "83%", maxWidth: 400, zIndex: 2, paddingBottom: 2 },
  featureEyebrow: { color: colors.mint, fontSize: 8, fontWeight: "900", letterSpacing: 1.2 },
  featureTitle: { color: colors.white, fontSize: 25, lineHeight: 29, fontWeight: "800", letterSpacing: -0.65, marginTop: 6 },
  featureDescription: { color: "#D0D9E4", fontSize: 11, lineHeight: 16, marginTop: 7, maxWidth: 340 },
  jimmyByline: { flexDirection: "row", alignItems: "center", gap: 6, marginTop: 11 },
  jimmyStatus: { width: 5, height: 5, borderRadius: 3, backgroundColor: colors.mint },
  jimmyBylineText: { color: "#D3DFE9", fontSize: 7, fontWeight: "900", letterSpacing: 0.7 },
  progressBlock: { paddingHorizontal: 16, paddingVertical: 13, borderTopWidth: 1, borderTopColor: "#26394F", backgroundColor: "#0A1523" },
  progressTop: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 8 },
  progressLabel: { color: "#8E9DB0", fontSize: 7, fontWeight: "900", letterSpacing: 1 },
  progressCount: { color: colors.white, fontSize: 8, fontWeight: "900", letterSpacing: 0.5 },
  progressSlash: { color: colors.dim },
  runLog: { minWidth: 0, minHeight: 275, backgroundColor: "#0B1625", borderTopWidth: 1, borderTopColor: "#24364B", paddingHorizontal: 16, paddingTop: 16, paddingBottom: 10, justifyContent: "space-between" },
  runLogWide: { flex: 0.92, borderTopWidth: 0, borderLeftWidth: 1, borderLeftColor: "#24364B" },
  runLogStack: { minHeight: 275 },
  logHeader: { flexDirection: "row", alignItems: "flex-end", justifyContent: "space-between", marginBottom: 7 },
  logEyebrow: { color: colors.mint, fontSize: 7, fontWeight: "900", letterSpacing: 1 },
  logTitle: { color: colors.white, fontSize: 16, fontWeight: "800", marginTop: 4 },
  logCount: { color: colors.dim, fontSize: 7, fontWeight: "900", letterSpacing: 0.8, paddingBottom: 2 },
  levelList: { flex: 1 },
  levelRow: { minHeight: 75, flexDirection: "row", alignItems: "center", gap: 10, paddingVertical: 10 },
  levelRowDivider: { borderBottomWidth: 1, borderBottomColor: "#243448" },
  levelLocked: { opacity: 0.63 },
  levelPressed: { backgroundColor: "#12243A" },
  levelIcon: { width: 34, height: 34, borderRadius: 10, borderWidth: 1, alignItems: "center", justifyContent: "center" },
  completeIcon: { borderColor: "#355079", backgroundColor: "#14243A" },
  readyIcon: { borderColor: "#3C786F", backgroundColor: "#12312F" },
  lockedIcon: { borderColor: "#2A394D", backgroundColor: "#101B2A" },
  levelCopy: { flex: 1, minWidth: 0 },
  levelMeta: { flexDirection: "row", alignItems: "center", gap: 7 },
  levelNumber: { color: "#8191A6", fontSize: 7, fontWeight: "900", letterSpacing: 0.5 },
  levelState: { fontSize: 7, fontWeight: "900", letterSpacing: 0.65 },
  completeText: { color: colors.blue },
  readyText: { color: colors.mint },
  lockedText: { color: "#7D8BA0" },
  levelTitle: { color: "#EAF0F8", fontSize: 11, fontWeight: "800", marginTop: 4 },
  levelTitleLocked: { color: "#ABB7C7" },
  levelSummary: { color: "#8798AD", fontSize: 7, fontWeight: "800", letterSpacing: 0.35, marginTop: 3 },
  logFooter: { paddingTop: 10, borderTopWidth: 1, borderTopColor: "#243448", marginTop: 5 },
  logFooterText: { color: "#96A7BC", fontSize: 7, fontWeight: "900", letterSpacing: 0.55 },
  futureNote: { flexDirection: "row", alignItems: "center", gap: 10, marginTop: 18, alignSelf: "center", width: "100%", maxWidth: 600 },
  futureRule: { height: 1, flex: 1, backgroundColor: "#203047" },
  futureText: { color: "#63758D", fontSize: 7, fontWeight: "900", letterSpacing: 0.85 },
});
