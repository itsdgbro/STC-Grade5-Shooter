declare global {
  interface Window {
    __GAME_DATA__?: unknown;
  }
}

/**
 * Loads game levels data.
 * Flow:
 * 1. Window injected data (__GAME_DATA__) if available.
 * 2. Reads the centralized `data.json` file in `data/data.json`.
 * 3. Searches for the value of "data" or "file" in data.json (e.g. "Grade-5-Math.json").
 * 4. If the dataset value is found in the data directory, loads the JSON data into the game.
 * 5. If not found or any fetch fails, throws an error to display a fullscreen "Failed to fetch json file." screen.
 */
export async function loadGameLevels(): Promise<unknown[]> {
  // 1. Check window injected data (for Flutter / container injection)
  if (
    typeof window !== 'undefined' &&
    window.__GAME_DATA__ &&
    Array.isArray(window.__GAME_DATA__) &&
    window.__GAME_DATA__.length > 0
  ) {
    console.log('[DataLoader] Loaded levels from window.__GAME_DATA__');
    return window.__GAME_DATA__;
  }

  const baseUrl = import.meta.env.BASE_URL || './';
  let targetFileName: string | null = null;

  // 2. Check if URL query parameter specifies the dataset (e.g. ?data=filename.json)
  if (typeof window !== 'undefined' && window.location && window.location.search) {
    const urlParams = new URLSearchParams(window.location.search);
    const queryFile = urlParams.get('data') || urlParams.get('dataset');
    if (queryFile && queryFile.trim()) {
      targetFileName = queryFile.trim();
      console.log(`[DataLoader] URL query parameter specified dataset: "${targetFileName}"`);
    }
  }

  // 3. Fallback: If no URL parameter was provided, read the centralized data.json file
  if (!targetFileName) {
    try {
      const configPath = `${baseUrl}data/data.json`;
      const dataRes = await fetch(configPath);

      const isHtmlResponse = dataRes.headers.get('content-type')?.includes('text/html');
      if (!dataRes.ok || isHtmlResponse) {
        throw new Error(`Failed to fetch data.json (Status: ${dataRes.status})`);
      }

      const config = (await dataRes.json()) as Record<string, unknown>;
      const fileCandidate = config?.data || config?.file;
      if (!fileCandidate || typeof fileCandidate !== 'string' || !fileCandidate.trim()) {
        throw new Error('Field "data" or "file" missing or invalid in data.json');
      }

      targetFileName = fileCandidate.trim();
    } catch (err) {
      console.error('[DataLoader] Centralized data.json could not be loaded:', err);
      throw new Error('Failed to fetch json file.');
    }
  }

  // 4. Search for the value of data in the directory and load it
  try {
    const cleanFileName = targetFileName.startsWith('data/') ? targetFileName : `data/${targetFileName}`;
    const datasetUrl = `${baseUrl}${cleanFileName}`;

    console.log(`[DataLoader] Centralized data.json pointed to: ${cleanFileName}. Fetching dataset...`);
    const datasetRes = await fetch(datasetUrl);

    const isHtmlResponse = datasetRes.headers.get('content-type')?.includes('text/html');
    if (!datasetRes.ok || isHtmlResponse) {
      throw new Error(`Failed to fetch dataset ${cleanFileName} (Status: ${datasetRes.status})`);
    }

    const json = (await datasetRes.json()) as unknown;
    if (!json) {
      throw new Error(`Empty JSON response from ${cleanFileName}`);
    }

    // Support array of levels or level object containing questions
    if (Array.isArray(json) && json.length > 0) {
      const firstLevel = json[0] as { questions?: unknown[] } | undefined;
      console.log(`[DataLoader] Successfully loaded ${firstLevel?.questions?.length || 0} questions from ${cleanFileName}`);
      return json;
    } else if (
      typeof json === 'object' &&
      json !== null &&
      'questions' in json &&
      Array.isArray((json as { questions: unknown[] }).questions) &&
      (json as { questions: unknown[] }).questions.length > 0
    ) {
      console.log(`[DataLoader] Successfully loaded single level object from ${cleanFileName}`);
      return [json];
    } else {
      throw new Error(`Dataset ${cleanFileName} does not contain valid questions`);
    }
  } catch (err) {
    console.error(`[DataLoader] Error loading dataset "${targetFileName}":`, err);
    throw new Error('Failed to fetch json file.');
  }
}
