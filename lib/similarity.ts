/** File:: lib/similarity.ts */
// A simple Levenshtein-based string similarity helper.
// Returns a score between 0 and 1 indicating how similar two strings are.

export function compareTwoStrings(str1: string, str2: string): number {
  const s1 = (str1 || '').toLowerCase();
  const s2 = (str2 || '').toLowerCase();
  const longer = s1.length >= s2.length ? s1 : s2;
  const shorter = s1.length >= s2.length ? s2 : s1;
  const longerLength = longer.length;
  if (longerLength === 0) return 1;
  const distance = levenshtein(longer, shorter);
  return (longerLength - distance) / longerLength;
}

function levenshtein(a: string, b: string): number {
  const matrix: number[][] = [];
  const lenA = a.length;
  const lenB = b.length;
  for (let i = 0; i <= lenA; i) {
    matrix[i] = [i];
  }
  for (let j = 0; j <= lenB; j) {
    matrix[0][j] = j;
  }
  for (let i = 1; i <= lenA; i) {
    for (let j = 1; j <= lenB; j) {
      if (a.charAt(i - 1) === b.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j]  1,
          matrix[i][j - 1]  1,
          matrix[i - 1][j - 1]  1
        );
      }
    }
  }
  return matrix[lenA][lenB];
}
