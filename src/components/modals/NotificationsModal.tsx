import React, { useState } from 'react';
import { 
  Bell, 
  Check, 
  Trash2, 
  Shield, 
  AlertTriangle, 
  Target, 
  CreditCard, 
  CheckCircle2, 
  Info,
  X
} from 'lucide-react';
import { useFinance } from '../../context/FinanceContext';
import { Modal } from '../ui/Modal';
import { NotificationItem, NotificationType } from '../../types';
import { formatRelativeTime } from '../../utils/formatters';

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

  const [activeFilter, setActiveFilter] = useState<'all' | NotificationType>('all');

  const filtered = notifications.filter(n => {
    if (activeFilter === 'all') return true;
    return n.type === activeFilter;
  });

  const getIcon = (type: NotificationType, severity?: string) => {
    if (type === 'budget' || severity === 'alert') {
      return <AlertTriangle className="w-4 h-4 text-danger" />;
    }
    if (type === 'security') {
      return <Shield className="w-4 h-4 text-amber-500" />;
    }
    if (type === 'goal') {
      return <Target className="w-4 h-4 text-growth" />;
    }
    if (type === 'transaction') {
      return <CreditCard className="w-4 h-4 text-brand-600" />;
    }
    return <Info className="w-4 h-4 text-gray-400" />;
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Notifications"
      subtitle={`${notifications.filter(n => !n.isRead).length} unread alerts`}
    >
      <div className="space-y-4">
        
        {/* Top Actions: Mark all as read & Clear */}
        <div className="flex items-center justify-between text-xs">
          <div className="flex items-center space-x-1 overflow-x-auto pb-1 no-scrollbar">
            <button
              onClick={() => setActiveFilter('all')}
              className={`px-2.5 py-1 rounded-full font-bold transition-colors ${
                activeFilter === 'all'
                  ? 'bg-brand-600 text-white'
                  : 'bg-gray-100 dark:bg-[#1e2638] text-gray-600 dark:text-[#64748b]'
              }`}
            >
              All ({notifications.length})
            </button>
            <button
              onClick={() => setActiveFilter('budget')}
              className={`px-2.5 py-1 rounded-full font-bold transition-colors ${
                activeFilter === 'budget'
                  ? 'bg-rose-500 text-white'
                  : 'bg-gray-100 dark:bg-[#1e2638] text-gray-600 dark:text-[#64748b]'
              }`}
            >
              Budgets
            </button>
            <button
              onClick={() => setActiveFilter('security')}
              className={`px-2.5 py-1 rounded-full font-bold transition-colors ${
                activeFilter === 'security'
                  ? 'bg-amber-500 text-white'
                  : 'bg-gray-100 dark:bg-[#1e2638] text-gray-600 dark:text-[#64748b]'
              }`}
            >
              Security
            </button>
          </div>

          <div className="flex items-center space-x-1 shrink-0">
            <button
              onClick={markAllNotificationsAsRead}
              className="p-1.5 text-brand-600 dark:text-brand-400 hover:text-brand-700 font-bold"
              title="Mark all as read"
            >
              <Check className="w-4 h-4" />
            </button>
            <button
              onClick={clearNotifications}
              className="p-1.5 text-gray-400 dark:text-[#64748b] hover:text-rose-500 font-bold"
              title="Clear all"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Notifications List */}
        <div className="divide-y divide-gray-100 dark:divide-[#1e2638] max-h-[55vh] overflow-y-auto pr-1">
          {filtered.length === 0 ? (
            <div className="text-center py-10 text-xs text-gray-400 dark:text-[#64748b]">
              <Bell className="w-8 h-8 mx-auto text-gray-300 dark:text-[#1e2638] mb-2" />
              <p className="font-bold">No notifications right now</p>
              <p className="mt-0.5">Budget warnings, transaction alerts and milestones will appear here.</p>
            </div>
          ) : (
            filtered.map(item => (
              <div
                key={item.id}
                onClick={() => markNotificationAsRead(item.id)}
                className={`py-3.5 px-2 flex items-start space-x-3 rounded-2xl cursor-pointer transition-colors ${
                  !item.isRead
                    ? 'bg-brand-50/60 dark:bg-brand-950/20'
                    : 'hover:bg-gray-50 dark:hover:bg-[#1e2638]/40'
                }`}
              >
                <div className="p-2 rounded-xl bg-white dark:bg-[#131722] shadow-xs shrink-0 mt-0.5">
                  {getIcon(item.type, item.severity)}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <h4 className={`text-xs font-bold truncate ${!item.isRead ? 'text-brand-900 dark:text-[#f8fafc]' : 'text-gray-700 dark:text-[#f8fafc]'}`}>
                      {item.title}
                    </h4>
                    <span className="text-[10px] text-gray-400 dark:text-[#64748b] ml-2 shrink-0">
                      {formatRelativeTime(item.timestamp)}
                    </span>
                  </div>
                  <p className="text-[11px] text-gray-600 dark:text-[#64748b] mt-0.5 leading-relaxed">
                    {item.message}
                  </p>
                </div>

                {!item.isRead && (
                  <div className="w-2 h-2 rounded-full bg-brand-600 shrink-0 mt-2" />
                )}
              </div>
            ))
          )}
        </div>

      </div>
    </Modal>
  );
};
