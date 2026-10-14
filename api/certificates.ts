import { put } from "@vercel/blob";
import { validateMintPayload } from "../src/domain/certificateStore";

export const config = {
  runtime: "nodejs",
};

export default async function handler(req: any, res?: any) {
  // Check if Web standard Request or Node.js req/res
  const isWebStandard = req instanceof Request || (req && typeof req.json === "function" && !res);

  const getMethod = () => (isWebStandard ? req.method : req.method || "GET");

  if (getMethod() !== "POST") {
    const errorBody = { error: "Method not allowed. Use POST to mint certificates." };
    if (isWebStandard) {
      return new Response(JSON.stringify(errorBody), {
        status: 405,
        headers: { "Content-Type": "application/json", Allow: "POST" },
      });
    }
    return res.status(405).setHeader("Allow", "POST").json(errorBody);
  }

  let body: any;
  try {
    if (isWebStandard) {
      body = await req.json();
    } else {
      body = typeof req.body === "string" ? JSON.parse(req.body) : req.body;
    }
  } catch {
    const errorBody = { error: "Malformed JSON payload." };
    if (isWebStandard) {
      return new Response(JSON.stringify(errorBody), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }
    return res.status(400).json(errorBody);
  }

  const validation = validateMintPayload(body);
  if (validation.error || !validation.record) {
    const errorBody = { error: validation.error || "Validation failed." };
    if (isWebStandard) {
      return new Response(JSON.stringify(errorBody), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }
    return res.status(400).json(errorBody);
  }

  const { record } = validation;

  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    const errorBody = {
      error: "Vercel Blob store token is not configured on this environment.",
      isConfigured: false,
      record,
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
    const blobKey = `certificates/${record.id}.json`;
    const blob = await put(blobKey, JSON.stringify(record, null, 2), {
      access: "public",
      addRandomSuffix: false,
      allowOverwrite: true,
      contentType: "application/json",
    });

    const responseData = {
      success: true,
      id: record.id,
      mintedAt: record.mintedAt,
      url: blob.url,
      verificationUrl: `/verify?id=${encodeURIComponent(record.id)}`,
    };

    if (isWebStandard) {
      return new Response(JSON.stringify(responseData), {
        status: 200,
        headers: {
          "Content-Type": "application/json",
          "Cache-Control": "no-store",
        },
      });
    }
    return res.status(200).setHeader("Cache-Control", "no-store").json(responseData);
  } catch (err: any) {
    const errorBody = {
      error: err?.message || "Failed to store certificate in Vercel Blob.",
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
