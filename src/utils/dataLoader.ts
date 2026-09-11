declare global {
  interface Window {
    __GAME_DATA__?: unknown;
  }
}

export interface GameLevelItem {
  title?: string;
  subtitle?: string;
  sourceFileName?: string;
  questions?: unknown[];
  [key: string]: unknown;
}

/**
 * Universal Game Level Loader
 * 
 * Priority:
 * 1. window.__GAME_DATA__ (Direct Flutter memory injection)
 * 2. URL search param ?data=filename.json or ?dataset=filename.json (Flutter WebView query param)
 * 3. data/data.json (Default fallback config file)
 */
export async function loadGameLevels(): Promise<GameLevelItem[]> {
  // 1. Direct in-memory injection from Flutter or container
  if (typeof window !== 'undefined' && window.__GAME_DATA__) {
    const injected = window.__GAME_DATA__;
    if (Array.isArray(injected) && injected.length > 0) {
      console.log('[DataLoader] Loaded levels from window.__GAME_DATA__');
      return injected as GameLevelItem[];
    } else if (
      typeof injected === 'object' &&
      injected !== null &&
      'questions' in injected &&
      Array.isArray((injected as { questions: unknown[] }).questions)
    ) {
      console.log('[DataLoader] Loaded single level object from window.__GAME_DATA__');
      return [injected as GameLevelItem];
    }
  }

  const baseUrl = import.meta.env?.BASE_URL || './';
  let targetFileName: string | null = null;

  // 2. Check if URL query parameter specifies dataset (?data=filename.json or ?dataset=filename.json)
  if (typeof window !== 'undefined' && window.location && window.location.search) {
    const urlParams = new URLSearchParams(window.location.search);
    const queryFile = urlParams.get('data') || urlParams.get('dataset');
    if (queryFile && queryFile.trim()) {
      targetFileName = queryFile.trim();
      console.log(`[DataLoader] URL query param specified dataset: "${targetFileName}"`);
    }
  }

  // 3. Fallback: Read centralized data/data.json
  if (!targetFileName) {
    try {
      const configPath = `${baseUrl}data/data.json`;
      const dataRes = await fetch(configPath);

      const isHtmlResponse = dataRes.headers.get('content-type')?.includes('text/html');
      if (!dataRes.ok || isHtmlResponse) {
        throw new Error(`Failed to fetch data.json (Status: ${dataRes.status})`);
      }

      const config = (await dataRes.json()) as Record<string, unknown>;
      const candidate = config?.data || config?.file;
      if (!candidate || typeof candidate !== 'string' || !candidate.trim()) {
        throw new Error('Field "data" missing or invalid in data.json');
      }

      targetFileName = candidate.trim();
      console.log(`[DataLoader] Centralized data.json pointed to: "${targetFileName}"`);
    } catch (err) {
      console.error('[DataLoader] Centralized data.json could not be loaded:', err);
      throw new Error('Failed to fetch json file.');
    }
  }

  // 4. Fetch the target dataset file
  try {
    const cleanFileName = targetFileName.startsWith('data/') ? targetFileName : `data/${targetFileName}`;
    const datasetUrl = `${baseUrl}${cleanFileName}`;

    console.log(`[DataLoader] Fetching dataset: ${datasetUrl}`);
    const datasetRes = await fetch(datasetUrl);

    const isHtmlResponse = datasetRes.headers.get('content-type')?.includes('text/html');
    if (!datasetRes.ok || isHtmlResponse) {
      throw new Error(`Failed to fetch dataset ${cleanFileName} (Status: ${datasetRes.status})`);
    }

    const json = (await datasetRes.json()) as unknown;
    if (!json) {
      throw new Error(`Empty JSON response from ${cleanFileName}`);
    }

    // Support either an array of levels [{ questions: [...] }] or a single object { questions: [...] }
    if (Array.isArray(json) && json.length > 0) {
      // Check if it's an array of question objects directly [ { question: '...', ... } ]
      const firstItem = json[0];
      if (firstItem && typeof firstItem === 'object' && ('question' in firstItem || 'options' in firstItem)) {
        const wrappedLevel: GameLevelItem = {
          sourceFileName: cleanFileName,
          questions: json,
        };
        return [wrappedLevel];
      }
      return json.map((level) => {
        if (level && typeof level === 'object') {
          return { sourceFileName: cleanFileName, ...level };
        }
        return level;
      }) as GameLevelItem[];
    } else if (
      typeof json === 'object' &&
      json !== null &&
      'questions' in json &&
      Array.isArray((json as { questions: unknown[] }).questions) &&
      (json as { questions: unknown[] }).questions.length > 0
    ) {
      const doc = json as GameLevelItem;
      return [{
        ...doc,
        sourceFileName: cleanFileName,
      }];
    } else {
      throw new Error(`Dataset ${cleanFileName} does not contain valid questions`);
    }
  } catch (err) {
    console.error(`[DataLoader] Error loading dataset "${targetFileName}":`, err);
    throw new Error('Failed to fetch json file.');
  }
}
