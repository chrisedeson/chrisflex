// Styled output helpers
import pc from 'picocolors';

export function banner(text: string): void {
  const line = '━'.repeat(56);
  console.log(pc.cyan(line));
  console.log(pc.cyan(pc.bold(` ChrisFlex ► ${text}`)));
  console.log(pc.cyan(line));
}

export function success(text: string): void {
  console.log(pc.green(`✓ ${text}`));
}

export function warn(text: string): void {
  console.log(pc.yellow(`⚠ ${text}`));
}

export function error(text: string): void {
  console.log(pc.red(`✗ ${text}`));
}

export function info(text: string): void {
  console.log(pc.dim(`ℹ ${text}`));
}

export function heading(text: string): void {
  console.log(pc.bold(`\n${text}`));
}

export function bullet(text: string): void {
  console.log(`  • ${text}`);
}

export function keyValue(key: string, value: string): void {
  console.log(`  ${pc.dim(key + ':')} ${value}`);
}

export function table(headers: string[], rows: string[][]): void {
  // Simple table output
  const widths = headers.map((h, i) =>
    Math.max(h.length, ...rows.map((r) => (r[i] ?? '').length))
  );

  const headerLine = headers.map((h, i) => h.padEnd(widths[i]!)).join('  ');
  const sepLine = widths.map((w) => '─'.repeat(w)).join('  ');

  console.log(pc.bold(`  ${headerLine}`));
  console.log(pc.dim(`  ${sepLine}`));
  for (const row of rows) {
    const line = row.map((cell, i) => cell.padEnd(widths[i]!)).join('  ');
    console.log(`  ${line}`);
  }
}
