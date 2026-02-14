import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const MAX_IMAGE_SIZE = 10_000_000; // 10MB
const VALID_HEX = /^#[0-9A-Fa-f]{3,8}$/;

// Simple in-memory rate limiter per IP
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT_WINDOW_MS = 60_000;
const RATE_LIMIT_MAX = 5;

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(ip);
  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(ip, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
    return false;
  }
  entry.count++;
  return entry.count > RATE_LIMIT_MAX;
}

/** Poll Replicate prediction until completed or failed */
async function pollPrediction(url: string, apiKey: string, maxWaitMs = 120_000): Promise<any> {
  const start = Date.now();
  while (Date.now() - start < maxWaitMs) {
    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${apiKey}` },
    });
    if (!res.ok) throw new Error(`Replicate poll error: ${res.status}`);
    const data = await res.json();
    if (data.status === "succeeded") return data;
    if (data.status === "failed" || data.status === "canceled") {
      throw new Error(`Replicate prediction ${data.status}: ${data.error || "unknown"}`);
    }
    // Wait before next poll (progressive backoff)
    await new Promise(r => setTimeout(r, Math.min(3000, 1000 + (Date.now() - start) / 10)));
  }
  throw new Error("Replicate prediction timed out");
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  // Rate limiting
  const clientIp = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  if (isRateLimited(clientIp)) {
    return new Response(
      JSON.stringify({ error: "Muitas requisições. Aguarde um momento." }),
      { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  try {
    const body = await req.json();
    const { image, elementType, color, colorName } = body;

    // Validate image
    if (!image || typeof image !== "string" || image.length > MAX_IMAGE_SIZE) {
      return new Response(
        JSON.stringify({ error: "Invalid or missing image (max 10MB)" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    if (!image.startsWith("data:image/")) {
      return new Response(
        JSON.stringify({ error: "Invalid image format" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Validate elementType
    if (!elementType || typeof elementType !== "string" || elementType.length > 100) {
      return new Response(
        JSON.stringify({ error: "Invalid element type" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Validate color (hex)
    if (!color || typeof color !== "string" || !VALID_HEX.test(color)) {
      return new Response(
        JSON.stringify({ error: "Invalid color format (expected hex like #RRGGBB)" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Sanitize inputs for prompt
    const safeElementType = elementType.slice(0, 100).replace(/[^\w\sÀ-ÿ\-]/g, "");
    const safeColorName = typeof colorName === "string"
      ? colorName.slice(0, 100).replace(/[^\w\sÀ-ÿ\-]/g, "")
      : color;

    const REPLICATE_API_KEY = Deno.env.get("REPLICATE_API_KEY");
    if (!REPLICATE_API_KEY) {
      throw new Error("REPLICATE_API_KEY is not configured");
    }

    const prompt = `A professional interior design photo. Change ONLY the ${safeElementType} to the color ${safeColorName} (hex: ${color}). Keep everything else exactly the same. No text, no labels, no watermarks. Realistic photograph, same lighting and perspective. Do not add or remove any objects.`;

    // Create prediction using Replicate API
    const createRes = await fetch("https://api.replicate.com/v1/predictions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${REPLICATE_API_KEY}`,
        "Content-Type": "application/json",
        Prefer: "wait",
      },
      body: JSON.stringify({
        model: "asiryan/flux-dev",
        input: {
          image: image,
          prompt: prompt,
          prompt_strength: 0.55,
          num_inference_steps: 28,
          guidance_scale: 3.5,
        },
      }),
    });

    if (!createRes.ok) {
      const errText = await createRes.text();
      console.error("Replicate create error:", createRes.status, errText);
      
      if (createRes.status === 422) {
        return new Response(
          JSON.stringify({ error: "Imagem inválida ou modelo indisponível. Tente novamente." }),
          { status: 422, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      throw new Error(`Replicate API error: ${createRes.status}`);
    }

    let prediction = await createRes.json();

    // If not already completed (Prefer: wait may return completed), poll
    if (prediction.status !== "succeeded") {
      const pollUrl = prediction.urls?.get;
      if (!pollUrl) throw new Error("No poll URL from Replicate");
      prediction = await pollPrediction(pollUrl, REPLICATE_API_KEY);
    }

    // Extract output image URL(s)
    const output = prediction.output;
    let imageUrl: string | null = null;

    if (Array.isArray(output) && output.length > 0) {
      imageUrl = output[0];
    } else if (typeof output === "string") {
      imageUrl = output;
    }

    if (imageUrl) {
      return new Response(
        JSON.stringify({ success: true, image: imageUrl }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({
        success: false,
        error: "Modelo não gerou imagem. Tente novamente.",
        image: image,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error applying color:", error);
    return new Response(
      JSON.stringify({ error: "Failed to apply color" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
