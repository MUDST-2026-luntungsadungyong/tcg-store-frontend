export function levenshteinDistance(a: string, b: string): number {
  const s1 = a.toLowerCase();
  const s2 = b.toLowerCase();
  const m = s1.length;
  const n = s2.length;
  if (m === 0) return n;
  if (n === 0) return m;

  let prev = Array.from({ length: n + 1 }, (_, i) => i);
  const curr = new Array<number>(n + 1);

  for (let i = 1; i <= m; i++) {
    curr[0] = i;
    const c1 = s1.charAt(i - 1);
    for (let j = 1; j <= n; j++) {
      const c2 = s2.charAt(j - 1);
      const cost = c1 === c2 ? 0 : 1;
      curr[j] = Math.min(curr[j - 1] + 1, prev[j] + 1, prev[j - 1] + cost);
    }
    for (let k = 0; k <= n; k++) {
      prev[k] = curr[k];
    }
  }

  return prev[n];
}

const COMMON_DICTIONARY = [
  'Pokemon',
  'Poke Ball',
  'Charizard',
  'Pikachu',
  'Mew',
  'Mewtwo',
  'Blastoise',
  'Venusaur',
  'Bulbasaur',
  'Charmander',
  'Squirtle',
  'Gengar',
  'Eevee',
  'Snorlax',
  'Dragonite',
];

export function findFuzzySuggestion(
  query: string,
  extraCandidates: string[] = []
): { suggested: string; distance: number } | null {
  const trimmed = query.trim().toLowerCase();
  if (!trimmed) return null;

  const allCandidates = Array.from(new Set([...COMMON_DICTIONARY, ...extraCandidates]));

  // If already exact match, no typo
  if (allCandidates.some((c) => c.toLowerCase() === trimmed)) {
    return null;
  }

  let best: string | null = null;
  let minDistance = 3; // only accept distance <= 2

  for (const candidate of allCandidates) {
    const dist = levenshteinDistance(trimmed, candidate);
    if (dist <= 2 && dist < minDistance) {
      minDistance = dist;
      best = candidate;
    }
  }

  if (best) {
    return { suggested: best, distance: minDistance };
  }
  return null;
}
