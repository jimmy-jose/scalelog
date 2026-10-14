import { useEffect, useRef, useState } from "react";
import { Platform, StyleSheet, Text, TextInput, View } from "react-native";
import { useLocalSearchParams, router } from "expo-router";
import Svg, { SvgXml } from "react-native-svg";
import {
  CERTIFICATE_CAMPAIGN_ID,
  certificateDate,
  verifyCredentialSignature,
  type CampaignCertificate,
} from "@/domain/certificates";
import { isValidCertificateId } from "@/domain/certificateStore";
import { certificateArtwork } from "@/lib/certificateArtwork";
import { exportCertificate, getCertificateSiteUrl } from "@/lib/certificateExport";
import { fetchVerifiedCertificate } from "@/lib/certificateRegistry";
import { Screen } from "@/ui/components/Screen";
import { TopBar } from "@/ui/components/TopBar";
import { Button } from "@/ui/components/Button";
import { colors, radii } from "@/ui/theme";

export default function VerifyScreen() {
  const params = useLocalSearchParams<{
    id?: string;
    name?: string;
    campaign?: string;
    levels?: string;
    issued?: string;
    sig?: string;
  }>();

  const initialId = typeof params.id === "string" ? params.id.trim() : "";
  const paramName = typeof params.name === "string" ? params.name : "";
  const paramCampaign = typeof params.campaign === "string" ? params.campaign : CERTIFICATE_CAMPAIGN_ID;
  const paramLevels = Number(params.levels) || 36;
  const paramIssued = typeof params.issued === "string" ? params.issued : "";
  const paramSig = typeof params.sig === "string" ? params.sig : "";

  const [searchId, setSearchId] = useState(initialId);
  const [activeId, setActiveId] = useState(initialId);
  const [loading, setLoading] = useState(Boolean(initialId));
  const [verifiedData, setVerifiedData] = useState<{
    id: string;
    recipientName: string;
    campaignTitle: string;
    levelCount: number;
    issuedAt: string;
    mintedAt?: string;
    maskedEmail?: string;
  } | null>(null);

  const [busyPng, setBusyPng] = useState(false);
  const [busyPdf, setBusyPdf] = useState(false);
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");
  const [searchFocused, setSearchFocused] = useState(false);
  const svg = useRef<Svg>(null);

  // Perform verification when activeId changes
  useEffect(() => {
    if (!activeId) {
      setLoading(false);
      setVerifiedData(null);
      return;
    }

    let isMounted = true;
    setLoading(true);
    setError("");

    async function checkCredential() {
      // 1. Check server registry (Vercel Blob via API)
      const res = await fetchVerifiedCertificate(activeId);

      if (!isMounted) return;

      if (res.verified && res.recipientName) {
        setVerifiedData({
          id: res.id || activeId,
          recipientName: res.recipientName,
          campaignTitle: res.campaignTitle || "Startup CTO",
          levelCount: res.levelCount || 36,
          issuedAt: res.issuedAt || new Date().toISOString(),
          mintedAt: res.mintedAt,
          maskedEmail: res.maskedEmail,
        });
        setLoading(false);
        return;
      }

      // 2. Fallback to client-side cryptographic signature if legacy params were provided
      const legacyValid =
        Boolean(paramName && paramIssued && paramSig) &&
        verifyCredentialSignature(
          {
            id: activeId,
            campaignId: paramCampaign,
            recipientName: paramName,
            levelCount: paramLevels,
            issuedAt: paramIssued,
          },
          paramSig
        );

      if (legacyValid) {
        setVerifiedData({
          id: activeId,
          recipientName: paramName,
          campaignTitle: "Startup CTO",
          levelCount: paramLevels,
          issuedAt: paramIssued,
          mintedAt: undefined,
          maskedEmail: undefined,
        });
        setLoading(false);
        return;
      }

      setVerifiedData(null);
      setError(res.error || `Credential "${activeId}" could not be verified in the ScaleLog registry.`);
      setLoading(false);
    }

    void checkCredential();

    return () => {
      isMounted = false;
    };
  }, [activeId, paramName, paramCampaign, paramLevels, paramIssued, paramSig]);

  const certificate: CampaignCertificate = {
    id: verifiedData?.id || activeId || "SL-SCTO-UNKNOWN",
    campaignId: CERTIFICATE_CAMPAIGN_ID,
    campaignTitle: verifiedData?.campaignTitle || "Startup CTO",
    recipientName: verifiedData?.recipientName || "Verified Recipient",
    levelCount: verifiedData?.levelCount || 36,
    issuedAt: verifiedData?.issuedAt || new Date().toISOString(),
    mintedAt: verifiedData?.mintedAt,
    isMinted: true,
  };

  const siteUrl = getCertificateSiteUrl();
  const xml = certificateArtwork(certificate, siteUrl);

  // Update web document title
  useEffect(() => {
    if (Platform.OS === "web" && typeof document !== "undefined") {
      if (verifiedData) {
        document.title = `Verified Credential: ${verifiedData.recipientName} — ScaleLog`;
        const metaDesc = document.querySelector('meta[name="description"]');
        if (metaDesc) {
          metaDesc.setAttribute(
            "content",
            `${verifiedData.recipientName} completed ${verifiedData.levelCount} system design scenarios in ScaleLog's Startup CTO campaign. Verified architectural credential.`
          );
        }
      } else {
        document.title = "Verify Credential — ScaleLog";
      }
    }
  }, [verifiedData]);

  const handleManualSearch = () => {
    const clean = searchId.trim();
    if (!clean) {
      setError("Please enter a credential ID to verify.");
      return;
    }
    setActiveId(clean);
  };

  const download = async (format: "png" | "pdf") => {
    if (busyPng || busyPdf) return;
    if (format === "pdf") setBusyPdf(true);
    else setBusyPng(true);
    setError("");
    setStatus("");
    try {
      await exportCertificate(xml, certificate.id, svg.current, format);
      setStatus(
        Platform.OS === "web"
          ? `${format.toUpperCase()} downloaded.`
          : `Saved ${format.toUpperCase()}.`
      );
    } catch (reason) {
      setError(
        reason instanceof Error ? reason.message : "The certificate could not be exported."
      );
    } finally {
      if (format === "pdf") setBusyPdf(false);
      else setBusyPng(false);
    }
  };

  return (
    <Screen contentStyle={styles.screen}>
      <TopBar back eyebrow="CREDENTIAL VERIFICATION" title="Authentic Milestone" />

      {/* Manual Search Card if not loading and not verified */}
      {(!verifiedData || !activeId) && !loading ? (
        <View style={styles.card}>
          <View style={styles.badgeNeutral}>
            <Text style={styles.badgeTextNeutral}>SCALELOG REGISTRY VERIFICATION</Text>
          </View>
          <Text style={styles.title}>Verify a ScaleLog Credential</Text>
          <Text style={styles.body}>
            Enter the unique credential ID found on any ScaleLog Certificate of Achievement or scan its QR code to
            verify authenticity against the official registry.
          </Text>

          <TextInput
            value={searchId}
            onChangeText={(text) => {
              setSearchId(text);
              setError("");
            }}
            placeholder="e.g. SL-SCTO-20261014-ABC12345"
            placeholderTextColor={colors.muted}
            autoCapitalize="characters"
            autoCorrect={false}
            onFocus={() => setSearchFocused(true)}
            onBlur={() => setSearchFocused(false)}
            style={[styles.input, searchFocused && styles.inputFocused]}
          />

          <Button onPress={handleManualSearch}>Verify Credential ID</Button>

          {error ? <Text style={styles.error}>{error}</Text> : null}
          <Button variant="secondary" onPress={() => router.replace("/")}>
            Learn system design with ScaleLog
          </Button>
        </View>
      ) : null}

      {/* Loading State */}
      {loading ? (
        <View style={styles.card}>
          <Text style={styles.title}>Verifying with ScaleLog Registry...</Text>
          <Text style={styles.body}>
            Checking unique credential ID <Text style={styles.highlight}>{activeId}</Text> against the official
            registry.
          </Text>
        </View>
      ) : null}

      {/* Verified Credential Details */}
      {verifiedData && !loading ? (
        <>
          <View style={styles.badgeValid}>
            <Text style={styles.badgeTextValid}>✓ VERIFIED SCALELOG CREDENTIAL</Text>
          </View>

          <Text style={styles.intro}>
            This credential certifies that <Text style={styles.highlight}>{verifiedData.recipientName}</Text> has
            successfully completed the ScaleLog campaign{" "}
            <Text style={styles.highlight}>Startup CTO: From Garage to Growth</Text>, completing all{" "}
            {verifiedData.levelCount} interactive system architecture scenarios.
          </Text>

          {/* Certificate Artwork Vector Preview */}
          <View
            style={styles.preview}
            accessible
            accessibilityRole="image"
            accessibilityLabel={`Certificate of Achievement for ${verifiedData.recipientName}. 36 scenarios completed. Issued on ${certificateDate(
              certificate
            )}.`}
          >
            <SvgXml xml={xml} override={{ width: "100%", height: "100%", ref: svg }} />
          </View>

          {/* Credential Details Card */}
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Verification Metadata</Text>
            <View style={styles.metaRow}>
              <Text style={styles.metaLabel}>Recipient</Text>
              <Text style={styles.metaValue}>{verifiedData.recipientName}</Text>
            </View>
            {verifiedData.maskedEmail ? (
              <View style={styles.metaRow}>
                <Text style={styles.metaLabel}>Linked Email</Text>
                <Text style={styles.metaValue}>{verifiedData.maskedEmail}</Text>
              </View>
            ) : null}
            <View style={styles.metaRow}>
              <Text style={styles.metaLabel}>Campaign</Text>
              <Text style={styles.metaValue}>Startup CTO: From Garage to Growth</Text>
            </View>
            <View style={styles.metaRow}>
              <Text style={styles.metaLabel}>Achievement</Text>
              <Text style={styles.metaValue}>
                {verifiedData.levelCount} / {verifiedData.levelCount} Scenarios Completed (100%)
              </Text>
            </View>
            <View style={styles.metaRow}>
              <Text style={styles.metaLabel}>Issue Date</Text>
              <Text style={styles.metaValue}>{certificateDate(certificate)}</Text>
            </View>
            {verifiedData.mintedAt ? (
              <View style={styles.metaRow}>
                <Text style={styles.metaLabel}>Registry Minted</Text>
                <Text style={styles.metaValue}>{new Date(verifiedData.mintedAt).toLocaleDateString()}</Text>
              </View>
            ) : null}
            <View style={styles.metaRow}>
              <Text style={styles.metaLabel}>Credential ID</Text>
              <Text style={styles.metaValue}>{verifiedData.id}</Text>
            </View>
            <View style={styles.metaRow}>
              <Text style={styles.metaLabel}>Registry Status</Text>
              <Text style={styles.metaValueMint}>Authoritative & Verified</Text>
            </View>

            <View style={styles.actions}>
              <Button
                loading={busyPng}
                disabled={busyPdf}
                style={styles.action}
                onPress={() => void download("png")}
              >
                Download PNG
              </Button>
              <Button
                variant="secondary"
                loading={busyPdf}
                disabled={busyPng}
                style={styles.action}
                onPress={() => void download("pdf")}
              >
                Download PDF
              </Button>
            </View>
            {status ? <Text style={styles.status}>{status}</Text> : null}
            {error ? <Text style={styles.error}>{error}</Text> : null}
          </View>

          {/* Look up another credential */}
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Verify another credential</Text>
            <Button
              variant="secondary"
              onPress={() => {
                setActiveId("");
                setSearchId("");
                setVerifiedData(null);
              }}
            >
              Search different ID
            </Button>
          </View>
        </>
      ) : null}

      {/* Call to action for visitors / recruiters */}
      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Learn system design by making real decisions</Text>
        <Text style={styles.body}>
          ScaleLog is an interactive software architecture and distributed systems simulator. Master trade-offs across
          scalability, reliability, performance, and cost through real-world engineering scenarios.
        </Text>
        <Button onPress={() => router.replace("/")}>Start playing ScaleLog</Button>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  screen: { maxWidth: 1000, paddingBottom: 48 },
  intro: { color: colors.text, fontSize: 16, lineHeight: 25, marginBottom: 20, maxWidth: 700 },
  highlight: { color: colors.white, fontWeight: "700" },
  badgeValid: {
    alignSelf: "flex-start",
    backgroundColor: "rgba(140, 244, 210, 0.15)",
    borderWidth: 1,
    borderColor: colors.mint,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: radii.sm,
    marginBottom: 16,
  },
  badgeTextValid: { color: colors.mint, fontSize: 13, fontWeight: "700", letterSpacing: 0.5 },
  badgeNeutral: {
    alignSelf: "flex-start",
    backgroundColor: "rgba(255, 255, 255, 0.08)",
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: radii.sm,
    marginBottom: 8,
  },
  badgeTextNeutral: { color: colors.text, fontSize: 12, fontWeight: "700", letterSpacing: 0.5 },
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
  title: { color: colors.white, fontSize: 24, lineHeight: 32, fontWeight: "700" },
  sectionTitle: { color: colors.white, fontSize: 18, lineHeight: 26, fontWeight: "700" },
  body: { color: colors.text, fontSize: 15, lineHeight: 25 },
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
  metaRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.06)",
  },
  metaLabel: { color: colors.muted, fontSize: 14, fontWeight: "500" },
  metaValue: { color: colors.white, fontSize: 14, fontWeight: "600", textAlign: "right" },
  metaValueMint: { color: colors.mint, fontSize: 14, fontWeight: "600", textAlign: "right" },
  actions: { flexDirection: "row", flexWrap: "wrap", gap: 12, marginTop: 8 },
  action: { flexGrow: 1, flexBasis: 180 },
  error: { color: colors.red, fontSize: 14 },
  status: { color: colors.mint, fontSize: 14 },
});
