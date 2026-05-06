// Re-export all tables. Add new tables here as they're created.
// 헌법 제23조 — `users`는 user_profiles로 대체되어 v1.8에서 제거되었다.
// 헌법 v3.0 / v3.0.1 — 폐기 5 (study-cards, vocab, materials, mistakes, universities)
// 는 plan §1.2 정합으로 본 export에서 제거되었다 (Phase 4-3a).

// v3.0 보존
export * from "./user-profiles";
export * from "./study-sessions";
export * from "./learning-logs";

// v3.0 신설 — 헌법 v3.0 제2조·제13조의2·제13조의3·제15조 정합
export * from "./regions";
export * from "./exam-papers";
export * from "./exam-items";
export * from "./cards";
export * from "./user-card-state";
export * from "./user-card-log";
export * from "./user-attempts";
export * from "./podcast-episodes";
export * from "./podcast-progress";
