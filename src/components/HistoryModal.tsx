/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from "react";
import { X, Calendar, FileImage, Trash2, Eye, Sparkles, Search, FileDown, Printer, Download, BookOpen, Check } from "lucide-react";
import { HistoryItem } from "../types.js";

interface HistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  historyList: HistoryItem[];
  onLoadHistoryItem: (item: HistoryItem) => void;
  onClearHistory: () => void;
  onDeleteItem?: (id: number) => void;
  theme?: "dark-gold" | "light";
  artistName?: string;
}

export default function HistoryModal({
  isOpen,
  onClose,
  historyList,
  onLoadHistoryItem,
  onClearHistory,
  onDeleteItem,
  theme = "dark-gold",
  artistName = "Artiste"
}: HistoryModalProps) {
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [downloadNotice, setDownloadNotice] = useState<string | null>(null);

  const filteredHistory = useMemo(() => {
    if (!searchTerm.trim()) return historyList;
    const q = searchTerm.toLowerCase();
    return historyList.filter(
      (item) =>
        item.toolLabel.toLowerCase().includes(q) ||
        item.filename.toLowerCase().includes(q) ||
        item.summary.toLowerCase().includes(q) ||
        item.date.toLowerCase().includes(q)
    );
  }, [historyList, searchTerm]);

  // Export full logbook as an elegant standalone A4 HTML document
  const handleExportA4Html = () => {
    if (historyList.length === 0) return;

    const htmlContent = `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <title>Carnet de Bord d'Atelier - ${artistName}</title>
  <style>
    @page {
      size: A4 portrait;
      margin: 15mm 12mm 15mm 12mm;
    }
    * { box-sizing: border-box; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
    body {
      font-family: 'Helvetica Neue', Arial, sans-serif;
      color: #1a1a1a;
      background: #ffffff;
      margin: 0;
      padding: 24px;
      font-size: 13px;
      line-height: 1.5;
    }
    .no-print-bar {
      position: sticky;
      top: 0;
      z-index: 100;
      background: #0f0f0f;
      color: #ffffff;
      padding: 12px 20px;
      margin: -24px -24px 24px -24px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      border-bottom: 3px solid #c9a84c;
    }
    .no-print-bar button {
      background: #c9a84c;
      color: #000;
      border: none;
      padding: 8px 16px;
      font-size: 12px;
      font-weight: bold;
      text-transform: uppercase;
      letter-spacing: 1px;
      cursor: pointer;
    }
    .header {
      border-bottom: 2px solid #c9a84c;
      padding-bottom: 14px;
      margin-bottom: 20px;
      display: flex;
      justify-content: space-between;
      align-items: flex-end;
    }
    .header h1 {
      margin: 0;
      font-size: 20px;
      text-transform: uppercase;
      letter-spacing: 1.5px;
      color: #000;
    }
    .header p {
      margin: 3px 0 0 0;
      font-size: 11px;
      color: #666;
    }
    .meta-badge {
      font-size: 11px;
      font-family: monospace;
      background: #f4f0e6;
      border: 1px solid #c9a84c;
      padding: 4px 8px;
    }
    .item-card {
      border: 1px solid #e0dbd0;
      background: #faf8f5;
      padding: 14px 16px;
      margin-bottom: 16px;
      page-break-inside: avoid;
    }
    .item-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 8px;
      border-bottom: 1px dashed #d5cfc4;
      padding-bottom: 6px;
    }
    .item-tool {
      font-weight: bold;
      text-transform: uppercase;
      font-size: 11px;
      letter-spacing: 1px;
      color: #8c7324;
      background: #f1e9d2;
      padding: 2px 6px;
    }
    .item-date {
      font-size: 11px;
      color: #777;
      font-family: monospace;
    }
    .item-title {
      font-size: 14px;
      font-weight: bold;
      margin: 0 0 4px 0;
      color: #111;
    }
    .item-file {
      font-size: 11px;
      color: #555;
      margin: 0 0 10px 0;
      font-style: italic;
    }
    .item-body {
      background: #ffffff;
      border: 1px solid #eae5db;
      padding: 10px 12px;
      font-size: 12px;
      white-space: pre-wrap;
      line-height: 1.6;
    }
    @media print {
      .no-print-bar { display: none !important; }
      body { padding: 0 !important; }
    }
  </style>
</head>
<body>
  <div class="no-print-bar">
    <div>
      <strong>CARNET DE BORD D'ATELIER · FORMAT A4</strong>
      <span style="opacity: 0.7; margin-left: 8px; font-size: 11px;">(${historyList.length} analyses consignées)</span>
    </div>
    <button onclick="window.print()">🖨️ Imprimer / Enregistrer en PDF (A4)</button>
  </div>

  <div class="header">
    <div>
      <h1>Mon Carnet de Bord d'Atelier</h1>
      <p>Registre officiel des analyses artistiques, cartels et critiques · ${artistName}</p>
    </div>
    <div class="meta-badge">
      Édité le ${new Date().toLocaleDateString("fr-FR")} à ${new Date().toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}
    </div>
  </div>

  ${historyList.map((item, index) => {
    let detailsText = "";
    if (item.result && typeof item.result === "object") {
      detailsText = Object.entries(item.result)
        .filter(([k]) => !k.startsWith("_") && typeof item.result[k] !== "object")
        .map(([k, v]) => `• ${k.toUpperCase()} : ${v}`)
        .join("\n");
      if (!detailsText) {
        detailsText = JSON.stringify(item.result, null, 2);
      }
    } else {
      detailsText = String(item.result || "");
    }

    return `
    <div class="item-card">
      <div class="item-header">
        <span class="item-tool">#${index + 1} · ${item.toolLabel}</span>
        <span class="item-date">📅 ${item.date}</span>
      </div>
      <div class="item-title">${item.summary || item.toolLabel}</div>
      <div class="item-file">Œuvre : ${item.filename}</div>
      <div class="item-body">${detailsText}</div>
    </div>
    `;
  }).join("")}

  <footer style="margin-top: 30px; text-align: center; font-size: 10px; color: #888; border-top: 1px solid #ccc; padding-top: 10px;">
    Document généré par l'Œil de l'Atelier · Registre d'atelier de l'artiste
  </footer>
</body>
</html>`;

    const blob = new Blob([htmlContent], { type: "text/html;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `carnet_de_bord_atelier_${new Date().toISOString().slice(0, 10)}.html`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    setDownloadNotice("Carnet de bord téléchargé avec succès au format A4 (.html). Vous pouvez l'ouvrir dans n'importe quel navigateur pour l'imprimer ou l'enregistrer en PDF !");
    setTimeout(() => setDownloadNotice(null), 5000);
  };

  // Export as JSON backup
  const handleExportJson = () => {
    if (historyList.length === 0) return;
    const jsonStr = JSON.stringify(historyList, null, 2);
    const blob = new Blob([jsonStr], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `carnet_de_bord_sauvegarde_${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    setDownloadNotice("Sauvegarde JSON exportée.");
    setTimeout(() => setDownloadNotice(null), 4000);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/85 backdrop-blur-sm z-50 flex items-center justify-center p-3 sm:p-6 animate-fadeIn">
      <div className={`rounded-none w-full max-w-3xl max-h-[90vh] flex flex-col relative transition-all duration-300 border-2 shadow-[0_0_50px_rgba(201,168,76,0.15)] ${
        theme === "dark-gold" ? "bg-[#111111] border-[#c9a84c]" : "bg-white border-[#c9a84c]"
      }`}>
        {/* Gold accent line on top */}
        <div className="absolute top-0 left-0 right-0 h-[3px] bg-[#c9a84c]" />

        {/* Modal Header */}
        <div className={`p-4 sm:p-5 border-b flex items-center justify-between ${
          theme === "dark-gold" ? "border-white/10" : "border-stone-200"
        }`}>
          <div>
            <h2 className={`font-sans font-black uppercase tracking-wide flex items-center gap-2 text-sm sm:text-base ${
              theme === "dark-gold" ? "text-white" : "text-stone-900"
            }`}>
              <BookOpen className="w-5 h-5 text-[#c9a84c]" />
              Mon Carnet de Bord d'Atelier
            </h2>
            <p className={`text-[11px] mt-0.5 ${
              theme === "dark-gold" ? "text-neutral-400" : "text-stone-500"
            }`}>
              Vos analyses d'œuvres, palettes et cartels sont archivés en toute sécurité.
            </p>
          </div>
          
          <button
            onClick={onClose}
            className={`transition-colors p-1.5 ${
              theme === "dark-gold" ? "text-neutral-400 hover:text-[#c9a84c]" : "text-stone-400 hover:text-[#c9a84c]"
            }`}
            title="Fermer"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Download notification banner */}
        {downloadNotice && (
          <div className="bg-emerald-950/80 border-b border-emerald-500 text-emerald-300 px-4 py-2 text-xs flex items-center gap-2 animate-fadeIn font-sans">
            <Check className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{downloadNotice}</span>
          </div>
        )}

        {/* Top Controls: Search and Actions */}
        {historyList.length > 0 && (
          <div className={`px-4 sm:px-5 py-3 border-b flex flex-col sm:flex-row items-center justify-between gap-2.5 ${
            theme === "dark-gold" ? "bg-black/40 border-white/10" : "bg-stone-50 border-stone-200"
          }`}>
            <div className="relative w-full sm:w-64">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500" />
              <input
                type="text"
                placeholder="Rechercher une œuvre, un outil..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className={`w-full pl-8 pr-3 py-1.5 text-xs rounded-none border focus:outline-none transition-colors ${
                  theme === "dark-gold"
                    ? "bg-neutral-900 border-white/10 text-white placeholder-neutral-500 focus:border-[#c9a84c]"
                    : "bg-white border-stone-300 text-stone-900 placeholder-stone-400 focus:border-[#c9a84c]"
                }`}
              />
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm("")}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-white"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
              <button
                onClick={handleExportA4Html}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-[#c9a84c] hover:bg-white text-black text-[11px] tracking-wider uppercase font-sans font-bold transition-all shadow-sm"
                title="Télécharger le fichier A4 imprimable autonome avec toutes vos analyses"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Exporter A4 (.html)</span>
              </button>

              <button
                onClick={handleExportJson}
                className={`flex items-center gap-1.5 px-2.5 py-1.5 border text-[11px] tracking-wider uppercase font-sans font-medium transition-all ${
                  theme === "dark-gold"
                    ? "border-white/15 text-neutral-300 hover:text-white hover:border-[#c9a84c]/50 bg-black/30"
                    : "border-stone-300 text-stone-700 hover:text-stone-900 hover:border-[#c9a84c]/50 bg-white"
                }`}
                title="Sauvegarde brute JSON de vos analyses"
              >
                <Download className="w-3.5 h-3.5" />
                <span>JSON</span>
              </button>
            </div>
          </div>
        )}

        {/* Modal Content */}
        <div className="p-4 sm:p-5 overflow-y-auto flex-1 space-y-3 custom-scrollbar">
          {historyList.length === 0 ? (
            <div className="text-center py-16">
              <FileImage className="w-12 h-12 text-neutral-600 mx-auto mb-3 opacity-60" />
              <p className={`text-sm font-sans font-medium ${
                theme === "dark-gold" ? "text-neutral-300" : "text-stone-700"
              }`}>
                Votre carnet de bord est vide pour le moment.
              </p>
              <p className="text-xs text-neutral-500 mt-1 max-w-sm mx-auto font-sans leading-relaxed">
                Toutes les analyses que vous lancez s'enregistrent ici automatiquement. Vous pouvez également cliquer sur « Enregistrer dans le Carnet » depuis la fiche de résultat.
              </p>
            </div>
          ) : filteredHistory.length === 0 ? (
            <div className="text-center py-12">
              <Search className="w-8 h-8 text-neutral-500 mx-auto mb-2 opacity-50" />
              <p className="text-xs text-neutral-400 font-sans">
                Aucune entrée ne correspond à votre recherche « {searchTerm} ».
              </p>
              <button
                onClick={() => setSearchTerm("")}
                className="text-xs text-[#c9a84c] underline mt-2 font-mono"
              >
                Réinitialiser le filtre
              </button>
            </div>
          ) : (
            filteredHistory.map((item) => (
              <div
                key={item.id}
                className={`p-3 sm:p-4 flex flex-col sm:flex-row gap-3 sm:gap-4 items-start sm:items-center justify-between transition-all duration-200 rounded-none group border ${
                  theme === "dark-gold" 
                    ? "bg-[#0A0A0A] border-white/10 hover:border-[#c9a84c]/50" 
                    : "bg-stone-50 border-stone-200 hover:border-[#c9a84c]/50"
                }`}
              >
                <div className="flex gap-3.5 items-center min-w-0 flex-1">
                  {/* Miniature Image Preview */}
                  {item.imageSrc ? (
                    <div className="w-12 h-12 sm:w-14 sm:h-14 bg-black border border-white/10 flex-shrink-0 flex items-center justify-center overflow-hidden rounded-none relative">
                      <img
                        src={item.imageSrc}
                        alt="Miniature"
                        className="w-full h-full object-cover filter brightness-95 group-hover:scale-105 transition-transform duration-300"
                        referrerPolicy="no-referrer"
                      />
                    </div>
                  ) : (
                    <div className="w-12 h-12 sm:w-14 sm:h-14 bg-neutral-900 border border-white/10 flex-shrink-0 flex items-center justify-center">
                      <FileImage className="w-6 h-6 text-[#c9a84c]/60" />
                    </div>
                  )}
                  
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className={`text-[9px] sm:text-[10px] border py-0.5 px-2 rounded-none uppercase tracking-wider font-bold font-sans ${
                        theme === "dark-gold" 
                          ? "bg-[#c9a84c]/10 text-[#c9a84c] border-[#c9a84c]/20" 
                          : "bg-[#c9a84c]/10 text-[#9c7d2b] border-[#c9a84c]/30"
                      }`}>
                        {item.toolLabel}
                      </span>
                      <span className="text-[10px] text-neutral-400 flex items-center gap-1 font-mono">
                        <Calendar className="w-3 h-3" />
                        {item.date}
                      </span>
                    </div>
                    
                    <h4 className={`font-sans font-bold text-xs sm:text-sm tracking-wide mt-1.5 truncate max-w-full ${
                      theme === "dark-gold" ? "text-white" : "text-stone-900"
                    }`}>
                      {item.summary || item.toolLabel}
                    </h4>
                    <p className="text-[11px] text-neutral-400 truncate max-w-full mt-0.5 font-sans">
                      Œuvre : <span className="text-neutral-300">{item.filename}</span>
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 self-end sm:self-auto shrink-0 pt-2 sm:pt-0">
                  <button
                    onClick={() => {
                      onLoadHistoryItem(item);
                      onClose();
                    }}
                    className={`px-3 py-1.5 font-sans text-[10px] tracking-widest uppercase transition-all duration-200 rounded-none font-bold flex items-center gap-1.5 border-none shadow-sm ${
                      theme === "dark-gold"
                        ? "bg-[#c9a84c] hover:bg-white text-black"
                        : "bg-stone-900 hover:bg-[#c9a84c] hover:text-black text-white"
                    }`}
                  >
                    <Eye className="w-3.5 h-3.5" />
                    Consulter
                  </button>

                  {onDeleteItem && (
                    <button
                      onClick={() => onDeleteItem(item.id)}
                      className="p-1.5 text-neutral-500 hover:text-rose-400 transition-colors"
                      title="Supprimer cette entrée du carnet"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            ))
          )}
        </div>

        {/* Modal Footer */}
        {historyList.length > 0 && (
          <div className={`p-4 border-t flex flex-wrap justify-between items-center gap-3 ${
            theme === "dark-gold" ? "bg-black border-white/10" : "bg-stone-50 border-stone-200"
          }`}>
            <span className="text-[11px] text-neutral-400 font-mono">
              {historyList.length} entrée{historyList.length > 1 ? "s" : ""} dans votre Carnet de Bord
            </span>
            <button
              onClick={() => {
                if (confirm("Effacer définitivement l'ensemble de votre carnet local ?")) {
                  onClearHistory();
                }
              }}
              className="text-rose-400 hover:text-rose-300 text-xs font-sans tracking-wider uppercase flex items-center gap-1.5 transition-colors font-bold"
            >
              <Trash2 className="w-4 h-4" />
              Vider le Carnet de Bord
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
