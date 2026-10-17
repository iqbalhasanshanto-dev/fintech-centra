/**
 * Persisted offline/retry Outbox queue for Centra Fintech.
 * Stores pending mutations per user in localStorage: centra:{userId}:outbox
 */

export interface OutboxItem {
  id: string;
  userId: string;
  entity: 'accounts' | 'categories' | 'transactions' | 'goals' | 'budgets' | 'notifications' | 'settings' | 'profiles';
  op: 'upsert' | 'delete';
  recordId: string;
  payload?: any;
  timestamp: number;
  retries: number;
  lastError?: string;
  groupId?: string;
  order?: number;
}

function getOutboxKey(userId: string): string {
  const uid = userId && userId !== 'guest' ? userId : 'guest';
  return `centra:${uid}:outbox`;
}

function getOutboxItems(userId: string): OutboxItem[] {
  try {
    const raw = localStorage.getItem(getOutboxKey(userId));
    if (!raw) return [];
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

function saveOutboxItems(userId: string, items: OutboxItem[]): void {
  try {
    localStorage.setItem(getOutboxKey(userId), JSON.stringify(items));
  } catch (err) {
    console.error('Failed to persist outbox items:', err);
  }
}

export const OutboxQueue = {
  enqueue: (item: Omit<OutboxItem, 'id' | 'timestamp' | 'retries'>): OutboxItem => {
    // Generate UUID for outbox record
    const id = typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `out_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    const fullItem: OutboxItem = {
      ...item,
      id,
      timestamp: Date.now(),
      retries: 0,
    };

    const items = getOutboxItems(item.userId);
    // Deduplicate / coalesce if updating same record
    const filtered = items.filter(existing => !(existing.entity === item.entity && existing.recordId === item.recordId));
    filtered.push(fullItem);
    saveOutboxItems(item.userId, filtered);
    return fullItem;
  },

  enqueueGroup: (
    rawItems: Array<Omit<OutboxItem, 'id' | 'timestamp' | 'retries'>>,
    providedGroupId?: string
  ): OutboxItem[] => {
    if (rawItems.length === 0) return [];
    const groupId = providedGroupId || (typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `grp_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`);
    const now = Date.now();
    const userId = rawItems[0].userId;

    const fullItems: OutboxItem[] = rawItems.map((item, idx) => ({
      ...item,
      id: typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `out_${now}_${idx}_${Math.random().toString(36).substring(2, 9)}`,
      groupId,
      order: idx,
      timestamp: now,
      retries: 0,
    }));

    const existingItems = getOutboxItems(userId);
    // Remove individual matching records to be coalesced with this atomic operation
    const filtered = existingItems.filter(existing =>
      !fullItems.some(incoming => incoming.entity === existing.entity && incoming.recordId === existing.recordId)
    );

    const merged = [...filtered, ...fullItems];
    saveOutboxItems(userId, merged);
    return fullItems;
  },

  getPending: (userId: string): OutboxItem[] => {
    return getOutboxItems(userId);
  },

  remove: (userId: string, itemId: string): void => {
    const items = getOutboxItems(userId);
    saveOutboxItems(userId, items.filter(i => i.id !== itemId));
  },

  update: (userId: string, updatedItem: OutboxItem): void => {
    const items = getOutboxItems(userId);
    saveOutboxItems(userId, items.map(i => i.id === updatedItem.id ? updatedItem : i));
  },

  clear: (userId: string): void => {
    try {
      localStorage.removeItem(getOutboxKey(userId));
    } catch {
      // Ignore
    }
  },

  count: (userId: string): number => {
    return getOutboxItems(userId).length;
  },
};
