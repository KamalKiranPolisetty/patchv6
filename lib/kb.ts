import { promises as fs } from "node:fs";
import path from "node:path";

const KB_ROOT = path.join(process.cwd(), "knowledge_base");
const WORKFLOWS_DIR = path.join(KB_ROOT, "workflows");
const IMAGES_DIR = path.join(KB_ROOT, "images");

export type KBSnippet = {
  file: string;
  category: string;
  content: string;
};

export async function ensureKBStructure(): Promise<void> {
  await fs.mkdir(WORKFLOWS_DIR, { recursive: true });
  await fs.mkdir(IMAGES_DIR, { recursive: true });

  // Seed a sample VDI workflow file if missing — keeps the KB Available by default.
  const vdiPath = path.join(WORKFLOWS_DIR, "vdi.md");
  try {
    await fs.access(vdiPath);
  } catch {
    const sample = `# VDI Troubleshooting

Use this workflow to resolve common Virtual Desktop Infrastructure issues for Discount Tire store associates.

## Step 1 — Confirm the symptom
Ask the user to describe what they see. The two most common symptoms are:

- A black screen on the VDI client.
- A login loop where credentials are accepted but the desktop never loads.

![VDI login screen](vdi_login.png)

## Step 2 — Capture environment
Gather the following:

1. Store number.
2. Register / lane number.
3. Time the issue started.

## Step 3 — Restart the VDI client
1. Close the VDI client window.
2. Wait 10 seconds.
3. Re-launch from the start menu.

![VDI client restart steps](vdi_restart.png)

## Step 4 — Verify network
Confirm the network cable is seated and the Wi-Fi indicator shows a connection.

## Step 5 — Escalation
If the above does not resolve the issue, escalate to the Trusted Experts support group.
`;
    await fs.writeFile(vdiPath, sample, "utf-8");
  }
}

function fileToCategory(filename: string): string {
  return path.basename(filename, path.extname(filename)).toUpperCase();
}

export async function listWorkflowFiles(): Promise<string[]> {
  await ensureKBStructure();
  const entries = await fs.readdir(WORKFLOWS_DIR);
  return entries.filter((f) => f.endsWith(".md")).sort();
}

export async function fileExists(filepath: string): Promise<boolean> {
  try {
    await fs.access(filepath);
    return true;
  } catch {
    return false;
  }
}

export async function hasWorkflow(category: string): Promise<boolean> {
  await ensureKBStructure();
  const filename = `${category.toLowerCase()}.md`;
  return fileExists(path.join(WORKFLOWS_DIR, filename));
}

export async function readWorkflow(category: string): Promise<KBSnippet | null> {
  await ensureKBStructure();
  const filename = `${category.toLowerCase()}.md`;
  const filepath = path.join(WORKFLOWS_DIR, filename);
  if (!(await fileExists(filepath))) return null;
  const content = await fs.readFile(filepath, "utf-8");
  return {
    file: filename,
    category: fileToCategory(filename),
    content,
  };
}

export async function readAllWorkflows(): Promise<KBSnippet[]> {
  await ensureKBStructure();
  const files = await listWorkflowFiles();
  const results: KBSnippet[] = [];
  for (const f of files) {
    const content = await fs.readFile(path.join(WORKFLOWS_DIR, f), "utf-8");
    results.push({
      file: f,
      category: fileToCategory(f),
      content,
    });
  }
  return results;
}

export function formatContext(snippets: KBSnippet[]): string {
  if (snippets.length === 0) return "";
  return snippets
    .map((s) => `[CATEGORY: ${s.category} | FILE: ${s.file}]\n${s.content}`)
    .join("\n\n---\n\n");
}

export async function getKBStatusForCategory(category: string): Promise<"KB Available" | "KB Missing"> {
  const ok = await hasWorkflow(category);
  return ok ? "KB Available" : "KB Missing";
}
