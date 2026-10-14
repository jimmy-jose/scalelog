import { useEffect, useState } from "react";
import { Image, Pressable, StyleSheet, Text, TextInput, View, useWindowDimensions } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import Animated, { FadeInDown } from "react-native-reanimated";
import Svg, { Circle, Path, Rect } from "react-native-svg";
import { allLevels, campaigns, getLevel } from "@/campaigns";
import { Screen } from "@/ui/components/Screen";
import { TopBar } from "@/ui/components/TopBar";
import { Button } from "@/ui/components/Button";
import { Pill } from "@/ui/components/Pill";
import { useGameStore } from "@/store/gameStore";
import { colors, radii, spacing } from "@/ui/theme";
import { formatCompact, formatMoney } from "@/lib/format";
import { gameFeedback } from "@/game/feedback/GameFeedbackManager";

const jimmyWelcome = require("../../assets/characters/jimmy_welcome.png");
const jimmyExplaining = require("../../assets/characters/jimmy_explain.png");
const emptyLevels: string[] = [];

type CampaignStep = "welcome" | "brief";

export function generateStaticParams() { return campaigns.map((campaign) => ({ campaignId: campaign.id })); }

export default function CampaignOnboardingScreen() {
  const { campaignId, startLevel, view } = useLocalSearchParams<{ campaignId: string; startLevel?: string; view?: string }>();
  const campaign = campaigns.find((item) => item.id === String(campaignId)) ?? campaigns[0];
  const { width } = useWindowDimensions();
  const wide = width >= 760;
  const profile = useGameStore((state) => state.profile);
  const company = useGameStore((state) => state.activeCampaignId === campaign.id ? state.company : state.campaignSaves[campaign.id]?.company) ?? campaign.story.startingCompany;
  const architecture = useGameStore((state) => state.activeCampaignId === campaign.id ? state.architecture : state.campaignSaves[campaign.id]?.architecture) ?? allLevels.find((level) => level.campaignId === campaign.id)?.architectureBefore;
  const briefSeen = useGameStore((state) => state.campaignSaves[campaign.id]?.briefSeen ?? (state.activeCampaignId === campaign.id && state.briefSeen));
  const unlockedLevels = useGameStore((state) => state.activeCampaignId === campaign.id ? state.player.unlockedLevels : state.campaignSaves[campaign.id]?.player.unlockedLevels ?? emptyLevels);
  const completedLevels = useGameStore((state) => state.activeCampaignId === campaign.id ? state.progress.completedLevels : state.campaignSaves[campaign.id]?.progress.completedLevels ?? emptyLevels);
  const failureReason = useGameStore((state) => state.activeCampaignId === campaign.id ? state.failureReason : state.campaignSaves[campaign.id]?.failureReason);
  const selectCampaign = useGameStore((state) => state.selectCampaign);
  const setProfile = useGameStore((state) => state.setProfile);
  const markCampaignBriefSeen = useGameStore((state) => state.markCampaignBriefSeen);
  const reviewOnly = view === "brief";
  const [hydrated, setHydrated] = useState(() => useGameStore.persist.hasHydrated());
  const [entryHandled, setEntryHandled] = useState(false);
  const [step, setStep] = useState<CampaignStep>(reviewOnly ? "brief" : "welcome");
  const [nameDraft, setNameDraft] = useState(profile.name);
  const [ageDraft, setAgeDraft] = useState(profile.age === null ? "" : String(profile.age));
  const [ageSkipped, setAgeSkipped] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    setNameDraft(profile.name);
    setAgeDraft(profile.age === null ? "" : String(profile.age));
    setAgeSkipped(false);
  }, [profile.age, profile.name]);

  useEffect(() => {
    if (useGameStore.persist.hasHydrated()) {
      setHydrated(true);
      return;
    }
    return useGameStore.persist.onFinishHydration(() => setHydrated(true));
  }, []);

  const profileComplete = Boolean(profile.name.trim());
  const campaignLevels = allLevels.filter((level) => level.campaignId === campaign.id);
  const availableLevels = unlockedLevels.length ? unlockedLevels : campaign.levelIds.slice(0, 1);
  const nextPlayable = failureReason ? undefined : campaignLevels.find((level) => availableLevels.includes(level.id) && !completedLevels.includes(level.id));
  const requestedLevel = typeof startLevel === "string" && getLevel(startLevel)?.campaignId === campaign.id
    && (completedLevels.includes(startLevel) || (!failureReason && availableLevels.includes(startLevel))) ? getLevel(startLevel) : undefined;
  const targetLevel = requestedLevel ?? nextPlayable;
  const architectureNodes = architecture?.nodes ?? [];
  const stackLabels = [
    architectureNodes.filter((node) => node.type === "client").map((node) => node.label).join(" / "),
    architectureNodes.filter((node) => ["loadBalancer", "api", "monolith", "service", "worker"].includes(node.type)).map((node) => node.label).join(" + "),
    architectureNodes.filter((node) => ["postgres", "mysql", "readReplica", "redis", "objectStorage"].includes(node.type)).map((node) => node.label).join(" + "),
  ].filter(Boolean);

  const continueAfterBrief = () => {
    selectCampaign(campaign.id);
    markCampaignBriefSeen(campaign.id);
    if (reviewOnly) {
      router.replace("/levels");
      return;
    }
    if (targetLevel) router.replace({ pathname: "/game/[levelId]", params: { levelId: targetLevel.id } });
    else router.replace("/levels");
  };

  useEffect(() => {
    if (!hydrated || entryHandled) return;
    setEntryHandled(true);
    if (reviewOnly) {
      selectCampaign(campaign.id);
      markCampaignBriefSeen(campaign.id);
      setStep("brief");
      return;
    }
    if (!briefSeen || !profileComplete) return;
    selectCampaign(campaign.id);
    if (requestedLevel ?? nextPlayable) router.replace({ pathname: "/game/[levelId]", params: { levelId: (requestedLevel ?? nextPlayable)!.id } });
    else router.replace("/levels");
  }, [briefSeen, campaign.id, entryHandled, hydrated, markCampaignBriefSeen, nextPlayable, profileComplete, requestedLevel, reviewOnly, selectCampaign]);

  const saveProfileAndContinue = () => {
    const name = nameDraft.trim();
    let age: number | null = null;
    if (!name) {
      setError("Tell Jimmy what to call you.");
      return;
    }
    if (!ageSkipped) {
      if (!ageDraft.trim()) {
        setError("Add your age, or choose “Skip age”.");
        return;
      }
      age = Number(ageDraft);
      if (!Number.isInteger(age) || age < 1 || age > 120) {
        setError("Enter a whole-number age from 1 to 120, or choose “Skip age”.");
        return;
      }
    }

    setProfile({ name, age });
    setError("");
    selectCampaign(campaign.id);
    if (briefSeen) {
      if (requestedLevel) router.replace({ pathname: "/game/[levelId]", params: { levelId: requestedLevel.id } });
      else router.replace("/levels");
      return;
    }
    markCampaignBriefSeen(campaign.id);
    setStep("brief");
  };

  const showBrief = () => {
    selectCampaign(campaign.id);
    markCampaignBriefSeen(campaign.id);
    setStep("brief");
  };

  if (!hydrated) return <Screen><View style={styles.loading}><Text style={styles.loadingText}>Loading your campaign…</Text></View></Screen>;

  const hasCompleteProfile = profileComplete;
  const ageGuidance = profile.age !== null && profile.age < 18
    ? "I’ll explain the unfamiliar engineering terms as we go and keep each trade-off concrete."
    : "I’ll keep the advice practical, and unpack the technical details whenever they matter.";

  return <Screen contentStyle={styles.screen}>
    <TopBar back eyebrow="CAMPAIGN START" title={campaign.title} right={<Pill color={colors.mint}>{step === "welcome" ? "MEET BYTE" : "THE BRIEF"}</Pill>} />
    <View style={styles.progressRow}>
      <View style={[styles.progressStep, step === "welcome" && styles.progressStepActive]}><Text style={[styles.progressNumber, step === "welcome" && styles.progressNumberActive]}>01</Text><Text style={[styles.progressLabel, step === "welcome" && styles.progressLabelActive]}>YOUR COPILOT</Text></View>
      <View style={styles.progressConnector} />
      <View style={[styles.progressStep, step === "brief" && styles.progressStepActive]}><Text style={[styles.progressNumber, step === "brief" && styles.progressNumberActive]}>02</Text><Text style={[styles.progressLabel, step === "brief" && styles.progressLabelActive]}>THE COMPANY</Text></View>
    </View>

    {step === "welcome" ? <Animated.View entering={FadeInDown.duration(300)} style={[styles.welcomeCard, wide && styles.welcomeWide]}>
      <View style={styles.portraitColumn}>
        <View style={styles.portraitFrame}><Image source={jimmyWelcome} resizeMode="contain" style={styles.welcomePortrait} accessibilityLabel="Byte welcoming the player" /></View>
        <Text style={styles.jimmyName}>BYTE</Text>
        <Text style={styles.jimmyRole}>YOUR AI ASSISTANT</Text>
      </View>
      <View style={styles.welcomeCopy}>
        <Text style={styles.eyebrow}>BEFORE THE FIRST INCIDENT</Text>
        <Text style={styles.heading}>{hasCompleteProfile ? `Hey, ${profile.name}. I’m Byte.` : "Let’s get to know each other."}</Text>
        <Text style={styles.body}>{hasCompleteProfile
          ? `I’ll be your sounding board as you take the CTO seat at ${campaign.story.companyName}. ${ageGuidance}`
          : `I’m Byte, your AI assistant. I’ll help you read the signals, weigh the trade-offs, and make the calls as the company grows.`}</Text>

        {!hasCompleteProfile ? <View style={styles.form}>
          <View style={styles.field}>
            <Text style={styles.fieldLabel}>WHAT SHOULD I CALL YOU?</Text>
            <TextInput accessibilityLabel="Your name" autoCapitalize="words" autoComplete="given-name" maxLength={40} onChangeText={(value) => { setNameDraft(value); setError(""); }} placeholder="Your name" placeholderTextColor="#65758A" returnKeyType="next" style={styles.input} value={nameDraft} />
          </View>
          <View style={styles.field}>
            <View style={styles.ageLabelRow}><Text style={styles.fieldLabel}>HOW OLD ARE YOU?</Text><Pressable accessibilityRole="button" onPress={() => { gameFeedback.trigger("uiTap"); setAgeSkipped(true); setAgeDraft(""); setError(""); }}><Text style={styles.skipAge}>{ageSkipped ? "AGE SKIPPED" : "SKIP AGE"}</Text></Pressable></View>
            <TextInput accessibilityLabel="Your age" keyboardType="number-pad" maxLength={3} onChangeText={(value) => { setAgeDraft(value.replace(/[^0-9]/g, "")); setAgeSkipped(false); setError(""); }} placeholder="Age" placeholderTextColor="#65758A" returnKeyType="done" style={styles.input} value={ageDraft} />
          </View>
          {error ? <Text accessibilityRole="alert" style={styles.error}>{error}</Text> : null}
          <Text style={styles.privacy}>Saved only on this device. Your age helps me choose how much background to include.</Text>
          <Button onPress={saveProfileAndContinue}>Meet the company <Text>→</Text></Button>
        </View> : <View style={styles.profileSummary}>
          <View style={styles.profileBadge}><ProfileIcon /><Text style={styles.profileBadgeText}>PROFILE READY{profile.age !== null ? `  ·  AGE ${profile.age}` : ""}</Text></View>
          <Text style={styles.bodySmall}>First up: the company you’re inheriting, what’s already working, and what you’re here to change.</Text>
          <Button onPress={showBrief}>Meet {campaign.story.companyName} <Text>→</Text></Button>
        </View>}
      </View>
    </Animated.View> : <Animated.View entering={FadeInDown.duration(340)} style={styles.briefPage}>
      <View style={[styles.briefHero, wide && styles.briefHeroWide]}>
        <View style={styles.briefCopy}>
          <Text style={styles.eyebrow}>BYTE’S FIELD BRIEF  ·  {campaign.title.toUpperCase()}</Text>
          <Text style={styles.briefTitle}>Welcome to {campaign.story.companyName}{profile.name ? `, ${profile.name}` : ""}.</Text>
          <Text style={styles.briefProduct}>{campaign.story.product}</Text>
          <View style={styles.assistantLine}><View style={styles.onlineDot} /><Text style={styles.assistantText}>BYTE  ·  YOUR AI ASSISTANT</Text></View>
          <Text style={styles.jimmyQuote}>“I’ve got you. Let’s start with the system you have, not the one somebody says you should have.”</Text>
        </View>
        <View style={styles.explainPortraitFrame}><Image source={jimmyExplaining} resizeMode="contain" style={styles.explainPortrait} accessibilityLabel="Byte explaining the campaign" /></View>
      </View>

      <View style={[styles.briefGrid, wide && styles.briefGridWide]}>
        <View style={[styles.briefPanel, wide && styles.briefPanelWide]}>
          <View style={styles.panelHeading}><CompanyIcon /><Text style={styles.panelEyebrow}>THE SITUATION</Text></View>
          <Text style={styles.panelTitle}>Where things stand</Text>
          <Text style={styles.panelBody}>{campaign.story.situation}</Text>
          <View style={styles.stackBlock}><Text style={styles.stackLabel}>CURRENT SYSTEM</Text><Text style={styles.stackValue}>{stackLabels.length ? stackLabels.join("   →   ") : "Architecture not yet mapped"}</Text></View>
        </View>
        <View style={[styles.briefPanel, styles.objectivePanel, wide && styles.briefPanelWide]}>
          <View style={styles.panelHeading}><TargetIcon /><Text style={styles.panelEyebrow}>YOUR MANDATE</Text></View>
          <Text style={styles.panelTitle}>What success looks like</Text>
          <Text style={styles.panelBody}>{campaign.story.objective}</Text>
          <Text style={styles.objectiveFoot}>Every decision changes the company you’ll lead next.</Text>
        </View>
      </View>

      <View style={styles.metricsPanel}>
        <View style={styles.metricsHeading}><View><Text style={styles.panelEyebrow}>THE COMPANY TODAY</Text><Text style={styles.panelTitle}>{campaign.story.companyName} · operating snapshot</Text></View><Text style={styles.liveLabel}>LIVE SAVE</Text></View>
        <View style={styles.metricsGrid}>
          <StoryMetric label="ACTIVE USERS" value={formatCompact(company.users)} color={colors.blue} />
          <StoryMetric label="ENGINEERING TEAM" value={`${company.engineers}`} suffix={company.engineers === 1 ? "engineer" : "engineers"} color={colors.purple} />
          <StoryMetric label="CASH ON HAND" value={formatMoney(company.cash)} color={colors.mint} />
          <StoryMetric label="MONTHLY REVENUE" value={`${formatCompact(company.monthlyRevenue)}/mo`} color={colors.yellow} />
          <StoryMetric label="RELIABILITY" value={`${company.reliability}%`} color={company.reliability >= 70 ? colors.mint : colors.orange} />
        </View>
      </View>

      <View style={[styles.briefFooter, wide && styles.briefFooterWide]}>
        <Text style={styles.footerNote}>You can return to the incident map at any time.</Text>
        <View style={styles.footerActions}>
          <Pressable accessibilityRole="button" onPress={() => { gameFeedback.trigger("uiTap"); router.replace("/levels"); }} style={styles.mapLink}><Text style={styles.mapLinkText}>{reviewOnly ? "BACK TO INCIDENT MAP" : "VIEW INCIDENT MAP"}</Text></Pressable>
          <Button onPress={continueAfterBrief}>{reviewOnly ? "Back to incidents" : targetLevel ? `Start: ${targetLevel.title}` : "Open campaign map"} <Text>→</Text></Button>
        </View>
      </View>
    </Animated.View>}
  </Screen>;
}

