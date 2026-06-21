import { jsPDF } from "jspdf";
import type { ProduceAnalysis, Recommendation, Intent } from "./ai-analysis";
import { INTENT_LABELS, RECOMMENDATION_LABELS } from "./ai-analysis";
import { deriveSignals } from "./signals";

const BRAND = { r: 16, g: 91, b: 73 }; // deep green
const ACCENT = { r: 234, g: 179, b: 8 };

function header(doc: jsPDF, title: string, subtitle: string) {
  doc.setFillColor(BRAND.r, BRAND.g, BRAND.b);
  doc.rect(0, 0, 210, 32, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(18);
  doc.text("AgriVision AI", 14, 14);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.text(title, 14, 22);
  doc.setFontSize(8);
  doc.text(subtitle, 14, 28);
  doc.setTextColor(20, 20, 20);
}

function footer(doc: jsPDF) {
  const h = doc.internal.pageSize.getHeight();
  doc.setFontSize(8);
  doc.setTextColor(120, 120, 120);
  doc.text(`Generated ${new Date().toLocaleString()} · AgriVision AI`, 14, h - 8);
}

export interface ScanRecord {
  produce_name: string;
  intent: Intent | string;
  ripeness: string;
  ripeness_score: number | string;
  confidence: number | string;
  recommendation: Recommendation | string;
  reasoning: string | null;
  image_url: string | null;
  analysis: ProduceAnalysis | any;
  created_at: string;
}

export function exportScanPdf(scan: ScanRecord) {
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  header(doc, `Scan Report · ${scan.produce_name}`, new Date(scan.created_at).toLocaleString());

  let y = 42;
  if (scan.image_url && scan.image_url.startsWith("data:image/")) {
    try {
      doc.addImage(scan.image_url, "JPEG", 14, y, 60, 60);
    } catch {}
  }

  doc.setFont("helvetica", "bold");
  doc.setFontSize(20);
  doc.text(scan.produce_name, 82, y + 8);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.setTextColor(80, 80, 80);
  doc.text(`Intent: ${INTENT_LABELS[scan.intent as Intent] ?? String(scan.intent)}`, 82, y + 16);
  doc.text(`Ripeness: ${String(scan.ripeness).replace(/_/g, " ")} · ${Number(scan.ripeness_score).toFixed(0)}%`, 82, y + 22);
  doc.text(`Confidence: ${Math.round(Number(scan.confidence) * 100)}%`, 82, y + 28);

  doc.setFillColor(ACCENT.r, ACCENT.g, ACCENT.b);
  doc.roundedRect(82, y + 34, 70, 10, 2, 2, "F");
  doc.setTextColor(20, 20, 20);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.text(
    `Recommendation: ${RECOMMENDATION_LABELS[scan.recommendation as Recommendation] ?? String(scan.recommendation)}`,
    85,
    y + 41,
  );

  y += 70;
  doc.setTextColor(20, 20, 20);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.text("Reasoning", 14, y);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  const wrapped = doc.splitTextToSize(scan.reasoning || "—", 180);
  doc.text(wrapped, 14, y + 6);
  y += 6 + wrapped.length * 5 + 6;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.text("Signal breakdown", 14, y);
  y += 6;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);

  const signals = deriveSignals(scan.analysis as ProduceAnalysis);
  for (const s of signals) {
    if (y > 270) { doc.addPage(); y = 20; }
    doc.setFont("helvetica", "bold");
    doc.text(`${s.label} — ${s.value}`, 14, y);
    doc.setFont("helvetica", "normal");
    const d = doc.splitTextToSize(s.detail, 180);
    doc.text(d, 14, y + 5);
    // bar
    doc.setFillColor(230, 230, 230);
    doc.rect(14, y + 5 + d.length * 4 + 1, 180, 2, "F");
    const color = s.impact === "positive" ? [16, 185, 129] : s.impact === "neutral" ? [59, 130, 246] : [239, 68, 68];
    doc.setFillColor(color[0], color[1], color[2]);
    doc.rect(14, y + 5 + d.length * 4 + 1, (180 * s.score) / 100, 2, "F");
    y += 5 + d.length * 4 + 10;
  }

  footer(doc);
  doc.save(`agrivision-scan-${scan.produce_name.toLowerCase().replace(/\s+/g, "-")}.pdf`);
}

export interface ComparisonItem {
  rank: number;
  produceName: string;
  ripeness: string;
  ripenessScore: number;
  confidence: number;
  recommendation: Recommendation | string;
  reasoning: string;
  score: number;
}

export function exportComparisonPdf(intent: Intent | string, items: ComparisonItem[]) {
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  header(doc, `Comparison Report · ${INTENT_LABELS[intent as Intent] ?? String(intent)}`, new Date().toLocaleString());

  let y = 42;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(14);
  doc.text(`Winner: ${items[0]?.produceName ?? "—"}`, 14, y);
  y += 8;

  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.text(`Ranked ${items.length} items by intent fit. Highest match score wins.`, 14, y);
  y += 8;

  for (const it of items) {
    if (y > 260) { doc.addPage(); y = 20; }
    doc.setFillColor(it.rank === 1 ? ACCENT.r : 245, it.rank === 1 ? ACCENT.g : 245, it.rank === 1 ? ACCENT.b : 245);
    doc.roundedRect(14, y, 182, 26, 2, 2, "F");
    doc.setTextColor(20, 20, 20);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.text(`#${it.rank} · ${it.produceName}`, 18, y + 7);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.text(
      `${RECOMMENDATION_LABELS[it.recommendation as Recommendation] ?? String(it.recommendation)} · ${it.score}% match · ${Math.round(it.confidence * 100)}% confidence`,
      18, y + 13,
    );
    const reason = doc.splitTextToSize(it.reasoning, 174);
    doc.text(reason.slice(0, 2), 18, y + 19);
    y += 30;
  }

  footer(doc);
  doc.save(`agrivision-comparison-${Date.now()}.pdf`);
}
