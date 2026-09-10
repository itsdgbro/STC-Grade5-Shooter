export interface QuestionData {
  id: string | number;
  question: string;
  options: (string | number)[];
  answer: string | number;
  hint: string;
  difficulty?: number; // 1 (Easy), 2 (Medium), 3 (Hard) or 1-5 scale
  category?: string; // e.g. 'Time', 'Number sense', 'Place value', 'addition'
  skill?: string; // e.g. 'Unit conversion', 'Reading time', 'Place value'
  metadata?: Record<string, any>;
}

export interface PerformanceLog {
  questionId: string | number;
  category: string;
  skill: string;
  difficulty: number;
  isCorrect: boolean;
  timestamp: number;
}

/**
 * Normalizes difficulty values from various formats ("Easy", "Medium", "Hard", "सजिलो", etc.)
 * into a standardized numerical scale (1 to 5).
 */
export function normalizeDifficulty(diffVal: any): number {
  if (typeof diffVal === "number") {
    return Math.max(1, Math.min(5, Math.round(diffVal)));
  }
  if (typeof diffVal === "string") {
    const lower = diffVal.trim().toLowerCase();
    if (lower === "easy" || lower === "सजिलो" || lower === "1") return 1;
    if (lower === "medium" || lower === "मध्यम" || lower === "2") return 2;
    if (lower === "hard" || lower === "गाह्रो" || lower === "3") return 3;
    if (lower === "very hard" || lower === "4") return 4;
    if (lower === "expert" || lower === "master" || lower === "5") return 5;
    const parsed = parseInt(lower, 10);
    if (!isNaN(parsed)) return Math.max(1, Math.min(5, parsed));
  }
  return 1;
}

/**
 * Checks whether a question object satisfies all required validity criteria:
 * 1. Non-empty question/prompt text.
 * 2. Non-empty, valid answer value.
 * 3. Exactly expectedOptionCount (default 5) valid, non-null, non-empty answer options.
 * 4. The correct answer must match one of the available options.
 */
export function isValidQuestion(raw: any, expectedOptionCount = 5): boolean {
  if (!raw || typeof raw !== "object") return false;

  // 1. Question prompt text validation
  if (typeof raw.question !== "string" || raw.question.trim().length === 0) {
    return false;
  }

  // 2. Answer validation
  if (
    raw.answer === undefined ||
    raw.answer === null ||
    String(raw.answer).trim().length === 0
  ) {
    return false;
  }

  // 3. Options validation (must have exactly expectedOptionCount items, none null/empty)
  if (
    !Array.isArray(raw.options) ||
    raw.options.length !== expectedOptionCount
  ) {
    return false;
  }

  const hasEmptyOrNullOption = raw.options.some(
    (opt: any) =>
      opt === null || opt === undefined || String(opt).trim().length === 0,
  );
  if (hasEmptyOrNullOption) {
    return false;
  }

  // 4. Correct answer must be present in the options list
  const hasMatchingAnswer = raw.options.some((opt: any) =>
    isAnswerCorrect(opt, raw.answer),
  );
  if (!hasMatchingAnswer) {
    return false;
  }

  return true;
}

/**
 * Normalizes raw question objects from JSON files into the standard QuestionData format.
 */
export function normalizeQuestion(raw: any, index: number): QuestionData {
  const metadata = raw.metadata || {};
  const diff =
    raw.difficulty !== undefined ? raw.difficulty : metadata.Difficulty;
  const category =
    raw.category ||
    metadata.Category ||
    metadata.Theme ||
    metadata["Chapter / Lesson"] ||
    "general";
  const skill = raw.skill || metadata.Skill || category;

  const options: (string | number)[] = Array.isArray(raw.options)
    ? [...raw.options]
    : [];

  return {
    id: raw.id !== undefined && raw.id !== null ? raw.id : `Q-${index + 1}`,
    question: String(raw.question || "").trim(),
    options,
    answer: raw.answer,
    hint: raw.hint
      ? String(raw.hint)
      : metadata["Hint / Concept"]
        ? String(metadata["Hint / Concept"])
        : "",
    difficulty: normalizeDifficulty(diff),
    category: String(category).trim(),
    skill: String(skill).trim(),
    metadata,
  };
}

/**
 * Modern Fisher-Yates shuffle algorithm for unbiased array randomization.
 */
