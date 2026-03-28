const ocrFixes: Array<[RegExp, string]> = [
  [/0/g, "o"],
  [/1/g, "i"],
  [/\|/g, "i"],
  [/5/g, "s"]
];

export function stripAccents(value: string): string {
  return value.normalize("NFD").replace(/\p{Diacritic}/gu, "");
}

export function normalizeForMatch(value: string): string {
  let normalized = stripAccents(value).toLowerCase();
  for (const [pattern, replacement] of ocrFixes) {
    normalized = normalized.replace(pattern, replacement);
  }
  return normalized.replace(/[^a-z\s]/g, " ").replace(/\s+/g, " ").trim();
}

export function diceCoefficient(left: string, right: string): number {
  if (!left.length || !right.length) {
    return 0;
  }
  if (left === right) {
    return 1;
  }

  const toBigrams = (value: string): string[] => {
    if (value.length < 2) {
      return [value];
    }

    const bigrams: string[] = [];
    for (let index = 0; index < value.length - 1; index += 1) {
      bigrams.push(value.slice(index, index + 2));
    }
    return bigrams;
  };

  const leftBigrams = toBigrams(left);
  const rightBigrams = toBigrams(right);
  const counts = new Map<string, number>();

  for (const gram of leftBigrams) {
    counts.set(gram, (counts.get(gram) ?? 0) + 1);
  }

  let overlap = 0;
  for (const gram of rightBigrams) {
    const count = counts.get(gram) ?? 0;
    if (count > 0) {
      counts.set(gram, count - 1);
      overlap += 1;
    }
  }

  return (2 * overlap) / (leftBigrams.length + rightBigrams.length);
}
