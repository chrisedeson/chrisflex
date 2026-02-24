// Smart search: heuristic file search that doesn't waste tokens
import { stat, readFile, access } from 'node:fs/promises';

async function pathExists(p: string): Promise<boolean> {
  try { await access(p); return true; } catch { return false; }
}

export interface SearchResult {
  file: string;
  lineNumber: number;
  content: string;
}

export interface FileInfo {
  exists: boolean;
  size: number;
  estimatedLines: number;
  category: 'small' | 'medium' | 'large' | 'huge';
}

/**
 * Check file size before reading — prevents token waste
 */
export async function inspectFile(filePath: string): Promise<FileInfo> {
  if (!(await pathExists(filePath))) {
    return { exists: false, size: 0, estimatedLines: 0, category: 'small' };
  }

  const stats = await stat(filePath);
  const estimatedLines = Math.ceil(stats.size / 80); // rough avg chars per line

  let category: FileInfo['category'];
  if (estimatedLines < 100) category = 'small';
  else if (estimatedLines < 500) category = 'medium';
  else if (estimatedLines < 2000) category = 'large';
  else category = 'huge';

  return { exists: true, size: stats.size, estimatedLines, category };
}

/**
 * Smart search: reads only what's needed based on file size
 *
 * - Small files (< 100 lines): read entirely
 * - Medium files (100-500 lines): full keyword search
 * - Large files (500-2000 lines): header + section-based search
 * - Huge files (2000+ lines): index-only or header scan
 */
export async function smartSearch(
  filePath: string,
  keywords: string[]
): Promise<SearchResult[]> {
  const info = await inspectFile(filePath);
  if (!info.exists) return [];

  const content = await readFile(filePath, 'utf8');
  const lines = content.split('\n');
  const lowerKeywords = keywords.map((k) => k.toLowerCase());

  if (info.category === 'small') {
    // Read everything, return matches
    return matchLines(filePath, lines, lowerKeywords);
  }

  if (info.category === 'medium') {
    // Full keyword search but only return matching lines
    return matchLines(filePath, lines, lowerKeywords);
  }

  // Large/Huge: section-based search
  // 1. Scan headers (## lines) for keyword matches
  // 2. Read 30 lines around each matching header
  const results: SearchResult[] = [];
  const matchingHeaders: number[] = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]!;
    if (line.startsWith('#')) {
      const lower = line.toLowerCase();
      if (lowerKeywords.some((k) => lower.includes(k))) {
        matchingHeaders.push(i);
      }
    }
  }

  // Read context around matching headers
  for (const headerIdx of matchingHeaders) {
    const start = Math.max(0, headerIdx - 2);
    const end = Math.min(lines.length, headerIdx + 30);
    for (let i = start; i < end; i++) {
      const line = lines[i]!;
      if (lowerKeywords.some((k) => line.toLowerCase().includes(k))) {
        results.push({ file: filePath, lineNumber: i + 1, content: line });
      }
    }
  }

  // Also check first 20 lines (usually has TOC)
  for (let i = 0; i < Math.min(20, lines.length); i++) {
    const line = lines[i]!;
    if (lowerKeywords.some((k) => line.toLowerCase().includes(k))) {
      // Avoid duplicates
      if (!results.some((r) => r.lineNumber === i + 1)) {
        results.push({ file: filePath, lineNumber: i + 1, content: line });
      }
    }
  }

  return results.sort((a, b) => a.lineNumber - b.lineNumber);
}

/**
 * Simple line-by-line keyword matching
 */
function matchLines(
  filePath: string,
  lines: string[],
  lowerKeywords: string[]
): SearchResult[] {
  const results: SearchResult[] = [];
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]!;
    if (lowerKeywords.some((k) => line.toLowerCase().includes(k))) {
      results.push({ file: filePath, lineNumber: i + 1, content: line });
    }
  }
  return results;
}

/**
 * Read a specific range of lines from a file
 * Useful for targeted reading after smart search
 */
export async function readLineRange(
  filePath: string,
  startLine: number,
  endLine: number
): Promise<string> {
  const content = await readFile(filePath, 'utf8');
  const lines = content.split('\n');
  return lines.slice(startLine - 1, endLine).join('\n');
}
