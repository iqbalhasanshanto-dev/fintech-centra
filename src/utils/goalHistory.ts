import { Goal, GoalHistoryEntry } from '../types';

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
 * Removes a specific history entry from a goal's history log,
 * recalculates `balanceAfter` chronologically (from oldest to newest) for remaining entries,
 * persists the updated list, and returns both the removed entry and updated newest-first history.
 */
export function removeGoalHistoryEntry(
  goalId: string,
  entryId: string
): { removed?: GoalHistoryEntry; updatedHistory: GoalHistoryEntry[] } {
  const current = getGoalHistory(goalId);
  const removed = current.find(e => e.id === entryId);
  if (!removed) {
    return { updatedHistory: current };
  }

  const remaining = current.filter(e => e.id !== entryId);

  // Recalculate balanceAfter chronologically (oldest to newest)
  const chronological = [...remaining].reverse();
  chronological.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  let runningBalance = 0;
  const recalculated = chronological.map(entry => {
    if (entry.type === 'initial' || entry.type === 'add') {
      runningBalance = Math.max(0, runningBalance + entry.amount);
    } else if (entry.type === 'withdraw') {
      runningBalance = Math.max(0, runningBalance - entry.amount);
    }
    return {
      ...entry,
      balanceAfter: runningBalance,
    };
  });

  // Re-sort newest-first (latest date first)
  const updatedHistory = recalculated.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  saveGoalHistory(goalId, updatedHistory);
  return { removed, updatedHistory };
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

/**
 * Automatically seeds an initial GoalHistoryEntry for goals where currentAmount > 0 and no history exists.
 */
export function ensureGoalHistory(goal: Goal): GoalHistoryEntry[] {
  let history = getGoalHistory(goal.id);
  if (history.length === 0 && goal.currentAmount > 0) {
    const seedEntry: GoalHistoryEntry = {
      id: 'init-' + goal.id,
      goalId: goal.id,
      type: 'initial',
      amount: goal.currentAmount,
      note: 'Initial deposit',
      date: (goal as unknown as { createdAt?: string }).createdAt || goal.startDate || new Date().toISOString(),
      balanceAfter: goal.currentAmount,
    };
    saveGoalHistory(goal.id, [seedEntry]);
    history = [seedEntry];
  }
  return history;
}

