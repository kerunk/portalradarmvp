// Report Export - PDF and Excel (CSV) generation
import jsPDF from 'jspdf';
import type { ExecutiveReportData, TurmaReportData, NucleoReportData, CoverageReportData, CycleReportData, CollaboratorProgressData, SectorMaturityData } from './reportData';

// ============ COLORS ============
const TEAL: [number, number, number] = [20, 90, 90];
const TEXT: [number, number, number] = [30, 30, 30];
const GRAY: [number, number, number] = [120, 120, 120];
const GREEN: [number, number, number] = [34, 160, 80];
const ORANGE: [number, number, number] = [220, 150, 30];
const RED: [number, number, number] = [200, 60, 60];
const LIGHT_BG: [number, number, number] = [245, 248, 250];
const WHITE: [number, number, number] = [255, 255, 255];

// ============ HELPERS ============
function addHeader(doc: jsPDF, title: string, subtitle: string) {
  doc.setFillColor(...TEAL);
  doc.rect(0, 0, 210, 38, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(20);
  doc.setFont('helvetica', 'bold');
  doc.text(title, 20, 18);
  doc.setFontSize(11);
  doc.setFont('helvetica', 'normal');
  doc.text(subtitle, 20, 28);
  doc.setFontSize(8);
  doc.text(`Gerado em: ${new Date().toLocaleDateString('pt-BR')} às ${new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`, 20, 35);
}

function addPageHeader(doc: jsPDF, title: string) {
  doc.setFillColor(...TEAL);
  doc.rect(0, 0, 210, 18, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text(title, 20, 12);
}

function addFooter(doc: jsPDF, pageNum: number) {
  const pageCount = doc.getNumberOfPages();
  doc.setFillColor(...TEAL);
  doc.rect(0, 280, 210, 17, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(8);
  doc.text('MVP Portal — Relatório Executivo', 20, 289);
  doc.text(`Página ${pageNum} de ${pageCount}`, 170, 289);
}

function addSectionTitle(doc: jsPDF, title: string, yPos: number): number {
  doc.setFillColor(...TEAL);
  doc.rect(15, yPos, 4, 12, 'F');
  doc.setTextColor(...TEXT);
  doc.setFontSize(13);
  doc.setFont('helvetica', 'bold');
  doc.text(title, 23, yPos + 9);
  return yPos + 18;
}

function checkPage(doc: jsPDF, yPos: number, needed: number = 30): number {
  if (yPos + needed > 270) {
    doc.addPage();
    return 20;
  }
  return yPos;
}

function addMetricBox(doc: jsPDF, x: number, y: number, w: number, value: string, label: string, color?: [number, number, number]) {
  doc.setFillColor(...LIGHT_BG);
  doc.roundedRect(x, y, w, 28, 2, 2, 'F');
  doc.setTextColor(...(color || TEXT));
  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.text(value, x + w / 2, y + 13, { align: 'center' });
  doc.setTextColor(...GRAY);
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.text(label, x + w / 2, y + 22, { align: 'center' });
}

function addProgressBar(doc: jsPDF, x: number, y: number, w: number, pct: number, label?: string) {
  doc.setFillColor(230, 230, 230);
  doc.roundedRect(x, y, w, 5, 1, 1, 'F');
  if (pct > 0) {
    doc.setFillColor(...(pct >= 60 ? GREEN : pct >= 30 ? ORANGE : RED));
    doc.roundedRect(x, y, w * Math.min(pct, 100) / 100, 5, 1, 1, 'F');
  }
  if (label) {
    doc.setTextColor(...GRAY);
    doc.setFontSize(7);
    doc.text(label, x + w + 3, y + 4);
  }
}

// ============ EXECUTIVE PDF (IMPROVED MULTI-PAGE) ============
export function exportExecutivePDF(data: ExecutiveReportData) {
  const doc = new jsPDF();
  const statusLabels: Record<string, string> = { pending: 'Pendente', in_progress: 'Em andamento', ready_to_close: 'Pronto p/ encerrar', closed: 'Encerrado' };

  // ---- PAGE 1: RESUMO EXECUTIVO ----
  addHeader(doc, 'Relatório Executivo — Implementação MVP', `${data.companyName} · ${data.period} · Fase atual: ${data.currentPhase}`);

  let y = 48;

  // Indicadores principais
  y = addSectionTitle(doc, 'Indicadores Principais', y);
  const mw = 42;
  addMetricBox(doc, 15, y, mw, `${data.activePop}`, 'Colaboradores');
  addMetricBox(doc, 15 + mw + 3, y, mw, `${data.nucleoCount}`, 'Núcleo ativo');
  addMetricBox(doc, 15 + (mw + 3) * 2, y, mw, `${data.facilitators}`, 'Facilitadores');
  addMetricBox(doc, 15 + (mw + 3) * 3, y, mw, `${data.coveragePercent}%`, 'Cobertura', data.coveragePercent >= 60 ? GREEN : data.coveragePercent >= 30 ? ORANGE : RED);
  y += 36;

  // Indicadores operacionais
  y = addSectionTitle(doc, 'Indicadores Operacionais', y);
  addMetricBox(doc, 15, y, mw, `${data.turmasRealizadas}/${data.turmasTotal}`, 'Turmas realizadas');
  addMetricBox(doc, 15 + mw + 3, y, mw, `${data.pessoasTreinadas}`, 'Pessoas treinadas');
  addMetricBox(doc, 15 + (mw + 3) * 2, y, mw, `${data.completedActions}/${data.totalActions}`, 'Ações concluídas');
  addMetricBox(doc, 15 + (mw + 3) * 3, y, mw, `${data.delayedActions}`, 'Ações atrasadas', data.delayedActions > 0 ? RED : GREEN);
  y += 36;

  // Ciclos & Maturidade
  y = addSectionTitle(doc, 'Ciclos e Maturidade', y);
  addMetricBox(doc, 15, y, 56, `${data.closedCycles}/${data.totalCycles}`, 'Ciclos encerrados');
  addMetricBox(doc, 74, y, 56, `${data.totalPresences}`, 'Presenças registradas');
  addMetricBox(doc, 133, y, 62, `${data.maturityScore}`, `Maturidade: ${data.maturityLevel}`);
  y += 36;

  // ---- PAGE 2: COBERTURA DO PROGRAMA ----
  doc.addPage();
  addPageHeader(doc, 'Cobertura do Programa por Setor');
  y = 28;

  if (data.populationBySector.length > 0) {
    // Table header
    doc.setFillColor(...TEAL);
    doc.rect(15, y, 180, 8, 'F');
    doc.setTextColor(...WHITE);
    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');
    doc.text('Setor', 20, y + 6);
    doc.text('Colaboradores', 90, y + 6);
    doc.text('Treinados', 125, y + 6);
    doc.text('Cobertura', 155, y + 6);
    y += 12;

    data.populationBySector.forEach((s, i) => {
      y = checkPage(doc, y, 12);
      const bgColor: [number, number, number] = i % 2 === 0 ? LIGHT_BG : WHITE;
      doc.setFillColor(...bgColor);
      doc.rect(15, y - 3, 180, 10, 'F');
      doc.setTextColor(...TEXT);
      doc.setFontSize(9);
      doc.setFont('helvetica', 'normal');
      doc.text(s.sector, 20, y + 3);
      doc.text(`${s.count}`, 95, y + 3);
      doc.text(`${s.trained}`, 130, y + 3);
      const pct = s.count > 0 ? Math.round((s.trained / s.count) * 100) : 0;
      doc.setTextColor(...(pct >= 60 ? GREEN : pct >= 30 ? ORANGE : RED));
      doc.setFont('helvetica', 'bold');
      doc.text(`${pct}%`, 160, y + 3);
      // mini bar
      addProgressBar(doc, 170, y, 22, pct);
      y += 11;
    });
  } else {
    doc.setTextColor(...GRAY);
    doc.setFontSize(10);
    doc.text('Nenhum dado de setor disponível.', 20, y + 10);
  }

  // ---- PAGE 3: DETALHAMENTO DOS CICLOS ----
  doc.addPage();
  addPageHeader(doc, 'Detalhamento dos Ciclos MVP');
  y = 28;

  data.cycleDetails.forEach(c => {
    y = checkPage(doc, y, 20);
    doc.setFillColor(...LIGHT_BG);
    doc.roundedRect(15, y, 180, 14, 2, 2, 'F');
    doc.setTextColor(...TEXT);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text(`${c.cycleId} — ${c.phaseName}`, 20, y + 6);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(...GRAY);
    doc.text(`${statusLabels[c.status] || c.status} | ${c.completionPercent}% concluído | ${c.completedActions}/${c.totalActions} ações | ${c.turmasCompleted}/${c.turmasTotal} turmas`, 20, y + 12);
    y += 18;
  });

  // ---- PAGE 4: TREINAMENTOS ----
  doc.addPage();
  addPageHeader(doc, 'Treinamentos Realizados');
  y = 28;

  // Re-use executive data to list turmas summary
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...TEXT);
  doc.text(`Total de turmas: ${data.turmasTotal} | Realizadas: ${data.turmasRealizadas} | Pessoas treinadas: ${data.pessoasTreinadas} | Presenças registradas: ${data.totalPresences}`, 20, y);
  y += 12;

  // ---- PAGE 5: INSIGHTS E RECOMENDAÇÕES ----
  doc.addPage();
  addPageHeader(doc, 'Insights e Recomendações Estratégicas');
  y = 28;

  data.insights.forEach(insight => {
    y = checkPage(doc, y, 18);
    const color = insight.type === 'positive' ? GREEN : insight.type === 'warning' ? ORANGE : TEAL;
    const typeLabel = insight.type === 'positive' ? 'POSITIVO' : insight.type === 'warning' ? 'ATENÇÃO' : 'RECOMENDAÇÃO';

    doc.setFillColor(...color);
    doc.roundedRect(15, y - 2, 180, 2, 0, 0, 'F');

    doc.setTextColor(...color);
    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');
    doc.text(typeLabel, 20, y + 6);

    doc.setTextColor(...TEXT);
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    const lines = doc.splitTextToSize(insight.message, 165);
    doc.text(lines, 20, y + 12);
    y += 14 + lines.length * 5;
  });

  // Finalize
  const totalPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    addFooter(doc, i);
  }

  doc.save(`relatorio-executivo-${data.companyName.toLowerCase().replace(/\s+/g, '-')}.pdf`);
}

// ============ TURMA PDF ============
export function exportTurmaPDF(data: TurmaReportData, companyName: string) {
  const doc = new jsPDF();
  addHeader(doc, 'Relatório de Turmas', companyName);

  let y = 48;
  addMetricBox(doc, 15, y, 43, `${data.turmas.length}`, 'Total turmas');
  addMetricBox(doc, 61, y, 43, `${data.totalParticipants}`, 'Participantes');
  addMetricBox(doc, 107, y, 43, `${data.totalPresences}`, 'Presenças', GREEN);
  addMetricBox(doc, 153, y, 42, `${data.totalAbsences}`, 'Faltas', RED);
  y += 36;

  data.turmas.forEach(t => {
    y = checkPage(doc, y, 30);
    y = addSectionTitle(doc, `${t.name} (${t.cycleId})`, y);
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...GRAY);
    doc.text(`Facilitador: ${t.facilitator} | Data: ${t.trainingDate ? new Date(t.trainingDate).toLocaleDateString('pt-BR') : 'N/A'} | Presença: ${t.presentCount}/${t.participantCount}`, 25, y);
    y += 8;

    t.participants.forEach(p => {
      y = checkPage(doc, y, 6);
      doc.setTextColor(...TEXT);
      doc.text(`${p.name} — ${p.sector} (${p.role})`, 25, y);
      const attColor = p.attendance === 'Presente' ? GREEN : p.attendance === 'Faltou' ? RED : ORANGE;
      doc.setTextColor(...attColor);
      doc.text(p.attendance, 165, y);
      doc.setTextColor(...TEXT);
      y += 5;
    });
    y += 8;
  });

  const totalPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) { doc.setPage(i); addFooter(doc, i); }
  doc.save(`relatorio-turmas-${companyName.toLowerCase().replace(/\s+/g, '-')}.pdf`);
}

