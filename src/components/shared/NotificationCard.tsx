import React from 'react';
import { formatDistanceToNow } from 'date-fns';
import { ShoppingCart, Factory, Package, DollarSign, Users, AlertCircle, CheckCircle, Info, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useRouter } from 'next/navigation';

export interface Notification {
  id: string;
  title: string;
  message: string;
  module: string;
  category: string;
  priority: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  isRead: boolean;
  icon?: string;
  color?: string;
  link?: string;
  createdAt: string;
}

interface NotificationCardProps {
  notification: Notification;
  onRead: (id: string) => void;
  onClose?: () => void;
}

export function NotificationCard({ notification, onRead, onClose }: NotificationCardProps) {
  const router = useRouter();
  
  const getIcon = (iconName?: string) => {
    switch (iconName?.toLowerCase()) {
      case 'shopping-cart': return <ShoppingCart className="h-5 w-5" />;
      case 'factory': return <Factory className="h-5 w-5" />;
      case 'package': return <Package className="h-5 w-5" />;
      case 'dollar': return <DollarSign className="h-5 w-5" />;
      case 'users': return <Users className="h-5 w-5" />;
      case 'alert': return <AlertCircle className="h-5 w-5" />;
      case 'check': return <CheckCircle className="h-5 w-5" />;
      case 'info': return <Info className="h-5 w-5" />;
      default: return <BellIcon />;
    }
  };

  const BellIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"/></svg>
  );

  const getColorClasses = (color?: string, priority?: string) => {
    if (color === 'red' || priority === 'CRITICAL') return 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400';
    if (color === 'orange' || priority === 'HIGH') return 'bg-orange-100 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400';
    if (color === 'green') return 'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400';
    return 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400';
  };

  const handleClick = async () => {
    if (!notification.isRead) {
      onRead(notification.id);
    }
    if (notification.link) {
      if (onClose) onClose();
      router.push(notification.link);
    }
  };

  return (
    <div 
      onClick={handleClick}
      className={cn(
        "group relative flex cursor-pointer gap-4 rounded-xl p-3 transition-colors",
        notification.isRead 
          ? "hover:bg-gray-50 dark:hover:bg-gray-800/50" 
          : "bg-blue-50/50 hover:bg-blue-50 dark:bg-blue-900/10 dark:hover:bg-blue-900/20"
      )}
    >
      <div className={cn("mt-1 flex h-10 w-10 shrink-0 items-center justify-center rounded-full", getColorClasses(notification.color, notification.priority))}>
        {getIcon(notification.icon)}
      </div>
      
      <div className="flex-1 space-y-1">
        <div className="flex items-start justify-between gap-2">
          <p className={cn("text-sm font-semibold", notification.isRead ? "text-gray-900 dark:text-gray-100" : "text-gray-900 dark:text-white")}>
            {notification.title}
          </p>
          {!notification.isRead && (
            <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-blue-600" />
          )}
        </div>
        <p className="text-sm text-gray-500 dark:text-gray-400 line-clamp-2">
          {notification.message}
        </p>
        <div className="flex items-center gap-2 pt-1 text-xs font-medium text-gray-400 dark:text-gray-500">
          <Clock className="h-3.5 w-3.5" />
          {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })}
        </div>
      </div>
    </div>
  );
}
