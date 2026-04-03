import * as XLSX from "xlsx";
import type { PopulationMember } from "./companyStorage";

const HEADERS = [
  "Nome Completo",
  "Email",
  "Cargo / Função",
  "Setor",
  "Unidade",
  "Turno",
  "Data de Admissão",
];

const EXPORT_HEADERS = [
  "Nome Completo",
  "Email",
  "Cargo / Função",
  "Setor",
  "Unidade",
  "Turno",
  "Data de Admissão",
  "Facilitador",
  "Núcleo",
  "Liderança",
  "Status",
];

const EXAMPLE_ROWS = [
  ["João Exemplo Silva", "joao.silva@empresa.com", "Técnico de Segurança", "Operações", "Planta Industrial", "Turno A", "2020-01-15"],
  ["Maria Santos Costa", "maria.santos@empresa.com", "Coordenadora de RH", "Recursos Humanos", "Sede Administrativa", "Administrativo", "2019-06-01"],
  ["Carlos Oliveira", "carlos.oliveira@empresa.com", "Operador de Máquinas", "Produção", "Fábrica 02", "Turno B", "2021-03-10"],
];

export function downloadExcelTemplate() {
  const wb = XLSX.utils.book_new();
  const data = [HEADERS, ...EXAMPLE_ROWS];
  const ws = XLSX.utils.aoa_to_sheet(data);

  // Column widths
  ws["!cols"] = [
    { wch: 25 }, // Nome
    { wch: 30 }, // Email
    { wch: 25 }, // Cargo
    { wch: 20 }, // Setor
    { wch: 22 }, // Unidade
    { wch: 15 }, // Turno
    { wch: 18 }, // Data Admissão
  ];

  XLSX.utils.book_append_sheet(wb, ws, "Modelo");
  XLSX.writeFile(wb, "modelo_base_populacional.xlsx");
}

export function exportPopulationExcel(members: PopulationMember[], filename: string) {
  const rows = members.map(m => [
    m.name,
    m.email,
    m.role,
    m.sector,
    m.unit,
    m.shift,
    m.admissionDate,
    m.facilitator ? "Sim" : "Não",
    m.nucleo ? "Sim" : "Não",
    m.leadership ? "Sim" : "Não",
    m.active ? "Ativo" : "Inativo",
  ]);

  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.aoa_to_sheet([EXPORT_HEADERS, ...rows]);

  ws["!cols"] = [
    { wch: 25 }, { wch: 30 }, { wch: 25 }, { wch: 20 },
    { wch: 22 }, { wch: 15 }, { wch: 18 }, { wch: 12 },
    { wch: 10 }, { wch: 12 }, { wch: 10 },
  ];

  XLSX.utils.book_append_sheet(wb, ws, "Colaboradores");
  XLSX.writeFile(wb, filename);
}

