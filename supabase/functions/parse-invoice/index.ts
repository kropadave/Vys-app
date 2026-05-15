/**
 * parse-invoice — Supabase Edge Function
 *
 * Flow:
 *   faktury@teamvys.cz (Gmail) → forward → Postmark inbound → POST here → Claude → Supabase
 *
 * Required environment variables (set in Supabase Dashboard → Edge Functions → Secrets):
 *   SUPABASE_URL              — auto-injected by Supabase runtime
 *   SUPABASE_SERVICE_ROLE_KEY — auto-injected by Supabase runtime
 *   ANTHROPIC_API_KEY         — your key from console.anthropic.com
 *   POSTMARK_INBOUND_TOKEN    — optional but recommended: the secret token from
 *                               Postmark → Inbound → Webhook Token (prevents spam)
 */

import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const ANTHROPIC_KEY = Deno.env.get("ANTHROPIC_API_KEY") ?? "";
const POSTMARK_TOKEN = Deno.env.get("POSTMARK_INBOUND_TOKEN") ?? "";

serve(async (req) => {
  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }

  // Verify Postmark webhook token if configured
  if (POSTMARK_TOKEN) {
    const incoming = req.headers.get("x-postmark-inbound-webhook-token") ?? "";
    if (incoming !== POSTMARK_TOKEN) {
      return new Response("Unauthorized", { status: 401 });
    }
  }

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return new Response("Invalid JSON", { status: 400 });
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

  // ── Extract Postmark fields ──────────────────────────────────────────────
  const from = String(body.From ?? body.FromFull ?? "");
  const subject = String(body.Subject ?? "");
  const textBody = String(body.TextBody ?? body.StrippedTextReply ?? "");
  type PostmarkAttachment = { Name: string; Content: string; ContentType: string };
  const attachments = (body.Attachments as PostmarkAttachment[] | undefined) ?? [];

  // ── Upload PDF attachment to Supabase Storage ────────────────────────────
  const pdfAttachment = attachments.find(
    (a) => a.ContentType === "application/pdf" || a.Name?.toLowerCase().endsWith(".pdf"),
  );

  let fileUrl: string | null = null;
  let pdfBase64: string | null = null;

  if (pdfAttachment) {
    pdfBase64 = pdfAttachment.Content;
    try {
      const pdfBytes = Uint8Array.from(atob(pdfBase64), (c) => c.charCodeAt(0));
      // sanitize filename
      const safeName = pdfAttachment.Name.replace(/[^a-zA-Z0-9._-]/g, "_");
      const fileName = `${Date.now()}_${safeName}`;

      const { data: uploadData, error: uploadError } = await supabase.storage
        .from("invoices")
        .upload(fileName, pdfBytes, { contentType: "application/pdf", upsert: false });

      if (!uploadError && uploadData) {
        // Private bucket → use signed URL valid for 10 years (~315 000 000 s)
        const { data: signedData } = await supabase.storage
          .from("invoices")
          .createSignedUrl(uploadData.path, 315_000_000);
        fileUrl = signedData?.signedUrl ?? null;
      } else if (uploadError) {
        console.error("Storage upload error:", uploadError.message);
      }
    } catch (err) {
      console.error("Failed to upload attachment:", err);
    }
  }

  // ── Call Claude to parse invoice data ────────────────────────────────────
  type ParsedInvoice = {
    dodavatel?: string;
    castka?: string;
    mena?: string;
    datum_vystaveni?: string;
    datum_splatnosti?: string;
    cislo_faktury?: string;
    popis?: string;
  };

  let parsed: ParsedInvoice = {};

  if (ANTHROPIC_KEY) {
    try {
      const systemPrompt =
        "Jsi asistent pro parsování faktur. Vždy odpověz POUZE validním JSON objektem bez dalšího textu. " +
        "Klíče: dodavatel (string), castka (string, pouze číslo bez měny), mena (string, výchozí CZK), " +
        "datum_vystaveni (string DD.MM.YYYY nebo prázdný), datum_splatnosti (string DD.MM.YYYY nebo prázdný), " +
        "cislo_faktury (string), popis (string, krátce o co jde).";

      type ContentBlock =
        | { type: "text"; text: string }
        | { type: "document"; source: { type: "base64"; media_type: string; data: string } };

      const userContent: ContentBlock[] = pdfBase64
        ? [
            {
              type: "text",
              text: `Parsuj fakturu z přiložené PDF. Od: ${from}. Předmět: ${subject}.`,
            },
            {
              type: "document",
              source: { type: "base64", media_type: "application/pdf", data: pdfBase64 },
            },
          ]
        : [
            {
              type: "text",
              text: `Parsuj fakturu z emailu.\n\nOd: ${from}\nPředmět: ${subject}\n\nObsah:\n${textBody.slice(0, 4000)}`,
            },
          ];

      const claudeRes = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "x-api-key": ANTHROPIC_KEY,
          "anthropic-version": "2023-06-01",
          "content-type": "application/json",
        },
        body: JSON.stringify({
          model: "claude-opus-4-5",
          max_tokens: 512,
          system: systemPrompt,
          messages: [{ role: "user", content: userContent }],
        }),
      });

      const claudeData = await claudeRes.json();
      const responseText: string = claudeData.content?.[0]?.text ?? "";
      const match = responseText.match(/\{[\s\S]*\}/);
      if (match) {
        parsed = JSON.parse(match[0]) as ParsedInvoice;
      }
    } catch (err) {
      console.error("Claude parsing failed:", err);
      // Fall through — save with fallback data below
    }
  }

  // ── Insert into invoices table ───────────────────────────────────────────
  const { error: insertError } = await supabase.from("invoices").insert({
    dodavatel: parsed.dodavatel ?? from,
    castka: parsed.castka ?? "",
    mena: parsed.mena ?? "CZK",
    datum_vystaveni: parsed.datum_vystaveni ?? "",
    datum_splatnosti: parsed.datum_splatnosti ?? "",
    cislo_faktury: parsed.cislo_faktury ?? "",
    popis: parsed.popis ?? subject,
    file_url: fileUrl,
    zaplaceno: false,
    odeslal: from,
  });

  if (insertError) {
    console.error("DB insert error:", insertError.message);
    return new Response(JSON.stringify({ error: insertError.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }

  console.log(`Invoice saved — from: ${from}, supplier: ${parsed.dodavatel ?? "?"}, amount: ${parsed.castka ?? "?"} ${parsed.mena ?? "CZK"}`);
  return new Response(JSON.stringify({ ok: true }), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
});
