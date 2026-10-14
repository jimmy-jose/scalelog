import { useRef, useState } from "react";
import { Linking, Platform, StyleSheet, Text, TextInput, View } from "react-native";
import Svg, { SvgXml } from "react-native-svg";
import * as Clipboard from "expo-clipboard";
import { router } from "expo-router";
import { useGameStore } from "@/store/gameStore";
import { CERTIFICATE_CAMPAIGN_ID, CERTIFICATE_NAME_LIMIT, certificateCaption, certificateDate, normalizeCertificateName } from "@/domain/certificates";
import { certificateArtwork } from "@/lib/certificateArtwork";
import { exportCertificate, getCertificateSiteUrl } from "@/lib/certificateExport";
import { Screen } from "@/ui/components/Screen";
import { TopBar } from "@/ui/components/TopBar";
import { Button } from "@/ui/components/Button";
import { colors, radii } from "@/ui/theme";

export default function CertificateScreen() {
  const certificate = useGameStore((state) => state.certificates[CERTIFICATE_CAMPAIGN_ID]);
  const personalize = useGameStore((state) => state.personalizeCertificate);
  const [name, setName] = useState(certificate?.recipientName ?? "");
  const [busy, setBusy] = useState(false);
  const [copying, setCopying] = useState(false);
  const [error, setError] = useState("");
  const [status, setStatus] = useState("");
  const [feedbackFor, setFeedbackFor] = useState<"export" | "share">("export");
  const [focused, setFocused] = useState(false);
  const svg = useRef<Svg>(null);
  if (!certificate) return <Screen>
    <TopBar back title="Your certificate" />
    <View style={styles.card}><Text style={styles.title}>An achievement to work toward.</Text>
      <Text style={styles.body}>Complete every scenario in Startup CTO without ending the run to unlock your free certificate.</Text>
      <Button onPress={() => router.replace("/levels")}>Continue your campaign</Button>
    </View>
  </Screen>;

  const recipientName = normalizeCertificateName(name);
  const validName = recipientName.length > 0 && recipientName.length <= CERTIFICATE_NAME_LIMIT;
  const preview = { ...certificate, recipientName };
  const siteUrl = getCertificateSiteUrl();
  const xml = certificateArtwork(preview, siteUrl);
  const caption = certificateCaption(certificate, siteUrl);
  const download = async () => {
    if (busy || !validName) return;
    setBusy(true); setError(""); setStatus(""); setFeedbackFor("export");
    try {
      if (!personalize(certificate.campaignId, recipientName)) throw new Error("Enter the name you want on your certificate.");
      await exportCertificate(xml, certificate.id, svg.current);
      setStatus(Platform.OS === "web" ? "Download started. Attach the PNG to your LinkedIn post." : "Attach your saved certificate image to your LinkedIn post.");
    } catch (reason) { setError(reason instanceof Error ? reason.message : "The certificate could not be exported. Please try again."); }
    finally { setBusy(false); }
  };
  const copyCaption = async () => {
    setCopying(true); setError(""); setStatus(""); setFeedbackFor("share");
    try {
      if (!await Clipboard.setStringAsync(caption)) throw new Error("Copy is unavailable.");
      setStatus("Caption copied. Paste it into your LinkedIn post and attach your certificate.");
    } catch { setError("Copy is unavailable. Select the caption below and copy it manually."); }
    finally { setCopying(false); }
  };

  return <Screen contentStyle={styles.screen}>
    <TopBar back eyebrow="YOUR FIRST CAMPAIGN" title="You earned this." />
    <Text style={styles.intro}>A milestone with your name on it. Your Startup CTO certificate is free to keep and share.</Text>
    <View style={styles.preview} accessible accessibilityRole="image" accessibilityLabel={`Certificate of Completion for ${recipientName || "your name"}. ${certificate.campaignTitle}, ${certificate.levelCount} scenarios completed. Issued by ScaleLog on ${certificateDate(certificate)}. Certificate ${certificate.id}.`}>
      <SvgXml xml={xml} override={{ width: "100%", height: "100%", ref: svg }} />
    </View>
    <View style={styles.card}>
      <Text style={styles.sectionTitle}>Make it yours</Text>
      <Text nativeID="certificate-name-label" style={styles.label}>Name on certificate</Text>
      <TextInput value={name} onChangeText={(value) => { setName(value); setError(""); setStatus(""); }}
        accessibilityLabel="Name on certificate" accessibilityHint="Enter your name as you want it to appear on the certificate."
        placeholder="Your full name" placeholderTextColor={colors.muted} maxLength={CERTIFICATE_NAME_LIMIT}
        editable={!busy} autoCapitalize="words" autoCorrect={false} onFocus={() => setFocused(true)} onBlur={() => setFocused(false)}
        style={[styles.input, focused && styles.inputFocused]} />
      <Text style={styles.hint}>Check the spelling. Your name is saved when you export the certificate.</Text>
      <Button loading={busy} disabled={!validName} onPress={() => void download()}>{Platform.OS === "web" ? "Download certificate · PNG" : "Save or share certificate · PNG"}</Button>
      {feedbackFor === "export" && error ? <Text accessibilityRole="alert" style={styles.error}>{error}</Text> : null}
      {feedbackFor === "export" && status ? <Text accessibilityLiveRegion="polite" style={styles.status}>{status}</Text> : null}
      <Text style={styles.hint}>High-resolution image · Free, always</Text>
    </View>
    <View style={styles.card}>
      <Text style={styles.sectionTitle}>Share your milestone on LinkedIn</Text>
      <Text style={styles.body}>1. Save your certificate image.{"\n"}2. Copy the caption below.{"\n"}3. Start a LinkedIn post, attach the image, and paste your caption.</Text>
      <Text selectable style={styles.caption}>{caption}</Text>
      <View style={styles.actions}>
        <Button variant="secondary" loading={copying} style={styles.action} onPress={() => void copyCaption()}>Copy LinkedIn caption</Button>
        <Button variant="secondary" style={styles.action} onPress={() => {
          setError(""); setStatus(""); setFeedbackFor("share");
          void Linking.openURL("https://www.linkedin.com/feed/").catch(() => setError("LinkedIn could not be opened. Open the LinkedIn app or website to create your post."));
        }}>Open LinkedIn</Button>
      </View>
      {feedbackFor === "share" && error ? <Text accessibilityRole="alert" style={styles.error}>{error}</Text> : null}
      {feedbackFor === "share" && status ? <Text accessibilityLiveRegion="polite" style={styles.status}>{status}</Text> : null}
      <Text style={styles.hint}>Make the caption your own before posting.</Text>
    </View>
    <Text style={styles.footnote}>Issued by ScaleLog for completing an interactive learning campaign. This certificate recognizes completion and is not a professional accreditation. It is saved on this device with your progress.</Text>
  </Screen>;
}

