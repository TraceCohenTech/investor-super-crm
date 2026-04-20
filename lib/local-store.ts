const NOTES_KEY = "nyvp-crm-notes";
const FOLLOWUPS_KEY = "nyvp-crm-followups";
const SNOOZED_KEY = "nyvp-crm-snoozed";

export type Note = { text: string; date: string };

export function getNotes(contactId: string): Note[] {
  if (typeof window === "undefined") return [];
  try {
    const all = JSON.parse(localStorage.getItem(NOTES_KEY) || "{}");
    return all[contactId] || [];
  } catch {
    return [];
  }
}

export function addNote(contactId: string, text: string) {
  const all = JSON.parse(localStorage.getItem(NOTES_KEY) || "{}");
  const notes = all[contactId] || [];
  notes.unshift({ text, date: new Date().toISOString().split("T")[0] });
  all[contactId] = notes;
  localStorage.setItem(NOTES_KEY, JSON.stringify(all));
}

export function deleteNote(contactId: string, index: number) {
  const all = JSON.parse(localStorage.getItem(NOTES_KEY) || "{}");
  const notes = all[contactId] || [];
  notes.splice(index, 1);
  all[contactId] = notes;
  localStorage.setItem(NOTES_KEY, JSON.stringify(all));
}

export function getFollowUp(contactId: string): string | null {
  if (typeof window === "undefined") return null;
  try {
    const all = JSON.parse(localStorage.getItem(FOLLOWUPS_KEY) || "{}");
    return all[contactId] || null;
  } catch {
    return null;
  }
}

export function setFollowUp(contactId: string, date: string | null) {
  const all = JSON.parse(localStorage.getItem(FOLLOWUPS_KEY) || "{}");
  if (date) {
    all[contactId] = date;
  } else {
    delete all[contactId];
  }
  localStorage.setItem(FOLLOWUPS_KEY, JSON.stringify(all));
}

export function getAllFollowUps(): Record<string, string> {
  if (typeof window === "undefined") return {};
  try {
    return JSON.parse(localStorage.getItem(FOLLOWUPS_KEY) || "{}");
  } catch {
    return {};
  }
}

export function snoozeContact(contactId: string, until: string) {
  const all = JSON.parse(localStorage.getItem(SNOOZED_KEY) || "{}");
  all[contactId] = until;
  localStorage.setItem(SNOOZED_KEY, JSON.stringify(all));
}

export function getSnoozed(): Record<string, string> {
  if (typeof window === "undefined") return {};
  try {
    return JSON.parse(localStorage.getItem(SNOOZED_KEY) || "{}");
  } catch {
    return {};
  }
}

export function getAllNotes(): Record<string, Note[]> {
  if (typeof window === "undefined") return {};
  try {
    return JSON.parse(localStorage.getItem(NOTES_KEY) || "{}");
  } catch {
    return {};
  }
}
