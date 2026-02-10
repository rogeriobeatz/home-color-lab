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
    const { rooms } = await req.json();

    if (!rooms || !Array.isArray(rooms) || rooms.length === 0) {
      return new Response(
        JSON.stringify({ error: "No rooms provided" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Build an HTML document that will be converted to a downloadable HTML report
    // (A full PDF library would be heavy for edge functions; we generate a self-contained HTML report)
    const html = buildReportHTML(rooms);

    // Convert to base64 data URL so the client can download it
    const encoder = new TextEncoder();
    const bytes = encoder.encode(html);
    const base64 = btoa(String.fromCharCode(...bytes));
    const dataUrl = `data:text/html;base64,${base64}`;

    return new Response(
      JSON.stringify({ success: true, pdf: dataUrl }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error generating PDF:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

interface RoomElement {
  name: string;
  color?: string;
  colorName?: string;
  colorCode?: string;
  colorBrand?: string;
}

interface RoomData {
  name: string;
  originalImage: string;
  processedImage: string;
  elements: RoomElement[];
}

function buildReportHTML(rooms: RoomData[]): string {
  const roomSections = rooms.map((room, i) => {
    const colorRows = room.elements
      .map(el => `
        <tr>
          <td style="padding:8px 12px;border-bottom:1px solid #e5e7eb;">${el.name}</td>
          <td style="padding:8px 12px;border-bottom:1px solid #e5e7eb;">
            <span style="display:inline-block;width:24px;height:24px;border-radius:4px;background:${el.color || '#eee'};vertical-align:middle;margin-right:8px;border:1px solid #ccc;"></span>
            ${el.colorName || '—'}
          </td>
          <td style="padding:8px 12px;border-bottom:1px solid #e5e7eb;font-family:monospace;">${el.colorCode || '—'}</td>
          <td style="padding:8px 12px;border-bottom:1px solid #e5e7eb;">${el.colorBrand || '—'}</td>
        </tr>
      `).join('');

    return `
      <div style="page-break-inside:avoid;margin-bottom:40px;">
        <h2 style="font-size:20px;color:#1a1a2e;margin-bottom:16px;padding-bottom:8px;border-bottom:2px solid #2a9d8f;">
          ${i + 1}. ${room.name}
        </h2>
        <div style="display:flex;gap:16px;margin-bottom:16px;flex-wrap:wrap;">
          <div style="flex:1;min-width:200px;">
            <p style="font-size:12px;color:#888;margin-bottom:4px;">Original</p>
            <img src="${room.originalImage}" style="width:100%;max-height:300px;object-fit:contain;border-radius:8px;border:1px solid #e5e7eb;" />
          </div>
          <div style="flex:1;min-width:200px;">
            <p style="font-size:12px;color:#888;margin-bottom:4px;">Com cores aplicadas</p>
            <img src="${room.processedImage}" style="width:100%;max-height:300px;object-fit:contain;border-radius:8px;border:1px solid #e5e7eb;" />
          </div>
        </div>
        ${room.elements.length > 0 ? `
          <table style="width:100%;border-collapse:collapse;font-size:14px;">
            <thead>
              <tr style="background:#f8f9fa;">
                <th style="padding:8px 12px;text-align:left;border-bottom:2px solid #dee2e6;">Elemento</th>
                <th style="padding:8px 12px;text-align:left;border-bottom:2px solid #dee2e6;">Cor</th>
                <th style="padding:8px 12px;text-align:left;border-bottom:2px solid #dee2e6;">Código</th>
                <th style="padding:8px 12px;text-align:left;border-bottom:2px solid #dee2e6;">Marca</th>
              </tr>
            </thead>
            <tbody>${colorRows}</tbody>
          </table>
        ` : '<p style="color:#888;">Nenhuma cor aplicada neste ambiente.</p>'}
      </div>
    `;
  }).join('');

  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <title>Relatório DecorAI</title>
  <style>
    @media print { body { margin: 0; } .no-print { display: none; } }
    body { font-family: 'Segoe UI', sans-serif; max-width: 800px; margin: 0 auto; padding: 40px 24px; color: #333; }
  </style>
</head>
<body>
  <div style="text-align:center;margin-bottom:40px;">
    <h1 style="font-size:28px;color:#2a9d8f;margin-bottom:4px;">🎨 Relatório de Cores</h1>
    <p style="color:#888;font-size:14px;">Gerado por DecorAI — ${new Date().toLocaleDateString('pt-BR')}</p>
  </div>
  ${roomSections}
  <div style="text-align:center;margin-top:40px;padding-top:20px;border-top:1px solid #e5e7eb;color:#888;font-size:12px;" class="no-print">
    <p>Para imprimir como PDF, use Ctrl+P (ou Cmd+P) e selecione "Salvar como PDF".</p>
  </div>
</body>
</html>`;
}
