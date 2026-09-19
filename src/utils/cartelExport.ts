/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface ExhibitionCartelItem {
  id: string;
  title: string;
  artist: string;
  medium: string;
  year: string;
  dimensions: string;
  price: string;
  status: "available" | "reserved" | "sold";
  type?: "peinture" | "photo" | "sculpture" | "dessin" | "autre";
  qrUrl: string;
  copies: number;
  enabled: boolean;
}

export type CartelDensity = "compact" | "standard" | "spacious";

export interface CartelDensityConfig {
  id: CartelDensity;
  label: string;
  description: string;
  cartelsPerPage: number;
  columns: number;
  rows: number;
  widthMm: number;
  heightMm: number;
}

export const CARTEL_DENSITIES: Record<CartelDensity, CartelDensityConfig> = {
  // Format 5 cm x 3 cm = 24 cartels par page A4 (3 cols x 8 rows) - Maximum d'optimisation
  compact: {
    id: "compact",
    label: "Format 5 × 3 cm (24 cartels / page A4)",
    description: "Format 5 cm sur 3 cm : optimise au maximum le nombre de cartels par feuille A4",
    cartelsPerPage: 24,
    columns: 3,
    rows: 8,
    widthMm: 50,
    heightMm: 30
  },
  // Format 5 cm x 4 cm = 18 cartels par page A4 (3 cols x 6 rows) - Standard équilibré
  standard: {
    id: "standard",
    label: "Format 5 × 4 cm (18 cartels / page A4)",
    description: "Format 5 cm sur 4 cm : standard musée recommandé pour peintures et photographies",
    cartelsPerPage: 18,
    columns: 3,
    rows: 6,
    widthMm: 50,
    heightMm: 40
  },
  // Format aéré 6 cm x 4.5 cm = 12 cartels par page A4 (3 cols x 4 rows)
  spacious: {
    id: "spacious",
    label: "Format 6 × 4,5 cm (12 cartels / page A4)",
    description: "Format aéré pour cartels avec notices descriptives ou titres longs",
    cartelsPerPage: 12,
    columns: 3,
    rows: 4,
    widthMm: 60,
    heightMm: 45
  }
};

export interface GenerateA4CartelsHtmlOptions {
  galleryName?: string;
  exhibitionTitle?: string;
  density: CartelDensity;
  cartels: Array<{
    item: ExhibitionCartelItem;
    qrSvgHtml: string;
  }>;
}

/**
 * Generates an ultra-crisp, standalone A4 HTML document formatted for museum cartels.
 * Strictly respects:
 * - ISO A4 format (210 x 297 mm, 8mm margins)
 * - Cartels 5cm x 3.5cm to 4cm (NO cut borders / no outlines on cartels to prevent edge marks after cutting)
 * - Multi-artwork exhibition layout
 * - Embedded print styles and offline capabilities
 */
