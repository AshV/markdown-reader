/**
 * Markdown Utilities for Inline Editing
 */

export interface DocumentStats {
  words: number;
  chars: number;
  lines: number;
  readingTimeMinutes: number;
}

/**
 * Calculates document statistics from markdown content
 */
export function getDocumentStats(markdown: string): DocumentStats {
  const chars = markdown.length;
  const lines = markdown.split('\n').length;
  const words = markdown.trim() ? markdown.trim().split(/\s+/).filter(Boolean).length : 0;
  const readingTimeMinutes = Math.max(1, Math.ceil(words / 200));

  return { words, chars, lines, readingTimeMinutes };
}

/**
 * Replaces a 1-indexed line range [startLine, endLine] in the markdown string
 */
export function replaceLineRange(
  source: string,
  startLine: number,
  endLine: number,
  replacement: string
): string {
  const lines = source.split('\n');
  const clampedStart = Math.max(1, Math.min(startLine, lines.length));
  const clampedEnd = Math.max(clampedStart, Math.min(endLine, lines.length));

  const before = lines.slice(0, clampedStart - 1);
  const after = lines.slice(clampedEnd);
  const replacementLines = replacement.split('\n');

  return [...before, ...replacementLines, ...after].join('\n');
}

/**
 * Extracts lines corresponding to a 1-indexed line range [startLine, endLine]
 */
export function getLineRange(source: string, startLine: number, endLine: number): string {
  const lines = source.split('\n');
  const clampedStart = Math.max(1, Math.min(startLine, lines.length));
  const clampedEnd = Math.max(clampedStart, Math.min(endLine, lines.length));
  return lines.slice(clampedStart - 1, clampedEnd).join('\n');
}

/**
 * Toggles a markdown task list checkbox on a specific line or the n-th checkbox
 */
export function toggleCheckbox(
  source: string,
  targetLine?: number,
  checkboxIndex?: number
): string {
  const lines = source.split('\n');

  if (targetLine && targetLine >= 1 && targetLine <= lines.length) {
    const lineIndex = targetLine - 1;
    const candidates = [lineIndex, lineIndex - 1, lineIndex + 1, lineIndex - 2, lineIndex + 2];
    for (const idx of candidates) {
      if (idx >= 0 && idx < lines.length) {
        const line = lines[idx];
        if (/^(\s*[-*+\d.]+\s*\[)([\sXx])(\].*)$/.test(line)) {
          lines[idx] = line.replace(
            /^(\s*[-*+\d.]+\s*\[)([\sXx])(\].*)$/,
            (_, prefix, check, suffix) => {
              const isChecked = check.toLowerCase() === 'x';
              return `${prefix}${isChecked ? ' ' : 'x'}${suffix}`;
            }
          );
          return lines.join('\n');
        }
      }
    }
  }

  // Fallback: Find by checkbox occurrence index
  if (typeof checkboxIndex === 'number') {
    let currentIndex = 0;
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      if (/^(\s*[-*+\d.]+\s*\[)([\sXx])(\].*)$/.test(line)) {
        if (currentIndex === checkboxIndex) {
          lines[i] = line.replace(
            /^(\s*[-*+\d.]+\s*\[)([\sXx])(\].*)$/,
            (_, prefix, check, suffix) => {
              const isChecked = check.toLowerCase() === 'x';
              return `${prefix}${isChecked ? ' ' : 'x'}${suffix}`;
            }
          );
          return lines.join('\n');
        }
        currentIndex++;
      }
    }
  }

  return source;
}

/**
 * Appends or inserts a new markdown block at a specific position
 */
export function insertMarkdownBlock(
  source: string,
  blockContent: string,
  afterLine?: number
): string {
  const lines = source.split('\n');
  if (typeof afterLine === 'number' && afterLine >= 0 && afterLine <= lines.length) {
    const before = lines.slice(0, afterLine);
    const after = lines.slice(afterLine);
    return [...before, '', blockContent, '', ...after].join('\n');
  }

  // Append at end
  const separator = source.trimEnd().length > 0 ? '\n\n' : '';
  return source.trimEnd() + separator + blockContent + '\n';
}

/**
 * Wraps or formats a selection string with markdown syntax
 */
export function formatMarkdownSnippet(
  type: 'bold' | 'italic' | 'strike' | 'code' | 'h1' | 'h2' | 'h3' | 'quote' | 'math' | 'link' | 'task',
  text: string,
  url?: string
): string {
  const trimmed = text || 'text';
  switch (type) {
    case 'bold':
      return `**${trimmed}**`;
    case 'italic':
      return `*${trimmed}*`;
    case 'strike':
      return `~~${trimmed}~~`;
    case 'code':
      return `\`${trimmed}\``;
    case 'math':
      return `$${trimmed}$`;
    case 'h1':
      return `# ${trimmed}`;
    case 'h2':
      return `## ${trimmed}`;
    case 'h3':
      return `### ${trimmed}`;
    case 'quote':
      return `> ${trimmed}`;
    case 'link':
      return `[${trimmed}](${url || 'https://example.com'})`;
    case 'task':
      return `- [ ] ${trimmed}`;
    default:
      return trimmed;
  }
}

/**
 * Parse a markdown table string into a 2D array of strings and alignments
 */
export interface ParsedTable {
  headers: string[];
  alignments: Array<'left' | 'center' | 'right' | null>;
  rows: string[][];
}

export function parseMarkdownTable(tableMarkdown: string): ParsedTable | null {
  const lines = tableMarkdown.trim().split('\n').map(l => l.trim()).filter(Boolean);
  if (lines.length < 2) return null;

  const splitRow = (line: string) => {
    // Remove leading/trailing pipes if present
    let content = line;
    if (content.startsWith('|')) content = content.slice(1);
    if (content.endsWith('|')) content = content.slice(0, -1);
    return content.split('|').map(c => c.trim());
  };

  const headers = splitRow(lines[0]);
  const delimiterRow = splitRow(lines[1]);

  const alignments = delimiterRow.map(cell => {
    const left = cell.startsWith(':');
    const right = cell.endsWith(':');
    if (left && right) return 'center' as const;
    if (right) return 'right' as const;
    if (left) return 'left' as const;
    return null;
  });

  const rows = lines.slice(2).map(splitRow);

  return { headers, alignments, rows };
}

/**
 * Serializes a 2D array back to a formatted markdown table
 */
export function serializeMarkdownTable(table: ParsedTable): string {
  const colCount = Math.max(
    table.headers.length,
    table.alignments.length,
    ...table.rows.map(r => r.length)
  );

  const padRow = (row: string[]) => {
    const padded = [...row];
    while (padded.length < colCount) padded.push('');
    return padded;
  };

  const headerCells = padRow(table.headers);
  const delimiterCells = Array.from({ length: colCount }, (_, i) => {
    const align = table.alignments[i];
    if (align === 'center') return ':---:';
    if (align === 'right') return '---:';
    if (align === 'left') return ':---';
    return '---';
  });

  const formattedRows = [
    `| ${headerCells.join(' | ')} |`,
    `| ${delimiterCells.join(' | ')} |`,
    ...table.rows.map(row => `| ${padRow(row).join(' | ')} |`)
  ];

  return formattedRows.join('\n');
}
