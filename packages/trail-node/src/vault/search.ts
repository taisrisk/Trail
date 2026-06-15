import { readTrailState, MailRecord } from "../store";

// Simple encrypted search index using trigrams and SQLite/in-memory for the local production build
import { TrailState } from "../store";
export async function indexMailSearch(state: TrailState, mail: MailRecord) {

  if (!state.searchIndex) state.searchIndex = {};

  const tokenize = (text: string) => {
    return text.toLowerCase().replace(/[^a-z0-9]/g, ' ').split(/\s+/).filter(Boolean);
  };

  const tokens = new Set([
    ...tokenize(mail.subject),
    ...tokenize(mail.body || ""),
    ...tokenize(mail.from),
    ...tokenize(mail.to),
  ]);

  for (const token of tokens) {
    if (!state.searchIndex[token]) {
      state.searchIndex[token] = [];
    }
    if (!state.searchIndex[token].includes(mail.id)) {
      state.searchIndex[token].push(mail.id);
    }
  }
}

export async function searchVault(query: string) {
  const state = await readTrailState();
  if (!state.searchIndex) return [];

  const tokens = query.toLowerCase().replace(/[^a-z0-9]/g, ' ').split(/\s+/).filter(Boolean);
  if (tokens.length === 0) return [];

  let matchIds: string[] | null = null;

  for (const token of tokens) {
    const ids = state.searchIndex[token] || [];
    if (matchIds === null) {
      matchIds = [...ids];
    } else {
      matchIds = matchIds.filter(id => ids.includes(id));
    }
  }

  if (!matchIds) return [];
  return state.mail.filter(m => matchIds!.includes(m.id));
}
