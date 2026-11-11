import type { ModuleManifest } from './manifestSchema.ts';

// Only types come from the schema, so a manifest loaded by the UI does not bundle zod. The backend
// loader validates every manifest at startup, and the server refuses to start on an invalid one.
export const defineModule = (manifest: ModuleManifest): ModuleManifest => manifest;
