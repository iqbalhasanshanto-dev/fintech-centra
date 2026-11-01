import React, { useMemo } from 'react';
import { createPortal } from 'react-dom';
import { 
  Bell, 
  ChevronLeft, 
  Shield, 
  AlertTriangle, 
  Target, 
  CreditCard, 
  Info, 
  Trash2, 
  ChevronRight,
  Pin
} from 'lucide-react';
import { useFinance } from '../../context/FinanceContext';
import { useAuth } from '../../context/AuthContext';
import { NotificationType, NotificationItem } from '../../types';
import { useBackHandler } from '../../utils/backButton';

interface NotificationsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenQuickAction?: () => void;
  onNavigateToTab?: (tab: 'home' | 'report' | 'plan' | 'settings') => void;
  onOpenRecentActivities?: () => void;
  onNavigateToSettings?: () => void;
}

export const NotificationsModal: React.FC<NotificationsModalProps> = ({
  isOpen,
  onClose,
  onOpenQuickAction,
  onNavigateToTab,
  onOpenRecentActivities,
  onNavigateToSettings,
}) => {
  const { 
    notifications, 
    markNotificationAsRead, 
    markAllNotificationsAsRead, 
    deleteNotification,
    clearNotifications 
  } = useFinance();
  const { isGuest } = useAuth();

  useBackHandler(isOpen, onClose);

  // Deduplicate notifications by title and message so multiple "Welcome to Centra" items don't stack up
  const uniqueNotifications = useMemo(() => {
    const seen = new Set<string>();
    return notifications.filter(n => {
      const key = `${n.title.trim().toLowerCase()}||${n.message.trim().toLowerCase()}`;
      if (seen.has(key)) {
        return false;
      }
      seen.add(key);
      return true;
    });
  }, [notifications]);

  const unreadCount = useMemo(() => {
    return uniqueNotifications.filter(n => !n.isRead).length;
  }, [uniqueNotifications]);

  const isRetentionReminder = (n: NotificationItem) =>
    n.id.startsWith('retention-reminder:') || n.title.includes('2-Month Data Retention Reminder');

  // Group notifications into Pinned Reminder, Today, and Earlier
  const { pinnedReminder, todayList, earlierList } = useMemo(() => {
    let reminder: NotificationItem | null = null;
    const today: NotificationItem[] = [];
    const earlier: NotificationItem[] = [];
    const now = new Date();
    const todayStr = now.toDateString();

    uniqueNotifications.forEach(n => {
      if (isRetentionReminder(n)) {
        if (!reminder) reminder = n;
        return;
      }
      const d = new Date(n.timestamp);
      if (d.toDateString() === todayStr) {
        today.push(n);
      } else {
        earlier.push(n);
      }
    });

    return { pinnedReminder: reminder, todayList: today, earlierList: earlier };
  }, [uniqueNotifications]);

  const isWelcomeNotification = (item: NotificationItem) => {
    return (
      item.title.toLowerCase().includes('welcome') ||
      item.message.toLowerCase().includes('welcome') ||
      item.message.toLowerCase().includes('first transaction')
    );
  };

  const getIcon = (type: NotificationType) => {
    const iconClass = "w-4 h-4";
    switch (type) {
      case 'budget':
        return <AlertTriangle className={iconClass} />;
      case 'security':
        return <Shield className={iconClass} />;
      case 'goal':
        return <Target className={iconClass} />;
      case 'transaction':
        return <CreditCard className={iconClass} />;
      default:
        return <Info className={iconClass} />;
    }
  };

  const getCategoryLabel = (type: NotificationType) => {
    switch (type) {
      case 'budget':
        return 'Budget outflow';
      case 'security':
        return 'Security & login';
      case 'goal':
        return 'Savings milestone';
      case 'transaction':
        return 'Spending alert';
      default:
        return 'System update';
    }
  };

  const getActionLabel = (item: NotificationItem): string | null => {
    if (isWelcomeNotification(item)) {
      return 'Add transaction';
    }
    switch (item.type) {
      case 'budget':
        return 'View budget';
      case 'security':
        return isGuest ? null : 'Review session';
      case 'transaction':
        return 'View transaction';
      default:
        return 'View details';
    }
  };

  const handleNotificationClick = (item: NotificationItem) => {
    markNotificationAsRead(item.id);
    onClose();
    if (item.type === 'security') {
      if (isGuest) return;
      if (onNavigateToSettings) onNavigateToSettings();
      else onNavigateToTab?.('settings');
      return;
    }
    if (isWelcomeNotification(item) || item.type === 'system') {
      onOpenQuickAction?.();
    } else if (item.type === 'budget' || item.type === 'goal') {
      onNavigateToTab?.('plan');
    } else if (item.type === 'transaction') {
      if (onOpenRecentActivities) onOpenRecentActivities();
      else onNavigateToTab?.('home');
    }
  };

  const formatItemTime = (isoString: string) => {
    try {
      const d = new Date(isoString);
      return d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
    } catch {
      return '';
    }
  };

  const todayDateString = useMemo(() => {
    return new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
  }, []);

  const earlierDateString = useMemo(() => {
    if (earlierList.length > 0) {
      const d = new Date(earlierList[0].timestamp);
      return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
    }
    return '';
  }, [earlierList]);

  if (!isOpen) return null;

  const renderNotificationCard = (item: NotificationItem, isPinned: boolean = false) => {
    const isUnread = !item.isRead;
    const categoryLabel = getCategoryLabel(item.type);
    const actionLabel = getActionLabel(item);

    return (
      <div
        key={item.id}
        onClick={() => handleNotificationClick(item)}
        className={`rounded-[28px] bg-white dark:bg-white/[0.08] border p-5 shadow-sm transition-all cursor-pointer space-y-3.5 ${
          isPinned
            ? 'border-[#C6FF3D]/40 dark:border-[#C6FF3D]/30 bg-gradient-to-br from-[#C6FF3D]/5 to-transparent'
            : 'border-black/[0.06] dark:border-white/[0.15] hover:border-black/[0.12] dark:hover:border-white/[0.25]'
        }`}
      >
        {/* Card Header Row: Icon + Overline + Title + Unread Dot */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3 min-w-0">
            <div
              className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 mt-0.5 ${
                isPinned
                  ? 'bg-[#C6FF3D]/20 text-[#4D6E18] dark:text-[#C6FF3D]'
                  : isUnread
                  ? 'bg-[#C6FF3D]/15 text-[#4D6E18] dark:text-[#C6FF3D]'
                  : 'bg-[#F1F2F4] text-[#667085] dark:bg-[#262626] dark:text-[#9CA3AF]'
              }`}
            >
              {isPinned ? <Pin className="w-4 h-4 text-[#4D6E18] dark:text-[#C6FF3D]" /> : getIcon(item.type)}
            </div>

            <div className="min-w-0">
              <span className="text-[11px] font-medium text-[#667085] dark:text-white/60 flex items-center gap-1.5">
                {isPinned ? (
                  <span className="inline-flex items-center gap-1 text-[#4D6E18] dark:text-[#C6FF3D] font-bold">
                    <Pin className="w-3 h-3" /> Pinned • Monthly Policy
                  </span>
                ) : (
                  <>
                    {categoryLabel}
                    {!isUnread && ' • Read'}
                  </>
                )}
              </span>
              <h4 className="text-base font-medium text-[#18212F] dark:text-white truncate mt-0.5">
                {item.title}
              </h4>
            </div>
          </div>

          {isUnread && (
            <span
              className="w-2 h-2 rounded-full bg-[#C6FF3D] shrink-0 mt-2 shadow-[0_0_8px_rgba(198,255,61,0.6)]"
              aria-label="Unread"
            />
          )}
        </div>

        {/* Message Body */}
        <p className="text-sm text-[#667085] dark:text-white/70 leading-relaxed">
          {item.message}
        </p>

        {/* Footer Row: Timestamp + Action Link */}
        <div className="flex items-center justify-between pt-2 border-t border-black/[0.04] dark:border-white/[0.07]">
          <span className="text-[11px] text-[#667085] dark:text-white/40">
            {formatItemTime(item.timestamp)}
          </span>

          {actionLabel && (
            <span 
              onClick={(e) => {
                e.stopPropagation();
                handleNotificationClick(item);
              }}
              className="text-xs font-medium text-[#4D6E18] dark:text-[#C6FF3D] hover:underline flex items-center gap-0.5 cursor-pointer"
            >
              <span>{actionLabel}</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </span>
          )}
        </div>
      </div>
    );
  };

  const modalNode = (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Notifications"
      className="fixed inset-0 z-[100] bg-[#F7F8FA] dark:bg-[#000000] flex flex-col overflow-hidden text-[#18212F] dark:text-white antialiased"
    >
      {/* Top Header Bar matching unified spec */}
      <div
        className="shrink-0 w-full bg-[#F7F8FA] dark:bg-[#000000] border-b border-black/5 dark:border-white/10"
        style={{
          paddingTop: 'env(safe-area-inset-top, 0px)',
          paddingLeft: 'env(safe-area-inset-left, 0px)',
          paddingRight: 'env(safe-area-inset-right, 0px)',
        }}
      >
        <div className="w-full max-w-lg mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
          <button
            type="button"
            onClick={onClose}
            className="w-10 h-10 rounded-full border border-black/[0.08] dark:border-white/[0.12] bg-white dark:bg-[#1D1D1D] flex items-center justify-center text-gray-700 dark:text-gray-300 cursor-pointer shrink-0"
            aria-label="Back"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>

          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-[#18212F] dark:text-white text-center">
            Notifications
          </h1>

          {uniqueNotifications.length > 0 ? (
            <button
              type="button"
              onClick={clearNotifications}
              className="w-10 h-10 rounded-full border border-black/[0.08] dark:border-white/[0.12] bg-white dark:bg-[#1D1D1D] flex items-center justify-center text-gray-400 hover:text-rose-500 hover:bg-rose-500/10 transition-colors cursor-pointer shrink-0 shadow-xs"
              title="Clear all"
              aria-label="Clear all notifications"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          ) : (
            <div className="w-10 h-10 shrink-0" aria-hidden="true" />
          )}
        </div>
      </div>

      {/* Notifications Scroll List Container */}
      <div
        className="flex-1 overflow-y-auto px-4 sm:px-6 pt-3 pb-24"
        style={{ paddingBottom: 'calc(4rem + env(safe-area-inset-bottom, 0px))' }}
      >
        <div className="w-full max-w-lg mx-auto flex-1 flex flex-col space-y-4 pb-3">

        {/* Inbox Controls Bar: "Your updates" + unread badge + "Mark all as read" */}
        <div className="flex items-center justify-between pt-1">
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold text-[#18212F] dark:text-white/80">
              Your updates
            </span>
            {unreadCount > 0 && (
              <span className="bg-[#C6FF3D]/10 text-[#4D6E18] dark:text-[#C6FF3D] border border-[#C6FF3D]/20 rounded-full px-2.5 py-0.5 text-[11px] font-semibold">
                {unreadCount} unread
              </span>
            )}
          </div>

          {unreadCount > 0 && (
            <button
              type="button"
              onClick={markAllNotificationsAsRead}
              className="text-xs font-medium text-[#4D6E18] dark:text-[#C6FF3D] hover:underline transition-colors cursor-pointer"
            >
              Mark all as read
            </button>
          )}
        </div>

        {/* Notifications Scroll List Container */}
        <div className="space-y-6 flex-1 pb-16">
          {uniqueNotifications.length === 0 ? (
            <div className="text-center py-20 text-xs text-[#667085] dark:text-[#9CA3AF] space-y-3">
              <div className="w-16 h-16 mx-auto rounded-full bg-white dark:bg-[#1D1D1D] border border-black/[0.06] dark:border-white/[0.1] flex items-center justify-center shadow-xs">
                <Bell className="w-8 h-8 text-gray-400 dark:text-gray-500" />
              </div>
              <p className="font-bold text-[#18212F] dark:text-white text-base">No notifications right now</p>
              <p className="max-w-xs mx-auto text-gray-500 dark:text-gray-400 text-xs leading-relaxed">
                Budget warnings, transaction alerts and milestones will appear here.
              </p>
            </div>
          ) : (
            <>
              {/* Pinned 2-Month Data Retention Policy Reminder */}
              {pinnedReminder && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs text-[#667085] dark:text-white/60 px-1 font-medium">
                    <span className="font-semibold text-xs text-[#4D6E18] dark:text-[#C6FF3D] flex items-center gap-1.5 uppercase tracking-wider">
                      <Pin className="w-3.5 h-3.5" />
                      Pinned Policy
                    </span>
                  </div>
                  <div>
                    {renderNotificationCard(pinnedReminder, true)}
                  </div>
                </div>
              )}

              {/* Today Group */}
              {todayList.length > 0 && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-xs text-[#667085] dark:text-white/60 px-1 font-medium">
                    <span className="font-semibold text-sm text-[#18212F] dark:text-white">Today</span>
                    <span className="text-[11px] text-gray-400 dark:text-white/40">{todayDateString}</span>
                  </div>
                  <div className="space-y-3">
                    {todayList.map(item => renderNotificationCard(item, false))}
                  </div>
                </div>
              )}

              {/* Earlier Group */}
              {earlierList.length > 0 && (
                <div className="space-y-3 pt-2">
                  <div className="flex items-center justify-between text-xs text-[#667085] dark:text-white/60 px-1 font-medium">
                    <span className="font-semibold text-sm text-[#18212F] dark:text-white">Earlier</span>
                    {earlierDateString && (
                      <span className="text-[11px] text-gray-400 dark:text-white/40">{earlierDateString}</span>
                    )}
                  </div>
                  <div className="space-y-3">
                    {earlierList.map(item => renderNotificationCard(item, false))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  </div>
  );

  return typeof document !== 'undefined' ? createPortal(modalNode, document.body) : modalNode;
};
