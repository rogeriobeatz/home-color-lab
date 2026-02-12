import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const MAX_IMAGE_SIZE = 10_000_000; // 10MB

// Simple in-memory rate limiter per IP
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT_WINDOW_MS = 60_000; // 1 minute
const RATE_LIMIT_MAX = 10; // max requests per window

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

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  // Rate limiting
  const clientIp = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  if (isRateLimited(clientIp)) {
    return new Response(
      JSON.stringify({ error: "Too many requests. Please wait a moment." }),
      { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  try {
    const body = await req.json();
    const { image } = body;
    
    if (!image || typeof image !== 'string') {
      return new Response(
        JSON.stringify({ error: "No image provided" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (image.length > MAX_IMAGE_SIZE) {
      return new Response(
        JSON.stringify({ error: "Image too large (max 10MB)" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!image.startsWith('data:image/')) {
      return new Response(
        JSON.stringify({ error: "Invalid image format" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    // Use Gemini to analyze the room and identify elements
    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          {
            role: "system",
            content: `You are an expert at analyzing room images for interior decoration purposes.
            
Analyze the provided room image and identify the following elements:
- Walls (identify each visible wall separately)
- Ceiling (if visible)
- Floor (if visible)
- Doors and windows (to exclude from painting)
- Furniture (to exclude from painting)

Also identify the type of room (e.g., "Sala de Estar", "Quarto", "Cozinha", "Banheiro", "Escritório") and return it as "roomName" in Portuguese.

For each element, provide:
1. A unique ID (e.g., "wall-1", "ceiling", "floor")
2. A descriptive name in Portuguese (e.g., "Parede Principal", "Teto", "Piso")
3. The type (wall, ceiling, floor, door, window, furniture)
4. Approximate position in the image (top, bottom, left, right, center)

Return your analysis as a JSON object with "roomName" and "elements" array.`
          },
          {
            role: "user",
            content: [
              {
                type: "text",
                text: "Analyze this room image and identify all paintable surfaces (walls, ceiling, floor) and elements to exclude (furniture, doors, windows)."
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
        tools: [
          {
            type: "function",
            function: {
              name: "analyze_room",
              description: "Return the analysis of room elements",
              parameters: {
                type: "object",
                properties: {
                  elements: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        id: { type: "string", description: "Unique identifier like wall-1, ceiling, floor" },
                        name: { type: "string", description: "Descriptive name in Portuguese" },
                        type: { type: "string", enum: ["wall", "ceiling", "floor", "door", "window", "furniture"] },
                        position: { type: "string", description: "Position in image: top, bottom, left, right, center" },
                        canPaint: { type: "boolean", description: "Whether this element can be painted" }
                      },
                      required: ["id", "name", "type", "canPaint"]
                    }
                  },
                  roomName: {
                    type: "string",
                    description: "Name of the room type in Portuguese, e.g. Sala de Estar, Quarto, Cozinha"
                  },
                  description: {
                    type: "string",
                    description: "Brief description of the room in Portuguese"
                  }
                },
                required: ["elements", "roomName", "description"]
              }
            }
          }
        ],
        tool_choice: { type: "function", function: { name: "analyze_room" } }
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded. Please try again later." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "Payment required. Please add credits to continue." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      throw new Error(`AI gateway error: ${response.status}`);
    }

    const data = await response.json();
    
    // Extract the tool call result
    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
    if (toolCall?.function?.arguments) {
      const analysis = JSON.parse(toolCall.function.arguments);
      
      return new Response(
        JSON.stringify({
          success: true,
          analysis
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Fallback if no tool call
    return new Response(
      JSON.stringify({
        success: true,
        analysis: {
          elements: [
            { id: "wall-1", name: "Parede Principal", type: "wall", canPaint: true },
            { id: "wall-2", name: "Parede Lateral", type: "wall", canPaint: true },
            { id: "ceiling", name: "Teto", type: "ceiling", canPaint: true },
            { id: "floor", name: "Piso", type: "floor", canPaint: true },
          ],
          description: "Ambiente analisado com sucesso"
        }
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Error analyzing room:", error);
    return new Response(
      JSON.stringify({ 
        error: "Failed to analyze room",
        // Return default elements so user can still use the app
        analysis: {
          elements: [
            { id: "wall-1", name: "Parede Principal", type: "wall", canPaint: true },
            { id: "wall-2", name: "Parede Lateral", type: "wall", canPaint: true },
            { id: "ceiling", name: "Teto", type: "ceiling", canPaint: true },
            { id: "floor", name: "Piso", type: "floor", canPaint: true },
          ],
          description: "Elementos padrão (análise automática não disponível)"
        }
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
