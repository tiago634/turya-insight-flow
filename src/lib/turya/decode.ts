export function base64ToBlob(base64: string, mime: string): Blob {
  const normalized = normalizeBase64Payload(base64);
  const binaryString = atob(normalized);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return new Blob([bytes], { type: mime });
}

export function extractSecondarySpreadsheet(data: Record<string, unknown>): { blob: Blob; fileName: string } | null {
  const defaultFileName = "Analise_Turya_XLSX";

  const directKeyCandidates = [
    "Analise_Turya_XLSX",
    "Analise_Turya_XLSX.xls",
    "analise_turya_xlsx",
    "analise_turya_xls",
    "xlsx_content",
    "xls_content",
    "excel_content",
    "excel_base64",
    "spreadsheet_base64",
    "secondary_file_content",
    "arquivo_extra_content",
    "secondary_file_base64",
    "excel_file",
  ];

  // 1) Tenta chaves diretas conhecidas (backend: xlsx_content / Analise_Turya_XLSX).
  for (const key of directKeyCandidates) {
    const v = data[key];
    if (typeof v === "string" && v.trim()) {
      const decoded = decodeSpreadsheetFromBase64String(v.trim(), defaultFileName);
      if (decoded) return decoded;
      const trusted = sheetBlobFromTrustedApiBase64(v.trim(), key);
      if (trusted) return trusted;
    }
  }

  // 2) Busca recursiva por objetos com filename + conteúdo base64.
  const queue: unknown[] = [data];
  const visited = new Set<unknown>();

  while (queue.length > 0) {
    const current = queue.shift();
    if (!current || typeof current !== "object") continue;
    if (visited.has(current)) continue;
    visited.add(current);

    if (Array.isArray(current)) {
      for (const item of current) queue.push(item);
      continue;
    }

    const obj = current as Record<string, unknown>;

    const fileName = getFirstString(
      obj,
      ["fileName", "filename", "name", "arquivo", "output_name"],
      defaultFileName
    );
    const normalizedFileName = fileName.toLowerCase();

    // Conteúdos comuns: planilha pode vir como XLS (OLE) ou XLSX (ZIP).
    for (const contentKey of [
      "content",
      "base64",
      "data",
      "file",
      "value",
      "xlsx",
      "xls",
      "buffer",
      "binary",
      "payload",
    ]) {
      const value = obj[contentKey];
      if (typeof value !== "string" || !value.trim()) continue;

      const looksLikeSpreadsheetName =
        normalizedFileName.includes("xlsx") ||
        normalizedFileName.includes("xls") ||
        normalizedFileName.includes("analise_turya") ||
        normalizedFileName.includes("excel");

      const shouldTryAsSpreadsheet =
        looksLikeSpreadsheetName ||
        contentKey === "xlsx" ||
        contentKey === "xls";

      if (shouldTryAsSpreadsheet) {
        const decoded = decodeSpreadsheetFromBase64String(value.trim(), fileName);
        if (decoded) return decoded;
      }

      const decoded = decodeSpreadsheetFromBase64String(value.trim(), defaultFileName);
      if (decoded) return decoded;
    }

    // Explora recursivamente.
    for (const v of Object.values(obj)) {
      if (typeof v === "object" && v !== null) queue.push(v);
    }
  }

  // 3) Último recurso: qualquer string longa em base64 que decodifique para XLS/XLSX (chaves imprevistas no backend).
  const loose = findSpreadsheetInUnknownStrings(data);
  return loose;
}

