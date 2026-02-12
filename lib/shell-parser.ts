import { ConfigValues } from "./config-schema";

const DEFAULT_CONFIG: ConfigValues = {
  TEAMS_WINDOW_KEYWORDS: ["Call", "Meeting"],
  POLL_INTERVAL_ACTIVE: 10,
  POLL_INTERVAL_INACTIVE: 30,
  STABILITY_CHECK_DELAY: 5,
  EXPORT_FOLDER: "",
};

type ScalarConfigValues = Pick<
  ConfigValues,
  "POLL_INTERVAL_ACTIVE" | "POLL_INTERVAL_INACTIVE" | "STABILITY_CHECK_DELAY" | "EXPORT_FOLDER"
>;
type NumberScalarKey = "POLL_INTERVAL_ACTIVE" | "POLL_INTERVAL_INACTIVE" | "STABILITY_CHECK_DELAY";
type StringScalarKey = "EXPORT_FOLDER";

const NUMBER_KEYS = new Set<NumberScalarKey>([
  "POLL_INTERVAL_ACTIVE",
  "POLL_INTERVAL_INACTIVE",
  "STABILITY_CHECK_DELAY",
]);
const STRING_KEYS = new Set<StringScalarKey>(["EXPORT_FOLDER"]);

function isNumberScalarKey(key: string): key is NumberScalarKey {
  return NUMBER_KEYS.has(key as NumberScalarKey);
}

function isStringScalarKey(key: string): key is StringScalarKey {
  return STRING_KEYS.has(key as StringScalarKey);
}

function splitValueAndComment(input: string): { value: string; comment: string } {
  let inSingle = false;
  let inDouble = false;
  let escaped = false;

  for (let i = 0; i < input.length; i += 1) {
    const ch = input[i];

    if (escaped) {
      escaped = false;
      continue;
    }
    if (ch === "\\") {
      escaped = true;
      continue;
    }
    if (!inDouble && ch === "'") {
      inSingle = !inSingle;
      continue;
    }
    if (!inSingle && ch === '"') {
      inDouble = !inDouble;
      continue;
    }
    if (!inSingle && !inDouble && ch === "#") {
      return {
        value: input.slice(0, i).trim(),
        comment: input.slice(i).trim(),
      };
    }
  }

  return { value: input.trim(), comment: "" };
}

function decodeQuoted(value: string): string {
  if (value.length < 2 || value[0] !== '"' || value[value.length - 1] !== '"') {
    return value.trim();
  }

  const inner = value.slice(1, -1);
  return inner.replace(/\\([\\`"$])/g, "$1");
}

function encodeQuoted(value: string): string {
  return `"${value.replace(/([\\`"$])/g, "\\$1")}"`;
}

function parseScalarAssignments(shContent: string): Partial<ScalarConfigValues> {
  const parsed: Partial<ScalarConfigValues> = {};
  const lines = shContent.split(/\r?\n/);

  for (const line of lines) {
    const match = line.match(/^\s*([A-Z_][A-Z0-9_]*)\s*=(.*)$/);
    if (!match) {
      continue;
    }

    const key = match[1];
    const rest = splitValueAndComment(match[2]);

    if (isNumberScalarKey(key)) {
      const num = Number.parseInt(rest.value, 10);
      if (Number.isFinite(num)) {
        parsed[key] = num;
      }
      continue;
    }

    if (isStringScalarKey(key)) {
      parsed[key] = decodeQuoted(rest.value);
    }
  }

  return parsed;
}