// ============ COVERAGE PDF ============
export function exportCoveragePDF(data: CoverageReportData, companyName: string) {
  const doc = new jsPDF();
  addHeader(doc, 'Relatório de Cobertura', companyName);

  let y = 48;
  addMetricBox(doc, 15, y, 43, `${data.totalPopulation}`, 'Base ativa');
  addMetricBox(doc, 61, y, 43, `${data.trainedCount}`, 'Treinados', GREEN);
  addMetricBox(doc, 107, y, 43, `${data.notTrainedCount}`, 'Não treinados', RED);
  addMetricBox(doc, 153, y, 42, `${data.coveragePercent}%`, 'Cobertura', data.coveragePercent >= 60 ? GREEN : ORANGE);
  y += 36;

  if (data.bySector.length > 0) {
    y = addSectionTitle(doc, 'Cobertura por Setor', y);
    doc.setFontSize(9);
    data.bySector.forEach(s => {
      y = checkPage(doc, y, 10);
      doc.setTextColor(...TEXT);
      doc.setFont('helvetica', 'normal');
      doc.text(`${s.sector}: ${s.trained}/${s.total}`, 25, y);
      addProgressBar(doc, 100, y - 3, 60, s.percent, `${s.percent}%`);
      y += 8;
    });
    y += 5;
  }

  if (data.byCycle.length > 0) {
    y = checkPage(doc, y, 20);
    y = addSectionTitle(doc, 'Cobertura por Ciclo', y);
    doc.setFontSize(9);
    data.byCycle.forEach(c => {
      y = checkPage(doc, y, 7);
      doc.setTextColor(...TEXT);
      doc.text(`${c.cycleId}: ${c.trained} treinados (${c.percent}%)`, 25, y);
      y += 6;
    });
  }

  const totalPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) { doc.setPage(i); addFooter(doc, i); }
  doc.save(`relatorio-cobertura-${companyName.toLowerCase().replace(/\s+/g, '-')}.pdf`);
}

