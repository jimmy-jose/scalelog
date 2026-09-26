import { CompanySummary } from "@/ui/components/CompanySummary";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { router } from "expo-router";
import Animated, { FadeInDown } from "react-native-reanimated";
import Svg, { Circle, Path, Rect } from "react-native-svg";
import { allLevels } from "@/campaigns";
import { useGameStore } from "@/store/gameStore";
import { Screen } from "@/ui/components/Screen";
import { TopBar } from "@/ui/components/TopBar";
import { Pill } from "@/ui/components/Pill";
import { SettingsButton } from "@/ui/components/SettingsButton";
import { colors, radii, spacing } from "@/ui/theme";
import { gameFeedback } from "@/game/feedback/GameFeedbackManager";

const topics = ["TEAM & ARCHITECTURE", "DATABASE PERFORMANCE", "CONNECTION MANAGEMENT"];

export default function LevelSelectionScreen() {
  const failureReason = useGameStore((state) => state.failureReason);
  const unlockedLevels = useGameStore((state) => state.player.unlockedLevels);
  const completedLevels = useGameStore((state) => state.progress.completedLevels);
  const campaignId = useGameStore((state) => state.activeCampaignId);
  const completedCount = allLevels.filter((level) => completedLevels.includes(level.id)).length;
  const progress = allLevels.length ? completedCount / allLevels.length : 0;

  return (
    <Screen>
      <TopBar back title="Startup CTO" right={<View style={styles.headerActions}><Pill color={colors.mint}>CHAPTER 01</Pill><SettingsButton /></View>} />

      <View style={styles.hero}>
        <View style={styles.heroHeading}>
          <View style={styles.heroIcon}><CampaignGlyph /></View>
          <View style={styles.heroCopy}>
            <Text style={styles.eyebrow}>YOUR CAMPAIGN</Text>
            <Text style={styles.title}>From garage to growth</Text>
          </View>
        </View>
        <Text style={styles.description}>Build the right thing for the company you have—not the one you might become.</Text>
        <View style={styles.heroActionRow}>
          <Text style={styles.briefHint}>Need a refresher?</Text>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Read the company brief again"
            onPress={() => {
              gameFeedback.trigger("uiTap");
              router.push({ pathname: "/campaign/[campaignId]", params: { campaignId, view: "brief" } });
            }}
            style={({ pressed }) => [styles.briefButton, pressed && styles.briefButtonPressed]}
          >
            <BriefGlyph />
            <Text style={styles.briefButtonText}>READ COMPANY BRIEF</Text>
            <StateGlyph state="arrow" color={colors.blue} />
          </Pressable>
        </View>
        <View style={styles.heroProgress}>
          <View style={styles.progressLabelRow}>
            <Text style={styles.progressLabel}>CHAPTER PROGRESS</Text>
            <Text style={styles.progressValue}>{String(completedCount).padStart(2, "0")} <Text style={styles.progressSlash}>/</Text> {String(allLevels.length).padStart(2, "0")}</Text>
          </View>
          <View accessibilityRole="progressbar" accessibilityLabel="Chapter progress" accessibilityValue={{ min: 0, max: allLevels.length, now: completedCount }} style={styles.progressTrack}>
            <View style={[styles.progressFill, { width: `${progress * 100}%` }]} />
          </View>
        </View>
      </View>

      <CompanySummary />
      <View style={styles.sectionHead}>
        <View><Text style={styles.sectionTitle}>THE INCIDENTS</Text><Text style={styles.sectionSubtitle}>Three calls. A growing system.</Text></View>
        <Text style={styles.sectionCount}>{allLevels.length} SCENARIOS</Text>
      </View>

      <View style={styles.route}>
        {allLevels.map((level, index) => {
          const unlocked = !failureReason && unlockedLevels.includes(level.id);
          const completed = completedLevels.includes(level.id);
          const current = unlocked && !completed;
          const state = completed ? "DECISION LOGGED" : current ? "AVAILABLE" : "LOCKED";
          const tone = completed ? "completed" : current ? "current" : "locked";
          const action = completed ? "REVIEW SCENARIO" : current ? "ENTER SCENARIO" : "CLEAR THE PREVIOUS INCIDENT";

          return (
            <Animated.View key={level.id} entering={FadeInDown.delay(index * 70).duration(300)} style={styles.routeItem}>
              <View style={styles.rail}>
                <View style={[styles.topicIcon, styles[`${tone}Icon` as "completedIcon" | "currentIcon" | "lockedIcon"]]}>
                  <TopicGlyph index={index} color={tone === "completed" ? colors.blue : tone === "current" ? colors.mint : colors.dim} />
                </View>
                {index < allLevels.length - 1 && <View style={[styles.railLine, completed && styles.railLineComplete]} />}
              </View>

              <Pressable
                accessibilityRole="button"
                accessibilityLabel={`Level ${level.levelNumber}, ${level.title}, ${state.toLowerCase()}`}
                accessibilityHint={unlocked ? action : "Complete the previous level to unlock this scenario"}
                disabled={!unlocked}
                onPress={() => {
                  gameFeedback.trigger("uiTap");
                  router.push({ pathname: "/game/[levelId]", params: { levelId: level.id } });
                }}
                style={({ pressed }) => [styles.scenario, styles[`${tone}Scenario` as "completedScenario" | "currentScenario" | "lockedScenario"], pressed && styles.pressed]}
              >
                <View style={styles.scenarioTop}>
                  <View style={styles.scenarioMeta}>
                    <Text style={styles.levelNumber}>LEVEL {String(level.levelNumber).padStart(2, "0")}</Text>
                    <View style={styles.metaDot} />
                    <Text style={styles.topic}>{topics[index] ?? "SYSTEM DESIGN"}</Text>
                  </View>
                  <View style={[styles.stateTag, styles[`${tone}Tag` as "completedTag" | "currentTag" | "lockedTag"]]}>
                    <StateGlyph state={tone} color={tone === "completed" ? colors.blue : tone === "current" ? colors.mint : colors.dim} />
                    <Text style={[styles.stateText, styles[`${tone}State` as "completedState" | "currentState" | "lockedState"]]}>{state}</Text>
                  </View>
                </View>

                <Text style={[styles.scenarioTitle, tone === "locked" && styles.lockedTitle]}>{level.title}</Text>
                <Text style={[styles.scenarioDescription, tone === "locked" && styles.lockedDescription]}>{level.description}</Text>

                <View style={styles.scenarioFooter}>
                  <Text style={[styles.scenarioAction, tone === "current" && styles.currentAction, tone === "locked" && styles.lockedAction]}>{action}</Text>
                  {tone !== "locked" && <StateGlyph state="arrow" color={tone === "completed" ? colors.blue : colors.mint} />}
                </View>
              </Pressable>
            </Animated.View>
          );
        })}
      </View>

      <View style={styles.nextChapter}>
        <View style={styles.nextChapterGlyph}><PathGlyph /></View>
        <View style={styles.nextChapterCopy}>
          <Text style={styles.nextChapterEyebrow}>UP NEXT</Text>
          <Text style={styles.nextChapterTitle}>More incidents ahead</Text>
          <Text style={styles.nextChapterDescription}>New scenarios unlock as the campaign grows.</Text>
        </View>
        <Text style={styles.nextChapterCount}>{completedCount}/{allLevels.length}</Text>
      </View>
    </Screen>
  );
}