/** XLSX (OOXML) = PK. XLS BIFF = OLE. Alguns .xls são XML Spreadsheet (texto <?xml / <Workbook). */
export function detectSpreadsheetFromBytes(bytes: Uint8Array): { mime: string; fileName: string } | null {
  if (bytes.length >= 4 && bytes[0] === 0x50 && bytes[1] === 0x4b) {
    return {
      mime: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      fileName: "Analise_Turya_XLSX.xlsx",
    };
  }
  if (
    bytes.length >= 8 &&
    bytes[0] === 0xd0 &&
    bytes[1] === 0xcf &&
    bytes[2] === 0x11 &&
    bytes[3] === 0xe0
  ) {
    return {
      mime: "application/vnd.ms-excel",
      fileName: "Analise_Turya_XLSX.xls",
    };
  }

  let off = 0;
  if (bytes.length >= 3 && bytes[0] === 0xef && bytes[1] === 0xbb && bytes[2] === 0xbf) {
    off = 3;
  }
  if (bytes.length >= 2 && bytes[0] === 0xff && bytes[1] === 0xfe) {
    const t = new TextDecoder("utf-16le").decode(bytes.slice(0, Math.min(4096, bytes.length))).trimStart();
    if (t.startsWith("<?xml") || t.includes("<Workbook") || t.includes("ss:Workbook")) {
      return { mime: "application/vnd.ms-excel", fileName: "Analise_Turya_XLSX.xls" };
    }
  }

  const head = new TextDecoder("utf-8", { fatal: false }).decode(bytes.slice(off, Math.min(4096, bytes.length))).trimStart();
  if (
    head.startsWith("<?xml") ||
    /^<Workbook[\s>]/i.test(head) ||
    head.includes("<ss:Workbook") ||
    head.includes("urn:schemas-microsoft-com:office:spreadsheet")
  ) {
    return { mime: "application/vnd.ms-excel", fileName: "Analise_Turya_XLSX.xls" };
  }

  return null;
}

/**
 * Se o backend já enviou em xlsx_content / Analise_Turya_XLSX mas o binário não bateu nas assinaturas acima,
 * ainda montamos o download (o servidor já classificou como planilha).
 */
export function sheetBlobFromTrustedApiBase64(value: string, _apiKey: string): { blob: Blob; fileName: string } | null {
  try {
    if (/^https?:\/\//i.test(value)) return null;
    const normalized = normalizeBase64Payload(value);
    if (normalized.length < 24) return null;
    const binaryString = atob(normalized);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    if (bytes.length >= 4 && bytes[0] === 0x50 && bytes[1] === 0x4b) {
      return {
        blob: new Blob([bytes], {
          type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        }),
        fileName: "Analise_Turya_XLSX.xlsx",
      };
    }
    return {
      blob: new Blob([bytes], { type: "application/vnd.ms-excel" }),
      fileName: "Analise_Turya_XLSX.xls",
    };
  } catch {
    return null;
  }
}

export function normalizeBase64Payload(value: string): string {
  let s = value.trim().replace(/\s/g, "");
  if (s.startsWith("data:")) {
    const i = s.indexOf("base64,");
    if (i !== -1) s = s.slice(i + 7);
    else {
      const comma = s.indexOf(",");
      if (comma !== -1) s = s.slice(comma + 1);
    }
  }
  const pad = s.length % 4;
  if (pad) s += "=".repeat(4 - pad);
  return s;
}

export function decodeSpreadsheetFromBase64String(
  value: string,
  preferredName: string
): { blob: Blob; fileName: string } | null {
  try {
    if (/^https?:\/\//i.test(value)) return null;
    const normalized = normalizeBase64Payload(value);
    const binaryString = atob(normalized);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    const detected = detectSpreadsheetFromBytes(bytes);
    if (!detected) return null;
    const name =
      preferredName && preferredName !== "Analise_Turya_XLSX"
        ? preferredName
        : detected.fileName;
    return { blob: new Blob([bytes], { type: detected.mime }), fileName: name };
  } catch {
    return null;
  }
}

export function findSpreadsheetInUnknownStrings(root: unknown): { blob: Blob; fileName: string } | null {
  const queue: unknown[] = [root];
  const visited = new Set<unknown>();
  const minLen = 200;

  while (queue.length > 0) {
    const current = queue.shift();
    if (current === null || current === undefined) continue;
    if (typeof current === "string") {
      if (current.length < minLen) continue;
      const decoded = decodeSpreadsheetFromBase64String(current, "Analise_Turya_XLSX");
      if (decoded) return decoded;
      continue;
    }
    if (typeof current !== "object") continue;
    if (visited.has(current)) continue;
    visited.add(current);

    if (Array.isArray(current)) {
      for (const item of current) queue.push(item);
      continue;
    }
    for (const v of Object.values(current as Record<string, unknown>)) {
      queue.push(v);
    }
  }
  return null;
}

export function getFirstString(
  obj: Record<string, unknown>,
  keys: string[],
  fallback: string
): string {
  for (const key of keys) {
    const value = obj[key];
    if (typeof value === "string" && value.trim()) return value.trim();
  }
  return fallback;
}
