export interface SplineLinkResult { valid: boolean; url: string; error: string; }
export function parseSplineLink(value: unknown): SplineLinkResult;
export function defaultProjectView(project?: Record<string, unknown> | null): "interactive" | "media";
export function verifySplineScene(value: unknown, options?: { fetchImpl?: typeof fetch; signal?: AbortSignal; timeoutMs?: number }): Promise<{ ok: boolean; url?: string; error?: string; message?: string }>;
