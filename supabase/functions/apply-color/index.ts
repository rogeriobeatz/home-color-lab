import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { image, elementType, color, colorName } = await req.json();
    
    if (!image || !elementType || !color) {
      return new Response(
        JSON.stringify({ error: "Missing required parameters: image, elementType, color" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

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
                    text: `You are a professional interior design photo editor. Edit this room photo by changing ONLY the ${elementType} to the color ${colorName || color} (hex: ${color}).

Rules:
- Change ONLY the ${elementType} color. Do NOT modify anything else.
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
              // Wait before retry on rate limit
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
        
        // Extract the generated image
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

        // No image generated on this attempt, retry
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

    // All retries exhausted
    return new Response(
      JSON.stringify({
        success: false,
        error: lastError || "Não foi possível gerar a imagem modificada após múltiplas tentativas.",
        image: image // Return original as fallback
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Error applying color:", error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : "Erro desconhecido"
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