// ============ NUCLEO PDF ============
export function exportNucleoPDF(data: NucleoReportData, companyName: string) {
  const doc = new jsPDF();
  addHeader(doc, 'Relatório do Núcleo', companyName);

  let y = 48;
  addMetricBox(doc, 15, y, 43, `${data.totalMembers}`, 'Integrantes');
  addMetricBox(doc, 61, y, 43, `${data.membersWithActions}`, 'Com ações');
  addMetricBox(doc, 107, y, 43, `${data.totalActionsAssigned}`, 'Ações total');
  addMetricBox(doc, 153, y, 42, `${data.completedActions}`, 'Concluídas', GREEN);
  y += 36;

  y = addSectionTitle(doc, 'Integrantes do Núcleo', y);
  doc.setFontSize(9);
  data.members.forEach(m => {
    y = checkPage(doc, y, 12);
    doc.setFillColor(...LIGHT_BG);
    doc.roundedRect(15, y - 2, 180, 10, 1, 1, 'F');
    doc.setTextColor(...TEXT);
    doc.setFont('helvetica', 'bold');
    doc.text(m.name, 20, y + 4);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...GRAY);
    doc.text(`${m.sector} | ${m.role} | Ações: ${m.actionsCompleted}/${m.actionsAssigned} | Atrasadas: ${m.actionsDelayed}`, 65, y + 4);
    y += 13;
  });

  const totalPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) { doc.setPage(i); addFooter(doc, i); }
  doc.save(`relatorio-nucleo-${companyName.toLowerCase().replace(/\s+/g, '-')}.pdf`);
}

