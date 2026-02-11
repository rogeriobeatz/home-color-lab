import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const MAX_IMAGE_SIZE = 10_000_000; // 10MB
const VALID_HEX = /^#[0-9A-Fa-f]{3,8}$/;
const SAFE_STRING = /^[a-zA-ZÀ-ÿ0-9\s\-_.,()]+$/;

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    const { image, elementType, color, colorName } = body;
    
    // Validate image
    if (!image || typeof image !== 'string' || image.length > MAX_IMAGE_SIZE) {
      return new Response(
        JSON.stringify({ error: "Invalid or missing image (max 10MB)" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!image.startsWith('data:image/')) {
      return new Response(
        JSON.stringify({ error: "Invalid image format" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Validate elementType
    if (!elementType || typeof elementType !== 'string' || elementType.length > 100) {
      return new Response(
        JSON.stringify({ error: "Invalid element type" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Validate color (hex)
    if (!color || typeof color !== 'string' || !VALID_HEX.test(color)) {
      return new Response(
        JSON.stringify({ error: "Invalid color format (expected hex like #RRGGBB)" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Sanitize elementType and colorName for prompt injection prevention
    const safeElementType = elementType.slice(0, 100).replace(/[^\w\sÀ-ÿ\-]/g, '');
    const safeColorName = typeof colorName === 'string' 
      ? colorName.slice(0, 100).replace(/[^\w\sÀ-ÿ\-]/g, '') 
      : color;

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    // Retry logic for transient errors
    const maxRetries = 2;
    let lastError: string | null = null;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${LOVABLE_API_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model: "google/gemini-2.5-flash-image",
            messages: [
              {
                role: "user",
                content: [
                  {
                    type: "text",
                    text: `You are a professional interior design photo editor. Edit this room photo by changing ONLY the ${safeElementType} to the color ${safeColorName} (hex: ${color}).

Rules:
- Change ONLY the ${safeElementType} color. Do NOT modify anything else.
- Keep the exact same camera angle, lighting direction, and shadows.
- Maintain realistic material texture and light reflections on the painted surface.
- Preserve all furniture, decorations, windows, doors, and other elements exactly as they are.
- The result must look like a real photograph, not a digital render.`
                  },
                  {
                    type: "image_url",
                    image_url: {
                      url: image
                    }
                  }
                ]
              }
            ],
            modalities: ["image", "text"]
          }),
        });

        if (!response.ok) {
          if (response.status === 429) {
            if (attempt < maxRetries) {
              await new Promise(r => setTimeout(r, 2000 * (attempt + 1)));
              continue;
            }
            return new Response(
              JSON.stringify({ error: "Muitas requisições. Aguarde um momento e tente novamente." }),
              { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
            );
          }
          if (response.status === 402) {
            return new Response(
              JSON.stringify({ error: "Créditos insuficientes. Adicione créditos para continuar." }),
              { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
            );
          }
          const errorText = await response.text();
          console.error(`AI gateway error (attempt ${attempt + 1}):`, response.status, errorText);
          lastError = `AI gateway error: ${response.status}`;
          
          if (attempt < maxRetries && response.status >= 500) {
            await new Promise(r => setTimeout(r, 1500 * (attempt + 1)));
            continue;
          }
          throw new Error(lastError);
        }

        const data = await response.json();
        
        const generatedImage = data.choices?.[0]?.message?.images?.[0]?.image_url?.url;
        
        if (generatedImage) {
          return new Response(
            JSON.stringify({
              success: true,
              image: generatedImage
            }),
            { headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        lastError = "Modelo não gerou imagem";
        if (attempt < maxRetries) {
          await new Promise(r => setTimeout(r, 1000));
          continue;
        }

      } catch (innerError) {
        lastError = innerError instanceof Error ? innerError.message : "Erro desconhecido";
        if (attempt < maxRetries) {
          await new Promise(r => setTimeout(r, 1500 * (attempt + 1)));
          continue;
        }
      }
    }

    return new Response(
      JSON.stringify({
        success: false,
        error: lastError || "Não foi possível gerar a imagem modificada após múltiplas tentativas.",
        image: image
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Error applying color:", error);
    return new Response(
      JSON.stringify({ 
        error: "Failed to apply color"
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
