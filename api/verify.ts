import { get } from "@vercel/blob";
import {
  buildPublicVerificationResponse,
  isValidCertificateId,
  type StoredCertificateRecord,
} from "../src/domain/certificateStore";

export const config = {
  runtime: "nodejs",
};

export default async function handler(req: any, res?: any) {
  const isWebStandard = req instanceof Request || (req && typeof req.json === "function" && !res);

  const getMethod = () => (isWebStandard ? req.method : req.method || "GET");

  if (getMethod() !== "GET") {
    const errorBody = { error: "Method not allowed. Use GET to verify certificates." };
    if (isWebStandard) {
      return new Response(JSON.stringify(errorBody), {
        status: 405,
        headers: { "Content-Type": "application/json", Allow: "GET" },
      });
    }
    return res.status(405).setHeader("Allow", "GET").json(errorBody);
  }

  let id: string | null = null;
  if (isWebStandard) {
    const url = new URL(req.url);
    id = url.searchParams.get("id");
  } else {
    id = typeof req.query?.id === "string" ? req.query.id : null;
  }

  if (!id || !isValidCertificateId(id)) {
    const errorBody = {
      error: "A valid certificate ID is required (e.g. SL-SCTO-YYYYMMDD-XXXXXXXX).",
      verified: false,
    };
    if (isWebStandard) {
      return new Response(JSON.stringify(errorBody), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }
    return res.status(400).json(errorBody);
  }

  const cleanId = id.trim();

  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    const errorBody = {
      error: "Vercel Blob store token is not configured on this environment.",
      verified: false,
      isConfigured: false,
    };
    if (isWebStandard) {
      return new Response(JSON.stringify(errorBody), {
        status: 503,
        headers: { "Content-Type": "application/json" },
      });
    }
    return res.status(503).json(errorBody);
  }

  try {
    const blobKey = `certificates/${cleanId}.json`;
    const result = await get(blobKey, { access: "public" });

    if (!result || !result.stream) {
      const notFoundBody = {
        error: `Credential "${cleanId}" was not found in the ScaleLog registry.`,
        verified: false,
      };
      if (isWebStandard) {
        return new Response(JSON.stringify(notFoundBody), {
          status: 404,
          headers: {
            "Content-Type": "application/json",
            "Cache-Control": "public, s-maxage=60, stale-while-revalidate=30",
          },
        });
      }
      return res
        .status(404)
        .setHeader("Cache-Control", "public, s-maxage=60, stale-while-revalidate=30")
        .json(notFoundBody);
    }

    const text = await new Response(result.stream).text();
    const record = JSON.parse(text) as StoredCertificateRecord;
    const publicResponse = buildPublicVerificationResponse(record);

    if (isWebStandard) {
      return new Response(JSON.stringify(publicResponse), {
        status: 200,
        headers: {
          "Content-Type": "application/json",
          "Cache-Control": "public, s-maxage=86400, stale-while-revalidate=3600",
        },
      });
    }
    return res
      .status(200)
      .setHeader("Cache-Control", "public, s-maxage=86400, stale-while-revalidate=3600")
      .json(publicResponse);
  } catch (err: any) {
    const errorBody = {
      error: err?.message || "Failed to retrieve certificate from Vercel Blob.",
      verified: false,
    };
    if (isWebStandard) {
      return new Response(JSON.stringify(errorBody), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }
    return res.status(500).json(errorBody);
  }
}
