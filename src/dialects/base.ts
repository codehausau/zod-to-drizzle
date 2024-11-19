import type { z } from "zod";
import type { ColumnWithMeta } from "../types";

export abstract class DialectHandler {
	abstract string(isOptional: boolean): ColumnWithMeta;
	abstract number(isOptional: boolean): ColumnWithMeta;
	abstract boolean(isOptional: boolean): ColumnWithMeta;
	abstract json(isOptional: boolean): ColumnWithMeta;
	abstract date(isOptional: boolean): ColumnWithMeta;
	abstract enum(isOptional: boolean): ColumnWithMeta;
	abstract primaryKey(zodType: z.ZodType): ColumnWithMeta;
}
