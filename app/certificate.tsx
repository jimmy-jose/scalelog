import { CampaignScore } from "@/ui/components/CampaignScore";
import { formatCampaignScore, isValidCampaignScore } from "@/domain/campaignScore";
import { useRef, useState } from "react";
import { Platform, StyleSheet, Text, TextInput, View } from "react-native";
import Svg, { SvgXml } from "react-native-svg";
import * as Clipboard from "expo-clipboard";
import { router } from "expo-router";
import { useGameStore } from "@/store/gameStore";
import {
  CERTIFICATE_CAMPAIGN_ID,
  CERTIFICATE_NAME_LIMIT,
  certificateDate,
  getCertificateVerificationUrl,
  isValidCertificateEmail,
  maskEmail,
  normalizeCertificateEmail,
  normalizeCertificateName,
} from "@/domain/certificates";
import { certificateArtwork } from "@/lib/certificateArtwork";
import { exportCertificate, getCertificateSiteUrl } from "@/lib/certificateExport";
import { certificateShareMessage, shareCertificateMessage, shareCertificateOnLinkedIn } from "@/lib/certificateSharing";
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
  const [sharing, setSharing] = useState(false);
  const [sharingLinkedIn, setSharingLinkedIn] = useState(false);
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
  const caption = certificateShareMessage(certificate, siteUrl);
  const verificationUrl = getCertificateVerificationUrl(preview, siteUrl);

  const handleMint = async () => {
    if (!validName) {
      setError("Please enter your name as you want it on your certificate.");
      setFeedbackFor("mint");
      return;
    }
    if (!validEmail) {
      setError("Please enter a valid email address to save your certificate details.");
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
        throw new Error(result.error || "Could not save your certificate details. Please try again.");
      }

      markMinted(certificate.campaignId, result.mintedAt);
      setShowEdit(false);
      setStatus("Certificate details saved. Your certificate is ready to download or share.");
    } catch (err: any) {
      setError(err?.message || "Could not save your certificate details. Please try again.");
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

  const shareMessage = async () => {
    if (sharing || sharingLinkedIn) return;
    setSharing(true);
    setError("");
    setStatus("");
    setFeedbackFor("share");
    try {
      const result = await shareCertificateMessage(caption);
      if (result === "copied") setStatus("Message and links copied. Paste them into your post or message.");
      if (result === "shared") setStatus("Message passed to your sharing app. Review it before posting.");
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Sharing could not be opened. Copy the message below instead.");
    } finally {
      setSharing(false);
    }
  };

  const shareOnLinkedIn = async () => {
    if (sharing || sharingLinkedIn) return;
    setSharingLinkedIn(true);
    setError("");
    setStatus("");
    setFeedbackFor("share");
    try {
      const copied = await shareCertificateOnLinkedIn(caption, verificationUrl ?? siteUrl ?? "https://scalelog-fawn.vercel.app");
      if (copied) setStatus("Message copied. Paste it into your LinkedIn post and add your certificate image if you like.");
      else setError("LinkedIn opened, but the message could not be copied. Select and copy it below, then paste it into your post.");
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "LinkedIn could not be opened. Copy the message below instead.");
    } finally {
      setSharingLinkedIn(false);
    }
  };

  return (
    <Screen contentStyle={styles.screen}>
      <TopBar back eyebrow="CAMPAIGN COMPLETE" title="You earned this." />
      <Text style={styles.intro}>
        You completed Startup CTO. Add your name, download your certificate, and share your result.
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
        )}. Certificate ${certificate.id}.${isValidCampaignScore(certificate.score) ? ` Campaign score ${formatCampaignScore(certificate.score)}.` : ""}`}
      >
        <SvgXml xml={xml} override={{ width: "100%", height: "100%", ref: svg }} />
      </View>

      <CampaignScore score={certificate.score} label="Certificate campaign score" />

      {/* Minting / Personalization Card */}
      <View style={styles.card}>
        <View style={styles.mintHeader}>
          <Text style={styles.sectionTitle}>
            {certificate.isMinted ? "Your certificate details" : "Personalize your certificate"}
          </Text>
          {certificate.isMinted ? (
            <View style={styles.badgeMinted}>
              <Text style={styles.badgeMintedText}>DETAILS SAVED</Text>
            </View>
          ) : (
            <View style={styles.badgeDraft}>
              <Text style={styles.badgeDraftText}>ADD YOUR DETAILS</Text>
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
              <Text style={styles.metaLabel}>Verification link</Text>
              <Text style={styles.metaValueMint}>Open to check status</Text>
            </View>
            <Button variant="secondary" onPress={() => setShowEdit(true)}>
              Update name or email
            </Button>
          </View>
        ) : (
          <View style={styles.form}>
            <Text style={styles.body}>
              Add the name you want on your certificate and an email address to associate with its record.
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
              Email address
            </Text>
            <TextInput
              value={email}
              onChangeText={(value) => {
                setEmail(value);
                setError("");
                setStatus("");
              }}
              accessibilityLabel="Email address"
              accessibilityHint="Enter the email address to associate with this certificate."
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
              Your email is not shown on the certificate. The verification page displays a masked version.
            </Text>

            <Button
              loading={minting}
              disabled={!validName || !validEmail}
              onPress={() => void handleMint()}
            >
              {certificate.isMinted ? "Save changes" : "Save certificate details"}
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
        <Text style={styles.body}>Download a high-resolution PNG to share or a landscape A4 PDF to print.</Text>
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
        <Text style={styles.hint}>PNG: 2400 × 1696 pixels · PDF: landscape A4 · Free to download</Text>
      </View>

      {/* Share on LinkedIn Card */}
      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Share your achievement</Text>
        <Text style={styles.body}>
          Share your result with the short message below. It includes a link to try ScaleLog.
          You can also download your certificate above and attach it to your post.
        </Text>
        <Text selectable style={styles.caption}>
          {caption}
        </Text>
        <View style={styles.actions}>
          <Button loading={sharing} disabled={sharingLinkedIn} style={styles.action} onPress={() => void shareMessage()}>
            Share result
          </Button>
          <Button variant="secondary" loading={copying} style={styles.action} onPress={() => void copyCaption()}>
            Copy message
          </Button>
          {verificationUrl ? (
            <Button
              variant="secondary"
              loading={copyingUrl}
              style={styles.action}
              onPress={() => void copyVerificationUrl()}
            >
              Copy verification link
            </Button>
          ) : null}
          <Button
            variant="secondary"
            style={styles.action}
            loading={sharingLinkedIn}
            disabled={sharing}
            onPress={() => void shareOnLinkedIn()}
          >
            Copy message & open LinkedIn
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
        <Text style={styles.hint}>Sharing includes this message automatically when the receiving app supports it. For LinkedIn, we copy it for you to paste. You can edit it before posting.</Text>
      </View>

      <Text style={styles.footnote}>
        Issued by ScaleLog for completing an interactive learning campaign. The score reflects in-game decisions; this is
        not a professional accreditation. A local copy is saved with your progress.
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
