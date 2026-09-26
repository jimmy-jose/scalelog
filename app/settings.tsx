import { Pressable, StyleSheet, Switch, Text, View } from "react-native";
import { Screen } from "@/ui/components/Screen";
import { TopBar } from "@/ui/components/TopBar";
import { useGameStore } from "@/store/gameStore";
import { colors, radii } from "@/ui/theme";
import { gameFeedback } from "@/game/feedback/GameFeedbackManager";

export default function SettingsScreen() {
  const settings = useGameStore((state) => state.audioSettings);
  const updateAudioSettings = useGameStore((state) => state.updateAudioSettings);

  return (
    <Screen contentStyle={styles.screen}>
      <TopBar back eyebrow="PREFERENCES" title="Sound & haptics" musicControl={false} />
      <Text style={styles.intro}>Set the level of feedback you want while you make calls for Cartline.</Text>

      <View style={styles.panel}>
        <ToggleRow
          title="Sound Effects"
          description="Quiet cues for choices, incidents, and progression."
          value={settings.soundEnabled}
          onValueChange={(soundEnabled) => updateAudioSettings({ soundEnabled })}
        />
        <View style={styles.divider} />
        <ToggleRow
          title="Background Music"
          description="Soft ambient tracks that play in a loop."
          value={settings.musicEnabled}
          onValueChange={(musicEnabled) => updateAudioSettings({ musicEnabled })}
        />
        <View style={styles.divider} />
        <ToggleRow
          title="Haptics"
          description="Light touch feedback for important game events."
          value={settings.hapticsEnabled}
          onValueChange={(hapticsEnabled) => updateAudioSettings({ hapticsEnabled })}
        />
      </View>

      <Text style={styles.sectionLabel}>VOLUME</Text>
      <View style={styles.panel}>
        <VolumeRow
          title="SFX Volume"
          value={settings.sfxVolume}
          onChange={(sfxVolume) => updateAudioSettings({ sfxVolume })}
        />
        <View style={styles.divider} />
        <VolumeRow
          title="Music Volume"
          value={settings.musicVolume}
          onChange={(musicVolume) => updateAudioSettings({ musicVolume })}
        />
      </View>
      <Text style={styles.note}>Your sound and haptic preferences are saved on this device.</Text>
    </Screen>
  );
}

function ToggleRow({ title, description, value, onValueChange }: {
  title: string;
  description: string;
  value: boolean;
  onValueChange: (value: boolean) => void;
}) {
  return (
    <View style={styles.toggleRow}>
      <View style={styles.copy}>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.description}>{description}</Text>
      </View>
      <Switch
        accessibilityLabel={title}
        value={value}
        onValueChange={(val) => {
          gameFeedback.trigger("toggleSwitch");
          onValueChange(val);
        }}
        trackColor={{ false: "#324258", true: "#347B6C" }}
        thumbColor={value ? colors.mint : "#C1CBD7"}
        ios_backgroundColor="#324258"
      />
    </View>
  );
}

function VolumeRow({ title, value, onChange }: { title: string; value: number; onChange: (value: number) => void }) {
  const percent = Math.round(value * 100);
  const change = (delta: number) => {
    gameFeedback.trigger("uiTap");
    onChange(Math.max(0, Math.min(1, Math.round((value + delta) * 10) / 10)));
  };
  return (
    <View style={styles.volumeRow}>
      <View style={styles.volumeTop}>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.volumeValue}>{percent}%</Text>
      </View>
      <View style={styles.volumeControls}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`Decrease ${title} by 10 percent`}
          disabled={value <= 0}
          onPress={() => change(-0.1)}
          style={({ pressed }) => [styles.volumeButton, value <= 0 && styles.disabled, pressed && styles.pressed]}
        ><Text style={styles.volumeButtonText}>−</Text></Pressable>
        <View style={styles.volumeTrack} accessibilityRole="progressbar" accessibilityLabel={title} accessibilityValue={{ min: 0, max: 100, now: percent }}>
          <View style={[styles.volumeFill, { width: `${percent}%` }]} />
        </View>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`Increase ${title} by 10 percent`}
          disabled={value >= 1}
          onPress={() => change(0.1)}
          style={({ pressed }) => [styles.volumeButton, value >= 1 && styles.disabled, pressed && styles.pressed]}
        ><Text style={styles.volumeButtonText}>+</Text></Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { maxWidth: 760, paddingBottom: 36 },
  intro: { color: "#A5B5C8", fontSize: 13, lineHeight: 20, marginTop: 7, marginBottom: 18 },
  sectionLabel: { color: colors.mint, fontSize: 8, fontWeight: "900", letterSpacing: 1.1, marginTop: 20, marginBottom: 8 },
  panel: { paddingHorizontal: 15, borderRadius: radii.md, borderWidth: 1, borderColor: "#293E57", backgroundColor: "#0D192A" },
  toggleRow: { minHeight: 78, flexDirection: "row", alignItems: "center", gap: 12, paddingVertical: 12 },
  copy: { flex: 1, minWidth: 0 },
  title: { color: colors.white, fontSize: 13, fontWeight: "800" },
  description: { color: "#8496AD", fontSize: 10, lineHeight: 15, marginTop: 4 },
  divider: { height: 1, backgroundColor: "#21334A" },
  volumeRow: { paddingVertical: 14 },
  volumeTop: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  volumeValue: { color: colors.mint, fontSize: 11, fontWeight: "900", fontVariant: ["tabular-nums"] },
  volumeControls: { flexDirection: "row", alignItems: "center", gap: 12, marginTop: 12 },
  volumeButton: { width: 30, height: 30, alignItems: "center", justifyContent: "center", borderRadius: 9, borderWidth: 1, borderColor: "#334A64", backgroundColor: "#14243A" },
  volumeButtonText: { color: "#E5EDF5", fontSize: 18, lineHeight: 20, fontWeight: "700" },
  volumeTrack: { height: 5, flex: 1, borderRadius: 3, backgroundColor: "#25374D", overflow: "hidden" },
  volumeFill: { height: "100%", borderRadius: 3, backgroundColor: colors.mint },
  disabled: { opacity: 0.4 },
  pressed: { opacity: 0.7 },
  note: { color: "#71839A", fontSize: 9, lineHeight: 14, marginTop: 14 },
});
