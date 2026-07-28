import jsPDF from "jspdf";
import type { CaseAnalysis, CaseComparison, CaseContent, ChatMessage, PrecedentAnalysis } from "./types";

interface ExportParams {
  caseContent?: CaseContent;
  summary?: string;
  messages?: ChatMessage[];
  analysis?: CaseAnalysis;
  precedents?: PrecedentAnalysis;
  title: string;
}

interface ComparisonExportParams {
  comparison: CaseComparison;
  cases: { ecli: string; metadata: Record<string, string> }[];
  title: string;
}

const PAGE_MARGIN = 20;
const FOOTER_HEIGHT = 16;
const BODY_FONT_SIZE = 11;
const HEADING_FONT_SIZE = 14;
const SUBHEADING_FONT_SIZE = 12;
const LINE_HEIGHT_RATIO = 1.55;

const COLOR_DARK: [number, number, number] = [15, 30, 60];
const COLOR_BODY: [number, number, number] = [40, 40, 40];
const COLOR_MUTED: [number, number, number] = [100, 100, 100];
const COLOR_RULE: [number, number, number] = [200, 200, 210];

function stripMarkdown(text: string): string {
  return text
    .replace(/^#{1,6}\s+(.+)$/gm, "$1")
    .replace(/\*\*(.+?)\*\*/g, "$1")
    .replace(/\*(.+?)\*/g, "$1")
    .replace(/__(.+?)__/g, "$1")
    .replace(/_(.+?)_/g, "$1")
    .replace(/`(.+?)`/g, "$1")
    .replace(/\[(.+?)\]\(.+?\)/g, "$1")
    .replace(/^\s*[-*+]\s+/gm, "\u2022 ")
    .replace(/^\s*(\d+)\.\s+/gm, "$1. ")
    .replace(/^\s*>\s+/gm, "")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function cleanCaseText(raw: string): string {
  // Strip leading XML/metadata block before the actual legal text
  const markers = [
    "RECHTBANK",
    "GERECHTSHOF",
    "RAAD VAN STATE",
    "CENTRALE RAAD",
    "HOGE RAAD",
    "Uitspraak",
  ];
  for (const marker of markers) {
    const idx = raw.indexOf(marker);
    if (idx !== -1 && idx < 2000) {
      return raw.substring(idx);
    }
  }
  return raw;
}

export function exportToPDF({ caseContent, summary, messages, analysis, precedents, title }: ExportParams) {
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });

  const pageW = doc.internal.pageSize.getWidth();
  const pageH = doc.internal.pageSize.getHeight();
  const contentW = pageW - PAGE_MARGIN * 2;
  const bottomBoundary = pageH - FOOTER_HEIGHT - PAGE_MARGIN;

  let y = PAGE_MARGIN;

  function mmPerLine(fontSize: number) {
    return (fontSize * LINE_HEIGHT_RATIO) / 2.83;
  }

  function ensureSpace(needed: number) {
    if (y + needed > bottomBoundary) {
      doc.addPage();
      y = PAGE_MARGIN + 6;
    }
  }

  function writeText(
    text: string,
    opts: {
      size?: number;
      style?: "normal" | "bold" | "italic";
      color?: [number, number, number];
      afterGap?: number;
    } = {},
  ) {
    const size = opts.size ?? BODY_FONT_SIZE;
    const style = opts.style ?? "normal";
    const color = opts.color ?? COLOR_BODY;
    const afterGap = opts.afterGap ?? 3;

    doc.setFont("helvetica", style);
    doc.setFontSize(size);
    doc.setTextColor(...color);

    const lines = doc.splitTextToSize(text, contentW) as string[];
    const lh = mmPerLine(size);

    for (const line of lines) {
      ensureSpace(lh);
      doc.text(line, PAGE_MARGIN, y);
      y += lh;
    }
    y += afterGap;
  }

  function writeSectionHeading(text: string) {
    ensureSpace(14);
    y += 2;
    doc.setFont("helvetica", "bold");
    doc.setFontSize(HEADING_FONT_SIZE);
    doc.setTextColor(...COLOR_DARK);
    const lines = doc.splitTextToSize(text, contentW) as string[];
    const lh = mmPerLine(HEADING_FONT_SIZE);
    for (const line of lines) {
      ensureSpace(lh);
      doc.text(line, PAGE_MARGIN, y);
      y += lh;
    }
    // underline beneath the heading
    doc.setDrawColor(...COLOR_DARK);
    doc.setLineWidth(0.5);
    doc.line(PAGE_MARGIN, y, pageW - PAGE_MARGIN, y);
    y += 5;
  }

  function writeDivider() {
    ensureSpace(8);
    y += 3;
    doc.setDrawColor(...COLOR_RULE);
    doc.setLineWidth(0.25);
    doc.line(PAGE_MARGIN, y, pageW - PAGE_MARGIN, y);
    y += 6;
  }

  function writeBullet(text: string) {
    const indent = 6;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(BODY_FONT_SIZE);
    doc.setTextColor(...COLOR_BODY);
    const lines = doc.splitTextToSize(text, contentW - indent) as string[];
    const lh = mmPerLine(BODY_FONT_SIZE);
    for (let i = 0; i < lines.length; i++) {
      ensureSpace(lh);
      if (i === 0) doc.text("\u2022", PAGE_MARGIN, y);
      doc.text(lines[i], PAGE_MARGIN + indent, y);
      y += lh;
    }
    y += 2;
  }

  function writeTable(headers: string[], rows: string[][], colWidths?: number[]) {
    const colCount = headers.length;
    const tableW = contentW;
    const widths = colWidths || Array(colCount).fill(tableW / colCount);

    const headerLh = mmPerLine(BODY_FONT_SIZE);
    const rowLh = mmPerLine(BODY_FONT_SIZE);
    const cellPad = 2;

    // Header row
    ensureSpace(headerLh + cellPad * 2 + 2);
    doc.setFillColor(...COLOR_DARK);
    doc.rect(PAGE_MARGIN, y, tableW, headerLh + cellPad * 2, "F");
    doc.setFont("helvetica", "bold");
    doc.setFontSize(BODY_FONT_SIZE);
    doc.setTextColor(255, 255, 255);
    let xh = PAGE_MARGIN + cellPad;
    for (let c = 0; c < colCount; c++) {
      const headerLines = doc.splitTextToSize(headers[c], widths[c] - cellPad * 2) as string[];
      doc.text(headerLines[0] || "", xh, y + headerLh + cellPad - 1);
      xh += widths[c];
    }
    y += headerLh + cellPad * 2;

    // Data rows
    doc.setFont("helvetica", "normal");
    doc.setFontSize(BODY_FONT_SIZE);
    doc.setTextColor(...COLOR_BODY);

    for (let r = 0; r < rows.length; r++) {
      const row = rows[r];
      // Calculate max lines across all cells in this row
      let maxLines = 1;
      for (let c = 0; c < colCount; c++) {
        const cellLines = doc.splitTextToSize(row[c] || "", widths[c] - cellPad * 2) as string[];
        if (cellLines.length > maxLines) maxLines = cellLines.length;
      }
      const rowHeight = maxLines * rowLh + cellPad * 2;

      ensureSpace(rowHeight + 1);

      // Alternating row background
      if (r % 2 === 0) {
        doc.setFillColor(245, 247, 250);
        doc.rect(PAGE_MARGIN, y, tableW, rowHeight, "F");
      }

      // Cell borders
      doc.setDrawColor(...COLOR_RULE);
      doc.setLineWidth(0.2);
      let xc = PAGE_MARGIN;
      for (let c = 0; c < colCount; c++) {
        doc.rect(xc, y, widths[c], rowHeight);
        xc += widths[c];
      }

      // Cell text
      let xCell = PAGE_MARGIN + cellPad;
      for (let c = 0; c < colCount; c++) {
        const cellLines = doc.splitTextToSize(row[c] || "", widths[c] - cellPad * 2) as string[];
        for (let l = 0; l < cellLines.length; l++) {
          doc.text(cellLines[l], xCell, y + cellPad + rowLh - 1 + l * rowLh);
        }
        xCell += widths[c];
      }
      y += rowHeight;
    }
    y += 4;
  }

  function writeMetaRow(label: string, value: string) {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(BODY_FONT_SIZE);
    doc.setTextColor(...COLOR_DARK);
    const labelW = doc.getTextWidth(label + "  ");
    ensureSpace(mmPerLine(BODY_FONT_SIZE) + 2);
    doc.text(label, PAGE_MARGIN, y);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(...COLOR_BODY);
    const valueLines = doc.splitTextToSize(value, contentW - labelW) as string[];
    const lh = mmPerLine(BODY_FONT_SIZE);
    for (let i = 0; i < valueLines.length; i++) {
      if (i > 0) ensureSpace(lh);
      doc.text(valueLines[i], PAGE_MARGIN + labelW, y);
      if (i < valueLines.length - 1) y += lh;
    }
    y += lh + 1;
  }

  // ── Cover header bar ──
  doc.setFillColor(...COLOR_DARK);
  doc.rect(0, 0, pageW, 32, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(17);
  doc.text("Legal Case Analysis Report", PAGE_MARGIN, 14);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(180, 195, 220);
  doc.text("Rechtspraak.nl  |  AI-Powered Legal Research", PAGE_MARGIN, 21);
  doc.text(
    `Generated: ${new Date().toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })}`,
    PAGE_MARGIN,
    27,
  );

  y = 42;

  // ── Case title ──
  writeText(title, { size: SUBHEADING_FONT_SIZE + 1, style: "bold", color: COLOR_DARK, afterGap: 5 });

  // ── Metadata table ──
  if (caseContent) {
    const meta = caseContent.metadata ?? {};
    writeMetaRow("ECLI:", caseContent.ecli);
    if (meta.creator) writeMetaRow("Court:", meta.creator);
    if (meta.date) writeMetaRow("Date:", meta.date);
    if (meta.zaaknummer) writeMetaRow("Case No.:", meta.zaaknummer);
    if (meta.subject) writeMetaRow("Subject:", meta.subject);
  }

  writeDivider();

  // ── AI Summary ──
  if (summary) {
    writeSectionHeading("Summary");
    writeText(stripMarkdown(summary), { afterGap: 4 });
    writeDivider();
  }

  // ── Q&A ──
  if (messages && messages.length > 0) {
    let first = true;
    for (const msg of messages) {
      if (msg.role === "user") {
        if (!first) writeDivider();
        first = false;
        writeSectionHeading(msg.content);
      } else {
        writeText(stripMarkdown(msg.content), { afterGap: 4 });
      }
    }
    writeDivider();
  }

  // ── AI Analysis ──
  if (analysis) {
    writeSectionHeading("Legal Analysis");

    if (analysis.legalArea) {
      writeText(`Legal Area: ${analysis.legalArea}`, { style: "bold", color: COLOR_DARK, afterGap: 3 });
    }

    if (analysis.legalPrinciples?.length > 0) {
      writeText("Legal Principles", { size: SUBHEADING_FONT_SIZE, style: "bold", color: COLOR_DARK, afterGap: 2 });
      for (const p of analysis.legalPrinciples) writeBullet(p);
      y += 2;
    }

    if (analysis.keyArguments?.length > 0) {
      writeText("Key Arguments", { size: SUBHEADING_FONT_SIZE, style: "bold", color: COLOR_DARK, afterGap: 2 });
      writeTable(
        ["Party", "Argument", "Outcome"],
        analysis.keyArguments.map((a) => [a.party, a.argument, a.outcome]),
        [contentW * 0.18, contentW * 0.52, contentW * 0.30],
      );
    }

    if (analysis.citedLegislation?.length > 0) {
      writeText("Cited Legislation", { size: SUBHEADING_FONT_SIZE, style: "bold", color: COLOR_DARK, afterGap: 2 });
      writeTable(
        ["Title", "Articles", "Relevance"],
        analysis.citedLegislation.map((l) => [l.title, l.articles.join(", "), l.relevance]),
        [contentW * 0.25, contentW * 0.25, contentW * 0.50],
      );
    }

    if (analysis.referencedCases?.length > 0) {
      writeText("Referenced Cases", { size: SUBHEADING_FONT_SIZE, style: "bold", color: COLOR_DARK, afterGap: 2 });
      writeTable(
        ["ECLI", "Title", "How Referenced"],
        analysis.referencedCases.map((c) => [c.ecli, c.title, c.how]),
        [contentW * 0.25, contentW * 0.35, contentW * 0.40],
      );
    }

    if (analysis.timeline?.length > 0) {
      writeText("Timeline", { size: SUBHEADING_FONT_SIZE, style: "bold", color: COLOR_DARK, afterGap: 2 });
      writeTable(
        ["Date", "Event"],
        analysis.timeline.map((t) => [t.date, t.event]),
        [contentW * 0.25, contentW * 0.75],
      );
    }

    if (analysis.outcome) {
      writeText("Outcome", { size: SUBHEADING_FONT_SIZE, style: "bold", color: COLOR_DARK, afterGap: 2 });
      writeText(analysis.outcome, { afterGap: 3 });
    }

    if (analysis.significance) {
      writeText("Significance", { size: SUBHEADING_FONT_SIZE, style: "bold", color: COLOR_DARK, afterGap: 2 });
      writeText(analysis.significance, { afterGap: 4 });
    }

    writeDivider();
  }

  // ── Similar Precedents ──
  if (precedents) {
    writeSectionHeading("Similar Precedents");

    if (precedents.precedentSummary) {
      writeText(precedents.precedentSummary, { afterGap: 4 });
    }

    if (precedents.similarPrecedents?.length > 0) {
      writeTable(
        ["ECLI", "Title", "Similarity", "Reason", "Key Difference"],
        precedents.similarPrecedents.map((p) => [
          p.ecli,
          p.title,
          p.similarity,
          p.reason,
          p.keyDifference,
        ]),
        [contentW * 0.16, contentW * 0.20, contentW * 0.12, contentW * 0.26, contentW * 0.26],
      );
    }

    writeDivider();
  }

  // ── Case text ──
  if (caseContent?.text) {
    writeSectionHeading("Case Text");
    const cleaned = cleanCaseText(caseContent.text).substring(0, 6000);
    writeText(cleaned, { color: COLOR_BODY, afterGap: 3 });
    if (caseContent.text.length > 6000) {
      writeText(
        `[ ... truncated — full text is ${caseContent.text.length.toLocaleString()} characters ]`,
        { style: "italic", color: COLOR_MUTED, afterGap: 0 },
      );
    }
  }

  // ── Footer on every page ──
  const total = doc.getNumberOfPages();
  for (let p = 1; p <= total; p++) {
    doc.setPage(p);
    doc.setDrawColor(...COLOR_RULE);
    doc.setLineWidth(0.25);
    doc.line(PAGE_MARGIN, pageH - FOOTER_HEIGHT, pageW - PAGE_MARGIN, pageH - FOOTER_HEIGHT);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(...COLOR_MUTED);
    doc.text(
      "For informational purposes only. Does not constitute legal advice.",
      PAGE_MARGIN,
      pageH - 10,
    );
    doc.text(`Page ${p} of ${total}`, pageW - PAGE_MARGIN, pageH - 10, { align: "right" });
  }

  doc.save(`${title.replace(/[^a-zA-Z0-9]/g, "_")}.pdf`);
}

export function exportComparisonToPDF({ comparison, cases, title }: ComparisonExportParams) {
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });

  const pageW = doc.internal.pageSize.getWidth();
  const pageH = doc.internal.pageSize.getHeight();
  const contentW = pageW - PAGE_MARGIN * 2;
  const bottomBoundary = pageH - FOOTER_HEIGHT - PAGE_MARGIN;

  let y = PAGE_MARGIN;

  function mmPerLine(fontSize: number) {
    return (fontSize * LINE_HEIGHT_RATIO) / 2.83;
  }

  function ensureSpace(needed: number) {
    if (y + needed > bottomBoundary) {
      doc.addPage();
      y = PAGE_MARGIN + 6;
    }
  }

  function writeText(
    text: string,
    opts: {
      size?: number;
      style?: "normal" | "bold" | "italic";
      color?: [number, number, number];
      afterGap?: number;
    } = {},
  ) {
    const size = opts.size ?? BODY_FONT_SIZE;
    const style = opts.style ?? "normal";
    const color = opts.color ?? COLOR_BODY;
    const afterGap = opts.afterGap ?? 3;

    doc.setFont("helvetica", style);
    doc.setFontSize(size);
    doc.setTextColor(...color);

    const lines = doc.splitTextToSize(text, contentW) as string[];
    const lh = mmPerLine(size);

    for (const line of lines) {
      ensureSpace(lh);
      doc.text(line, PAGE_MARGIN, y);
      y += lh;
    }
    y += afterGap;
  }

  function writeSectionHeading(text: string) {
    ensureSpace(14);
    y += 2;
    doc.setFont("helvetica", "bold");
    doc.setFontSize(HEADING_FONT_SIZE);
    doc.setTextColor(...COLOR_DARK);
    const lines = doc.splitTextToSize(text, contentW) as string[];
    const lh = mmPerLine(HEADING_FONT_SIZE);
    for (const line of lines) {
      ensureSpace(lh);
      doc.text(line, PAGE_MARGIN, y);
      y += lh;
    }
    doc.setDrawColor(...COLOR_DARK);
    doc.setLineWidth(0.5);
    doc.line(PAGE_MARGIN, y, pageW - PAGE_MARGIN, y);
    y += 5;
  }

  function writeDivider() {
    ensureSpace(8);
    y += 3;
    doc.setDrawColor(...COLOR_RULE);
    doc.setLineWidth(0.25);
    doc.line(PAGE_MARGIN, y, pageW - PAGE_MARGIN, y);
    y += 6;
  }

  function writeBullet(text: string) {
    const indent = 6;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(BODY_FONT_SIZE);
    doc.setTextColor(...COLOR_BODY);
    const lines = doc.splitTextToSize(text, contentW - indent) as string[];
    const lh = mmPerLine(BODY_FONT_SIZE);
    for (let i = 0; i < lines.length; i++) {
      ensureSpace(lh);
      if (i === 0) doc.text("\u2022", PAGE_MARGIN, y);
      doc.text(lines[i], PAGE_MARGIN + indent, y);
      y += lh;
    }
    y += 2;
  }

  // ── Cover header bar ──
  doc.setFillColor(...COLOR_DARK);
  doc.rect(0, 0, pageW, 32, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(17);
  doc.text("Case Comparison Report", PAGE_MARGIN, 14);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(180, 195, 220);
  doc.text("Rechtspraak.nl  |  AI-Powered Legal Research", PAGE_MARGIN, 21);
  doc.text(
    `Generated: ${new Date().toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })}`,
    PAGE_MARGIN,
    27,
  );

  y = 42;

  // ── Title ──
  writeText(title, { size: SUBHEADING_FONT_SIZE + 1, style: "bold", color: COLOR_DARK, afterGap: 5 });

  // ── Cases compared ──
  writeSectionHeading("Cases Compared");
  for (const c of cases) {
    const meta = c.metadata || {};
    writeText(c.ecli, { size: BODY_FONT_SIZE, style: "bold", color: COLOR_DARK, afterGap: 1 });
    if (meta.title) writeText(meta.title, { size: BODY_FONT_SIZE - 1, color: COLOR_BODY, afterGap: 1 });
    const metaParts: string[] = [];
    if (meta.creator) metaParts.push(meta.creator);
    if (meta.date) metaParts.push(meta.date);
    if (metaParts.length > 0) writeText(metaParts.join("  |  "), { size: 9, color: COLOR_MUTED, afterGap: 4 });
  }

  writeDivider();

  // ── Comparative summary ──
  if (comparison.comparativeSummary) {
    writeSectionHeading("Comparative Summary");
    writeText(comparison.comparativeSummary, { afterGap: 4 });
    writeDivider();
  }

  // ── Common principles ──
  if (comparison.commonPrinciples?.length > 0) {
    writeSectionHeading("Common Principles");
    for (const p of comparison.commonPrinciples) {
      writeBullet(p);
    }
    writeDivider();
  }

  // ── Convergence ──
  if (comparison.convergencePoints?.length > 0) {
    writeSectionHeading("Convergence Points");
    for (const c of comparison.convergencePoints) {
      writeBullet(c);
    }
    writeDivider();
  }

  // ── Divergence ──
  if (comparison.divergencePoints?.length > 0) {
    writeSectionHeading("Divergence Points");
    for (const d of comparison.divergencePoints) {
      writeBullet(d);
    }
    writeDivider();
  }

  // ── Key differences ──
  if (comparison.differences?.length > 0) {
    writeSectionHeading("Key Differences");
    for (const diff of comparison.differences) {
      writeText(diff.topic, { size: SUBHEADING_FONT_SIZE, style: "bold", color: COLOR_DARK, afterGap: 2 });
      for (const pos of diff.positions) {
        writeText(`${pos.ecli}: ${pos.position}`, { afterGap: 2 });
      }
      y += 2;
    }
    writeDivider();
  }

  // ── Legal evolution ──
  if (comparison.legalEvolution) {
    writeSectionHeading("Legal Evolution");
    writeText(comparison.legalEvolution, { afterGap: 4 });
  }

  // ── Footer on every page ──
  const total = doc.getNumberOfPages();
  for (let p = 1; p <= total; p++) {
    doc.setPage(p);
    doc.setDrawColor(...COLOR_RULE);
    doc.setLineWidth(0.25);
    doc.line(PAGE_MARGIN, pageH - FOOTER_HEIGHT, pageW - PAGE_MARGIN, pageH - FOOTER_HEIGHT);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(...COLOR_MUTED);
    doc.text(
      "For informational purposes only. Does not constitute legal advice.",
      PAGE_MARGIN,
      pageH - 10,
    );
    doc.text(`Page ${p} of ${total}`, pageW - PAGE_MARGIN, pageH - 10, { align: "right" });
  }

  doc.save(`${title.replace(/[^a-zA-Z0-9]/g, "_")}_comparison.pdf`);
}
