import React, {
  createContext,
  useContext,
  useState,
  ReactNode,
  useEffect,
} from "react";
import { useAuth } from "./AuthContext";

export interface Notification {
  _id: string;
  type: "user_registration" | "new_order" | "order_status" | "system_alert";
  title: string;
  message: string;
  timestamp: string;
  isRead: boolean;
  priority: "high" | "medium" | "low";
  createdAt: string;
  updatedAt: string;
}

interface NotificationContextType {
  notifications: Notification[];
  unreadCount: number;
  loading: boolean;
  markAsRead: (id: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  refreshNotifications: () => Promise<void>;
}

const NotificationContext = createContext<NotificationContextType | undefined>(
  undefined
);

const baseUrl = import.meta.env.VITE_API_URL || "http://localhost:8000";

export const NotificationProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();

  const fetchNotifications = async () => {
    if (!user) return;

    setLoading(true);
    try {
      const token = localStorage.getItem("admin_token");
      const response = await fetch(`${baseUrl}/api/notifications`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setNotifications(data.notifications || []);
      }
    } catch (error) {
      // No console.error here
    } finally {
      setLoading(false);
    }
  };

  const fetchUnreadCount = async () => {
    if (!user) return;

    try {
      const token = localStorage.getItem("admin_token");
      const response = await fetch(
        `${baseUrl}/api/notifications/unread-count`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        setNotifications((prev) =>
          prev.map((notification) => ({
            ...notification,
            isRead: data.unreadCount === 0 ? true : notification.isRead,
          }))
        );
      }
    } catch (error) {
      // No console.error here
    }
  };

  const markAsRead = async (id: string) => {
    if (!user) return;

    try {
      const token = localStorage.getItem("admin_token");
      const response = await fetch(`${baseUrl}/api/notifications/${id}/read`, {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        setNotifications((prev) =>
          prev.map((notification) =>
            notification._id === id
              ? { ...notification, isRead: true }
              : notification
          )
        );
      }
    } catch (error) {
      // No console.error here
    }
  };

  const markAllAsRead = async () => {
    if (!user) return;

    try {
      const token = localStorage.getItem("admin_token");
      const response = await fetch(
        `${baseUrl}/api/notifications/mark-all-read`,
        {
          method: "PATCH",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.ok) {
        setNotifications((prev) =>
          prev.map((notification) => ({ ...notification, isRead: true }))
        );
      }
    } catch (error) {
      // No console.error here
    }
  };

  const refreshNotifications = async () => {
    await fetchNotifications();
  };

  // Fetch notifications when user is authenticated
  useEffect(() => {
    if (user) {
      fetchNotifications();
    }
  }, [user]);

  // Set up polling for new notifications every 30 seconds
  useEffect(() => {
    if (!user) return;

    const interval = setInterval(() => {
      fetchUnreadCount();
    }, 30000); // 30 seconds

    return () => clearInterval(interval);
  }, [user]);

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        unreadCount,
        loading,
        markAsRead,
        markAllAsRead,
        refreshNotifications,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error(
      "useNotifications must be used within a NotificationProvider"
    );
  }
  return context;
};
