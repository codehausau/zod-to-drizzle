import { z } from "zod";

type ZodStringFormatCheckDef = {
  check?: string;
  format?: string;
  offset?: boolean;
};

function getStringFormatChecks(zodType: z.ZodTypeAny): ZodStringFormatCheckDef[] {
  if (!(zodType instanceof z.ZodString)) {
    return [];
  }

  const checks = zodType.def.checks;
  if (!Array.isArray(checks)) {
    return [];
  }

  return checks
    .map((check) => (check as { def?: ZodStringFormatCheckDef }).def)
    .filter((check): check is ZodStringFormatCheckDef => check !== undefined);
}

function getStringFormatCheck(
  zodType: z.ZodTypeAny,
  format: string,
): ZodStringFormatCheckDef | undefined {
  return getStringFormatChecks(zodType).find(
    (check) =>
      check.check === "string_format" &&
      check.format === format,
  );
}

export function isUuidStringSchema(zodType: z.ZodTypeAny): boolean {
  return getStringFormatCheck(zodType, "uuid") !== undefined;
}

export function isDateTimeStringSchema(zodType: z.ZodTypeAny): boolean {
  return getStringFormatCheck(zodType, "datetime") !== undefined;
}

export function isOffsetDateTimeStringSchema(
  zodType: z.ZodTypeAny,
): boolean {
  return getStringFormatCheck(zodType, "datetime")?.offset === true;
}
