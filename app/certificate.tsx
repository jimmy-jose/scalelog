import { useRef, useState } from "react";
import { Linking, Platform, StyleSheet, Text, TextInput, View } from "react-native";
import Svg, { SvgXml } from "react-native-svg";
import * as Clipboard from "expo-clipboard";
import { router } from "expo-router";
import { useGameStore } from "@/store/gameStore";
import {
  CERTIFICATE_CAMPAIGN_ID,
  CERTIFICATE_NAME_LIMIT,
  certificateCaption,
  certificateDate,
  getCertificateVerificationUrl,
  isValidCertificateEmail,
  maskEmail,
  normalizeCertificateEmail,
  normalizeCertificateName,
} from "@/domain/certificates";
import { certificateArtwork } from "@/lib/certificateArtwork";
import { exportCertificate, getCertificateSiteUrl } from "@/lib/certificateExport";
import { mintCertificateOnServer } from "@/lib/certificateRegistry";
import { Screen } from "@/ui/components/Screen";
import { TopBar } from "@/ui/components/TopBar";
import { Button } from "@/ui/components/Button";
import { colors, radii } from "@/ui/theme";

export default function CertificateScreen() {
  const certificate = useGameStore((state) => state.certificates[CERTIFICATE_CAMPAIGN_ID]);
  const personalize = useGameStore((state) => state.personalizeCertificate);
  const markMinted = useGameStore((state) => state.markCertificateMinted);

  const [name, setName] = useState(certificate?.recipientName ?? "");
  const [email, setEmail] = useState(certificate?.recipientEmail ?? "");
  const [minting, setMinting] = useState(false);
  const [showEdit, setShowEdit] = useState(!certificate?.isMinted);
  const [busyPng, setBusyPng] = useState(false);
  const [busyPdf, setBusyPdf] = useState(false);
  const [copying, setCopying] = useState(false);
  const [copyingUrl, setCopyingUrl] = useState(false);
  const [error, setError] = useState("");
  const [status, setStatus] = useState("");
  const [feedbackFor, setFeedbackFor] = useState<"mint" | "export" | "share">("mint");
  const [nameFocused, setNameFocused] = useState(false);
  const [emailFocused, setEmailFocused] = useState(false);
  const svg = useRef<Svg>(null);

  if (!certificate)
    return (
      <Screen>
        <TopBar back title="Your certificate" />
        <View style={styles.card}>
          <Text style={styles.title}>An achievement to work toward.</Text>
          <Text style={styles.body}>
            Complete every scenario in Startup CTO without ending the run to unlock your free certificate.
          </Text>
          <Button onPress={() => router.replace("/levels")}>Continue your campaign</Button>
        </View>
      </Screen>
    );

  const recipientName = normalizeCertificateName(name);
  const validName = recipientName.length > 0 && recipientName.length <= CERTIFICATE_NAME_LIMIT;
  const cleanEmail = normalizeCertificateEmail(email);
  const validEmail = isValidCertificateEmail(cleanEmail);

  const preview = {
    ...certificate,
    recipientName,
    recipientEmail: cleanEmail || certificate.recipientEmail,
    isMinted: Boolean(certificate.isMinted),
  };

  const siteUrl = getCertificateSiteUrl();
  const xml = certificateArtwork(preview, siteUrl);
  const caption = certificateCaption(certificate, siteUrl);
  const verificationUrl = getCertificateVerificationUrl(preview, siteUrl);

  const handleMint = async () => {
    if (!validName) {
      setError("Please enter your name as you want it on your certificate.");
      setFeedbackFor("mint");
      return;
    }
    if (!validEmail) {
      setError("Please enter a valid email address before minting your certificate.");
      setFeedbackFor("mint");
      return;
    }

    setMinting(true);
    setError("");
    setStatus("");
    setFeedbackFor("mint");

    try {
      if (!personalize(certificate.campaignId, recipientName, cleanEmail)) {
        throw new Error("Unable to save name and email. Please check your input.");
      }

      const result = await mintCertificateOnServer({
        ...preview,
        recipientName,
        recipientEmail: cleanEmail,
      });

      if (!result.success) {
        throw new Error(result.error || "Failed to mint certificate to the ScaleLog registry.");
      }

      markMinted(certificate.campaignId, result.mintedAt);
      setShowEdit(false);
      setStatus("✓ Certificate minted! Your unique credential ID is recorded and verifiable.");
    } catch (err: any) {
      setError(err?.message || "Minting failed. Please try again.");
    } finally {
      setMinting(false);
    }
  };

  const download = async (format: "png" | "pdf" = "png") => {
    if (busyPng || busyPdf || !validName) return;
    if (format === "pdf") setBusyPdf(true);
    else setBusyPng(true);
    setError("");
    setStatus("");
    setFeedbackFor("export");
    try {
      personalize(certificate.campaignId, recipientName, cleanEmail || certificate.recipientEmail);
      await exportCertificate(xml, certificate.id, svg.current, format);
      const formatLabel = format.toUpperCase();
      setStatus(
        Platform.OS === "web"
          ? `${formatLabel} download started. Attach it to your LinkedIn post or profile.`
          : `Attach your saved certificate ${formatLabel} to your LinkedIn post.`
      );
    } catch (reason) {
      setError(
        reason instanceof Error ? reason.message : "The certificate could not be exported. Please try again."
      );
    } finally {
      if (format === "pdf") setBusyPdf(false);
      else setBusyPng(false);
    }
  };

  const copyCaption = async () => {
    setCopying(true);
    setError("");
    setStatus("");
    setFeedbackFor("share");
    try {
      if (!(await Clipboard.setStringAsync(caption))) throw new Error("Copy is unavailable.");
      setStatus("Caption copied. Paste it into your LinkedIn post and attach your certificate.");
    } catch {
      setError("Copy is unavailable. Select the caption below and copy it manually.");
    } finally {
      setCopying(false);
    }
  };

  const copyVerificationUrl = async () => {
    if (!verificationUrl) return;
    setCopyingUrl(true);
    setError("");
    setStatus("");
    setFeedbackFor("share");
    try {
      if (!(await Clipboard.setStringAsync(verificationUrl))) throw new Error("Copy is unavailable.");
      setStatus("Credential verification URL copied to clipboard.");
    } catch {
      setError("Copy is unavailable. Please copy the URL manually.");
    } finally {
      setCopyingUrl(false);
    }
  };

  const shareOnLinkedIn = () => {
    setError("");
    setStatus("");
    setFeedbackFor("share");
    const shareTarget = verificationUrl ?? siteUrl ?? "https://scalelog-fawn.vercel.app";
    const linkedInShareUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareTarget)}`;
    void Linking.openURL(linkedInShareUrl).catch(() =>
      setError("LinkedIn could not be opened. Open the LinkedIn app or website to create your post.")
    );
  };

  return (
    <Screen contentStyle={styles.screen}>
      <TopBar back eyebrow="YOUR FIRST CAMPAIGN" title="You earned this." />
      <Text style={styles.intro}>
        A milestone with your name on it. Your Startup CTO certificate is free to keep, export, and share.
      </Text>

      {/* Vector Certificate Master Preview */}
      <View
        style={styles.preview}
        accessible
        accessibilityRole="image"
        accessibilityLabel={`Certificate of Achievement for ${
          recipientName || "your name"
        }. ${certificate.campaignTitle}, ${certificate.levelCount} scenarios completed. Issued by ScaleLog on ${certificateDate(
          certificate
        )}. Certificate ${certificate.id}.`}
      >
        <SvgXml xml={xml} override={{ width: "100%", height: "100%", ref: svg }} />
      </View>

      {/* Minting / Personalization Card */}
      <View style={styles.card}>
        <View style={styles.mintHeader}>
          <Text style={styles.sectionTitle}>
            {certificate.isMinted ? "Verified Milestone" : "Mint your certificate"}
          </Text>
          {certificate.isMinted ? (
            <View style={styles.badgeMinted}>
              <Text style={styles.badgeMintedText}>✓ REGISTRY MINTED</Text>
            </View>
          ) : (
            <View style={styles.badgeDraft}>
              <Text style={styles.badgeDraftText}>PENDING MINT</Text>
            </View>
          )}
        </View>

        {certificate.isMinted && !showEdit ? (
          <View style={styles.mintedSummary}>
            <View style={styles.metaRow}>
              <Text style={styles.metaLabel}>Credential ID</Text>
              <Text style={styles.metaValue}>{certificate.id}</Text>
            </View>
            <View style={styles.metaRow}>
              <Text style={styles.metaLabel}>Recipient</Text>
              <Text style={styles.metaValue}>{certificate.recipientName}</Text>
            </View>
            {certificate.recipientEmail ? (
              <View style={styles.metaRow}>
                <Text style={styles.metaLabel}>Linked Email</Text>
                <Text style={styles.metaValue}>{maskEmail(certificate.recipientEmail)}</Text>
              </View>
            ) : null}
            <View style={styles.metaRow}>
              <Text style={styles.metaLabel}>QR Code Verification</Text>
              <Text style={styles.metaValueMint}>Active & Verifiable</Text>
            </View>
            <Button variant="secondary" onPress={() => setShowEdit(true)}>
              Update name or email
            </Button>
          </View>
        ) : (
          <View style={styles.form}>
            <Text style={styles.body}>
              Before minting, link your email and update your name. This records your milestone in the ScaleLog registry,
              generating a unique verifiable QR code.
            </Text>

            <Text nativeID="certificate-name-label" style={styles.label}>
              Name on certificate
            </Text>
            <TextInput
              value={name}
              onChangeText={(value) => {
                setName(value);
                setError("");
                setStatus("");
              }}
              accessibilityLabel="Name on certificate"
              accessibilityHint="Enter your name as you want it to appear on the certificate."
              placeholder="Your full name"
              placeholderTextColor={colors.muted}
              maxLength={CERTIFICATE_NAME_LIMIT}
              editable={!minting && !busyPng && !busyPdf}
              autoCapitalize="words"
              autoCorrect={false}
              onFocus={() => setNameFocused(true)}
              onBlur={() => setNameFocused(false)}
              style={[styles.input, nameFocused && styles.inputFocused]}
            />

            <Text nativeID="certificate-email-label" style={styles.label}>
              Link your email
            </Text>
            <TextInput
              value={email}
              onChangeText={(value) => {
                setEmail(value);
                setError("");
                setStatus("");
              }}
              accessibilityLabel="Link your email"
              accessibilityHint="Enter your email to link with your certificate."
              placeholder="you@example.com"
              placeholderTextColor={colors.muted}
              maxLength={120}
              editable={!minting && !busyPng && !busyPdf}
              autoCapitalize="none"
              keyboardType="email-address"
              autoCorrect={false}
              onFocus={() => setEmailFocused(true)}
              onBlur={() => setEmailFocused(false)}
              style={[styles.input, emailFocused && styles.inputFocused]}
            />
            <Text style={styles.hint}>
              Your email is used to verify ownership and will not be displayed on the public certificate artwork.
            </Text>

            <Button
              loading={minting}
              disabled={!validName || !validEmail}
              onPress={() => void handleMint()}
            >
              {certificate.isMinted ? "Save & Re-mint Certificate" : "Mint Certificate & Enable QR Verification"}
            </Button>

            {certificate.isMinted ? (
              <Button variant="secondary" onPress={() => setShowEdit(false)}>
                Cancel editing
              </Button>
            ) : null}
          </View>
        )}

        {feedbackFor === "mint" && error ? (
          <Text accessibilityRole="alert" style={styles.error}>
            {error}
          </Text>
        ) : null}
        {feedbackFor === "mint" && status ? (
          <Text accessibilityLiveRegion="polite" style={styles.status}>
            {status}
          </Text>
        ) : null}
      </View>

      {/* Export Card */}
      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Export certificate</Text>
        <Text style={styles.body}>Download high-resolution vector exports to keep or print.</Text>
        <View style={styles.actions}>
          <Button
            loading={busyPng}
            disabled={!validName || busyPdf || minting}
            style={styles.action}
            onPress={() => void download("png")}
          >
            {Platform.OS === "web" ? "Download certificate · PNG" : "Save or share certificate · PNG"}
          </Button>
          <Button
            variant="secondary"
            loading={busyPdf}
            disabled={!validName || busyPng || minting}
            style={styles.action}
            onPress={() => void download("pdf")}
          >
            {Platform.OS === "web" ? "Download certificate · PDF" : "Save or share certificate · PDF"}
          </Button>
        </View>
        {feedbackFor === "export" && error ? (
          <Text accessibilityRole="alert" style={styles.error}>
            {error}
          </Text>
        ) : null}
        {feedbackFor === "export" && status ? (
          <Text accessibilityLiveRegion="polite" style={styles.status}>
            {status}
          </Text>
        ) : null}
        <Text style={styles.hint}>Landscape A4 · High-resolution vector export · Free, always</Text>
      </View>

      {/* Share on LinkedIn Card */}
      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Share your milestone on LinkedIn</Text>
        <Text style={styles.body}>
          1. Save your certificate (PNG or PDF).{"\n"}
          2. Copy the verified credential URL or suggested caption below.{"\n"}
          3. Share directly to LinkedIn.
        </Text>
        <Text selectable style={styles.caption}>
          {caption}
        </Text>
        <View style={styles.actions}>
          <Button variant="secondary" loading={copying} style={styles.action} onPress={() => void copyCaption()}>
            Copy LinkedIn caption
          </Button>
          {verificationUrl ? (
            <Button
              variant="secondary"
              loading={copyingUrl}
              style={styles.action}
              onPress={() => void copyVerificationUrl()}
            >
              Copy credential verification URL
            </Button>
          ) : null}
          <Button
            variant="secondary"
            style={styles.action}
            onPress={() => shareOnLinkedIn()}
          >
            Share directly on LinkedIn
          </Button>
        </View>
        {feedbackFor === "share" && error ? (
          <Text accessibilityRole="alert" style={styles.error}>
            {error}
          </Text>
        ) : null}
        {feedbackFor === "share" && status ? (
          <Text accessibilityLiveRegion="polite" style={styles.status}>
            {status}
          </Text>
        ) : null}
        <Text style={styles.hint}>Make the caption your own before posting.</Text>
      </View>

      <Text style={styles.footnote}>
        Issued by ScaleLog for completing an interactive learning campaign. This certificate recognizes completion and is
        not a professional accreditation. It is saved on this device with your progress.
      </Text>
    </Screen>
  );
}

const styles = StyleSheet.create({
  screen: { maxWidth: 1000, paddingBottom: 48 },
  intro: { color: colors.text, fontSize: 16, lineHeight: 25, marginBottom: 24, maxWidth: 660 },
  preview: {
    width: "100%",
    aspectRatio: 1200 / 848,
    borderRadius: 8,
    overflow: "hidden",
    backgroundColor: "#F8F5EE",
    marginBottom: 8,
  },
  card: {
    marginTop: 16,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.md,
    padding: 20,
    gap: 14,
    backgroundColor: colors.panelSoft,
  },
  mintHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    flexWrap: "wrap",
    gap: 8,
  },
  badgeMinted: {
    backgroundColor: "rgba(140, 244, 210, 0.15)",
    borderWidth: 1,
    borderColor: colors.mint,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: radii.sm,
  },
  badgeMintedText: {
    color: colors.mint,
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 0.5,
  },
  badgeDraft: {
    backgroundColor: "rgba(255, 193, 7, 0.15)",
    borderWidth: 1,
    borderColor: colors.yellow,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: radii.sm,
  },
  badgeDraftText: {
    color: colors.yellow,
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 0.5,
  },
  mintedSummary: {
    gap: 10,
  },
  metaRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255, 255, 255, 0.06)",
  },
  metaLabel: {
    color: colors.muted,
    fontSize: 13,
    fontWeight: "500",
  },
  metaValue: {
    color: colors.white,
    fontSize: 13,
    fontWeight: "600",
  },
  metaValueMint: {
    color: colors.mint,
    fontSize: 13,
    fontWeight: "600",
  },
  form: {
    gap: 12,
  },
  title: { color: colors.white, fontSize: 26, lineHeight: 33, fontWeight: "700" },
  sectionTitle: { color: colors.white, fontSize: 20, lineHeight: 28, fontWeight: "700" },
  label: { color: colors.text, fontSize: 14, fontWeight: "600" },
  input: {
    minHeight: 52,
    paddingHorizontal: 14,
    paddingVertical: 12,
    backgroundColor: colors.ink,
    borderColor: colors.border,
    borderWidth: 2,
    borderRadius: radii.sm,
    color: colors.white,
    fontSize: 17,
  },
  inputFocused: { borderColor: colors.blue },
  body: { color: colors.text, fontSize: 15, lineHeight: 26 },
  hint: { color: colors.text, fontSize: 12, lineHeight: 18 },
  caption: {
    color: colors.text,
    fontSize: 14,
    lineHeight: 23,
    backgroundColor: colors.ink,
    padding: 16,
    borderRadius: radii.sm,
  },
  actions: { flexDirection: "row", flexWrap: "wrap", gap: 12 },
  action: { flexGrow: 1, flexBasis: 200 },
  error: { color: colors.red, fontSize: 14, lineHeight: 22, marginTop: 4 },
  status: { color: colors.mint, fontSize: 14, lineHeight: 22, marginTop: 4 },
  footnote: { color: colors.text, fontSize: 12, lineHeight: 19, marginTop: 24 },
});