const styles = StyleSheet.create({
  screen: { maxWidth: 1000, paddingBottom: 48 },
  intro: { color: colors.text, fontSize: 16, lineHeight: 25, marginBottom: 24, maxWidth: 660 },
  preview: { width: "100%", aspectRatio: 4 / 3, borderRadius: 8, overflow: "hidden", backgroundColor: "#FAF8F1", marginBottom: 8 },
  card: { marginTop: 16, borderWidth: 1, borderColor: colors.border, borderRadius: radii.md, padding: 20, gap: 14, backgroundColor: colors.panelSoft },
  title: { color: colors.white, fontSize: 26, lineHeight: 33, fontWeight: "700" },
  sectionTitle: { color: colors.white, fontSize: 20, lineHeight: 28, fontWeight: "700" },
  label: { color: colors.text, fontSize: 14, fontWeight: "600" },
  input: { minHeight: 52, paddingHorizontal: 14, paddingVertical: 12, backgroundColor: colors.ink, borderColor: colors.border, borderWidth: 2, borderRadius: radii.sm, color: colors.white, fontSize: 17 },
  inputFocused: { borderColor: colors.blue },
  body: { color: colors.text, fontSize: 15, lineHeight: 26 },
  hint: { color: colors.text, fontSize: 12, lineHeight: 18 },
  caption: { color: colors.text, fontSize: 14, lineHeight: 23, backgroundColor: colors.ink, padding: 16, borderRadius: radii.sm },
  actions: { flexDirection: "row", flexWrap: "wrap", gap: 12 },
  action: { flexGrow: 1, flexBasis: 240 },
  error: { color: colors.red, fontSize: 14, lineHeight: 22, marginTop: 18 },
  status: { color: colors.mint, fontSize: 14, lineHeight: 22, marginTop: 18 },
  footnote: { color: colors.text, fontSize: 12, lineHeight: 19, marginTop: 24 },
});
