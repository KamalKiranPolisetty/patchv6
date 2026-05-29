import fs from "fs";
import path from "path";

const KB_BASE = path.join(process.cwd(), "knowledge_base");

export interface KBFile {
  category: string;
  filename: string;
  content: string;
}

export function kbExists(category: string): boolean {
  const dir = path.join(KB_BASE, category);
  if (!fs.existsSync(dir)) return false;
  const files = fs.readdirSync(dir).filter((f) => f.endsWith(".txt"));
  return files.length > 0;
}

export function getCategories(): string[] {
  if (!fs.existsSync(KB_BASE)) return [];
  return fs.readdirSync(KB_BASE).filter((d) => {
    return fs.statSync(path.join(KB_BASE, d)).isDirectory();
  });
}

export function getKBForCategory(category: string): KBFile[] {
  const dir = path.join(KB_BASE, category);
  if (!fs.existsSync(dir)) return [];
  const files = fs.readdirSync(dir).filter((f) => f.endsWith(".txt"));
  return files.map((filename) => ({
    category,
    filename,
    content: fs.readFileSync(path.join(dir, filename), "utf-8"),
  }));
}

export function getAllKB(): KBFile[] {
  const categories = getCategories();
  return categories.flatMap((cat) => getKBForCategory(cat));
}

export function formatKBContext(files: KBFile[]): string {
  return files
    .map((f) => `[CATEGORY: ${f.category} | FILE: ${f.filename}]\n${f.content}`)
    .join("\n\n---\n\n");
}