function StoryMetric({ label, value, suffix, color }: { label: string; value: string; suffix?: string; color: string }) {
  return <View style={styles.metricCard}><Text style={styles.metricLabel}>{label}</Text><Text style={[styles.metricValue, { color }]}>{value}{suffix ? <Text style={styles.metricSuffix}> {suffix}</Text> : null}</Text></View>;
}

function ProfileIcon() { return <Svg width={16} height={16} viewBox="0 0 20 20" fill="none"><Circle cx="10" cy="6.5" r="3" stroke={colors.mint} strokeWidth={1.5} /><Path d="M4 17c.6-3.1 2.6-4.7 6-4.7s5.4 1.6 6 4.7" stroke={colors.mint} strokeWidth={1.5} strokeLinecap="round" /></Svg>; }
function CompanyIcon() { return <Svg width={18} height={18} viewBox="0 0 20 20" fill="none"><Rect x="3" y="3" width="14" height="14" rx="3" stroke={colors.blue} strokeWidth={1.5} /><Path d="M6 7h8M6 10h5m-5 3h7" stroke={colors.blue} strokeWidth={1.5} strokeLinecap="round" /></Svg>; }
function TargetIcon() { return <Svg width={18} height={18} viewBox="0 0 20 20" fill="none"><Circle cx="10" cy="10" r="7" stroke={colors.yellow} strokeWidth={1.5} /><Circle cx="10" cy="10" r="3.2" stroke={colors.yellow} strokeWidth={1.5} /><Path d="m10 10 6-6m-2 0h2v2" stroke={colors.yellow} strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" /></Svg>; }

const styles = StyleSheet.create({
  screen: { paddingBottom: 44 }, loading: { flex: 1, minHeight: 280, alignItems: "center", justifyContent: "center" }, loadingText: { color: colors.muted, fontSize: 13, fontWeight: "700" },
  progressRow: { flexDirection: "row", alignItems: "center", alignSelf: "center", marginTop: 3, marginBottom: 17 }, progressStep: { flexDirection: "row", alignItems: "center", gap: 7, opacity: 0.52 }, progressStepActive: { opacity: 1 }, progressNumber: { color: colors.muted, fontSize: 9, fontWeight: "900" }, progressNumberActive: { color: colors.mint }, progressLabel: { color: colors.muted, fontSize: 8, fontWeight: "900", letterSpacing: 0.9 }, progressLabelActive: { color: colors.white }, progressConnector: { width: 44, height: 1, backgroundColor: colors.border, marginHorizontal: 12 },
  welcomeCard: { maxWidth: 780, width: "100%", alignSelf: "center", flexDirection: "column", overflow: "hidden", backgroundColor: "#0C1A2B", borderWidth: 1, borderColor: colors.border, borderRadius: radii.lg }, welcomeWide: { flexDirection: "row", minHeight: 380 }, portraitColumn: { minHeight: 232, alignItems: "center", justifyContent: "flex-end", backgroundColor: "#132844", borderBottomWidth: 1, borderBottomColor: colors.border, paddingTop: 16 },
  portraitFrame: { width: 146, height: 188, overflow: "hidden", alignItems: "center", justifyContent: "flex-end" }, welcomePortrait: { width: 141, height: 188 }, jimmyName: { color: colors.mint, fontSize: 10, fontWeight: "900", letterSpacing: 1.5, marginTop: 1 }, jimmyRole: { color: colors.muted, fontSize: 7, fontWeight: "900", letterSpacing: 1.1, marginTop: 3, marginBottom: 15 },
  welcomeCopy: { flex: 1, minWidth: 0, padding: spacing.lg }, eyebrow: { color: colors.mint, fontSize: 8, fontWeight: "900", letterSpacing: 1.3 }, heading: { color: colors.white, fontSize: 25, lineHeight: 31, fontWeight: "900", letterSpacing: -0.7, marginTop: 8 }, body: { color: "#AAB9CB", fontSize: 12, lineHeight: 19, marginTop: 9 }, form: { gap: 11, marginTop: 18 }, field: { gap: 6, flex: 1 }, fieldLabel: { color: "#8597AE", fontSize: 8, fontWeight: "900", letterSpacing: 0.8 }, input: { height: 44, paddingHorizontal: 12, borderWidth: 1, borderColor: "#344862", borderRadius: 10, backgroundColor: "#081525", color: colors.white, fontSize: 13, outlineStyle: "none" } as object, ageLabelRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" }, skipAge: { color: colors.blue, fontSize: 8, fontWeight: "900", letterSpacing: 0.55 }, error: { color: colors.red, fontSize: 10, lineHeight: 15 }, privacy: { color: colors.dim, fontSize: 9, lineHeight: 14, marginTop: -1 },
  profileSummary: { gap: 12, marginTop: 18 }, profileBadge: { alignSelf: "flex-start", flexDirection: "row", alignItems: "center", gap: 7, paddingHorizontal: 10, paddingVertical: 8, borderRadius: 9, backgroundColor: "#102821", borderWidth: 1, borderColor: "#285648" }, profileBadgeText: { color: colors.mint, fontSize: 8, fontWeight: "900", letterSpacing: 0.7 }, bodySmall: { color: "#AAB9CB", fontSize: 11, lineHeight: 17 },
  briefPage: { width: "100%", maxWidth: 940, alignSelf: "center", gap: 12 }, briefHero: { minHeight: 205, flexDirection: "row", overflow: "hidden", borderRadius: radii.lg, borderWidth: 1, borderColor: "#31506B", backgroundColor: "#10243B", paddingHorizontal: spacing.lg, paddingTop: spacing.md }, briefHeroWide: { minHeight: 228 }, briefCopy: { flex: 1, minWidth: 0, paddingVertical: spacing.md, paddingBottom: spacing.lg }, briefTitle: { color: colors.white, fontSize: 24, lineHeight: 30, fontWeight: "900", letterSpacing: -0.7, marginTop: 9 }, briefProduct: { maxWidth: 520, color: "#BDCBDA", fontSize: 12, lineHeight: 18, marginTop: 7 }, assistantLine: { flexDirection: "row", alignItems: "center", gap: 6, marginTop: 13 }, onlineDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: colors.mint }, assistantText: { color: colors.mint, fontSize: 8, fontWeight: "900", letterSpacing: 0.8 }, jimmyQuote: { color: "#DEE7F1", fontSize: 11, lineHeight: 17, fontWeight: "600", marginTop: 8, maxWidth: 510 }, explainPortraitFrame: { width: 190, alignSelf: "stretch", overflow: "hidden", justifyContent: "flex-end", marginLeft: 8 }, explainPortrait: { width: 169, height: 206, alignSelf: "center", marginBottom: -12 },
  briefGrid: { flexDirection: "column", gap: 10 }, briefGridWide: { flexDirection: "row" }, briefPanel: { minWidth: 0, padding: spacing.md, borderRadius: radii.md, backgroundColor: "#0D1B2D", borderWidth: 1, borderColor: "#263B54" }, briefPanelWide: { flex: 1 }, objectivePanel: { backgroundColor: "#111D31" }, panelHeading: { flexDirection: "row", alignItems: "center", gap: 8 }, panelEyebrow: { color: "#8FA1B7", fontSize: 8, fontWeight: "900", letterSpacing: 0.9 }, panelTitle: { color: colors.white, fontSize: 14, fontWeight: "900", letterSpacing: -0.2, marginTop: 8 }, panelBody: { color: "#AAB9CB", fontSize: 11, lineHeight: 17, marginTop: 7 }, stackBlock: { paddingTop: 12, marginTop: 14, borderTopWidth: 1, borderTopColor: "#283B52" }, stackLabel: { color: colors.dim, fontSize: 7, fontWeight: "900", letterSpacing: 0.8 }, stackValue: { color: colors.blue, fontSize: 10, fontWeight: "800", lineHeight: 15, marginTop: 6 }, objectiveFoot: { color: colors.yellow, fontSize: 9, fontWeight: "800", lineHeight: 14, marginTop: 11 },
  metricsPanel: { padding: spacing.md, borderRadius: radii.md, backgroundColor: "#0D1A2A", borderWidth: 1, borderColor: "#263B54" }, metricsHeading: { flexDirection: "row", alignItems: "flex-end", justifyContent: "space-between", marginBottom: 11 }, liveLabel: { color: colors.mint, fontSize: 7, fontWeight: "900", letterSpacing: 0.8 }, metricsGrid: { flexDirection: "row", flexWrap: "wrap", gap: 7 }, metricCard: { flexGrow: 1, flexBasis: "30%", minWidth: 102, paddingHorizontal: 10, paddingVertical: 10, borderRadius: 9, backgroundColor: "#101F33", borderWidth: 1, borderColor: "#24374F" }, metricLabel: { color: colors.dim, fontSize: 7, fontWeight: "900", letterSpacing: 0.55 }, metricValue: { fontSize: 16, fontWeight: "900", marginTop: 5 }, metricSuffix: { color: "#9AABC0", fontSize: 8, fontWeight: "800" },
  briefFooter: { gap: 10, paddingTop: 3 }, briefFooterWide: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" }, footerNote: { color: colors.dim, fontSize: 9, lineHeight: 14 }, footerActions: { flexDirection: "row", alignItems: "center", justifyContent: "flex-end", gap: 14 }, mapLink: { paddingVertical: 10, paddingHorizontal: 4 }, mapLinkText: { color: colors.blue, fontSize: 8, fontWeight: "900", letterSpacing: 0.75 },
});