function parseKeywords(shContent: string): string[] {
  const lines = shContent.split(/\r?\n/);
  const startIndex = lines.findIndex((line) => /^\s*TEAMS_WINDOW_KEYWORDS\s*=\s*\(/.test(line));
  if (startIndex === -1) {
    return [];
  }

  const keywords: string[] = [];
  for (let i = startIndex + 1; i < lines.length; i += 1) {
    const line = lines[i];
    if (/^\s*\)/.test(line)) {
      break;
    }

    const regex = /"((?:\\.|[^"\\])*)"/g;
    let match: RegExpExecArray | null;
    while ((match = regex.exec(line)) !== null) {
      keywords.push(match[1].replace(/\\([\\`"$])/g, "$1"));
    }
  }

  return keywords;
}

export function parseConfig(shContent: string): ConfigValues {
  const scalars = parseScalarAssignments(shContent);
  const keywords = parseKeywords(shContent);

  return {
    TEAMS_WINDOW_KEYWORDS:
      keywords.length > 0 ? keywords : DEFAULT_CONFIG.TEAMS_WINDOW_KEYWORDS,
    POLL_INTERVAL_ACTIVE:
      scalars.POLL_INTERVAL_ACTIVE ?? DEFAULT_CONFIG.POLL_INTERVAL_ACTIVE,
    POLL_INTERVAL_INACTIVE:
      scalars.POLL_INTERVAL_INACTIVE ?? DEFAULT_CONFIG.POLL_INTERVAL_INACTIVE,
    STABILITY_CHECK_DELAY:
      scalars.STABILITY_CHECK_DELAY ?? DEFAULT_CONFIG.STABILITY_CHECK_DELAY,
    EXPORT_FOLDER: scalars.EXPORT_FOLDER ?? DEFAULT_CONFIG.EXPORT_FOLDER,
  };
}

export function updateConfig(shContent: string, newValues: ConfigValues): string {
  const lines = shContent.split(/\r?\n/);
  const replacedKeys = new Set<keyof ConfigValues>();

  const arrayStartIndex = lines.findIndex((line) => /^\s*TEAMS_WINDOW_KEYWORDS\s*=\s*\(/.test(line));
  if (arrayStartIndex !== -1) {
    let arrayEndIndex = arrayStartIndex;
    for (let i = arrayStartIndex + 1; i < lines.length; i += 1) {
      if (/^\s*\)/.test(lines[i])) {
        arrayEndIndex = i;
        break;
      }
    }

    const indent = (lines[arrayStartIndex].match(/^(\s*)/)?.[1] ?? "");
    const newArrayBlock = [
      `${indent}TEAMS_WINDOW_KEYWORDS=(`,
      ...newValues.TEAMS_WINDOW_KEYWORDS.map((keyword) => `${indent}  ${encodeQuoted(keyword)}`),
      `${indent})`,
    ];

    lines.splice(arrayStartIndex, arrayEndIndex - arrayStartIndex + 1, ...newArrayBlock);
    replacedKeys.add("TEAMS_WINDOW_KEYWORDS");
  }

  const scalarRenderers: Record<Exclude<keyof ConfigValues, "TEAMS_WINDOW_KEYWORDS">, string> = {
    POLL_INTERVAL_ACTIVE: String(newValues.POLL_INTERVAL_ACTIVE),
    POLL_INTERVAL_INACTIVE: String(newValues.POLL_INTERVAL_INACTIVE),
    STABILITY_CHECK_DELAY: String(newValues.STABILITY_CHECK_DELAY),
    EXPORT_FOLDER: encodeQuoted(newValues.EXPORT_FOLDER || ""),
  };

  for (let i = 0; i < lines.length; i += 1) {
    const match = lines[i].match(/^(\s*)([A-Z_][A-Z0-9_]*)\s*=(.*)$/);
    if (!match) {
      continue;
    }

    const key = match[2] as keyof ConfigValues;
    if (key === "TEAMS_WINDOW_KEYWORDS") {
      continue;
    }
    if (!(key in scalarRenderers)) {
      continue;
    }

    const indent = match[1];
    const { comment } = splitValueAndComment(match[3]);
    const commentSuffix = comment ? ` ${comment}` : "";
    lines[i] = `${indent}${key}=${scalarRenderers[key as keyof typeof scalarRenderers]}${commentSuffix}`;
    replacedKeys.add(key);
  }

  if (!replacedKeys.has("TEAMS_WINDOW_KEYWORDS")) {
    lines.push(
      "TEAMS_WINDOW_KEYWORDS=(",
      ...newValues.TEAMS_WINDOW_KEYWORDS.map((keyword) => `  ${encodeQuoted(keyword)}`),
      ")",
    );
  }

  (["POLL_INTERVAL_ACTIVE", "POLL_INTERVAL_INACTIVE", "STABILITY_CHECK_DELAY", "EXPORT_FOLDER"] as const).forEach((key) => {
    if (!replacedKeys.has(key)) {
      lines.push(`${key}=${scalarRenderers[key]}`);
    }
  });

  return lines.join("\n");
}