// ============ CYCLE PDF ============
export function exportCyclePDF(data: CycleReportData, companyName: string) {
  const doc = new jsPDF();
  const statusLabels: Record<string, string> = { pending: 'Pendente', in_progress: 'Em andamento', completed: 'Concluído', delayed: 'Atrasado', ready_to_close: 'Pronto p/ encerrar', closed: 'Encerrado' };

  addHeader(doc, `Relatório do Ciclo ${data.cycleId}`, `${data.phaseName} — ${data.title} | ${companyName}`);

  let y = 48;
  addMetricBox(doc, 15, y, 43, statusLabels[data.status] || data.status, 'Status');
  addMetricBox(doc, 61, y, 43, `${data.completionPercent}%`, 'Conclusão', data.completionPercent >= 80 ? GREEN : ORANGE);
  addMetricBox(doc, 107, y, 43, `${data.delayedActions}`, 'Atrasadas', data.delayedActions > 0 ? RED : GREEN);
  addMetricBox(doc, 153, y, 42, `${data.turmasCompleted}/${data.turmasTotal}`, 'Turmas');
  y += 36;

  y = addSectionTitle(doc, 'Ações do Ciclo', y);
  doc.setFontSize(9);
  data.actions.forEach((a, i) => {
    y = checkPage(doc, y, 14);
    doc.setFillColor(...LIGHT_BG);
    doc.roundedRect(15, y - 2, 180, 12, 1, 1, 'F');
    doc.setTextColor(...TEXT);
    doc.setFont('helvetica', 'bold');
    doc.text(`${i + 1}. ${a.title.substring(0, 50)}`, 20, y + 3);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...GRAY);
    doc.text(`${a.factorName} | ${a.responsible} | ${statusLabels[a.status] || a.status}`, 20, y + 9);
    y += 15;
  });

  if (data.decisions.length > 0) {
    y = checkPage(doc, y, 20);
    y = addSectionTitle(doc, 'Decisões Registradas', y);
    doc.setFontSize(9);
    data.decisions.forEach(d => {
      y = checkPage(doc, y, 7);
      doc.setTextColor(...TEXT);
      doc.text(`• ${d.title} (${new Date(d.date).toLocaleDateString('pt-BR')}) — ${statusLabels[d.status] || d.status}`, 25, y);
      y += 6;
    });
  }

  const totalPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) { doc.setPage(i); addFooter(doc, i); }
  doc.save(`relatorio-ciclo-${data.cycleId.toLowerCase()}-${companyName.toLowerCase().replace(/\s+/g, '-')}.pdf`);
}

