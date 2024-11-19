export class UnsupportedZodTypeError extends Error {
	constructor(message: string) {
		super(`Unsupported Zod type: ${message}`);
		this.name = "UnsupportedZodTypeError";
	}
}
