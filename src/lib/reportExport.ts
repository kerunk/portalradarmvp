// Report Export - PDF and Excel (CSV) generation
import jsPDF from 'jspdf';
import type { ExecutiveReportData, TurmaReportData, NucleoReportData, CoverageReportData, CycleReportData } from './reportData';

// ============ COLORS ============
const TEAL: [number, number, number] = [20, 90, 90];
const TEXT: [number, number, number] = [30, 30, 30];
const GRAY: [number, number, number] = [120, 120, 120];
const GREEN: [number, number, number] = [34, 160, 80];
const ORANGE: [number, number, number] = [220, 150, 30];
const RED: [number, number, number] = [200, 60, 60];
const LIGHT_BG: [number, number, number] = [245, 248, 250];

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

function addFooter(doc: jsPDF, pageNum: number) {
  const pageCount = doc.getNumberOfPages();
  doc.setFillColor(...TEAL);
  doc.rect(0, 280, 210, 17, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(8);
  doc.text('MVP Portal - Relatório Executivo', 20, 289);
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

// ============ EXECUTIVE PDF ============
export function exportExecutivePDF(data: ExecutiveReportData) {
  const doc = new jsPDF();

  // Page 1: Executive Summary
  addHeader(doc, `Relatório Executivo - ${data.companyName}`, `Período: ${data.period} | Fase atual: ${data.currentPhase}`);

  let y = 48;

  // Key metrics row
  const mw = 42;
  addMetricBox(doc, 15, y, mw, `${data.activePop}`, 'Colaboradores');
  addMetricBox(doc, 15 + mw + 3, y, mw, `${data.nucleoCount}`, 'Núcleo');
  addMetricBox(doc, 15 + (mw + 3) * 2, y, mw, `${data.facilitators}`, 'Facilitadores');
  addMetricBox(doc, 15 + (mw + 3) * 3, y, mw, `${data.coveragePercent}%`, 'Cobertura', data.coveragePercent >= 60 ? GREEN : data.coveragePercent >= 30 ? ORANGE : RED);
  y += 36;

  // Execution metrics
  addMetricBox(doc, 15, y, mw, `${data.completionPercent}%`, 'Ações concluídas', data.completionPercent >= 70 ? GREEN : ORANGE);
  addMetricBox(doc, 15 + mw + 3, y, mw, `${data.delayedActions}`, 'Atrasadas', data.delayedActions > 0 ? RED : GREEN);
  addMetricBox(doc, 15 + (mw + 3) * 2, y, mw, `${data.closedCycles}/${data.totalCycles}`, 'Ciclos encerrados');
  addMetricBox(doc, 15 + (mw + 3) * 3, y, mw, `${data.maturityScore}`, `Maturidade: ${data.maturityLevel}`);
  y += 36;

  // Training summary
  y = addSectionTitle(doc, 'Treinamento', y);
  addMetricBox(doc, 15, y, 56, `${data.turmasRealizadas}/${data.turmasTotal}`, 'Turmas realizadas');
  addMetricBox(doc, 74, y, 56, `${data.pessoasTreinadas}`, 'Pessoas treinadas');
  addMetricBox(doc, 133, y, 62, `${data.totalPresences}`, 'Presenças registradas');
  y += 36;

  // Population by sector
  if (data.populationBySector.length > 0) {
    y = addSectionTitle(doc, 'Distribuição por Setor', y);
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    data.populationBySector.slice(0, 8).forEach(s => {
      y = checkPage(doc, y, 8);
      doc.setTextColor(...TEXT);
      doc.text(`${s.sector}`, 25, y);
      doc.setTextColor(...GRAY);
      doc.text(`${s.count} colab. | ${s.trained} treinados`, 90, y);
      // mini bar
      const barW = 60;
      const pct = s.count > 0 ? s.trained / s.count : 0;
      doc.setFillColor(230, 230, 230);
      doc.roundedRect(140, y - 3, barW, 5, 1, 1, 'F');
      if (pct > 0) {
        doc.setFillColor(...(pct >= 0.6 ? GREEN : pct >= 0.3 ? ORANGE : RED));
        doc.roundedRect(140, y - 3, barW * pct, 5, 1, 1, 'F');
      }
      y += 9;
    });
    y += 5;
  }

  // Insights
  y = checkPage(doc, y, 40);
  y = addSectionTitle(doc, 'Insights Inteligentes', y);
  doc.setFontSize(9);
  data.insights.forEach(insight => {
    y = checkPage(doc, y, 15);
    const icon = insight.type === 'positive' ? '✔' : insight.type === 'warning' ? '⚠' : '💡';
    const color = insight.type === 'positive' ? GREEN : insight.type === 'warning' ? ORANGE : TEAL;
    doc.setFillColor(...color);
    doc.circle(20, y - 1, 2, 'F');
    doc.setTextColor(...TEXT);
    doc.setFont('helvetica', 'normal');
    const lines = doc.splitTextToSize(insight.message, 165);
    doc.text(lines, 25, y);
    y += lines.length * 5 + 4;
  });

  // Page 2: Cycle Details
  doc.addPage();
  let y2 = 20;
  y2 = addSectionTitle(doc, 'Detalhamento dos Ciclos', y2);

  const statusLabels: Record<string, string> = { pending: 'Pendente', in_progress: 'Em andamento', ready_to_close: 'Pronto p/ encerrar', closed: 'Encerrado' };

  data.cycleDetails.forEach(c => {
    y2 = checkPage(doc, y2, 20);
    doc.setFillColor(...LIGHT_BG);
    doc.roundedRect(15, y2, 180, 14, 2, 2, 'F');
    doc.setTextColor(...TEXT);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text(`${c.cycleId} - ${c.phaseName}`, 20, y2 + 6);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(...GRAY);
    doc.text(`${statusLabels[c.status] || c.status} | ${c.completionPercent}% | ${c.completedActions}/${c.totalActions} ações | ${c.turmasCompleted}/${c.turmasTotal} turmas`, 20, y2 + 12);
    y2 += 18;
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
      doc.text(`${p.name} - ${p.sector} (${p.role})`, 25, y);
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
      y = checkPage(doc, y, 7);
      doc.setTextColor(...TEXT);
      doc.setFont('helvetica', 'normal');
      doc.text(`${s.sector}: ${s.trained}/${s.total} (${s.percent}%)`, 25, y);
      y += 6;
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

  addHeader(doc, `Relatório do Ciclo ${data.cycleId}`, `${data.phaseName} - ${data.title} | ${companyName}`);

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
      doc.text(`• ${d.title} (${new Date(d.date).toLocaleDateString('pt-BR')}) - ${statusLabels[d.status] || d.status}`, 25, y);
      y += 6;
    });
  }

  const totalPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) { doc.setPage(i); addFooter(doc, i); }
  doc.save(`relatorio-ciclo-${data.cycleId.toLowerCase()}-${companyName.toLowerCase().replace(/\s+/g, '-')}.pdf`);
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
  let csv = 'RELATÓRIO EXECUTIVO\n';
  csv += `Empresa,${data.companyName}\n`;
  csv += `Período,${data.period}\n`;
  csv += `Gerado em,${new Date().toLocaleDateString('pt-BR')}\n\n`;

  csv += 'INDICADORES GERAIS\n';
  csv += 'Indicador,Valor\n';
  csv += `Colaboradores ativos,${data.activePop}\n`;
  csv += `Líderes,${data.leaders}\n`;
  csv += `Facilitadores,${data.facilitators}\n`;
  csv += `Núcleo,${data.nucleoCount}\n`;
  csv += `Turmas realizadas,${data.turmasRealizadas}/${data.turmasTotal}\n`;
  csv += `Pessoas treinadas,${data.pessoasTreinadas}\n`;
  csv += `Cobertura,${data.coveragePercent}%\n`;
  csv += `Ações concluídas,${data.completedActions}/${data.totalActions}\n`;
  csv += `Ações atrasadas,${data.delayedActions}\n`;
  csv += `Ciclos encerrados,${data.closedCycles}/${data.totalCycles}\n`;
  csv += `Maturidade,${data.maturityScore} (${data.maturityLevel})\n\n`;

  csv += 'DISTRIBUIÇÃO POR SETOR\n';
  csv += 'Setor,Total,Treinados\n';
  data.populationBySector.forEach(s => { csv += `${s.sector},${s.count},${s.trained}\n`; });
  csv += '\n';

  csv += 'CICLOS\n';
  csv += 'Ciclo,Fase,Status,Conclusão,Ações,Turmas\n';
  const statusLabels: Record<string, string> = { pending: 'Pendente', in_progress: 'Em andamento', ready_to_close: 'Pronto', closed: 'Encerrado' };
  data.cycleDetails.forEach(c => {
    csv += `${c.cycleId},${c.phaseName},${statusLabels[c.status] || c.status},${c.completionPercent}%,${c.completedActions}/${c.totalActions},${c.turmasCompleted}/${c.turmasTotal}\n`;
  });

  downloadCSV(csv, `relatorio-executivo-${data.companyName.toLowerCase().replace(/\s+/g, '-')}.csv`);
}