// ============ COLLABORATOR PROGRESS PDF ============
export function exportCollaboratorProgressPDF(data: CollaboratorProgressData, companyName: string) {
  const doc = new jsPDF();
  addHeader(doc, 'Progresso por Colaborador', companyName);

  let y = 48;
  addMetricBox(doc, 15, y, 43, `${data.totalCollaborators}`, 'Colaboradores');
  addMetricBox(doc, 61, y, 43, `${data.averageProgress}%`, 'Progresso médio');
  addMetricBox(doc, 107, y, 43, `${data.fullyTrained}`, 'Completos', GREEN);
  addMetricBox(doc, 153, y, 42, `${data.notStarted}`, 'Não iniciados', RED);
  y += 36;

  // Table header
  doc.setFillColor(...TEAL);
  doc.rect(15, y, 180, 8, 'F');
  doc.setTextColor(...WHITE);
  doc.setFontSize(7);
  doc.setFont('helvetica', 'bold');
  doc.text('Colaborador', 17, y + 6);
  doc.text('Setor', 60, y + 6);
  doc.text('M1', 95, y + 6);
  doc.text('M2', 105, y + 6);
  doc.text('M3', 115, y + 6);
  doc.text('V1', 125, y + 6);
  doc.text('V2', 135, y + 6);
  doc.text('V3', 145, y + 6);
  doc.text('P1', 155, y + 6);
  doc.text('P2', 165, y + 6);
  doc.text('P3', 175, y + 6);
  doc.text('%', 185, y + 6);
  y += 11;

  const moduleIds = ['M1', 'M2', 'M3', 'V1', 'V2', 'V3', 'P1', 'P2', 'P3'];

  data.collaborators.forEach((c, i) => {
    y = checkPage(doc, y, 8);
    const bgColor: [number, number, number] = i % 2 === 0 ? LIGHT_BG : WHITE;
    doc.setFillColor(...bgColor);
    doc.rect(15, y - 3, 180, 7, 'F');

    doc.setTextColor(...TEXT);
    doc.setFontSize(7);
    doc.setFont('helvetica', 'normal');
    doc.text(c.name.substring(0, 25), 17, y + 2);
    doc.text(c.sector.substring(0, 15), 60, y + 2);

    moduleIds.forEach((mod, mi) => {
      const status = c.modules[mod];
      if (status === 'completed') {
        doc.setFillColor(...GREEN);
        doc.circle(97 + mi * 10, y, 2, 'F');
      } else if (status === 'in_progress') {
        doc.setFillColor(...ORANGE);
        doc.circle(97 + mi * 10, y, 2, 'F');
      } else {
        doc.setDrawColor(200, 200, 200);
        doc.circle(97 + mi * 10, y, 2, 'S');
      }
    });

    doc.setTextColor(...(c.progressPercent >= 60 ? GREEN : c.progressPercent > 0 ? ORANGE : RED));
    doc.setFont('helvetica', 'bold');
    doc.text(`${c.progressPercent}%`, 185, y + 2);
    y += 8;
  });

  const totalPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) { doc.setPage(i); addFooter(doc, i); }
  doc.save(`progresso-colaboradores-${companyName.toLowerCase().replace(/\s+/g, '-')}.pdf`);
}

