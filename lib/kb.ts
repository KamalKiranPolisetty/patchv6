import fs from "fs";
import path from "path";

const KB_WORKFLOWS_DIR = path.join(process.cwd(), "knowledge_base", "workflows");
const KB_IMAGES_DIR = path.join(process.cwd(), "knowledge_base", "images");

export function ensureKbDirs() {
  if (!fs.existsSync(KB_WORKFLOWS_DIR)) {
    fs.mkdirSync(KB_WORKFLOWS_DIR, { recursive: true });
  }
  if (!fs.existsSync(KB_IMAGES_DIR)) {
    fs.mkdirSync(KB_IMAGES_DIR, { recursive: true });
  }
}

export function kbFileExists(category: string): boolean {
  const filePath = path.join(KB_WORKFLOWS_DIR, `${category.toLowerCase()}.md`);
  return fs.existsSync(filePath);
}

export interface KbBlock {
  category: string;
  file: string;
  text: string;
}

export function getKbForCategory(category: string): KbBlock[] {
  ensureKbDirs();
  const fileName = `${category.toLowerCase()}.md`;
  const filePath = path.join(KB_WORKFLOWS_DIR, fileName);
  if (!fs.existsSync(filePath)) return [];
  const text = fs.readFileSync(filePath, "utf-8");
  return [{ category: category.toUpperCase(), file: fileName, text }];
}

export function getAllKbBlocks(): KbBlock[] {
  ensureKbDirs();
  const files = fs.readdirSync(KB_WORKFLOWS_DIR).filter((f) => f.endsWith(".md"));
  return files.map((fileName) => {
    const text = fs.readFileSync(path.join(KB_WORKFLOWS_DIR, fileName), "utf-8");
    const category = fileName.replace(".md", "").toUpperCase();
    return { category, file: fileName, text };
  });
}

export function formatKbContext(blocks: KbBlock[]): string {
  return blocks
    .map((b) => `[CATEGORY: ${b.category} | FILE: ${b.file}]\n${b.text}`)
    .join("\n\n---\n\n");
}

export function getImagePath(filename: string): string {
  return path.join(KB_IMAGES_DIR, filename);
}
