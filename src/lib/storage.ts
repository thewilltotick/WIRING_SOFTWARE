const STORAGE_KEY = "trailer-wiring-studio-model";

export function saveModelToStorage(model: any) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(model));
}

export function loadModelFromStorage() {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return null;
  return JSON.parse(raw);
}

export function clearModelFromStorage() {
  localStorage.removeItem(STORAGE_KEY);
}

export function downloadModelJson(model: any, filename = "trailer-wiring-model.json") {
  const blob = new Blob([JSON.stringify(model, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}