// ============ SECTOR MATURITY PDF ============
export function exportSectorMaturityPDF(data: SectorMaturityData, companyName: string) {
  const doc = new jsPDF();
  addHeader(doc, 'Maturidade por Setor', companyName);

  let y = 48;
  addMetricBox(doc, 15, y, 85, `${data.sectors.length}`, 'Setores');
  addMetricBox(doc, 105, y, 90, `${data.overallCoverage}%`, 'Cobertura geral', data.overallCoverage >= 60 ? GREEN : ORANGE);
  y += 36;

  // Table
  doc.setFillColor(...TEAL);
  doc.rect(15, y, 180, 8, 'F');
  doc.setTextColor(...WHITE);
  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.text('Setor', 20, y + 6);
  doc.text('Base', 80, y + 6);
  doc.text('Treinados', 100, y + 6);
  doc.text('Não treinados', 125, y + 6);
  doc.text('Cobertura', 160, y + 6);
  y += 12;

  data.sectors.forEach((s, i) => {
    y = checkPage(doc, y, 14);
    const bgColor: [number, number, number] = i % 2 === 0 ? LIGHT_BG : WHITE;
    doc.setFillColor(...bgColor);
    doc.rect(15, y - 3, 180, 12, 'F');

    doc.setTextColor(...TEXT);
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.text(s.sector, 20, y + 3);
    doc.text(`${s.total}`, 83, y + 3);
    doc.setTextColor(...GREEN);
    doc.text(`${s.trained}`, 105, y + 3);
    doc.setTextColor(...RED);
    doc.text(`${s.notTrained}`, 132, y + 3);

    doc.setTextColor(...(s.coveragePercent >= 60 ? GREEN : s.coveragePercent >= 30 ? ORANGE : RED));
    doc.setFont('helvetica', 'bold');
    doc.text(`${s.coveragePercent}%`, 163, y + 3);

    addProgressBar(doc, 20, y + 6, 170, s.coveragePercent);
    y += 14;
  });

  const totalPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) { doc.setPage(i); addFooter(doc, i); }
  doc.save(`maturidade-setor-${companyName.toLowerCase().replace(/\s+/g, '-')}.pdf`);
}

// ============ EXCEL (CSV) EXPORTS ============

