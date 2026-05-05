// Re-export all tables. Add new tables here as they're created.
// 헌법 제23조 — `users`는 user_profiles로 대체되어 v1.8에서 제거되었다.

// v3.0 보존
export * from "./user-profiles";
export * from "./study-sessions";
export * from "./learning-logs";
export * from "./materials";

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

// v3.0 폐기 예정 (D-S1.5 에서 export 제거 + DROP TABLE 마이그레이션)
// 현재는 src/lib/data/* 의 빌드 호환성 유지 위해 유지.
export * from "./universities";
export * from "./mistakes";
export * from "./vocab";
export * from "./study-cards";
