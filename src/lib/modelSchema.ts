export const CURRENT_MODEL_VERSION = 1;

export const SUPPORTED_MODEL_VERSIONS = [1];

export function makeFreshMetadata(existing?: any) {
  return {
    created_at: existing?.created_at || new Date().toISOString(),
    updated_at: new Date().toISOString(),
    title: existing?.title || "Untitled Wiring Model"
  };
}

export function createEmptyModelShell() {
  return {
    model_version: CURRENT_MODEL_VERSION,
    metadata: makeFreshMetadata(),
    nets: [],
    components: [],
    wires: []
  };
}

export function isObject(value: any) {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

export function assertImportShape(candidate: any) {
  if (!isObject(candidate)) {
    throw new Error("Imported file is not a valid object.");
  }

  if ("components" in candidate && !Array.isArray(candidate.components)) {
    throw new Error("Imported file has invalid components array.");
  }

  if ("wires" in candidate && !Array.isArray(candidate.wires)) {
    throw new Error("Imported file has invalid wires array.");
  }

  if ("nets" in candidate && !Array.isArray(candidate.nets)) {
    throw new Error("Imported file has invalid nets array.");
  }

  if ("metadata" in candidate && candidate.metadata != null && !isObject(candidate.metadata)) {
    throw new Error("Imported file has invalid metadata object.");
  }
}

export function getImportVersion(candidate: any) {
  const version = Number(candidate?.model_version ?? 1);
  return Number.isFinite(version) ? version : 1;
}

export function canImportVersion(version: number) {
  return SUPPORTED_MODEL_VERSIONS.includes(version);
}