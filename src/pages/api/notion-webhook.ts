import type { APIRoute } from "astro";
import crypto from "node:crypto";
import { markListsStale, markPostAndListsStale } from "../../lib/notion/service";

const NOTION_WEBHOOK_SECRET = import.meta.env.NOTION_WEBHOOK_SECRET;

function verifySignature(rawBody: string, signature: string | null) {
  if (!NOTION_WEBHOOK_SECRET) return true;
  if (!signature) return false;

  const expected = `sha256=${crypto
    .createHmac("sha256", NOTION_WEBHOOK_SECRET)
    .update(rawBody)
    .digest("hex")}`;

  const left = Buffer.from(expected);
  const right = Buffer.from(signature);

  if (left.length !== right.length) return false;

  return crypto.timingSafeEqual(left, right);
}

function getChangedPageId(payload: any) {
  return payload?.entity?.id ?? payload?.data?.id ?? payload?.page?.id ?? null;
}

// temporário
export const GET: APIRoute = async () => {
  return new Response(
    JSON.stringify({ ok: true, route: "notion-webhook" }),
    {
      status: 200,
      headers: { "content-type": "application/json" },
    }
  );
};

export const POST: APIRoute = async ({ request }) => {
  const rawBody = await request.text();

  let payload: any;

  try {
    payload = JSON.parse(rawBody);
  } catch {
    return new Response(JSON.stringify({ ok: false, error: "invalid_json" }), {
      status: 400,
      headers: { "content-type": "application/json" },
    });
  }

  // Etapa inicial do webhook do Notion:
  // o Notion envia um POST com verification_token para você copiar e colar no painel.
  if (payload?.verification_token) {
    console.log("NOTION VERIFICATION TOKEN:", payload.verification_token);

    return new Response(
      JSON.stringify({
        ok: true,
        receivedVerificationToken: true,
        verification_token: payload.verification_token,
      }),
      {
        status: 200,
        headers: { "content-type": "application/json" },
      }
    );
  }

  const signature = request.headers.get("x-notion-signature");

  if (!verifySignature(rawBody, signature)) {
    return new Response(JSON.stringify({ ok: false, error: "invalid_signature" }), {
      status: 401,
      headers: { "content-type": "application/json" },
    });
  }

  const eventType = payload?.type ?? "unknown";
  const pageId = getChangedPageId(payload);

  if (
    eventType === "page.created" ||
    eventType === "page.properties_updated" ||
    eventType === "page.content_updated"
  ) {
    if (pageId) {
      await markPostAndListsStale(pageId);
    } else {
      markListsStale();
    }
  }

  if (eventType === "data_source.content_updated") {
    markListsStale();
  }

  return new Response(JSON.stringify({ ok: true, eventType, pageId }), {
    status: 200,
    headers: { "content-type": "application/json" },
  });
};
