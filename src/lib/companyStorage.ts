// Company-scoped storage layer
// Each company gets isolated data via localStorage keys

export interface NucleoMember {
  id: string;
  name: string;
  email: string;
  sector: string;
  role: string;
}

export interface PopulationMember {
  id: string;
  name: string;
  email: string;
  sector: string;
  role: string;
  facilitator: boolean;
  active: boolean;
}

// Keys
function nucleoKey(companyId: string): string {
  return `mvp_company_${companyId}_nucleo`;
}

function populationKey(companyId: string): string {
  return `mvp_company_${companyId}_population`;
}

function companyDataKey(companyId: string): string {
  return `mvp_company_${companyId}_data`;
}

// ============ NÚCLEO ============

export function getNucleo(companyId: string): NucleoMember[] {
  try {
    const stored = localStorage.getItem(nucleoKey(companyId));
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

export function setNucleo(companyId: string, members: NucleoMember[]): void {
  localStorage.setItem(nucleoKey(companyId), JSON.stringify(members));
}

// ============ POPULATION ============

export function getPopulation(companyId: string): PopulationMember[] {
  try {
    const stored = localStorage.getItem(populationKey(companyId));
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

export function setPopulation(companyId: string, members: PopulationMember[]): void {
  localStorage.setItem(populationKey(companyId), JSON.stringify(members));
}

export function addPopulationMember(companyId: string, member: PopulationMember): void {
  const current = getPopulation(companyId);
  setPopulation(companyId, [...current, member]);
}

export function removePopulationMember(companyId: string, memberId: string): void {
  const current = getPopulation(companyId);
  setPopulation(companyId, current.filter(m => m.id !== memberId));
}

export function updatePopulationMember(companyId: string, memberId: string, updates: Partial<PopulationMember>): void {
  const current = getPopulation(companyId);
  setPopulation(companyId, current.map(m => m.id === memberId ? { ...m, ...updates } : m));
}

// ============ HELPERS ============

export function getFacilitators(companyId: string): PopulationMember[] {
  return getPopulation(companyId).filter(m => m.facilitator && m.active);
}

export function getPopulationBySector(companyId: string): Record<string, PopulationMember[]> {
  const pop = getPopulation(companyId).filter(m => m.active);
  const grouped: Record<string, PopulationMember[]> = {};
  pop.forEach(m => {
    const sector = m.sector || "Sem setor";
    if (!grouped[sector]) grouped[sector] = [];
    grouped[sector].push(m);
  });
  return grouped;
}

export function getPopulationStats(companyId: string) {
  const pop = getPopulation(companyId);
  const active = pop.filter(m => m.active);
  const facilitators = active.filter(m => m.facilitator);
  const sectors = new Set(active.map(m => m.sector).filter(Boolean));
  return {
    total: active.length,
    facilitators: facilitators.length,
    sectors: sectors.size,
    inactive: pop.length - active.length,
  };
}

// Check if email is already used in company population
export function isEmailUsedInCompany(companyId: string, email: string, excludeId?: string): boolean {
  if (!email.trim()) return false;
  const pop = getPopulation(companyId);
  const nucleo = getNucleo(companyId);
  const allEmails = [
    ...pop.filter(m => m.id !== excludeId).map(m => m.email.toLowerCase()),
    ...nucleo.filter(m => m.id !== excludeId).map(m => m.email.toLowerCase()),
  ];
  return allEmails.includes(email.trim().toLowerCase());
}

// Generate CSV template for population import
export function generatePopulationTemplate(): string {
  return "nome,setor,cargo,email,facilitador\nExemplo Silva,Operações,Técnico,exemplo@empresa.com,não\nMaria Santos,RH,Coordenadora,maria@empresa.com,sim";
}

// Parse CSV content into PopulationMember[]
export function parsePopulationCSV(csvContent: string): { members: Omit<PopulationMember, 'id' | 'active'>[]; errors: string[] } {
  const lines = csvContent.trim().split('\n');
  const members: Omit<PopulationMember, 'id' | 'active'>[] = [];
  const errors: string[] = [];

  // Skip header
  for (let i = 1; i < lines.length; i++) {
    const cols = lines[i].split(',').map(c => c.trim());
    if (cols.length < 2) {
      errors.push(`Linha ${i + 1}: dados insuficientes`);
      continue;
    }
    const name = cols[0];
    if (!name) {
      errors.push(`Linha ${i + 1}: nome é obrigatório`);
      continue;
    }
    members.push({
      name,
      sector: cols[1] || "",
      role: cols[2] || "",
      email: cols[3] || "",
      facilitator: (cols[4] || "").toLowerCase() === "sim",
    });
  }

  return { members, errors };
}
