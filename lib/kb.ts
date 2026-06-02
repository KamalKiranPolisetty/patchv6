import fs from 'fs';
import path from 'path';

const KB_DIR = path.join(process.cwd(), 'knowledge_base', 'workflows');

export function checkKbFile(category: string): boolean {
  const file = path.join(KB_DIR, `${category.toLowerCase()}.md`);
  try { return fs.existsSync(file); } catch { return false; }
}

export function getKbContent(category?: string): string {
  if (category) {
    const file = path.join(KB_DIR, `${category.toLowerCase()}.md`);
    try { return fs.readFileSync(file, 'utf-8'); } catch { return ''; }
  }
  // Global: all files
  try {
    const files = fs.readdirSync(KB_DIR).filter(f => f.endsWith('.md'));
    return files.map(f => {
      const cat = f.replace('.md', '').toUpperCase();
      const content = fs.readFileSync(path.join(KB_DIR, f), 'utf-8');
      return `[CATEGORY: ${cat} | FILE: ${f}]\n${content}`;
    }).join('\n\n---\n\n');
  } catch { return ''; }
}
