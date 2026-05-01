import {
  fsrs,
  generatorParameters,
  Rating,
  type Card,
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

export function reviewCard(
  card: Card,
  grade: ReviewGrade,
  now: Date = new Date()
) {
  return scheduler.next(card, now, gradeMap[grade]);
}

export { scheduler };
export type { Card };
