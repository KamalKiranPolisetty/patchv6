import { promises as fs } from "fs";
import path from "path";

const KB_DIR = path.join(process.cwd(), "knowledge_base", "workflows");

export async function getKBStatus(category: string): Promise<boolean> {
  try {
    await fs.access(path.join(KB_DIR, `${category}.md`));
    return true;
  } catch {
    return false;
  }
}

export async function getKBContext(category?: string): Promise<string> {
  try {
    if (category) {
      const filePath = path.join(KB_DIR, `${category}.md`);
      try {
        const content = await fs.readFile(filePath, "utf-8");
        return `[CATEGORY: ${category.toUpperCase()} | FILE: ${category}.md]\n${content}`;
      } catch {
        return "";
      }
    }

    // No category: read all .md files
    let files: string[];
    try {
      const entries = await fs.readdir(KB_DIR);
      files = entries.filter((f) => f.endsWith(".md"));
    } catch {
      return "";
    }

    if (files.length === 0) return "";

    const sections = await Promise.all(
      files.map(async (file) => {
        const name = path.basename(file, ".md");
        const content = await fs.readFile(path.join(KB_DIR, file), "utf-8");
        return `[CATEGORY: ${name.toUpperCase()} | FILE: ${file}]\n${content}`;
      })
    );

    return sections.join("\n\n");
  } catch {
    return "";
  }
}
