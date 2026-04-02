// Company-scoped storage layer
// Each company gets isolated data via localStorage keys

// ============ TYPES ============

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
  unit: string;
  shift: string;
  admissionDate: string;
  facilitator: boolean;
  nucleo: boolean;
  leadership: boolean;
  active: boolean;
}

export interface OrgUnit {
  id: string;
  name: string;
  archived: boolean;
  order: number;
}

export interface OrgSector {
  id: string;
  name: string;
  archived: boolean;
  order: number;
}

export interface OrgShift {
  id: string;
  name: string;
  archived: boolean;
  order: number;
}

export interface OrgPosition {
  id: string;
  name: string;
  archived: boolean;
  order: number;
}

export interface OrgStructure {
  units: OrgUnit[];
  sectors: OrgSector[];
  shifts: OrgShift[];
  positions: OrgPosition[];
}

export interface ExperienceMVP {
  id: string;
  date: string;
  context: string;
  humanFactors: string;
  deviations: string;
  actionTaken: string;
  learning: string;
  createdAt: string;
  updatedAt: string;
}

// ============ IMPLEMENTATION CONTACTS ============

export interface ImplementationContact {
  id: string;
  name: string;
  role: string;
  email: string;
  phone?: string;
  fromNucleo: boolean; // if selected from núcleo
  createdAt: string;
}

function contactsKey(companyId: string): string {
  return `mvp_company_${companyId}_contacts`;
}

export function getImplementationContacts(companyId: string): ImplementationContact[] {
  try {
    return JSON.parse(localStorage.getItem(contactsKey(companyId)) || "[]");
  } catch { return []; }
}

export function setImplementationContacts(companyId: string, contacts: ImplementationContact[]): void {
  localStorage.setItem(contactsKey(companyId), JSON.stringify(contacts));
}

export function addImplementationContact(companyId: string, contact: ImplementationContact): void {
  const current = getImplementationContacts(companyId);
  setImplementationContacts(companyId, [...current, contact]);
}

export function removeImplementationContact(companyId: string, contactId: string): void {
  const current = getImplementationContacts(companyId);
  setImplementationContacts(companyId, current.filter(c => c.id !== contactId));
}

export function updateImplementationContact(companyId: string, contactId: string, updates: Partial<ImplementationContact>): void {
  const current = getImplementationContacts(companyId);
  setImplementationContacts(companyId, current.map(c => c.id === contactId ? { ...c, ...updates } : c));
}

// ============ KEYS ============

function nucleoKey(companyId: string): string {
  return `mvp_company_${companyId}_nucleo`;
}

function populationKey(companyId: string): string {
  return `mvp_company_${companyId}_population`;
}

function orgStructureKey(companyId: string): string {
  return `mvp_company_${companyId}_org_structure`;
}

