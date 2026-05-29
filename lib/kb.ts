import fs from "fs";
import path from "path";

const KB_DIR = path.join(process.cwd(), "knowledge_base", "workflows");

export interface KBFile {
  category: string;
  filename: string;
  content: string;
}

export function getKBFilePath(category: string): string {
  return path.join(KB_DIR, `${category.toLowerCase()}.md`);
}

export function kbFileExists(category: string): boolean {
  return fs.existsSync(getKBFilePath(category));
}

export function readKBFile(category: string): string | null {
  const filePath = getKBFilePath(category);
  if (!fs.existsSync(filePath)) return null;
  return fs.readFileSync(filePath, "utf-8");
}

export function getAllKBFiles(): KBFile[] {
  if (!fs.existsSync(KB_DIR)) return [];
  const files = fs.readdirSync(KB_DIR).filter((f) => f.endsWith(".md"));
  return files.map((filename) => {
    const category = filename.replace(".md", "").toUpperCase();
    const content = fs.readFileSync(path.join(KB_DIR, filename), "utf-8");
    return { category, filename, content };
  });
}

export function formatKBContext(files: KBFile[]): string {
  return files
    .map((f) => `[CATEGORY: ${f.category} | FILE: ${f.filename}]\n${f.content}`)
    .join("\n\n");
}

export function getAvailableCategories(): string[] {
  if (!fs.existsSync(KB_DIR)) return [];
  return fs
    .readdirSync(KB_DIR)
    .filter((f) => f.endsWith(".md"))
    .map((f) => f.replace(".md", "").toUpperCase());
}
