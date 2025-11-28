import { formatDistanceToNow } from 'date-fns';
import { Check, Info, AlertTriangle, XCircle, Bell } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

export interface Notification {
    id: string;
    title: string;
    message: string;
    level: 'info' | 'success' | 'warning' | 'error';
    is_read: boolean;
    created_at: string;
    data?: Record<string, any>;
}

interface NotificationItemProps {
    notification: Notification;
    onRead: (id: string) => void;
}

const icons = {
    info: Info,
    success: Check,
    warning: AlertTriangle,
    error: XCircle,
};

const colors = {
    info: 'text-blue-500',
    success: 'text-green-500',
    warning: 'text-yellow-500',
    error: 'text-red-500',
};

export function NotificationItem({ notification, onRead }: NotificationItemProps) {
    const Icon = icons[notification.level] || Bell;
    const colorClass = colors[notification.level] || 'text-gray-500';

    return (
        <div className={cn(
            "flex gap-4 p-4 border-b hover:bg-muted/50 transition-colors",
            !notification.is_read && "bg-muted/20"
        )}>
            <div className={cn("mt-1", colorClass)}>
                <Icon className="h-5 w-5" />
            </div>
            <div className="flex-1 space-y-1">
                <div className="flex justify-between items-start">
                    <p className={cn("text-sm font-medium", !notification.is_read && "font-semibold")}>
                        {notification.title}
                    </p>
                    <span className="text-xs text-muted-foreground whitespace-nowrap ml-2">
                        {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true })}
                    </span>
                </div>
                <p className="text-sm text-muted-foreground line-clamp-2">
                    {notification.message}
                </p>
                {!notification.is_read && (
                    <Button
                        variant="ghost"
                        size="sm"
                        className="h-auto p-0 text-xs text-primary hover:text-primary/80"
                        onClick={() => onRead(notification.id)}
                    >
                        Mark as read
                    </Button>
                )}
            </div>
        </div>
    );
}
