import {
  fsrs,
  generatorParameters,
  Rating,
  createEmptyCard,
  type Card as FsrsCard,
  type Grade,
} from "ts-fsrs";

const params = generatorParameters({ enable_fuzz: true });
const scheduler = fsrs(params);

export type ReviewGrade = "again" | "hard" | "good" | "easy";

const gradeMap: Record<ReviewGrade, Grade> = {
  again: Rating.Again as Grade,
  hard: Rating.Hard as Grade,
  good: Rating.Good as Grade,
  easy: Rating.Easy as Grade,
};

export function newCard(now: Date = new Date()): FsrsCard {
  return createEmptyCard(now);
}

export function reviewCard(
  card: FsrsCard,
  grade: ReviewGrade,
  now: Date = new Date()
) {
  return scheduler.next(card, now, gradeMap[grade]);
}

export function fsrsCardFromState(state: unknown, now: Date = new Date()): FsrsCard {
  if (!state || typeof state !== "object") return createEmptyCard(now);
  const o = state as Record<string, unknown>;
  return {
    due: new Date((o.due as string) ?? now),
    stability: Number(o.stability ?? 0),
    difficulty: Number(o.difficulty ?? 0),
    elapsed_days: Number(o.elapsed_days ?? 0),
    scheduled_days: Number(o.scheduled_days ?? 0),
    reps: Number(o.reps ?? 0),
    lapses: Number(o.lapses ?? 0),
    state: Number(o.state ?? 0),
    last_review: o.last_review ? new Date(o.last_review as string) : undefined,
  } as FsrsCard;
}

export function fsrsCardToState(card: FsrsCard) {
  return {
    due: card.due.toISOString(),
    stability: card.stability,
    difficulty: card.difficulty,
    elapsed_days: card.elapsed_days,
    scheduled_days: card.scheduled_days,
    reps: card.reps,
    lapses: card.lapses,
    state: card.state,
    last_review: card.last_review?.toISOString(),
  };
}

export { scheduler };
export type { FsrsCard };