function CampaignGlyph() {
  return <Svg width={25} height={25} viewBox="0 0 24 24" fill="none">
    <Path d="M4 18.5h16M6.5 15.5l4-4 3 2.5 5-6" stroke={colors.mint} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" />
    <Circle cx="18.5" cy="8" r="2" fill={colors.mint} />
    <Path d="M5 5.5h5" stroke={colors.blue} strokeWidth={1.8} strokeLinecap="round" />
  </Svg>;
}

function BriefGlyph() {
  return <Svg width={16} height={16} viewBox="0 0 20 20" fill="none">
    <Rect x="3.5" y="2.5" width="13" height="15" rx="2.5" stroke={colors.blue} strokeWidth={1.5} />
    <Path d="M7 7h6m-6 3h6m-6 3h4" stroke={colors.blue} strokeWidth={1.5} strokeLinecap="round" />
  </Svg>;
}

function TopicGlyph({ index, color }: { index: number; color: string }) {
  if (index === 1) return <Svg width={23} height={23} viewBox="0 0 24 24" fill="none">
    <Path d="M4 6.5C4 4.6 7.6 3 12 3s8 1.6 8 3.5S16.4 10 12 10 4 8.4 4 6.5Z" stroke={color} strokeWidth={1.7} />
    <Path d="M4 6.5v10C4 18.4 7.6 20 12 20m8-13.5v3m-16 2C4 13.4 7.6 15 12 15m6-1 2 2 3-4" stroke={color} strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round" />
  </Svg>;
  if (index === 2) return <Svg width={23} height={23} viewBox="0 0 24 24" fill="none">
    <Circle cx="6" cy="6" r="2.5" stroke={color} strokeWidth={1.7} /><Circle cx="18" cy="6" r="2.5" stroke={color} strokeWidth={1.7} /><Circle cx="12" cy="18" r="2.5" stroke={color} strokeWidth={1.7} />
    <Path d="M8 7.5 10.8 16m5.2-8.5L13.2 16M8.5 6h7" stroke={color} strokeWidth={1.7} strokeLinecap="round" />
  </Svg>;
  return <Svg width={23} height={23} viewBox="0 0 24 24" fill="none">
    <Rect x="4" y="4" width="16" height="16" rx="3" stroke={color} strokeWidth={1.7} />
    <Path d="M8.5 9 6 12l2.5 3m7-6 2.5 3-2.5 3m-3.5-7-1.5 8" stroke={color} strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round" />
  </Svg>;
}