function downloadCSV(content: string, filename: string) {
  const BOM = '\uFEFF';
  const blob = new Blob([BOM + content], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = filename;
  link.click();
  URL.revokeObjectURL(link.href);
}

export function exportExecutiveExcel(data: ExecutiveReportData) {
  let csv = 'RELATÓRIO EXECUTIVO — IMPLEMENTAÇÃO MVP\n';
  csv += `Empresa,${data.companyName}\n`;
  csv += `Período,${data.period}\n`;
  csv += `Fase atual,${data.currentPhase}\n`;
  csv += `Gerado em,${new Date().toLocaleDateString('pt-BR')}\n\n`;

  csv += 'INDICADORES PRINCIPAIS\n';
  csv += 'Indicador,Valor\n';
  csv += `Colaboradores ativos,${data.activePop}\n`;
  csv += `Líderes,${data.leaders}\n`;
  csv += `Facilitadores habilitados,${data.facilitators}\n`;
  csv += `Núcleo ativo,${data.nucleoCount}\n`;
  csv += `Turmas realizadas,${data.turmasRealizadas}/${data.turmasTotal}\n`;
  csv += `Pessoas treinadas,${data.pessoasTreinadas}\n`;
  csv += `Presenças registradas,${data.totalPresences}\n`;
  csv += `Cobertura do programa,${data.coveragePercent}%\n`;
  csv += `Ações concluídas,${data.completedActions}/${data.totalActions}\n`;
  csv += `Ações atrasadas,${data.delayedActions}\n`;
  csv += `Ciclos encerrados,${data.closedCycles}/${data.totalCycles}\n`;
  csv += `Maturidade do programa,${data.maturityScore} (${data.maturityLevel})\n\n`;

  csv += 'DISTRIBUIÇÃO POR SETOR\n';
  csv += 'Setor,Colaboradores,Treinados,Cobertura\n';
  data.populationBySector.forEach(s => {
    const pct = s.count > 0 ? Math.round((s.trained / s.count) * 100) : 0;
    csv += `${s.sector},${s.count},${s.trained},${pct}%\n`;
  });
  csv += '\n';

  csv += 'CICLOS MVP\n';
  csv += 'Ciclo,Fase,Status,Conclusão,Ações concluídas,Turmas\n';
  const statusLabels: Record<string, string> = { pending: 'Pendente', in_progress: 'Em andamento', ready_to_close: 'Pronto', closed: 'Encerrado' };
  data.cycleDetails.forEach(c => {
    csv += `${c.cycleId},${c.phaseName},${statusLabels[c.status] || c.status},${c.completionPercent}%,${c.completedActions}/${c.totalActions},${c.turmasCompleted}/${c.turmasTotal}\n`;
  });

  downloadCSV(csv, `relatorio-executivo-${data.companyName.toLowerCase().replace(/\s+/g, '-')}.csv`);
}

export function exportTurmaExcel(data: TurmaReportData, companyName: string) {
  let csv = 'RELATÓRIO DE TURMAS\n\n';
  csv += 'Turma,Ciclo,Facilitador,Data,Participantes,Presenças,Faltas,Remarcar\n';
  data.turmas.forEach(t => {
    csv += `${t.name},${t.cycleId},${t.facilitator},${t.trainingDate ? new Date(t.trainingDate).toLocaleDateString('pt-BR') : 'N/A'},${t.participantCount},${t.presentCount},${t.absentCount},${t.rescheduleCount}\n`;
  });
  csv += '\nDETALHE DE PARTICIPANTES\n';
  csv += 'Turma,Nome,Setor,Cargo,Turno,Presença\n';
  data.turmas.forEach(t => {
    t.participants.forEach(p => {
      csv += `${t.name},${p.name},${p.sector},${p.role},${p.shift},${p.attendance}\n`;
    });
  });
  downloadCSV(csv, `relatorio-turmas-${companyName.toLowerCase().replace(/\s+/g, '-')}.csv`);
}

export function exportCoverageExcel(data: CoverageReportData, companyName: string) {
  let csv = 'RELATÓRIO DE COBERTURA\n\n';
  csv += `Base populacional ativa,${data.totalPopulation}\n`;
  csv += `Treinados,${data.trainedCount}\n`;
  csv += `Não treinados,${data.notTrainedCount}\n`;
  csv += `Cobertura do programa,${data.coveragePercent}%\n\n`;

  csv += 'COBERTURA POR SETOR\nSetor,Colaboradores,Treinados,Cobertura\n';
  data.bySector.forEach(s => { csv += `${s.sector},${s.total},${s.trained},${s.percent}%\n`; });

  csv += '\nCOLABORADORES TREINADOS\nNome,Setor,Cargo,Ciclos\n';
  data.trainedList.forEach(p => { csv += `${p.name},${p.sector},${p.role},"${p.cycles.join(', ')}"\n`; });

  csv += '\nCOLABORADORES NÃO TREINADOS\nNome,Setor,Cargo\n';
  data.notTrainedList.forEach(p => { csv += `${p.name},${p.sector},${p.role}\n`; });

  downloadCSV(csv, `relatorio-cobertura-${companyName.toLowerCase().replace(/\s+/g, '-')}.csv`);
}

export function exportNucleoExcel(data: NucleoReportData, companyName: string) {
  let csv = 'RELATÓRIO DO NÚCLEO\n\n';
  csv += 'Nome,Setor,Cargo,Ações atribuídas,Ações concluídas,Ações atrasadas\n';
  data.members.forEach(m => {
    csv += `${m.name},${m.sector},${m.role},${m.actionsAssigned},${m.actionsCompleted},${m.actionsDelayed}\n`;
  });
  downloadCSV(csv, `relatorio-nucleo-${companyName.toLowerCase().replace(/\s+/g, '-')}.csv`);
}

export function exportCycleExcel(data: CycleReportData, companyName: string) {
  const statusLabels: Record<string, string> = { pending: 'Pendente', in_progress: 'Em andamento', completed: 'Concluído', delayed: 'Atrasado' };
  let csv = `RELATÓRIO DO CICLO ${data.cycleId}\n`;
  csv += `Fase,${data.phaseName}\n`;
  csv += `Título,${data.title}\n\n`;
  csv += 'Ação,Fator de Sucesso,Status,Responsável,Prazo,Observação\n';
  data.actions.forEach(a => {
    csv += `"${a.title}","${a.factorName}",${statusLabels[a.status] || a.status},${a.responsible},${a.dueDate ? new Date(a.dueDate).toLocaleDateString('pt-BR') : 'N/A'},"${a.observation}"\n`;
  });
  downloadCSV(csv, `relatorio-ciclo-${data.cycleId.toLowerCase()}-${companyName.toLowerCase().replace(/\s+/g, '-')}.csv`);
}

export function exportCollaboratorProgressExcel(data: CollaboratorProgressData, companyName: string) {
  let csv = 'PROGRESSO POR COLABORADOR\n\n';
  csv += 'Colaborador,Setor,Cargo,Turno,M1,M2,M3,V1,V2,V3,P1,P2,P3,Progresso\n';
  const statusLabel = (s: string) => s === 'completed' ? 'Concluído' : s === 'in_progress' ? 'Em andamento' : 'Não iniciado';
  data.collaborators.forEach(c => {
    const modules = ['M1', 'M2', 'M3', 'V1', 'V2', 'V3', 'P1', 'P2', 'P3'].map(m => statusLabel(c.modules[m])).join(',');
    csv += `${c.name},${c.sector},${c.role},${c.shift},${modules},${c.progressPercent}%\n`;
  });
  downloadCSV(csv, `progresso-colaboradores-${companyName.toLowerCase().replace(/\s+/g, '-')}.csv`);
}

export function exportSectorMaturityExcel(data: SectorMaturityData, companyName: string) {
  let csv = 'MATURIDADE POR SETOR\n\n';
  csv += `Cobertura geral,${data.overallCoverage}%\n\n`;
  csv += 'Setor,Base populacional,Treinados,Não treinados,Cobertura\n';
  data.sectors.forEach(s => {
    csv += `${s.sector},${s.total},${s.trained},${s.notTrained},${s.coveragePercent}%\n`;
  });
  downloadCSV(csv, `maturidade-setor-${companyName.toLowerCase().replace(/\s+/g, '-')}.csv`);
}
