import { GoalHistoryEntry } from '../types';

const GOAL_HISTORY_STORAGE_KEY = 'centra_goal_history';

/**
 * Returns all saved goal history entries grouped by goalId.
 */
export function getAllGoalHistory(): Record<string, GoalHistoryEntry[]> {
  if (typeof window === 'undefined' || !window.localStorage) return {};
  try {
    const raw = localStorage.getItem(GOAL_HISTORY_STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

/**
 * Retrieves the history log for a specific goal, sorted newest-first.
 */
export function getGoalHistory(goalId: string): GoalHistoryEntry[] {
  const map = getAllGoalHistory();
  return map[goalId] || [];
}

/**
 * Saves or updates the history log for a specific goal.
 */
export function saveGoalHistory(goalId: string, history: GoalHistoryEntry[]): void {
  if (typeof window === 'undefined' || !window.localStorage) return;
  try {
    const map = getAllGoalHistory();
    map[goalId] = history;
    localStorage.setItem(GOAL_HISTORY_STORAGE_KEY, JSON.stringify(map));
  } catch (err) {
    console.warn('Failed to persist goal history:', err);
  }
}

/**
 * Appends a new GoalHistoryEntry to a goal's history log.
 */
export function appendGoalHistory(entry: GoalHistoryEntry): GoalHistoryEntry[] {
  const current = getGoalHistory(entry.goalId);
  const updated = [entry, ...current];
  saveGoalHistory(entry.goalId, updated);
  return updated;
}

/**
 * Permanently removes a goal's history log from localStorage.
 */
export function deleteGoalHistory(goalId: string): void {
  if (typeof window === 'undefined' || !window.localStorage) return;
  try {
    const map = getAllGoalHistory();
    delete map[goalId];
    localStorage.setItem(GOAL_HISTORY_STORAGE_KEY, JSON.stringify(map));
  } catch (err) {
    console.warn('Failed to delete goal history:', err);
  }
}

