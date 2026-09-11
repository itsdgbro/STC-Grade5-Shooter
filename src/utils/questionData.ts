import { loadGameLevels, type GameLevelItem } from "./dataLoader";

export interface LoadedQuestionData {
  data: GameLevelItem;
  sourceFile: string;
}

export async function loadConfiguredQuestionData(): Promise<LoadedQuestionData> {
  const levels = await loadGameLevels();
  if (!levels || levels.length === 0) {
    throw new Error("Failed to fetch json file.");
  }
  const level = levels[0];
  return {
    data: level,
    sourceFile: level.sourceFileName || "data/data.json",
  };
}
