import React, { useState } from 'react';
import { 
  Bell, 
  Check, 
  Trash2, 
  Shield, 
  AlertTriangle, 
  Target, 
  CreditCard, 
  Info
} from 'lucide-react';
import { useFinance } from '../../context/FinanceContext';
import { Modal } from '../ui/Modal';
import { NotificationType } from '../../types';
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
      return <AlertTriangle className="w-4 h-4 text-rose-400" />;
    }
    if (type === 'security') {
      return <Shield className="w-4 h-4 text-amber-400" />;
    }
    if (type === 'goal') {
      return <Target className="w-4 h-4 text-emerald-400" />;
    }
    if (type === 'transaction') {
      return <CreditCard className="w-4 h-4 text-indigo-400" />;
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
        
        {/* Top Actions: Filters & Clear */}
        <div className="flex items-center justify-between text-xs">
          <div className="flex items-center space-x-1 overflow-x-auto pb-1 no-scrollbar">
            <button
              onClick={() => setActiveFilter('all')}
              className={`px-3 py-1 rounded-lg font-semibold transition-colors ${
                activeFilter === 'all'
                  ? 'bg-gray-800 text-white border border-gray-700'
                  : 'bg-gray-900 border border-gray-800 text-gray-500 hover:text-gray-300'
              }`}
            >
              All ({notifications.length})
            </button>
            <button
              onClick={() => setActiveFilter('budget')}
              className={`px-3 py-1 rounded-lg font-semibold transition-colors ${
                activeFilter === 'budget'
                  ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                  : 'bg-gray-900 border border-gray-800 text-gray-500 hover:text-gray-300'
              }`}
            >
              Budgets
            </button>
            <button
              onClick={() => setActiveFilter('security')}
              className={`px-3 py-1 rounded-lg font-semibold transition-colors ${
                activeFilter === 'security'
                  ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                  : 'bg-gray-900 border border-gray-800 text-gray-500 hover:text-gray-300'
              }`}
            >
              Security
            </button>
          </div>

          <div className="flex items-center space-x-1 shrink-0">
            <button
              onClick={markAllNotificationsAsRead}
              className="p-1.5 text-indigo-400 hover:text-indigo-300 transition-colors"
              title="Mark all as read"
            >
              <Check className="w-4 h-4" />
            </button>
            <button
              onClick={clearNotifications}
              className="p-1.5 text-gray-500 hover:text-rose-400 transition-colors"
              title="Clear all"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Notifications List */}
        <div className="divide-y divide-gray-800 max-h-[55vh] overflow-y-auto pr-1">
          {filtered.length === 0 ? (
            <div className="text-center py-10 text-xs text-gray-500">
              <Bell className="w-8 h-8 mx-auto text-gray-600 mb-2" />
              <p className="font-bold text-gray-400">No notifications right now</p>
              <p className="mt-0.5">Budget warnings, transaction alerts and milestones will appear here.</p>
            </div>
          ) : (
            filtered.map(item => (
              <div
                key={item.id}
                onClick={() => markNotificationAsRead(item.id)}
                className={`py-3 px-2 flex items-start space-x-3 rounded-xl cursor-pointer transition-colors ${
                  !item.isRead
                    ? 'bg-gray-900/80 hover:bg-gray-800/60'
                    : 'hover:bg-gray-900/40'
                }`}
              >
                <div className="p-2 rounded-lg bg-gray-800 shrink-0 mt-0.5">
                  {getIcon(item.type, item.severity)}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <h4 className={`text-xs font-bold truncate ${!item.isRead ? 'text-white' : 'text-gray-400'}`}>
                      {item.title}
                    </h4>
                    <span className="text-[10px] text-gray-500 ml-2 shrink-0">
                      {formatRelativeTime(item.timestamp)}
                    </span>
                  </div>
                  <p className="text-xs text-gray-400 mt-0.5 leading-relaxed">
                    {item.message}
                  </p>
                </div>

                {!item.isRead && (
                  <div className="w-2 h-2 rounded-full bg-indigo-500 shrink-0 mt-2" />
                )}
              </div>
            ))
          )}
        </div>

      </div>
    </Modal>
  );
};
