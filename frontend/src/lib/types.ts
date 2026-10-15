export type Role = "sde" | "web" | "data_analyst" | "data_scientist" | "hr";
export type Difficulty = "easy" | "medium" | "hard";

export interface Scores { content: number; structure: number; communication: number }

export interface Turn {
  id: number;
  index: number;
  question_text: string;
  question_type: "intro" | "resume" | "technical" | "behavioral" | "followup";
  answer_text: string;
  duration_seconds: number;
  skipped: boolean;
  scores: Partial<Scores>;
  feedback: { strengths?: string[]; improvements?: string[]; better_answer_hint?: string; source?: string };
  metrics: { word_count?: number; wpm?: number | null; filler_total?: number; filler_rate?: number; fillers?: Record<string, number> };
  overall_score: number | null;
  answered_at: string | null;
}

export interface Report {
  overall: number;
  grade: string;
  averages: Scores;
  speech: { avg_wpm: number | null; filler_total: number; avg_words: number };
  summary: string;
  strengths: string[];
  improvements: string[];
  next_steps: string[];
}

export interface Session {
  id: string;
  role: Role;
  difficulty: Difficulty;
  total_questions: number;
  status: "in_progress" | "completed";
  skills: string[];
  projects: string[];
  overall_score: number | null;
  report: Partial<Report>;
  created_at: string;
  completed_at: string | null;
  answered_count: number;
  turns: Turn[];
}

export interface SessionListItem {
  id: string; role: Role; difficulty: Difficulty; total_questions: number;
  status: "in_progress" | "completed"; overall_score: number | null; created_at: string; answered_count: number;
}

export interface AnswerResponse { turn: Turn; next_turn: Turn | null; finished: boolean }

export interface Stats {
  completed: number; average: number | null; best: number | null; latest: number | null;
  trend: { id: string; date: string; score: number; role: Role }[];
  categories: { content: number | null; structure: number | null; communication: number | null };
}

export const ROLES: { id: Role; label: string; blurb: string }[] = [
  { id: "sde", label: "Software Engineer", blurb: "DSA, system basics, CS fundamentals" },
  { id: "web", label: "Web Developer", blurb: "JavaScript, React, APIs, security" },
  { id: "data_analyst", label: "Data Analyst", blurb: "SQL, statistics, dashboards" },
  { id: "data_scientist", label: "Data Scientist", blurb: "ML concepts, modelling, evaluation" },
  { id: "hr", label: "HR Round", blurb: "Behavioral and situational questions" },
];

export const roleLabel = (r: Role) => ROLES.find((x) => x.id === r)?.label ?? r;