export function shuffleArray<T>(array: T[]): T[] {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

/**
 * Checks equality between user-selected value and the correct answer,
 * properly handling number-string conversions, floating point values, and text casing.
 */
export function isAnswerCorrect(
  userValue: string | number | undefined | null,
  answerValue: string | number | undefined | null,
): boolean {
  if (userValue === answerValue) return true;
  if (
    userValue === undefined ||
    userValue === null ||
    answerValue === undefined ||
    answerValue === null
  ) {
    return false;
  }

  const strUser = String(userValue).trim();
  const strAns = String(answerValue).trim();
  if (strUser.toLowerCase() === strAns.toLowerCase()) return true;

  const numUser = Number(strUser);
  const numAns = Number(strAns);
  if (!isNaN(numUser) && !isNaN(numAns) && strUser !== "" && strAns !== "") {
    return Math.abs(numUser - numAns) < 0.0001;
  }

  return false;
}

export class AdaptiveEngine {
  private activeSourceFileName: string = "UNKNOWN_FILE";
  private allQuestions: QuestionData[] = [];
  private lastQuestionId: string | number | null = null;
  private recentQuestionIds: (string | number)[] = [];

  private history: PerformanceLog[] = [];
  private consecutiveCategoryErrors: Record<string, number> = {};
  private consecutiveSkillErrors: Record<string, number> = {};
  private categoryPerformance: Record<
    string,
    { correct: number; incorrect: number }
  > = {};

  /**
   * Initializes the pool with questions loaded from the active JSON file.
   * Performs rigorous validation (prompt text, answer, exactly 5 options, no nulls)
   * so only valid questions from this file enter the active pool.
   * NEVER combines, mixes, or falls back to questions from other files.
   */
  public setQuestions(
    rawQuestions: any[],
    sourceFileName: string = "UNKNOWN_FILE",
  ): void {
    this.activeSourceFileName = sourceFileName;
    this.allQuestions = [];
    this.lastQuestionId = null;
    this.recentQuestionIds = [];
    this.history = [];
    this.consecutiveCategoryErrors = {};
    this.consecutiveSkillErrors = {};
    this.categoryPerformance = {};

    if (
      !rawQuestions ||
      !Array.isArray(rawQuestions) ||
      rawQuestions.length === 0
    ) {
      throw new Error(
        `No question data found in assigned game file: ${sourceFileName}`,
      );
    }

    const validQuestions: QuestionData[] = [];
    let skippedInvalidCount = 0;

    rawQuestions.forEach((raw, idx) => {
      // Strict validity check: prompt text, answer, exactly 5 options, no nulls, matching answer in options
      if (!isValidQuestion(raw, 5)) {
        skippedInvalidCount++;
        return;
      }

      validQuestions.push(normalizeQuestion(raw, idx));
    });

    if (validQuestions.length === 0) {
      throw new Error(
        `The assigned JSON question file (${sourceFileName}) contains no valid questions with 5 options.`,
      );
    }

    // Keep questions in their exact original order from the JSON file (no shuffling of the question array)
    this.allQuestions = [...validQuestions];
  }

  public getActiveSourceFile(): string {
    return this.activeSourceFileName;
  }

  /**
   * Returns total count of loaded questions.
   */
  public getQuestionCount(): number {
    return this.allQuestions.length;
  }

  /**
   * Records a player's attempt at answering a question.
   */
  public recordAttempt(question: QuestionData, isCorrect: boolean): void {
    const category = question.category || "general";
    const skill = question.skill || category;
    const difficulty = question.difficulty || 1;

    this.history.push({
      questionId: question.id,
      category,
      skill,
      difficulty,
      isCorrect,
      timestamp: Date.now(),
    });

    if (!this.categoryPerformance[category]) {
      this.categoryPerformance[category] = { correct: 0, incorrect: 0 };
    }

    if (isCorrect) {
      this.categoryPerformance[category].correct += 1;
      this.consecutiveCategoryErrors[category] = 0;
      this.consecutiveSkillErrors[skill] = 0;
    } else {
      this.categoryPerformance[category].incorrect += 1;
      this.consecutiveCategoryErrors[category] =
        (this.consecutiveCategoryErrors[category] || 0) + 1;
      this.consecutiveSkillErrors[skill] =
        (this.consecutiveSkillErrors[skill] || 0) + 1;
    }

    // Keep history bounded to avoid memory leaks
    if (this.history.length > 50) {
      this.history.shift();
    }

    // Track recently used questions to prevent immediate repetition
    this.recentQuestionIds.push(question.id);
    const maxRecents = Math.max(
      3,
      Math.min(15, Math.floor(this.allQuestions.length * 0.6)),
    );
    if (this.recentQuestionIds.length > maxRecents) {
      this.recentQuestionIds.shift();
    }
  }

  /**
   * Calculates dynamic adaptive difficulty (1 to 5) based on player EXP level and recent accuracy.
   */
  public getTargetDifficulty(expLevel: number, historyWindowSize = 6): number {
    let target = Math.max(1, Math.min(5, expLevel));

    if (this.history.length === 0) {
      return target;
    }

    const recent = this.history.slice(-historyWindowSize);
    const correctCount = recent.filter((h) => h.isCorrect).length;
    const accuracy = correctCount / recent.length;

    // High performance pushes difficulty slightly up, struggling softens it down
    if (recent.length >= 3) {
      if (accuracy >= 0.8 && correctCount >= 3) {
        target = Math.min(5, target + 1);
      } else if (accuracy <= 0.4) {
        target = Math.max(1, target - 1);
      }
    }

    return target;
  }

  /**
   * Checks if player has struggled with a particular category.
   */
  public getStrugglingCategory(threshold = 2): string | null {
    for (const [cat, errors] of Object.entries(
      this.consecutiveCategoryErrors,
    )) {
      if (errors >= threshold) {
        return cat;
      }
    }
    return null;
  }

  /**
   * Checks if player has struggled with a particular skill.
   */
  public getStrugglingSkill(threshold = 2): string | null {
    for (const [skill, errors] of Object.entries(this.consecutiveSkillErrors)) {
      if (errors >= threshold) {
        return skill;
      }
    }
    return null;
  }

  /**
   * Selects the next question from the pool using Adaptive Learning + Random Selection:
   * 1. Evaluates player ability and struggling skill/category.
   * 2. Filters questions from the JSON pool matching difficulty and skill requirements.
   * 3. Strictly excludes the immediate previous question to avoid repeats.
   * 4. Filters out recently answered questions if additional choices exist.
   * 5. Randomly selects / shuffles a suitable question from the candidate pool.
   * 6. Immediately returns that question for display.
   */
  public selectNextQuestion(
    expLevel = 1,
    currentQuestionId?: string | number,
  ): QuestionData {
    if (this.allQuestions.length === 0) {
      throw new Error("No questions loaded into Adaptive Engine");
    }

    if (this.allQuestions.length === 1) {
      return this.allQuestions[0];
    }

    const targetDifficulty = this.getTargetDifficulty(expLevel);
    const strugglingSkill = this.getStrugglingSkill();
    const strugglingCat = this.getStrugglingCategory();
    const excludeId =
      currentQuestionId !== undefined ? currentQuestionId : this.lastQuestionId;

    // Filter suitable questions based on adaptive criteria
    const findAdaptiveCandidates = (pool: QuestionData[]): QuestionData[] => {
      // 1. If player is struggling with a specific skill, prioritize that skill
      if (strugglingSkill) {
        const skillMatches = pool.filter(
          (q) =>
            q.skill === strugglingSkill &&
            (q.difficulty || 1) <= targetDifficulty,
        );
        if (skillMatches.length > 0) return skillMatches;
      }

      // 2. If struggling with a category, prioritize that category
      if (strugglingCat) {
        const catMatches = pool.filter(
          (q) =>
            q.category === strugglingCat &&
            (q.difficulty || 1) <= targetDifficulty,
        );
        if (catMatches.length > 0) return catMatches;
      }

      // 3. Exact target difficulty match
      const exactMatches = pool.filter(
        (q) => (q.difficulty || 1) === targetDifficulty,
      );
      if (exactMatches.length > 0) return exactMatches;

      // 4. Close difficulty match (+/- 1 level)
      const closeMatches = pool.filter(
        (q) => Math.abs((q.difficulty || 1) - targetDifficulty) <= 1,
      );
      if (closeMatches.length > 0) return closeMatches;

      // 5. Any question from pool
      return [...pool];
    };

    // 1. Get adaptive candidates from entire JSON pool
    let candidates = findAdaptiveCandidates(this.allQuestions);

    // 2. Exclude the current / previous question to strictly prevent immediate consecutive repeat
    let validCandidates = candidates.filter((q) => q.id !== excludeId);

    // If all candidates in this tier matched the excludeId, broaden to entire question pool
    if (validCandidates.length === 0) {
      validCandidates = this.allQuestions.filter((q) => q.id !== excludeId);
    }

    // Safety fallback if only 1 question exists in total
    if (validCandidates.length === 0) {
      validCandidates = [...this.allQuestions];
    }

    // 3. Filter out questions in recent history (if multiple candidates exist) for maximum variety
    const nonRecent = validCandidates.filter(
      (q) => !this.recentQuestionIds.includes(q.id),
    );
    const finalSelectionPool =
      nonRecent.length > 0 ? nonRecent : validCandidates;

    // 4. Randomly shuffle and select a suitable question from the final candidate pool
    const shuffledPool = shuffleArray(finalSelectionPool);
    const randomIndex = Math.floor(Math.random() * shuffledPool.length);
    const selected = shuffledPool[randomIndex];

    // 5. Update tracking
    this.lastQuestionId = selected.id;
    this.recentQuestionIds.push(selected.id);
    const maxRecents = Math.max(
      3,
      Math.min(15, Math.floor(this.allQuestions.length * 0.6)),
    );
    if (this.recentQuestionIds.length > maxRecents) {
      this.recentQuestionIds.shift();
    }

    return selected;
  }
}

export const adaptiveEngine = new AdaptiveEngine();
