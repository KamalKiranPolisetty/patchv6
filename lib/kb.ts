import fs from 'fs';
import path from 'path';

const KB_DIR = path.join(process.cwd(), 'knowledge_base');

export function getKBContent(category?: string): string {
  if (!fs.existsSync(KB_DIR)) return '';

  if (category) {
    const filePath = path.join(KB_DIR, category, `${category.toLowerCase()}.txt`);
    if (!fs.existsSync(filePath)) return '';
    const content = fs.readFileSync(filePath, 'utf-8');
    return `[CATEGORY: ${category} | FILE: ${category.toLowerCase()}.txt]\n${content}`;
  }

  const categories = fs.readdirSync(KB_DIR).filter(d =>
    fs.statSync(path.join(KB_DIR, d)).isDirectory()
  );

  return categories.map(cat => {
    const filePath = path.join(KB_DIR, cat, `${cat.toLowerCase()}.txt`);
    if (!fs.existsSync(filePath)) return null;
    const content = fs.readFileSync(filePath, 'utf-8');
    return `[CATEGORY: ${cat} | FILE: ${cat.toLowerCase()}.txt]\n${content}`;
  }).filter(Boolean).join('\n\n');
}

export function checkKBAvailable(category: string): boolean {
  const filePath = path.join(KB_DIR, category, `${category.toLowerCase()}.txt`);
  return fs.existsSync(filePath);
}