export function generateA4CartelsHtml(options: GenerateA4CartelsHtmlOptions): string {
  const { galleryName = "Galerie d'Art", exhibitionTitle = "Exposition Collective", density, cartels } = options;
  const config = CARTEL_DENSITIES[density] || CARTEL_DENSITIES.standard;
  const perPage = config.cartelsPerPage;

  // Chunk cartels by page
  const pages: Array<Array<{ item: ExhibitionCartelItem; qrSvgHtml: string }>> = [];
  for (let i = 0; i < cartels.length; i += perPage) {
    pages.push(cartels.slice(i, i + perPage));
  }

  if (pages.length === 0) {
    pages.push([]);
  }

  const pagesHtml = pages.map((pageCartels, pageIdx) => {
    const itemsHtml = pageCartels.map(({ item, qrSvgHtml }, cartelIdx) => {
      const isAvailable = item.status === "available";
      const statusLabel = isAvailable ? "Disponible" : item.status === "reserved" ? "Réservé" : "Collection";
      const displayPrice = item.price && item.price !== "Prix sur demande" ? item.price : "Prix sur demande";

      return `
        <div class="cartel-card">
          <div class="cartel-info">
            <div class="cartel-artist">${escapeHtml(item.artist || "Artiste")}</div>
            <div class="cartel-title">${escapeHtml(item.title || "Sans Titre")}</div>
            <div class="cartel-meta">
              <span class="cartel-medium">${escapeHtml(item.medium || "Technique Mixte")}</span>
              ${item.year ? `<span class="cartel-year">(${escapeHtml(item.year)})</span>` : ""}
            </div>
            ${item.dimensions ? `<div class="cartel-dimensions">${escapeHtml(item.dimensions)}</div>` : ""}
            <div class="cartel-footer-row">
              <span class="cartel-price">${escapeHtml(displayPrice)}</span>
              <span class="cartel-status">${escapeHtml(statusLabel)}</span>
            </div>
          </div>
          <div class="cartel-qr-block">
            <div class="cartel-qr-svg">
              ${qrSvgHtml || `<div style="width:20mm;height:20mm;background:#eee;"></div>`}
            </div>
            <span class="cartel-qr-caption">Audioguide</span>
          </div>
        </div>
      `;
    }).join("");

    return `
      <div class="a4-sheet">
        <header class="sheet-header">
          <span class="sheet-brand">${escapeHtml(galleryName)} • ${escapeHtml(exhibitionTitle)}</span>
          <span class="sheet-page">Format Normalisé A4 • Page ${pageIdx + 1} / ${pages.length}</span>
        </header>

        <main class="sheet-grid density-${density}">
          ${itemsHtml}
        </main>

        <footer class="sheet-footer">
          <span>L'Œil de l'Atelier • Cartels muraux professionnels sans liseré de coupe (découpe nette au massicot ou cutter)</span>
          <span>${pageCartels.length} cartel(s) sur cette feuille</span>
        </footer>
      </div>
    `;
  }).join("");

  return `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Planche_Cartels_A4_${escapeHtml(exhibitionTitle.replace(/\s+/g, "_"))}</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,600;0,700;1,400;1,600&family=Josefin+Sans:wght@300;400;600;700&display=swap');

    @page {
      size: A4 portrait;
      margin: 8mm;
    }

    * {
      box-sizing: border-box;
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
    }

    body {
      margin: 0;
      padding: 0;
      background: #202020;
      font-family: 'Josefin Sans', ui-sans-serif, system-ui, sans-serif;
      color: #111111;
      -webkit-font-smoothing: antialiased;
    }

    /* Screen-only top action bar */
    .screen-toolbar {
      position: sticky;
      top: 0;
      z-index: 9999;
      background: #0f0f0f;
      color: #ffffff;
      border-bottom: 2px solid #c9a84c;
      padding: 12px 24px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 16px;
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.5);
    }

    .toolbar-title h1 {
      margin: 0;
      font-family: 'Cormorant Garamond', Georgia, serif;
      font-size: 18px;
      font-weight: 700;
      color: #c9a84c;
      letter-spacing: 0.05em;
      text-transform: uppercase;
    }

    .toolbar-title p {
      margin: 3px 0 0 0;
      font-size: 11px;
      color: #a0a0a0;
    }

    .toolbar-actions {
      display: flex;
      align-items: center;
      gap: 10px;
    }

    .btn-action {
      background: #c9a84c;
      color: #000000;
      font-family: 'Josefin Sans', sans-serif;
      font-size: 12px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      padding: 8px 16px;
      border: none;
      border-radius: 0;
      cursor: pointer;
      display: flex;
      align-items: center;
      gap: 6px;
      transition: background 0.2s;
    }

    .btn-action:hover {
      background: #ffffff;
    }

    .btn-secondary {
      background: #2a2a2a;
      color: #ffffff;
      border: 1px solid #444444;
    }

    .btn-secondary:hover {
      background: #3a3a3a;
      border-color: #c9a84c;
    }

    /* A4 Paper Canvas Representation */
    .sheets-wrapper {
      padding: 30px 10px;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 30px;
    }

    .a4-sheet {
      width: 210mm;
      height: 297mm;
      max-height: 297mm;
      background: #ffffff;
      padding: 8mm;
      box-shadow: 0 8px 30px rgba(0, 0, 0, 0.35);
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      position: relative;
      overflow: hidden;
      page-break-after: always;
      break-after: page;
    }

    /* Subtle header & footer on A4 paper */
    .sheet-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      border-bottom: 0.5pt solid #e0e0e0;
      padding-bottom: 2mm;
      margin-bottom: 2.5mm;
      font-size: 7.5pt;
      text-transform: uppercase;
      letter-spacing: 0.06em;
      color: #777777;
    }

    .sheet-brand {
      font-weight: 600;
      color: #555555;
    }

    .sheet-footer {
      display: flex;
      align-items: center;
      justify-content: space-between;
      border-top: 0.5pt solid #e0e0e0;
      padding-top: 2mm;
      margin-top: 2.5mm;
      font-size: 6.5pt;
      color: #888888;
      letter-spacing: 0.04em;
    }

    /* Grid Layout for Cartels */
    .sheet-grid {
      flex: 1;
      display: grid;
      gap: 4mm;
      align-content: stretch;
    }

    /* Density Configurations */
    .sheet-grid.density-compact {
      grid-template-columns: repeat(3, 1fr);
      grid-template-rows: repeat(8, 1fr);
      gap: 2.2mm;
    }

    .sheet-grid.density-standard {
      grid-template-columns: repeat(3, 1fr);
      grid-template-rows: repeat(6, 1fr);
      gap: 3.5mm;
    }

    .sheet-grid.density-spacious {
      grid-template-columns: repeat(3, 1fr);
      grid-template-rows: repeat(4, 1fr);
      gap: 5mm;
    }

    /* STRICT ZERO-BORDER MUSEUM CARTEL (No cut borders, no outlines) */
    .cartel-card {
      background: #ffffff;
      border: none !important;
      outline: none !important;
      box-shadow: none !important;
      padding: 2mm 2.5mm;
      display: flex;
      flex-direction: row;
      justify-content: space-between;
      align-items: center;
      gap: 2.5mm;
      overflow: hidden;
      page-break-inside: avoid;
      break-inside: avoid;
    }

    .cartel-info {
      flex: 1;
      min-width: 0;
      display: flex;
      flex-direction: column;
      justify-content: center;
      gap: 0.6mm;
    }

    .cartel-artist {
      font-size: 8pt;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.06em;
      color: #111111;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      line-height: 1.1;
    }

    .cartel-title {
      font-family: 'Cormorant Garamond', Georgia, serif;
      font-size: 9.5pt;
      font-style: italic;
      font-weight: 600;
      color: #000000;
      line-height: 1.15;
      display: -webkit-box;
      -webkit-line-clamp: 2;
      -webkit-box-orient: vertical;
      overflow: hidden;
    }

    .cartel-meta {
      font-size: 7pt;
      color: #444444;
      line-height: 1.1;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .cartel-year {
      color: #666666;
      margin-left: 2px;
    }

    .cartel-dimensions {
      font-size: 6.8pt;
      font-family: monospace;
      color: #555555;
      line-height: 1;
    }

    .cartel-footer-row {
      display: flex;
      align-items: center;
      gap: 4px;
      margin-top: 0.8mm;
      font-size: 7.2pt;
    }

    .cartel-price {
      font-weight: 700;
      color: #111111;
    }

    .cartel-status {
      font-size: 6pt;
      text-transform: uppercase;
      color: #777777;
      letter-spacing: 0.03em;
    }

    .cartel-qr-block {
      flex-shrink: 0;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 1mm;
      width: 22mm;
    }

    .cartel-qr-svg {
      width: 20mm;
      height: 20mm;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .cartel-qr-svg svg {
      width: 100% !important;
      height: 100% !important;
      display: block;
    }

    .cartel-qr-caption {
      font-size: 5.5pt;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      color: #666666;
      line-height: 1;
    }

    /* Print media rules */
    @media print {
      body {
        background: #ffffff !important;
        margin: 0 !important;
        padding: 0 !important;
      }

      .screen-toolbar {
        display: none !important;
      }

      .sheets-wrapper {
        padding: 0 !important;
        gap: 0 !important;
        display: block !important;
      }

      .a4-sheet {
        width: 100% !important;
        height: 100% !important;
        max-height: none !important;
        margin: 0 !important;
        padding: 0 !important;
        box-shadow: none !important;
        page-break-after: always !important;
        break-after: page !important;
      }
    }
  </style>
</head>
<body>

  <!-- Screen Toolbar -->
  <div class="screen-toolbar">
    <div class="toolbar-title">
      <h1>Planche Cartels A4 • ${escapeHtml(exhibitionTitle)}</h1>
      <p>Format ISO A4 (210 × 297 mm) • Sans contours de découpe • ${cartels.length} cartel(s) • ${pages.length} page(s)</p>
    </div>
    <div class="toolbar-actions">
      <button type="button" class="btn-action" onclick="window.print()">
        🖨️ Imprimer / Enregistrer en PDF (A4)
      </button>
      <button type="button" class="btn-action btn-secondary" onclick="window.close()">
        Fermer
      </button>
    </div>
  </div>

  <!-- Sheets Wrapper -->
  <div class="sheets-wrapper">
    ${pagesHtml}
  </div>

</body>
</html>`;
}

