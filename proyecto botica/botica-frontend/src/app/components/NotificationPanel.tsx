import { X, CheckCircle, AlertCircle, Info, Package, ShoppingCart } from "lucide-react";

interface Notification {
  id: string;
  type: "success" | "warning" | "info" | "order";
  title: string;
  message: string;
  time: string;
  read: boolean;
}

interface NotificationPanelProps {
  isOpen: boolean;
  onClose: () => void;
  notifications: Notification[];
  onMarkAsRead: (id: string) => void;
  onMarkAllAsRead: () => void;
}

export function NotificationPanel({
  isOpen,
  onClose,
  notifications,
  onMarkAsRead,
  onMarkAllAsRead,
}: NotificationPanelProps) {
  if (!isOpen) return null;

  const getIcon = (type: string) => {
    switch (type) {
      case "success":
        return <CheckCircle className="w-5 h-5 text-success" />;
      case "warning":
        return <AlertCircle className="w-5 h-5 text-warning" />;
      case "order":
        return <ShoppingCart className="w-5 h-5 text-info" />;
      case "info":
      default:
        return <Info className="w-5 h-5 text-faint" />;
    }
  };

  return (
    <>
      {/* Overlay */}
      <div
        className="fixed inset-0 bg-black/20 z-40"
        onClick={onClose}
      />

      {/* Panel */}
      <div className="fixed right-0 top-0 h-full w-full md:w-96 bg-surface shadow-2xl z-50 flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-line bg-surface-2">
          <h2 className="text-lg font-bold text-text">Notificaciones</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-surface-2 rounded-full transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Actions */}
        {notifications.length > 0 && (
          <div className="p-3 border-b border-line bg-surface-2">
            <button
              onClick={onMarkAllAsRead}
              className="text-sm text-brand font-semibold hover:underline"
            >
              Marcar todas como leídas
            </button>
          </div>
        )}

        {/* Notifications List */}
        <div className="flex-1 overflow-y-auto">
          {notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-faint p-8">
              <Package className="w-16 h-16 mb-4 opacity-50" />
              <p className="text-center">No tienes notificaciones</p>
            </div>
          ) : (
            <div className="divide-y divide-line">
              {notifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`p-4 hover:bg-surface-2 transition-colors cursor-pointer ${
                    !notification.read ? "bg-info-soft" : ""
                  }`}
                  onClick={() => onMarkAsRead(notification.id)}
                >
                  <div className="flex gap-3">
                    <div className="flex-shrink-0 mt-1">
                      {getIcon(notification.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2 mb-1">
                        <h3 className="font-semibold text-sm text-text">
                          {notification.title}
                        </h3>
                        {!notification.read && (
                          <div className="w-2 h-2 bg-info rounded-full flex-shrink-0 mt-1"></div>
                        )}
                      </div>
                      <p className="text-sm text-muted mb-2">{notification.message}</p>
                      <span className="text-xs text-faint">{notification.time}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
