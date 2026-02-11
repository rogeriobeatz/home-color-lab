import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function isValidDataUrl(url: string): boolean {
  return /^data:image\/(png|jpeg|jpg|gif|webp|svg\+xml);base64,/.test(url);
}

function isValidHexColor(color: string): boolean {
  return /^#[0-9A-Fa-f]{3,8}$/.test(color);
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    const { rooms } = body;

    if (!rooms || !Array.isArray(rooms) || rooms.length === 0) {
      return new Response(
        JSON.stringify({ error: "No rooms provided" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (rooms.length > 20) {
      return new Response(
        JSON.stringify({ error: "Too many rooms (max 20)" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Validate and sanitize rooms
    const sanitizedRooms: RoomData[] = [];
    for (const room of rooms) {
      if (typeof room.name !== 'string' || room.name.length > 200) {
        return new Response(
          JSON.stringify({ error: "Invalid room name" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (!Array.isArray(room.elements) || room.elements.length > 50) {
        return new Response(
          JSON.stringify({ error: "Invalid elements" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const sanitizedElements: RoomElement[] = room.elements.map((el: any) => ({
        name: typeof el.name === 'string' ? el.name.slice(0, 100) : '',
        color: typeof el.color === 'string' && isValidHexColor(el.color) ? el.color : undefined,
        colorName: typeof el.colorName === 'string' ? el.colorName.slice(0, 100) : undefined,
        colorCode: typeof el.colorCode === 'string' ? el.colorCode.slice(0, 50) : undefined,
        colorBrand: typeof el.colorBrand === 'string' ? el.colorBrand.slice(0, 100) : undefined,
      }));

      sanitizedRooms.push({
        name: room.name.slice(0, 200),
        originalImage: typeof room.originalImage === 'string' && isValidDataUrl(room.originalImage) ? room.originalImage : '',
        processedImage: typeof room.processedImage === 'string' && isValidDataUrl(room.processedImage) ? room.processedImage : '',
        elements: sanitizedElements,
      });
    }

    const html = buildReportHTML(sanitizedRooms);

    const encoder = new TextEncoder();
    const bytes = encoder.encode(html);
    let binary = '';
    const chunkSize = 8192;
    for (let i = 0; i < bytes.length; i += chunkSize) {
      const chunk = bytes.subarray(i, i + chunkSize);
      binary += String.fromCharCode(...chunk);
    }
    const base64 = btoa(binary);
    const dataUrl = `data:text/html;base64,${base64}`;

    return new Response(
      JSON.stringify({ success: true, pdf: dataUrl }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error generating PDF:", error);
    return new Response(
      JSON.stringify({ error: "Failed to generate report" }),
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
          <td style="padding:8px 12px;border-bottom:1px solid #e5e7eb;">${escapeHtml(el.name)}</td>
          <td style="padding:8px 12px;border-bottom:1px solid #e5e7eb;">
            <span style="display:inline-block;width:24px;height:24px;border-radius:4px;background:${el.color || '#eee'};vertical-align:middle;margin-right:8px;border:1px solid #ccc;"></span>
            ${escapeHtml(el.colorName || '—')}
          </td>
          <td style="padding:8px 12px;border-bottom:1px solid #e5e7eb;font-family:monospace;">${escapeHtml(el.colorCode || '—')}</td>
          <td style="padding:8px 12px;border-bottom:1px solid #e5e7eb;">${escapeHtml(el.colorBrand || '—')}</td>
        </tr>
      `).join('');

    return `
      <div style="page-break-inside:avoid;margin-bottom:40px;">
        <h2 style="font-size:20px;color:#1a1a2e;margin-bottom:16px;padding-bottom:8px;border-bottom:2px solid #2a9d8f;">
          ${i + 1}. ${escapeHtml(room.name)}
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
