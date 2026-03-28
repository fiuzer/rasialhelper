import type { TrackerIconTemplateMap } from "./icon-matcher";

const STORAGE_KEY = "rasial-helper:tracker-icon-templates";

export function loadTrackerIconTemplates(storage: Storage | undefined): TrackerIconTemplateMap {
  if (!storage) {
    return {};
  }

  const raw = storage.getItem(STORAGE_KEY);
  if (!raw) {
    return {};
  }

  try {
    const parsed = JSON.parse(raw) as TrackerIconTemplateMap;
    return parsed ?? {};
  } catch {
    return {};
  }
}

export function saveTrackerIconTemplates(
  storage: Storage | undefined,
  templates: TrackerIconTemplateMap
): boolean {
  if (!storage) {
    return false;
  }

  try {
    storage.setItem(STORAGE_KEY, JSON.stringify(templates));
    return true;
  } catch {
    return false;
  }
}

export function clearTrackerIconTemplates(storage: Storage | undefined): boolean {
  if (!storage) {
    return false;
  }

  try {
    storage.removeItem(STORAGE_KEY);
    return true;
  } catch {
    return false;
  }
}
