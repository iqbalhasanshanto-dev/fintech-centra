import React, { useMemo } from 'react';
import { 
  Bell, 
  ChevronLeft, 
  Shield, 
  AlertTriangle, 
  Target, 
  CreditCard, 
  Info,
  Trash2,
  ChevronRight
} from 'lucide-react';
import { useFinance } from '../../context/FinanceContext';
import { Modal } from '../ui/Modal';
import { NotificationType, NotificationItem } from '../../types';
import { useBackHandler } from '../../utils/backButton';

interface NotificationsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const NotificationsModal: React.FC<NotificationsModalProps> = ({
  isOpen,
  onClose,
}) => {
  const { 
    notifications, 
    markNotificationAsRead, 
    markAllNotificationsAsRead, 
    clearNotifications 
  } = useFinance();

  useBackHandler(isOpen, onClose);

  const unreadCount = useMemo(() => {
    return notifications.filter(n => !n.isRead).length;
  }, [notifications]);

  // Group notifications into Today and Earlier
  const { todayList, earlierList } = useMemo(() => {
    const today: NotificationItem[] = [];
    const earlier: NotificationItem[] = [];
    const now = new Date();
    const todayStr = now.toDateString();

    notifications.forEach(n => {
      const d = new Date(n.timestamp);
      if (d.toDateString() === todayStr) {
        today.push(n);
      } else {
        earlier.push(n);
      }
    });

    return { todayList: today, earlierList: earlier };
  }, [notifications]);

  const getIcon = (type: NotificationType) => {
    const iconClass = "w-5 h-5";
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

  const getActionLabel = (type: NotificationType) => {
    switch (type) {
      case 'budget':
        return 'View budget';
      case 'security':
        return 'Review session';
      case 'transaction':
        return 'View transaction';
      default:
        return 'View details';
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

  const renderNotificationCard = (item: NotificationItem) => {
    const isUnread = !item.isRead;
    const categoryLabel = getCategoryLabel(item.type);
    const actionLabel = getActionLabel(item.type);

    return (
      <div
        key={item.id}
        onClick={() => markNotificationAsRead(item.id)}
        className="rounded-[24px] bg-white dark:bg-[#1D1D1D] border border-black/[0.06] dark:border-white/[0.08] p-5 shadow-sm transition-all cursor-pointer hover:border-black/[0.12] dark:hover:border-white/[0.16] space-y-3"
      >
        {/* Card Header Row: Icon + Overline + Title + Unread Dot */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3 min-w-0">
            <div
              className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 mt-0.5 ${
                isUnread
                  ? 'bg-[#4D6E18]/15 text-[#4D6E18] dark:bg-[#C6FF3D]/15 dark:text-[#C6FF3D]'
                  : 'bg-[#F1F2F4] text-[#667085] dark:bg-[#262626] dark:text-[#9CA3AF]'
              }`}
            >
              {getIcon(item.type)}
            </div>

            <div className="min-w-0">
              <span className="text-xs font-medium text-[#667085] dark:text-[#9CA3AF] block">
                {categoryLabel}
                {!isUnread && ' • Read'}
              </span>
              <h4 className="text-sm sm:text-base font-bold text-[#18212F] dark:text-white truncate mt-0.5">
                {item.title}
              </h4>
            </div>
          </div>

          {isUnread && (
            <span
              className="w-2 h-2 rounded-full bg-[#F97316] shrink-0 mt-2"
              aria-label="Unread"
            />
          )}
        </div>

        {/* Message Body */}
        <p className="text-xs sm:text-sm text-[#667085] dark:text-[#9CA3AF] leading-relaxed">
          {item.message}
        </p>

        {/* Footer Row: Timestamp + Action Link */}
        <div className="flex items-center justify-between pt-1 border-t border-black/[0.04] dark:border-white/[0.05]">
          <span className="text-xs text-[#667085] dark:text-[#9CA3AF]">
            {formatItemTime(item.timestamp)}
          </span>

          <span className="text-xs font-semibold text-[#4D6E18] dark:text-[#C6FF3D] hover:underline flex items-center gap-0.5 cursor-pointer">
            <span>{actionLabel}</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </span>
        </div>
      </div>
    );
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} hideHeader maxWidth="max-w-lg">
      <div className="p-4 sm:p-6 space-y-5">
        {/* Top Bar (09-notifications.png) */}
        <div className="flex items-center justify-between">
          <button
            type="button"
            onClick={onClose}
            className="w-11 h-11 rounded-full border border-black/[0.08] dark:border-white/[0.12] flex items-center justify-center text-gray-700 dark:text-gray-300 hover:text-black dark:hover:text-white hover:bg-black/[0.04] dark:hover:bg-white/[0.04] transition-colors cursor-pointer"
            aria-label="Back"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>

          <h2 className="text-xl font-bold tracking-tight text-[#18212F] dark:text-white text-center">
            Notifications
          </h2>

          {notifications.length > 0 ? (
            <button
              type="button"
              onClick={clearNotifications}
              className="w-11 h-11 rounded-full border border-black/[0.08] dark:border-white/[0.12] flex items-center justify-center text-gray-400 hover:text-rose-500 hover:bg-rose-500/10 transition-colors cursor-pointer"
              title="Clear all"
              aria-label="Clear all notifications"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          ) : (
            <div className="w-11" aria-hidden="true" />
          )}
        </div>

        {/* Sub-bar: Your updates + unread badge + Mark all as read */}
        <div className="flex items-center justify-between pt-1">
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold text-[#18212F] dark:text-white">
              Your updates
            </span>
            {unreadCount > 0 && (
              <span className="bg-[#4D6E18]/15 text-[#4D6E18] dark:bg-[#C6FF3D]/15 dark:text-[#C6FF3D] rounded-full px-2.5 py-0.5 text-xs font-semibold">
                {unreadCount} unread
              </span>
            )}
          </div>

          {unreadCount > 0 && (
            <button
              type="button"
              onClick={markAllNotificationsAsRead}
              className="text-xs font-semibold text-[#4D6E18] dark:text-[#C6FF3D] hover:underline transition-colors cursor-pointer"
            >
              Mark all as read
            </button>
          )}
        </div>

        {/* Notifications Scroll Container */}
        <div className="space-y-6 max-h-[60vh] overflow-y-auto pr-1">
          {notifications.length === 0 ? (
            <div className="text-center py-12 text-xs text-[#667085] dark:text-[#9CA3AF] space-y-2">
              <Bell className="w-10 h-10 mx-auto text-gray-400 dark:text-gray-600 mb-2" />
              <p className="font-bold text-[#18212F] dark:text-white text-sm">No notifications right now</p>
              <p>Budget warnings, transaction alerts and milestones will appear here.</p>
            </div>
          ) : (
            <>
              {/* Today Group */}
              {todayList.length > 0 && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-xs text-[#667085] dark:text-[#9CA3AF] px-1 font-medium">
                    <span>Today</span>
                    <span>{todayDateString}</span>
                  </div>
                  <div className="space-y-3">
                    {todayList.map(renderNotificationCard)}
                  </div>
                </div>
              )}

              {/* Earlier Group */}
              {earlierList.length > 0 && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-xs text-[#667085] dark:text-[#9CA3AF] px-1 font-medium">
                    <span>Earlier</span>
                    {earlierDateString && <span>{earlierDateString}</span>}
                  </div>
                  <div className="space-y-3">
                    {earlierList.map(renderNotificationCard)}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </Modal>
  );
};