function StateGlyph({ state, color }: { state: "completed" | "current" | "locked" | "arrow"; color: string }) {
  if (state === "completed") return <Svg width={13} height={13} viewBox="0 0 16 16" fill="none"><Path d="m3.5 8.3 3 3 6-6.5" stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" /></Svg>;
  if (state === "locked") return <Svg width={13} height={13} viewBox="0 0 16 16" fill="none"><Rect x="3.5" y="7" width="9" height="7" rx="1.5" stroke={color} strokeWidth={1.4} /><Path d="M5.5 7V5a2.5 2.5 0 0 1 5 0v2" stroke={color} strokeWidth={1.4} strokeLinecap="round" /></Svg>;
  if (state === "current") return <Svg width={13} height={13} viewBox="0 0 16 16" fill="none"><Circle cx="8" cy="8" r="4" fill={color} /></Svg>;
  return <Svg width={16} height={16} viewBox="0 0 16 16" fill="none"><Path d="M2.5 8h10m-4-4 4 4-4 4" stroke={color} strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round" /></Svg>;
}

function PathGlyph() {
  return <Svg width={21} height={21} viewBox="0 0 24 24" fill="none"><Circle cx="5" cy="5" r="2" stroke={colors.yellow} strokeWidth={1.6} /><Circle cx="19" cy="19" r="2" stroke={colors.yellow} strokeWidth={1.6} /><Path d="M7 5h5a3 3 0 0 1 3 3v5a3 3 0 0 0 3 3h1" stroke={colors.yellow} strokeWidth={1.6} strokeLinecap="round" /></Svg>;
}

