import type { APIRoute } from "astro";
import crypto from "node:crypto";
import { markListsStale, markPostAndListsStale } from "../../lib/notion/service";

export const prerender = false;

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
  console.log("RAW BODY:", rawBody);

  let payload: any = null;
  try {
    payload = JSON.parse(rawBody);
  } catch {}

  if (payload?.verification_token) {
    console.log("NOTION VERIFICATION TOKEN:", payload.verification_token);

    return new Response("verification-token-received", {
      status: 200,
      headers: { "content-type": "text/plain; charset=utf-8" },
    });
  }

  return new Response("ok", {
    status: 200,
    headers: { "content-type": "text/plain; charset=utf-8" },
  });
};