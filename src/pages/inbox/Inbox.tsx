import { useState, useEffect } from "react";
import { Bell, Check, CheckCheck, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { notificationsApi, type Notification } from "@/lib/api/notifications";
import { Link } from "react-router-dom";

export default function Inbox() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("all");
  const { toast } = useToast();

  useEffect(() => {
    loadNotifications();
  }, [activeTab]);

  const loadNotifications = async () => {
    try {
      setLoading(true);
      const data = await notificationsApi.listNotifications({
        onlyUnread: activeTab === "unread"
      });
      setNotifications(data);
    } catch (error) {
      console.error('Error loading notifications:', error);
      toast({
        title: "Error",
        description: "Failed to load notifications",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (notificationId: string) => {
    try {
      await notificationsApi.markRead(notificationId);
      setNotifications(prev =>
        prev.map(n =>
          n.id === notificationId
            ? { ...n, read_at: new Date().toISOString() }
            : n
        )
      );
      toast({
        title: "Marked as read",
        description: "Notification updated"
      });
    } catch (error) {
      console.error('Error marking as read:', error);
      toast({
        title: "Error",
        description: "Failed to mark as read",
        variant: "destructive"
      });
    }
  };

  const markAllAsRead = async () => {
    try {
      const unreadNotifications = notifications.filter(n => !n.read_at);
      for (const notification of unreadNotifications) {
        await notificationsApi.markRead(notification.id);
      }
      await loadNotifications();
      toast({
        title: "Success",
        description: `Marked ${unreadNotifications.length} notifications as read`
      });
    } catch (error) {
      console.error('Error marking all as read:', error);
      toast({
        title: "Error",
        description: "Failed to mark all as read",
        variant: "destructive"
      });
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'weekly_digest':
        return '📰';
      case 'stance_shift':
        return '📊';
      case 'system':
        return '🔔';
      default:
        return '📱';
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'weekly_digest':
        return 'bg-sky text-sky-foreground';
      case 'stance_shift':
        return 'bg-sky-dark text-sky-foreground';
      case 'system':
        return 'bg-muted text-muted-foreground';
      default:
        return 'bg-secondary text-secondary-foreground';
    }
  };

  const unreadCount = notifications.filter(n => !n.read_at).length;

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <Bell className="h-8 w-8 text-sky" />
            <div>
              <h1 className="text-3xl font-bold text-foreground">Inbox</h1>
              <p className="text-muted-foreground">Stay updated on your interests</p>
            </div>
          </div>
          {unreadCount > 0 && (
            <Button
              onClick={markAllAsRead}
              variant="outline"
              className="border-sky text-sky hover:bg-sky-light"
            >
              <CheckCheck className="h-4 w-4 mr-2" />
              Mark all read
            </Button>
          )}
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="all" className="data-[state=active]:bg-sky data-[state=active]:text-sky-foreground">
              All ({notifications.length})
            </TabsTrigger>
            <TabsTrigger value="unread" className="data-[state=active]:bg-sky data-[state=active]:text-sky-foreground">
              Unread ({unreadCount})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="all" className="mt-6">
            <NotificationsList
              notifications={notifications}
              loading={loading}
              onMarkRead={markAsRead}
              getNotificationIcon={getNotificationIcon}
              getTypeColor={getTypeColor}
            />
          </TabsContent>

          <TabsContent value="unread" className="mt-6">
            <NotificationsList
              notifications={notifications.filter(n => !n.read_at)}
              loading={loading}
              onMarkRead={markAsRead}
              getNotificationIcon={getNotificationIcon}
              getTypeColor={getTypeColor}
            />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

interface NotificationsListProps {
  notifications: Notification[];
  loading: boolean;
  onMarkRead: (id: string) => void;
  getNotificationIcon: (type: string) => string;
  getTypeColor: (type: string) => string;
}

function NotificationsList({
  notifications,
  loading,
  onMarkRead,
  getNotificationIcon,
  getTypeColor
}: NotificationsListProps) {
  if (loading) {
    return (
      <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardContent className="p-6">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 bg-muted rounded-full" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-muted rounded w-3/4" />
                  <div className="h-3 bg-muted rounded w-1/2" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (notifications.length === 0) {
    return (
      <Card>
        <CardContent className="p-12 text-center">
          <Bell className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-foreground mb-2">No notifications</h3>
          <p className="text-muted-foreground">You're all caught up!</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4" role="log" aria-live="polite">
      {notifications.map((notification) => (
        <Card
          key={notification.id}
          className={`transition-all hover:shadow-md ${
            !notification.read_at
              ? 'border-l-4 border-l-sky bg-sky-light/50'
              : 'hover:bg-muted/50'
          }`}
        >
          <CardHeader className="pb-3">
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-start gap-3">
                <div className="text-2xl" role="img" aria-label={`${notification.type} notification`}>
                  {getNotificationIcon(notification.type)}
                </div>
                <div className="flex-1">
                  <div className="flex items-start gap-2 mb-2">
                    <CardTitle className="text-base leading-relaxed">
                      {notification.title}
                    </CardTitle>
                    <Badge className={`text-xs ${getTypeColor(notification.type)}`}>
                      {notification.type.replace('_', ' ')}
                    </Badge>
                  </div>
                  <CardDescription className="text-sm leading-relaxed">
                    {notification.body}
                  </CardDescription>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {!notification.read_at && (
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => onMarkRead(notification.id)}
                    className="hover:bg-sky hover:text-sky-foreground"
                    aria-label="Mark as read"
                  >
                    <Check className="h-4 w-4" />
                  </Button>
                )}
                {notification.data.url && (
                  <Button
                    size="sm"
                    variant="ghost"
                    asChild
                    className="hover:bg-sky hover:text-sky-foreground"
                  >
                    <Link to={notification.data.url} aria-label="Open related content">
                      <ExternalLink className="h-4 w-4" />
                    </Link>
                  </Button>
                )}
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <time dateTime={notification.created_at}>
                {new Date(notification.created_at).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'short',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </time>
              {notification.read_at && (
                <span className="text-green-600">✓ Read</span>
              )}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}