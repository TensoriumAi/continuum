import fs from 'fs';
import path from 'path';

export async function createDirectory(dirPath) {
  try {
    await fs.promises.access(dirPath);
  } catch {
    await fs.promises.mkdir(dirPath, { recursive: true });
  }
}

export async function ensureDirectoryExists(filePath) {
  const directory = path.dirname(filePath);
  await createDirectory(directory);
}

export async function writeFile(filePath, content) {
  await ensureDirectoryExists(filePath);
  await fs.promises.writeFile(filePath, content, 'utf8');
}

export async function readFile(filePath) {
  return await fs.promises.readFile(filePath, 'utf8');
}

export async function fileExists(filePath) {
  try {
    await fs.promises.access(filePath);
    return true;
  } catch {
    return false;
  }
}
