import jsPDF from 'jspdf';
import type { CompanyState } from './storage';

export function generateAccessPDF(company: CompanyState): void {
  const doc = new jsPDF();
  
  const primaryColor: [number, number, number] = [41, 98, 255];
  const textColor: [number, number, number] = [30, 30, 30];
  const grayColor: [number, number, number] = [120, 120, 120];
  
  // Header
  doc.setFillColor(...primaryColor);
  doc.rect(0, 0, 210, 40, 'F');
  
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(24);
  doc.setFont('helvetica', 'bold');
  doc.text('MVP Portal', 20, 25);
  
  doc.setFontSize(12);
  doc.setFont('helvetica', 'normal');
  doc.text('Carta de Boas-Vindas', 20, 33);
  
  // Company info box
  doc.setFillColor(245, 245, 250);
  doc.roundedRect(15, 50, 180, 45, 3, 3, 'F');
  
  doc.setTextColor(...textColor);
  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.text(company.name, 25, 65);
  
  doc.setFontSize(11);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...grayColor);
  doc.text(`Setor: ${company.sector}`, 25, 75);
  doc.text(`Colaboradores: ${company.employees}`, 25, 83);
  
  // Welcome message
  doc.setTextColor(...textColor);
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('Seja bem-vindo ao Programa MVP!', 20, 115);
  
  doc.setFontSize(11);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...grayColor);
  const welcomeText = 'Sua empresa está iniciando uma jornada de transformação comportamental. O MVP Portal será sua ferramenta central para acompanhar todo o progresso do programa.';
  const splitWelcome = doc.splitTextToSize(welcomeText, 170);
  doc.text(splitWelcome, 20, 125);
  
  // Access credentials box
  doc.setFillColor(...primaryColor);
  doc.roundedRect(15, 150, 180, 70, 3, 3, 'F');
  
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('Credenciais de Acesso', 25, 165);
  
  doc.setFontSize(11);
  doc.setFont('helvetica', 'normal');
  
  doc.text('Administrador:', 25, 180);
  doc.setFont('helvetica', 'bold');
  doc.text(company.adminName, 80, 180);
  
  doc.setFont('helvetica', 'normal');
  doc.text('Email:', 25, 190);
  doc.setFont('helvetica', 'bold');
  doc.text(company.adminEmail, 80, 190);
  
  doc.setFont('helvetica', 'normal');
  doc.text('Senha temporária:', 25, 200);
  doc.setFont('helvetica', 'bold');
  doc.text(company.tempPassword, 80, 200);
  
  doc.setFont('helvetica', 'normal');
  doc.text('Link de acesso:', 25, 210);
  doc.setFont('helvetica', 'bold');
  doc.text('https://mvp-portal.lovable.app', 80, 210);
  
  // Instructions
  doc.setTextColor(...textColor);
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('Próximos passos:', 20, 240);
  
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...grayColor);
  
  const steps = [
    '1. Acesse o link do portal com as credenciais acima',
    '2. Altere sua senha temporária no primeiro acesso',
    '3. Complete o cadastro de colaboradores',
    '4. Inicie o ciclo M1 do programa MVP',
  ];
  
  steps.forEach((step, index) => {
    doc.text(step, 25, 250 + (index * 8));
  });
  
  // Footer
  doc.setFillColor(...primaryColor);
  doc.rect(0, 280, 210, 17, 'F');
  
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(9);
  doc.text('MVP Portal - Programa de Mudança Comportamental', 20, 290);
  doc.text(`Gerado em: ${new Date().toLocaleDateString('pt-BR')}`, 150, 290);
  
  // Download
  doc.save(`acesso-${company.name.toLowerCase().replace(/\s+/g, '-')}.pdf`);
}

export function generateCycleSummaryPDF(
  cycleId: string,
  cycleTitle: string,
  phaseName: string,
  context: string,
  expectations: {
    whatHappens: string[];
    expectedResults: string[];
    successCriteria: string[];
  },
  activeActions: Array<{
    title: string;
    factorName: string;
    status: string;
    observation: string;
    responsible: string;
    dueDate: string | null;
  }>
): void {
  const doc = new jsPDF();
  
  const primaryColor: [number, number, number] = [41, 98, 255];
  const textColor: [number, number, number] = [30, 30, 30];
  const grayColor: [number, number, number] = [120, 120, 120];
  const successColor: [number, number, number] = [34, 197, 94];
  const warningColor: [number, number, number] = [245, 158, 11];
  
  // Header
  doc.setFillColor(...primaryColor);
  doc.rect(0, 0, 210, 35, 'F');
  
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.text(`Ciclo ${cycleId} - ${phaseName}`, 20, 20);
  
  doc.setFontSize(11);
  doc.setFont('helvetica', 'normal');
  doc.text(cycleTitle, 20, 28);
  
  let yPos = 50;
  
  // Context
  doc.setTextColor(...textColor);
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('Contexto do Ciclo', 20, yPos);
  
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...grayColor);
  const splitContext = doc.splitTextToSize(context, 170);
  doc.text(splitContext, 20, yPos + 8);
  yPos += 8 + (splitContext.length * 5) + 10;
  
  // Expectations section
  if (yPos < 100) {
    doc.setTextColor(...textColor);
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('Expectativas', 20, yPos);
    yPos += 10;
    
    // What happens
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text('O que precisa acontecer:', 20, yPos);
    yPos += 6;
    
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...grayColor);
    expectations.whatHappens.slice(0, 3).forEach(item => {
      doc.text(`• ${item}`, 25, yPos);
      yPos += 5;
    });
    yPos += 5;
  }
  
  // Active actions
  doc.setTextColor(...textColor);
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text(`Ações do Ciclo (${activeActions.length})`, 20, yPos);
  yPos += 10;
  
  const statusLabels: Record<string, string> = {
    pending: 'Pendente',
    in_progress: 'Em andamento',
    completed: 'Concluído',
    delayed: 'Atrasado',
  };
  
  activeActions.slice(0, 10).forEach((action, index) => {
    if (yPos > 250) {
      doc.addPage();
      yPos = 20;
    }
    
    doc.setFillColor(250, 250, 252);
    doc.roundedRect(15, yPos - 3, 180, 22, 2, 2, 'F');
    
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...textColor);
    doc.text(`${index + 1}. ${action.title}`, 20, yPos + 4);
    
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(...grayColor);
    doc.text(`${action.factorName} | ${action.responsible || 'Sem responsável'}`, 20, yPos + 12);
    
    // Status badge
    const statusLabel = statusLabels[action.status] || action.status;
    doc.text(`Status: ${statusLabel}`, 140, yPos + 4);
    
    if (action.dueDate) {
      doc.text(`Prazo: ${new Date(action.dueDate).toLocaleDateString('pt-BR')}`, 140, yPos + 12);
    }
    
    yPos += 28;
  });
  
  // Footer
  doc.setFillColor(...primaryColor);
  doc.rect(0, 280, 210, 17, 'F');
  
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(9);
  doc.text(`Ciclo ${cycleId} - MVP Portal`, 20, 290);
  doc.text(`Gerado em: ${new Date().toLocaleDateString('pt-BR')}`, 150, 290);
  
  // Download
  doc.save(`ciclo-${cycleId.toLowerCase()}-resumo.pdf`);
}
