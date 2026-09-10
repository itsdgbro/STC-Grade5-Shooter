import { GAME_CONFIG } from "../config/gameConfig";

interface DataManifest {
  file: string;
}

export interface LoadedQuestionData {
  data: unknown;
  sourceFile: string;
}

function buildDataUrl(filePath: string): string {
  const normalizedPath = filePath.replace(/^\/+/, "");
  return `${import.meta.env.BASE_URL}${normalizedPath}?t=${Date.now()}`;
}

export async function loadConfiguredQuestionData(): Promise<LoadedQuestionData> {
  const manifestPath = GAME_CONFIG.dataFile;
  const manifestResponse = await fetch(buildDataUrl(manifestPath));

  if (!manifestResponse.ok) {
    throw new Error(
      `Failed to load data manifest ${manifestPath}: HTTP ${manifestResponse.status}`,
    );
  }

  const manifest = (await manifestResponse.json()) as Partial<DataManifest>;
  if (
    !manifest ||
    typeof manifest.file !== "string" ||
    manifest.file.trim() === ""
  ) {
    throw new Error(
      `Invalid data manifest ${manifestPath}: expected a non-empty "file" value`,
    );
  }

  const questionFile = manifest.file.trim();
  const questionPath = questionFile.startsWith("data/")
    ? questionFile
    : `data/${questionFile}`;
  const questionResponse = await fetch(buildDataUrl(questionPath));

  if (!questionResponse.ok) {
    throw new Error(
      `Failed to load question file ${questionPath}: HTTP ${questionResponse.status}`,
    );
  }

  return {
    data: await questionResponse.json(),
    sourceFile: questionPath,
  };
}