function experiencesKey(companyId: string): string {
  return `mvp_company_${companyId}_experiences`;
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
    if (!stored) return [];
    const parsed = JSON.parse(stored) as any[];
    // Migrate old records that lack new fields
    return parsed.map(m => ({
      id: m.id || '',
      name: m.name || '',
      email: m.email || '',
      sector: m.sector || '',
      role: m.role || '',
      unit: m.unit || '',
      shift: m.shift || '',
      admissionDate: m.admissionDate || '',
      facilitator: !!m.facilitator,
      nucleo: !!m.nucleo,
      leadership: !!m.leadership,
      active: m.active !== false,
    }));
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

// ============ ORG STRUCTURE ============

const defaultOrgStructure: OrgStructure = {
  units: [],
  sectors: [],
  shifts: [],
  positions: [],
};

export function getOrgStructure(companyId: string): OrgStructure {
  try {
    const stored = localStorage.getItem(orgStructureKey(companyId));
    if (!stored) return { ...defaultOrgStructure };
    return { ...defaultOrgStructure, ...JSON.parse(stored) };
  } catch {
    return { ...defaultOrgStructure };
  }
}

export function setOrgStructure(companyId: string, structure: OrgStructure): void {
  localStorage.setItem(orgStructureKey(companyId), JSON.stringify(structure));
}

// ============ EXPERIENCES ============

export function getExperiences(companyId: string): ExperienceMVP[] {
  try {
    const stored = localStorage.getItem(experiencesKey(companyId));
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

export function setExperiences(companyId: string, experiences: ExperienceMVP[]): void {
  localStorage.setItem(experiencesKey(companyId), JSON.stringify(experiences));
}

export function addExperience(companyId: string, experience: ExperienceMVP): void {
  const current = getExperiences(companyId);
  setExperiences(companyId, [...current, experience]);
}

export function updateExperience(companyId: string, id: string, updates: Partial<ExperienceMVP>): void {
  const current = getExperiences(companyId);
  setExperiences(companyId, current.map(e => e.id === id ? { ...e, ...updates, updatedAt: new Date().toISOString() } : e));
}

export function deleteExperience(companyId: string, id: string): void {
  const current = getExperiences(companyId);
  setExperiences(companyId, current.filter(e => e.id !== id));
}

// ============ HELPERS ============

export function getFacilitators(companyId: string): PopulationMember[] {
  return getPopulation(companyId).filter(m => m.facilitator && m.active);
}

export function getNucleoMembers(companyId: string): PopulationMember[] {
  return getPopulation(companyId).filter(m => m.nucleo && m.active);
}

export function getLeaders(companyId: string): PopulationMember[] {
  return getPopulation(companyId).filter(m => m.leadership && m.active);
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

export function getPopulationByUnit(companyId: string): Record<string, PopulationMember[]> {
  const pop = getPopulation(companyId).filter(m => m.active);
  const grouped: Record<string, PopulationMember[]> = {};
  pop.forEach(m => {
    const unit = m.unit || "Sem unidade";
    if (!grouped[unit]) grouped[unit] = [];
    grouped[unit].push(m);
  });
  return grouped;
}

export function getPopulationStats(companyId: string) {
  const pop = getPopulation(companyId);
  const active = pop.filter(m => m.active);
  const facilitators = active.filter(m => m.facilitator);
  const nucleo = active.filter(m => m.nucleo);
  const leaders = active.filter(m => m.leadership);
  const sectors = new Set(active.map(m => m.sector).filter(Boolean));
  const units = new Set(active.map(m => m.unit).filter(Boolean));
  return {
    total: active.length,
    facilitators: facilitators.length,
    nucleoCount: nucleo.length,
    leaders: leaders.length,
    sectors: sectors.size,
    units: units.size,
    inactive: pop.length - active.length,
  };
}

// Check if email is already used in company population
export function isEmailUsedInCompany(companyId: string, email: string, excludeId?: string): boolean {
  if (!email.trim()) return false;
  const pop = getPopulation(companyId);
  const allEmails = pop
    .filter(m => m.id !== excludeId)
    .map(m => m.email.toLowerCase())
    .filter(Boolean);
  return allEmails.includes(email.trim().toLowerCase());
}

// Generate CSV template for population import
export function generatePopulationTemplate(): string {
  const header = "Nome Completo,Email,Cargo / Função,Setor,Unidade,Turno,Data de Admissão";
  const example1 = "João Exemplo Silva,joao.silva@empresa.com,Técnico de Segurança,Operações,Planta Industrial,Turno A,2020-01-15";
  const example2 = "Maria Santos Costa,maria.santos@empresa.com,Coordenadora de RH,Recursos Humanos,Sede Administrativa,Administrativo,2019-06-01";
  const example3 = "Carlos Oliveira,carlos.oliveira@empresa.com,Operador de Máquinas,Produção,Fábrica 02,Turno B,2021-03-10";
  return [header, example1, example2, example3].join("\n");
}

// Parse CSV content into PopulationMember[]
export function parsePopulationCSV(csvContent: string): { members: Omit<PopulationMember, 'id' | 'active' | 'facilitator' | 'nucleo' | 'leadership'>[]; errors: string[] } {
  const lines = csvContent.trim().split('\n');
  const members: Omit<PopulationMember, 'id' | 'active' | 'facilitator' | 'nucleo' | 'leadership'>[] = [];
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
      unit: cols[4] || "",
      shift: cols[5] || "",
      admissionDate: cols[6] || "",
    });
  }

  return { members, errors };
}

// Export population to CSV
export function exportPopulationCSV(companyId: string): string {
  const pop = getPopulation(companyId);
  const header = "nome,setor,cargo,email,unidade,turno,data_admissao,facilitador,nucleo,lideranca,ativo";
  const rows = pop.map(m =>
    `${m.name},${m.sector},${m.role},${m.email},${m.unit},${m.shift},${m.admissionDate},${m.facilitator ? 'sim' : 'não'},${m.nucleo ? 'sim' : 'não'},${m.leadership ? 'sim' : 'não'},${m.active ? 'sim' : 'não'}`
  );
  return [header, ...rows].join('\n');
}