/**
 * Downloads a generated HTML string as an .html file
 */
export function downloadA4CartelsHtmlFile(filename: string, htmlContent: string) {
  const blob = new Blob([htmlContent], { type: "text/html;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename.endsWith(".html") ? filename : `${filename}.html`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Directly triggers isolated printing of the A4 Cartels document via a hidden iframe
 */
export function printA4CartelsViaIframe(htmlContent: string) {
  const iframe = document.createElement("iframe");
  iframe.style.position = "fixed";
  iframe.style.right = "0";
  iframe.style.bottom = "0";
  iframe.style.width = "0";
  iframe.style.height = "0";
  iframe.style.border = "0";
  iframe.style.zIndex = "-999";
  document.body.appendChild(iframe);

  const doc = iframe.contentWindow?.document;
  if (doc) {
    doc.open();
    doc.write(htmlContent);
    doc.close();

    iframe.contentWindow?.focus();
    setTimeout(() => {
      try {
        iframe.contentWindow?.print();
      } catch (e) {
        console.error("Iframe print failed:", e);
      } finally {
        setTimeout(() => {
          if (iframe.parentNode) {
            document.body.removeChild(iframe);
          }
        }, 1500);
      }
    }, 400);
  }
}

/**
 * Opens the generated A4 Cartels document in a new tab
 */
export function openA4CartelsInNewTab(htmlContent: string) {
  const newTab = window.open("", "_blank");
  if (newTab) {
    newTab.document.open();
    newTab.document.write(htmlContent);
    newTab.document.close();
    newTab.focus();
  }
}

function escapeHtml(str: string): string {
  if (!str) return "";
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}
