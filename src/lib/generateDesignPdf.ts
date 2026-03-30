import jsPDF from 'jspdf';

export interface DesignField {
  name: string;
  label: string;
  type: string;
  placeholder: string;
  required: boolean;
  clinical_rationale: string;
}

export interface DesignStep {
  step_number: number;
  name: string;
  description: string;
  user_prompt: string;
  bot_guidance: string;
  fields: DesignField[];
}

export interface ToolDesign {
  tool_name: string;
  manual_source: string;
  protocol_overview: string;
  steps: DesignStep[];
  clinical_basis: string[];
  auto_registros_schema?: {
    description: string;
    key_metrics: string[];
  };
}

const HERBIE_PURPLE = [88, 80, 236]; // indigo-500 approx
const HERBIE_DARK = [15, 15, 20];
const GRAY = [120, 120, 135];
const LIGHT_GRAY = [240, 240, 248];
const WHITE: [number, number, number] = [255, 255, 255];

function addWrappedText(doc: jsPDF, text: string, x: number, y: number, maxWidth: number, lineHeight: number): number {
  const lines = doc.splitTextToSize(text, maxWidth);
  doc.text(lines, x, y);
  return y + lines.length * lineHeight;
}

function addSectionHeader(doc: jsPDF, title: string, y: number, pageWidth: number): number {
  doc.setFillColor(...HERBIE_PURPLE as [number, number, number]);
  doc.roundedRect(14, y - 5, pageWidth - 28, 10, 2, 2, 'F');
  doc.setTextColor(...WHITE);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.text(title.toUpperCase(), 18, y + 1.5);
  doc.setTextColor(...HERBIE_DARK as [number, number, number]);
  return y + 12;
}

function checkPageBreak(doc: jsPDF, y: number, margin: number = 20): number {
  const pageH = doc.internal.pageSize.getHeight();
  if (y > pageH - margin) {
    doc.addPage();
    return 20;
  }
  return y;
}