export function exportTurmaExcel(data: TurmaReportData, companyName: string) {
  let csv = 'RELATÓRIO DE TURMAS\n\n';
  csv += 'Turma,Ciclo,Facilitador,Data,Participantes,Presentes,Faltas,Remarcar\n';
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
  csv += `Base Populacional,${data.totalPopulation}\n`;
  csv += `Treinados,${data.trainedCount}\n`;
  csv += `Não treinados,${data.notTrainedCount}\n`;
  csv += `Cobertura,${data.coveragePercent}%\n\n`;

  csv += 'POR SETOR\nSetor,Total,Treinados,Cobertura\n';
  data.bySector.forEach(s => { csv += `${s.sector},${s.total},${s.trained},${s.percent}%\n`; });

  csv += '\nCOLABORADORES TREINADOS\nNome,Setor,Cargo,Ciclos\n';
  data.trainedList.forEach(p => { csv += `${p.name},${p.sector},${p.role},"${p.cycles.join(', ')}"\n`; });

  csv += '\nCOLABORADORES NÃO TREINADOS\nNome,Setor,Cargo\n';
  data.notTrainedList.forEach(p => { csv += `${p.name},${p.sector},${p.role}\n`; });

  downloadCSV(csv, `relatorio-cobertura-${companyName.toLowerCase().replace(/\s+/g, '-')}.csv`);
}

export function exportNucleoExcel(data: NucleoReportData, companyName: string) {
  let csv = 'RELATÓRIO DO NÚCLEO\n\n';
  csv += 'Nome,Setor,Cargo,Ações Atribuídas,Concluídas,Atrasadas\n';
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
  csv += 'Ação,Fator,Status,Responsável,Prazo,Observação\n';
  data.actions.forEach(a => {
    csv += `"${a.title}","${a.factorName}",${statusLabels[a.status] || a.status},${a.responsible},${a.dueDate ? new Date(a.dueDate).toLocaleDateString('pt-BR') : 'N/A'},"${a.observation}"\n`;
  });
  downloadCSV(csv, `relatorio-ciclo-${data.cycleId.toLowerCase()}-${companyName.toLowerCase().replace(/\s+/g, '-')}.csv`);
}