const styles = StyleSheet.create({
  headerActions: { flexDirection: "row", alignItems: "center", gap: 8 },
  hero: { padding: spacing.lg, backgroundColor: "#0D1B31", borderWidth: 1, borderColor: colors.border, borderRadius: radii.lg },
  heroHeading: { flexDirection: "row", alignItems: "center", gap: 13 },
  heroIcon: { width: 46, height: 46, borderRadius: 14, borderWidth: 1, borderColor: "#31506C", backgroundColor: "#142840", alignItems: "center", justifyContent: "center" },
  heroCopy: { flex: 1 },
  eyebrow: { color: colors.mint, fontSize: 9, fontWeight: "900", letterSpacing: 1.4 },
  title: { color: colors.white, fontSize: 21, lineHeight: 26, fontWeight: "800", letterSpacing: -0.45, marginTop: 3 },
  description: { color: "#A4B2C5", fontSize: 12, lineHeight: 18, marginTop: 14, maxWidth: 560 },
  heroActionRow: { flexDirection: "row", flexWrap: "wrap", alignItems: "center", justifyContent: "space-between", gap: 10, marginTop: 13 },
  briefHint: { color: colors.dim, fontSize: 9, fontWeight: "700" },
  briefButton: { flexDirection: "row", alignItems: "center", gap: 8, minHeight: 36, paddingHorizontal: 11, borderRadius: 10, borderWidth: 1, borderColor: "#31506C", backgroundColor: "#12243A" },
  briefButtonPressed: { backgroundColor: "#1A304B", transform: [{ scale: 0.98 }] },
  briefButtonText: { color: colors.blue, fontSize: 8, fontWeight: "900", letterSpacing: 0.7 },
  heroProgress: { marginTop: 15, paddingTop: 13, borderTopWidth: 1, borderTopColor: "#263A53" },
  progressLabelRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 8 },
  progressLabel: { color: colors.muted, fontSize: 8, fontWeight: "900", letterSpacing: 1 },
  progressValue: { color: colors.white, fontSize: 10, fontWeight: "900", letterSpacing: 0.5 },
  progressSlash: { color: colors.dim },
  progressTrack: { height: 4, borderRadius: 3, backgroundColor: "#1B2B40", overflow: "hidden" },
  progressFill: { height: "100%", borderRadius: 3, backgroundColor: colors.mint },
  sectionHead: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-end", marginTop: spacing.xl, marginBottom: spacing.md },
  sectionTitle: { color: colors.white, fontSize: 12, fontWeight: "900", letterSpacing: 1.2 },
  sectionSubtitle: { color: colors.muted, fontSize: 10, marginTop: 4 },
  sectionCount: { color: colors.dim, fontSize: 8, fontWeight: "900", letterSpacing: 0.8, paddingBottom: 2 },
  route: { gap: 10 },
  routeItem: { flexDirection: "row", alignItems: "stretch", gap: 10 },
  rail: { width: 34, alignItems: "center", position: "relative" },
  topicIcon: { width: 34, height: 34, borderRadius: 12, borderWidth: 1, alignItems: "center", justifyContent: "center", zIndex: 1 },
  completedIcon: { borderColor: "#35557A", backgroundColor: "#12253D" },
  currentIcon: { borderColor: "#4C9B89", backgroundColor: "#12332F" },
  lockedIcon: { borderColor: "#28384D", backgroundColor: "#0C1829" },
  railLine: { position: "absolute", top: 34, bottom: -11, width: 1, backgroundColor: "#293B51" },
  railLineComplete: { backgroundColor: "#42698A" },
  scenario: { flex: 1, minWidth: 0, paddingHorizontal: 15, paddingVertical: 13, borderRadius: 14, borderWidth: 1, overflow: "hidden", borderLeftWidth: 2 },
  completedScenario: { backgroundColor: "#0D192A", borderColor: "#29405A", borderLeftColor: colors.blue },
  currentScenario: { backgroundColor: "#10252F", borderColor: "#3D786E", borderLeftColor: colors.mint },
  lockedScenario: { backgroundColor: "#0A1525", borderColor: "#1E2D42", borderLeftColor: "#334156" },
  pressed: { transform: [{ scale: 0.99 }], backgroundColor: "#172A41" },
  scenarioTop: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", gap: 8 },
  scenarioMeta: { flexDirection: "row", alignItems: "center", gap: 7, flex: 1, minWidth: 0 },
  levelNumber: { color: "#AAB8CA", fontSize: 8, fontWeight: "900", letterSpacing: 0.8 },
  metaDot: { width: 3, height: 3, borderRadius: 2, backgroundColor: "#60728A" },
  topic: { color: "#7E90A8", fontSize: 7, fontWeight: "800", letterSpacing: 0.65, flexShrink: 1 },
  stateTag: { flexDirection: "row", alignItems: "center", gap: 4, paddingHorizontal: 7, paddingVertical: 4, borderRadius: 7 },
  completedTag: { backgroundColor: "#14243A" },
  currentTag: { backgroundColor: "#15332F" },
  lockedTag: { backgroundColor: "#111D2D" },
  stateText: { fontSize: 7, fontWeight: "900", letterSpacing: 0.5 },
  completedState: { color: colors.blue },
  currentState: { color: colors.mint },
  lockedState: { color: "#718198" },
  scenarioTitle: { color: colors.white, fontSize: 16, lineHeight: 21, fontWeight: "800", letterSpacing: -0.2, marginTop: 9 },
  lockedTitle: { color: "#A2AEC0" },
  scenarioDescription: { color: "#9AA9BC", fontSize: 11, lineHeight: 16, marginTop: 3 },
  lockedDescription: { color: "#74839A" },
  scenarioFooter: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", borderTopWidth: 1, borderTopColor: "#26374B", paddingTop: 9, marginTop: 10 },
  scenarioAction: { color: "#8493A7", fontSize: 7, fontWeight: "900", letterSpacing: 0.75 },
  currentAction: { color: colors.mint },
  lockedAction: { color: "#66768D" },
  nextChapter: { flexDirection: "row", alignItems: "center", gap: 12, marginTop: spacing.lg, paddingHorizontal: 14, paddingVertical: 13, borderRadius: 14, borderWidth: 1, borderColor: "#3A3741", backgroundColor: "#111923" },
  nextChapterGlyph: { width: 34, height: 34, borderRadius: 10, borderWidth: 1, borderColor: "#4A453D", backgroundColor: "#24231F", alignItems: "center", justifyContent: "center" },
  nextChapterCopy: { flex: 1 },
  nextChapterEyebrow: { color: colors.yellow, fontSize: 7, fontWeight: "900", letterSpacing: 1 },
  nextChapterTitle: { color: colors.white, fontSize: 12, fontWeight: "800", marginTop: 3 },
  nextChapterDescription: { color: colors.muted, fontSize: 9, marginTop: 3 },
  nextChapterCount: { color: colors.yellow, fontSize: 10, fontWeight: "900" },
});
