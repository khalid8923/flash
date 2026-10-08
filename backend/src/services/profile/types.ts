/* ═══════════════════════════════════════════════════════════
   Unified Snapshot — Types
   Single API call for dashboard. Self-comparison only.
   ═══════════════════════════════════════════════════════════ */

export type Lang = 'en' | 'ar';

export type DomainStatus =
  | 'strong'
  | 'stable'
  | 'attention_needed'
  | 'insufficient_data';

export type Trend = 'improving' | 'stable' | 'declining' | 'unknown';

export interface DomainCard {
  domain_id: string;
  domain_label: string;
  icon: string;
  color: string;
  status: DomainStatus;
  status_label: string;
  avg_accuracy: number | null;
  sessions_count: number;
  games_played: string[];
  games_count: number;
  trend: Trend;
  trend_label: string;
  pattern: string;         // Simple, non-clinical message
  last_played_days: number | null;
}

export interface AttentionArea {
  kind: 'domain_gap' | 'stale_domain' | 'low_accuracy' | 'variety_gap';
  target_domain: string | null;
  target_label: string | null;
  message: string;
  suggested_action: string;
}

export interface Strength {
  domain_id: string;
  domain_label: string;
  accuracy: number;
  message: string;
}

export interface Milestone {
  type: 'level_up' | 'level_down' | 'personal_best' | 'badge' | 'first_session';
  game_id: string | null;
  game_name: string | null;
  detail: string;
  at: string;
}

export interface NextBestAction {
  game_id: string;
  game_name: string;
  domain_id: string;
  reason: string;
  mode: string;
}

export interface QuickStats {
  total_sessions: number;
  days_active: number;
  personal_bests_count: number;
  badges_count: number;
  current_streak_days: number;
  active_predictions: number;
  active_lab_experiment: boolean;
  today_journal_logged: boolean;
}

export interface OverallSummary {
  sessions_total: number;
  days_active: number;
  evidence_tier: 'calibrating' | 'provisional' | 'established';
  headline: string;
  subline: string | null;
}

export interface SnapshotResponse {
  user_id: string;
  generated_at: string;
  overall: OverallSummary;
  domain_cards: DomainCard[];
  attention_areas: AttentionArea[];
  strengths: Strength[];
  recent_milestones: Milestone[];
  next_best_action: NextBestAction | null;
  quick_stats: QuickStats;
  language: Lang;
}