export function exportPopulationCSVCompat(members: PopulationMember[], filename: string) {
  const header = EXPORT_HEADERS.join(";");
  const rows = members.map(m =>
    [
      m.name, m.email, m.role, m.sector, m.unit, m.shift, m.admissionDate,
      m.facilitator ? "Sim" : "Não",
      m.nucleo ? "Sim" : "Não",
      m.leadership ? "Sim" : "Não",
      m.active ? "Ativo" : "Inativo",
    ].join(";")
  );
  const csv = [header, ...rows].join("\n");
  const bom = "\uFEFF";
  const blob = new Blob([bom + csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

// Header normalization map
const HEADER_MAP: Record<string, string> = {
  "nome completo": "name",
  "nome": "name",
  "email": "email",
  "e-mail": "email",
  "cargo / função": "role",
  "cargo": "role",
  "função": "role",
  "cargo/função": "role",
  "setor": "sector",
  "unidade": "unit",
  "turno": "shift",
  "data de admissão": "admissionDate",
  "data admissão": "admissionDate",
  "data_admissao": "admissionDate",
  "data de admissao": "admissionDate",
};

interface ParsedMember {
  name: string;
  email: string;
  role: string;
  sector: string;
  unit: string;
  shift: string;
  admissionDate: string;
}

export interface ImportResult {
  members: ParsedMember[];
  errors: string[];
  duplicatesSkipped: number;
  updated: number;
  added: number;
}

function parseRows(rows: string[][]): { members: ParsedMember[]; errors: string[] } {
  if (rows.length < 2) return { members: [], errors: ["Arquivo vazio ou sem dados"] };

  const headerRow = rows[0].map(h => h.trim().toLowerCase());
  const colMap: Record<string, number> = {};
  headerRow.forEach((h, i) => {
    const mapped = HEADER_MAP[h];
    if (mapped) colMap[mapped] = i;
  });

  // Fallback: positional if no headers matched
  const hasMapping = Object.keys(colMap).length >= 2;
  const members: ParsedMember[] = [];
  const errors: string[] = [];

  for (let i = 1; i < rows.length; i++) {
    const cols = rows[i];
    if (!cols.some(c => c?.trim())) continue;

    let m: ParsedMember;
    if (hasMapping) {
      m = {
        name: cols[colMap.name ?? 0]?.trim() || "",
        email: cols[colMap.email ?? 1]?.trim() || "",
        role: cols[colMap.role ?? 2]?.trim() || "",
        sector: cols[colMap.sector ?? 3]?.trim() || "",
        unit: cols[colMap.unit ?? 4]?.trim() || "",
        shift: cols[colMap.shift ?? 5]?.trim() || "",
        admissionDate: cols[colMap.admissionDate ?? 6]?.trim() || "",
      };
    } else {
      // Positional fallback
      m = {
        name: cols[0]?.trim() || "",
        email: cols[1]?.trim() || "",
        role: cols[2]?.trim() || "",
        sector: cols[3]?.trim() || "",
        unit: cols[4]?.trim() || "",
        shift: cols[5]?.trim() || "",
        admissionDate: cols[6]?.trim() || "",
      };
    }

    if (!m.name) {
      errors.push(`Linha ${i + 1}: nome é obrigatório`);
      continue;
    }
    members.push(m);
  }

  return { members, errors };
}

export function parseImportFile(
  file: File,
  existingPopulation: PopulationMember[],
  callback: (result: ImportResult) => void
) {
  const ext = file.name.split(".").pop()?.toLowerCase();

  if (ext === "xlsx" || ext === "xls") {
    const reader = new FileReader();
    reader.onload = (e) => {
      const data = new Uint8Array(e.target?.result as ArrayBuffer);
      const wb = XLSX.read(data, { type: "array" });
      const ws = wb.Sheets[wb.SheetNames[0]];
      const rows: string[][] = XLSX.utils.sheet_to_json(ws, { header: 1 });
      const { members, errors } = parseRows(rows);
      const result = deduplicateAndMerge(members, existingPopulation);
      result.errors = [...errors, ...result.errors];
      callback(result);
    };
    reader.readAsArrayBuffer(file);
  } else {
    // CSV
    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      if (!content) {
        callback({ members: [], errors: ["Arquivo vazio"], duplicatesSkipped: 0, updated: 0, added: 0 });
        return;
      }
      // Autodetect delimiter
      const firstLine = content.split("\n")[0];
      const delimiter = firstLine.includes(";") ? ";" : ",";
      const lines = content.trim().split("\n");
      const rows = lines.map(l => l.split(delimiter).map(c => c.trim()));
      const { members, errors } = parseRows(rows);
      const result = deduplicateAndMerge(members, existingPopulation);
      result.errors = [...errors, ...result.errors];
      callback(result);
    };
    reader.readAsText(file, "UTF-8");
  }
}

function deduplicateAndMerge(
  parsed: ParsedMember[],
  existing: PopulationMember[]
): ImportResult {
  const emailMap = new Map<string, PopulationMember>();
  existing.forEach(m => {
    if (m.email) emailMap.set(m.email.toLowerCase(), m);
  });

  const members: ParsedMember[] = [];
  let duplicatesSkipped = 0;
  let updated = 0;
  let added = 0;

  for (const m of parsed) {
    if (m.email && emailMap.has(m.email.toLowerCase())) {
      // Email exists — skip (will be reported)
      duplicatesSkipped++;
    } else {
      members.push(m);
      added++;
    }
  }

  return { members, errors: [], duplicatesSkipped, updated, added };
}
