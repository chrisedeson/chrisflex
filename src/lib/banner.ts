// Animated ASCII banner for chrisflex CLI
// Pink → Purple gradient, row-by-row reveal

// Block letter font for "CHRISFLEX" — each letter is 7 rows tall, variable width
// Using █ ▀ ▄ characters for clean block aesthetic

const LETTERS: Record<string, string[]> = {
  C: [
    ' ██████╗',
    '██╔════╝',
    '██║     ',
    '██║     ',
    '██║     ',
    '╚██████╗',
    ' ╚═════╝',
  ],
  H: [
    '██╗  ██╗',
    '██║  ██║',
    '████████║',
    '██╔══██║',
    '██║  ██║',
    '██║  ██║',
    '╚═╝  ╚═╝',
  ],
  R: [
    '██████╗ ',
    '██╔══██╗',
    '██████╔╝',
    '██╔══██╗',
    '██║  ██║',
    '██║  ██║',
    '╚═╝  ╚═╝',
  ],
  I: [
    '██╗',
    '██║',
    '██║',
    '██║',
    '██║',
    '██║',
    '╚═╝',
  ],
  S: [
    '███████╗',
    '██╔════╝',
    '███████╗',
    '╚════██║',
    '███████║',
    '███████║',
    '╚══════╝',
  ],
  F: [
    '███████╗',
    '██╔════╝',
    '█████╗  ',
    '██╔══╝  ',
    '██║     ',
    '██║     ',
    '╚═╝     ',
  ],
  L: [
    '██╗     ',
    '██║     ',
    '██║     ',
    '██║     ',
    '██║     ',
    '███████╗',
    '╚══════╝',
  ],
  E: [
    '███████╗',
    '██╔════╝',
    '█████╗  ',
    '██╔══╝  ',
    '███████╗',
    '███████║',
    '╚══════╝',
  ],
  X: [
    '██╗  ██╗',
    '╚██╗██╔╝',
    ' ╚███╔╝ ',
    ' ██╔██╗ ',
    '██╔╝ ██╗',
    '██║  ██║',
    '╚═╝  ╚═╝',
  ],
};

// Pink → Purple gradient using ANSI 256-color codes
// 213 = hot pink, 206 = pink, 199 = deep pink, 170 = magenta, 134 = purple, 98 = deep purple, 63 = blue-purple, 57 = indigo
const GRADIENT_COLORS = [213, 207, 206, 199, 170, 141, 135, 134, 98];

function ansi256(code: number, text: string): string {
  return `\x1b[38;5;${code}m${text}\x1b[0m`;
}

/**
 * Build the full ASCII art grid for "CHRISFLEX"
 * Returns array of 7 rows, each row being the concatenated letters
 */
function buildAsciiGrid(): string[] {
  const word = 'CHRISFLEX';
  const rows: string[] = [];

  for (let row = 0; row < 7; row++) {
    let line = '';
    for (const char of word) {
      const letter = LETTERS[char];
      if (letter) {
        line += letter[row] + ' ';
      }
    }
    rows.push(line);
  }

  return rows;
}

/**
 * Apply the pink→purple gradient across a single row.
 * Each character of the word CHRISFLEX (9 chars) gets a gradient color.
 * We map column positions to the 9 letter boundaries.
 */
function colorizeRow(row: string): string {
  const word = 'CHRISFLEX';
  // Find the width boundaries for each letter
  const boundaries: number[] = [];
  let pos = 0;
  for (const char of word) {
    const letter = LETTERS[char];
    if (letter) {
      const w = letter[0]!.length + 1; // +1 for the space separator
      boundaries.push(pos);
      pos += w;
    }
  }
  boundaries.push(pos); // end boundary

  // Colorize: map each character position to its letter index → gradient color
  let result = '';
  for (let i = 0; i < row.length; i++) {
    // Find which letter this column belongs to
    let letterIdx = 0;
    for (let b = 0; b < boundaries.length - 1; b++) {
      if (i >= boundaries[b]! && i < boundaries[b + 1]!) {
        letterIdx = b;
        break;
      }
    }

    // Map letter index (0-8) to gradient color
    const colorIdx = Math.min(letterIdx, GRADIENT_COLORS.length - 1);
    const ch = row[i]!;

    if (ch === ' ' || ch === '╝' || ch === '╗' || ch === '═' || ch === '╚' || ch === '╔' || ch === '║' || ch === '╗') {
      // Keep box drawing chars and spaces in same gradient
      result += ansi256(GRADIENT_COLORS[colorIdx]!, ch);
    } else {
      result += ansi256(GRADIENT_COLORS[colorIdx]!, ch);
    }
  }

  return result;
}

/**
 * Print the full banner immediately (no animation).
 * Used when stdout is not a TTY or animation is disabled.
 */
export function printBannerSync(): void {
  const rows = buildAsciiGrid();
  console.log('');
  for (const row of rows) {
    console.log('  ' + colorizeRow(row));
  }
  console.log('');
  console.log(
    '  ' + ansi256(141, '─'.repeat(60))
  );
  console.log(
    '  ' + ansi256(170, '  Lean AI workflow manager with persistent memory')
  );
  console.log('');
}

/**
 * Animated banner — row-by-row reveal with gradient.
 * Returns a promise that resolves when animation is complete.
 */
export function printBannerAnimated(): Promise<void> {
  return new Promise((resolve) => {
    const rows = buildAsciiGrid();
    const totalRows = rows.length;
    let currentRow = 0;

    // Clear a bit of space
    process.stdout.write('\n');

    const interval = setInterval(() => {
      if (currentRow < totalRows) {
        process.stdout.write('  ' + colorizeRow(rows[currentRow]!) + '\n');
        currentRow++;
      } else {
        clearInterval(interval);

        // Tagline after a brief pause
        setTimeout(() => {
          console.log('');
          console.log('  ' + ansi256(141, '─'.repeat(60)));
          console.log(
            '  ' + ansi256(170, '  Lean AI workflow manager with persistent memory')
          );
          console.log('');
          resolve();
        }, 100);
      }
    }, 65); // ~65ms per row = ~0.5s total for 7 rows
  });
}

/**
 * Smart banner — animated if TTY, sync otherwise.
 */
export async function showBanner(): Promise<void> {
  if (process.stdout.isTTY) {
    await printBannerAnimated();
  } else {
    printBannerSync();
  }
}