export function generateDesignPdf(design: ToolDesign, meta: { sources: string[]; topic: string; generated_at: string }) {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 14;
  const contentWidth = pageWidth - margin * 2;

  // ── COVER PAGE ──────────────────────────────────────────
  doc.setFillColor(...HERBIE_PURPLE as [number, number, number]);
  doc.rect(0, 0, pageWidth, 70, 'F');

  // Herbie logo area
  doc.setFillColor(...WHITE);
  doc.roundedRect(margin, 12, 30, 30, 6, 6, 'F');
  doc.setTextColor(...HERBIE_PURPLE as [number, number, number]);
  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.text('H', margin + 9, 31);

  doc.setTextColor(...WHITE);
  doc.setFontSize(22);
  doc.setFont('helvetica', 'bold');
  doc.text('Herbie Clinical Design', margin + 36, 26);
  doc.setFontSize(11);
  doc.setFont('helvetica', 'normal');
  doc.text('Especificación de Herramienta Clínica', margin + 36, 33);

  doc.setFillColor(255, 255, 255, 0.15);
  doc.setFontSize(9);
  doc.text(`Generado: ${new Date(meta.generated_at).toLocaleString('es-ES')}`, margin + 36, 42);

  // Tool Name Banner
  doc.setFillColor(...LIGHT_GRAY as [number, number, number]);
  doc.rect(0, 70, pageWidth, 50, 'F');
  doc.setTextColor(...HERBIE_PURPLE as [number, number, number]);
  doc.setFontSize(26);
  doc.setFont('helvetica', 'bold');
  const title = design.tool_name;
  const titleLines = doc.splitTextToSize(title, contentWidth);
  doc.text(titleLines, margin, 95);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...GRAY as [number, number, number]);
  doc.text(`Manual de referencia: ${design.manual_source}`, margin, 115);

  // Protocol Overview
  let y = 135;
  doc.setFillColor(...HERBIE_PURPLE as [number, number, number]);
  doc.rect(margin, y - 1, 4, 16, 'F');
  doc.setTextColor(...HERBIE_DARK as [number, number, number]);
  doc.setFontSize(13);
  doc.setFont('helvetica', 'bold');
  doc.text('Descripción del Protocolo', margin + 7, y + 8);
  y += 20;
  doc.setFontSize(9.5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(50, 50, 60);
  y = addWrappedText(doc, design.protocol_overview, margin, y, contentWidth, 5.5);

  // Steps count overview
  y += 8;
  doc.setFillColor(...LIGHT_GRAY as [number, number, number]);
  doc.roundedRect(margin, y, contentWidth, 16, 3, 3, 'F');
  doc.setTextColor(...HERBIE_PURPLE as [number, number, number]);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.text(`${design.steps.length} Pasos del Wizard  ·  ${design.steps.reduce((acc, s) => acc + (s.fields?.length || 0), 0)} Campos de Registro`, margin + 4, y + 10);

  // Page footer
  doc.setTextColor(...GRAY as [number, number, number]);
  doc.setFontSize(7);
  doc.text('Herbie AI — Documento generado automáticamente con base en protocolos clínicos validados', pageWidth / 2, pageHeight - 8, { align: 'center' });

  // ── STEPS PAGES ─────────────────────────────────────────
  for (const step of design.steps) {
    doc.addPage();
    y = 20;

    // Step header
    doc.setFillColor(...HERBIE_PURPLE as [number, number, number]);
    doc.roundedRect(margin, y, contentWidth, 18, 4, 4, 'F');
    doc.setTextColor(...WHITE);
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.text(`PASO ${step.step_number}`, margin + 5, y + 6);
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text(step.name, margin + 5, y + 14);
    y += 26;

    // Step description
    doc.setTextColor(50, 50, 60);
    doc.setFontSize(9.5);
    doc.setFont('helvetica', 'italic');
    y = addWrappedText(doc, step.description, margin, y, contentWidth, 5.5);
    y += 6;

    // User prompt
    doc.setFillColor(245, 245, 255);
    const promptLines = doc.splitTextToSize(step.user_prompt, contentWidth - 10);
    doc.roundedRect(margin, y, contentWidth, promptLines.length * 5.5 + 10, 3, 3, 'F');
    doc.setTextColor(...HERBIE_PURPLE as [number, number, number]);
    doc.setFontSize(7.5);
    doc.setFont('helvetica', 'bold');
    doc.text('INSTRUCCIÓN PARA EL USUARIO', margin + 5, y + 6);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(50, 50, 60);
    doc.setFontSize(9);
    doc.text(promptLines, margin + 5, y + 12);
    y += promptLines.length * 5.5 + 16;

    // Bot guidance
    y = checkPageBreak(doc, y);
    y = addSectionHeader(doc, '🤖 Guión de Herbie (Bot de guía)', y, pageWidth);
    doc.setFillColor(248, 248, 255);
    const guidanceLines = doc.splitTextToSize(step.bot_guidance, contentWidth - 10);
    doc.roundedRect(margin, y, contentWidth, guidanceLines.length * 5 + 10, 3, 3, 'F');
    doc.setTextColor(40, 40, 60);
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.text(guidanceLines, margin + 5, y + 8);
    y += guidanceLines.length * 5 + 16;

    // Fields
    if (step.fields && step.fields.length > 0) {
      y = checkPageBreak(doc, y);
      y = addSectionHeader(doc, `Campos de Registro (${step.fields.length})`, y, pageWidth);

      for (const field of step.fields) {
        y = checkPageBreak(doc, y, 40);
        doc.setFillColor(250, 250, 255);
        doc.roundedRect(margin, y, contentWidth, 28, 3, 3, 'F');
        doc.setDrawColor(...HERBIE_PURPLE as [number, number, number]);
        doc.setLineWidth(0.3);
        doc.line(margin + 4, y + 2, margin + 4, y + 26);

        doc.setTextColor(...HERBIE_PURPLE as [number, number, number]);
        doc.setFontSize(9);
        doc.setFont('helvetica', 'bold');
        doc.text(field.label, margin + 8, y + 8);
        doc.setTextColor(...GRAY as [number, number, number]);
        doc.setFontSize(7.5);
        doc.setFont('helvetica', 'normal');
        doc.text(`Tipo: ${field.type}  ·  ${field.required ? 'Obligatorio' : 'Opcional'}`, margin + 8, y + 14);
        const rationaleLines = doc.splitTextToSize(field.clinical_rationale || field.placeholder, contentWidth - 16);
        doc.setTextColor(60, 60, 70);
        doc.setFontSize(8);
        doc.text(rationaleLines.slice(0, 2), margin + 8, y + 20);
        y += 32;
      }
    }

    // Footer
    doc.setTextColor(...GRAY as [number, number, number]);
    doc.setFontSize(7);
    doc.text(`${design.tool_name}  ·  Paso ${step.step_number} de ${design.steps.length}`, pageWidth / 2, pageHeight - 8, { align: 'center' });
  }

  // ── CLINICAL BASIS PAGE ──────────────────────────────────
  if (design.clinical_basis && design.clinical_basis.length > 0) {
    doc.addPage();
    y = 20;
    y = addSectionHeader(doc, '📖 Justificación Clínica — Extractos del Manual', y, pageWidth);
    y += 4;

    for (let i = 0; i < design.clinical_basis.length; i++) {
      y = checkPageBreak(doc, y, 30);
      doc.setFillColor(...LIGHT_GRAY as [number, number, number]);
      const quoteLines = doc.splitTextToSize(`"${design.clinical_basis[i]}"`, contentWidth - 20);
      doc.roundedRect(margin, y, contentWidth, quoteLines.length * 5.5 + 14, 3, 3, 'F');
      doc.setFillColor(...HERBIE_PURPLE as [number, number, number]);
      doc.rect(margin, y, 3, quoteLines.length * 5.5 + 14, 'F');
      doc.setTextColor(40, 40, 60);
      doc.setFontSize(9);
      doc.setFont('helvetica', 'italic');
      doc.text(quoteLines, margin + 8, y + 8);
      y += quoteLines.length * 5.5 + 18;
    }

    // Metrics
    if (design.auto_registros_schema) {
      y = checkPageBreak(doc, y);
      y += 6;
      y = addSectionHeader(doc, '📊 Métricas de Autorregistro Sugeridas', y, pageWidth);
      y += 4;
      doc.setFontSize(9);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(50, 50, 60);
      y = addWrappedText(doc, design.auto_registros_schema.description, margin, y, contentWidth, 5.5);
      y += 6;
      for (const metric of design.auto_registros_schema.key_metrics) {
        doc.setFillColor(...HERBIE_PURPLE as [number, number, number]);
        doc.circle(margin + 3, y - 1, 1.5, 'F');
        doc.setTextColor(40, 40, 60);
        doc.text(metric, margin + 8, y);
        y += 6;
      }
    }

    doc.setTextColor(...GRAY as [number, number, number]);
    doc.setFontSize(7);
    doc.text('Herbie AI — Documento generado automáticamente con base en protocolos clínicos validados', pageWidth / 2, pageHeight - 8, { align: 'center' });
  }

  doc.save(`herbie-design-${design.tool_name.toLowerCase().replace(/\s+/g, '-')}.pdf`);
}
