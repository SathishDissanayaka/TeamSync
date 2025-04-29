// src/components/NotificationBell.jsx
import React, { useEffect, useState } from 'react';
import {
  IconButton,
  Popover,
  PopoverTrigger,
  PopoverContent,
  PopoverArrow,
  PopoverCloseButton,
  PopoverBody,
  Text,
  Box,
  Spinner,
  VStack,
  HStack,
  Badge,
  Button,
  useToast,
  Icon,
} from '@chakra-ui/react';
import { FiBell, FiCheck, FiX, FiCheckCircle, FiTrash2 } from 'react-icons/fi';
import axios from 'axios';
import io from 'socket.io-client';

const NOTIFICATION_TYPES = {
  REQUEST: 'request',
  ACCEPT: 'accept',
  DECLINE: 'decline',
  MARK_AS_DONE: 'mark_as_done',
};

const NOTIFICATION_ICONS = {
  [NOTIFICATION_TYPES.REQUEST]: FiBell,
  [NOTIFICATION_TYPES.ACCEPT]: FiCheck,
  [NOTIFICATION_TYPES.DECLINE]: FiX,
  [NOTIFICATION_TYPES.MARK_AS_DONE]: FiCheckCircle,
};

const NOTIFICATION_COLORS = {
  [NOTIFICATION_TYPES.REQUEST]: 'blue',
  [NOTIFICATION_TYPES.ACCEPT]: 'green',
  [NOTIFICATION_TYPES.DECLINE]: 'red',
  [NOTIFICATION_TYPES.MARK_AS_DONE]: 'purple',
};

export default function NotificationBell({
  companyID,
  iconSize = 20,
  buttonSize = 'sm',
  adminOnlyFeedback = false,
}) {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [userMap, setUserMap] = useState({});
  const toast = useToast();

  // Fetch all users once and build a map
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const res = await axios.get('http://localhost:5000/api/admin/users');
        const map = res.data.reduce((acc, user) => {
          acc[user.companyID] = user.fullName;
          return acc;
        }, {});
        setUserMap(map);
      } catch (err) {
        console.error('Error fetching users', err);
      }
    };
    fetchUsers();
  }, []);

  // Initialize WebSocket connection
  useEffect(() => {
    const socket = io('http://localhost:5000', {
      query: { companyID },
    });

    socket.on('notification', (newNotification) => {
      // Only show toast if the notification is for this user
      if (newNotification.companyID === companyID) {
        const name = userMap[newNotification.userID] || newNotification.userID;
        const notificationWithName = {
          ...newNotification,
          displayName: name
        };
        setNotifications((prev) => [notificationWithName, ...prev]);
        setUnreadCount((prev) => prev + 1);
        toast({
          title: newNotification.title,
          description: newNotification.message.replace(/^\\S+/, name),
          status: 'info',
          duration: 5000,
          isClosable: true,
        });
      }
    });

    return () => {
      socket.disconnect();
    };
  }, [companyID, toast, userMap]);

  // Load notification history
  useEffect(() => {
    const fetchNotifications = async () => {
      setLoading(true);
      try {
        const res = await axios.get(
          `http://localhost:5000/api/notifications/${companyID}`
        );
        // Use userMap to assign display names
        const notificationsWithNames = res.data.map((notification) => {
          const name = userMap[notification.userID] || notification.userID;
          return {
            ...notification,
            displayName: name
          };
        });
        setNotifications(notificationsWithNames);
        setUnreadCount(notificationsWithNames.filter(n => !n.read).length);
      } catch (err) {
        console.error('Error loading notifications', err);
      } finally {
        setLoading(false);
      }
    };
    if (Object.keys(userMap).length > 0) {
      fetchNotifications();
    }
  }, [companyID, userMap]);

  // Debug logs to check userMap and notifications
  console.log("userMap", userMap);
  console.log("notifications", notifications);

  const markAsRead = async (notificationId) => {
    try {
      await axios.put(`http://localhost:5000/api/notifications/${notificationId}/read`);
      setNotifications((prev) =>
        prev.map((n) =>
          n._id === notificationId ? { ...n, read: true } : n
        )
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch (err) {
      console.error('Error marking notification as read', err);
    }
  };

  const markAllAsRead = async () => {
    try {
      await axios.put(`http://localhost:5000/api/notifications/${companyID}/read-all`);
      setNotifications((prev) =>
        prev.map((n) => ({ ...n, read: true }))
      );
      setUnreadCount(0);
    } catch (err) {
      console.error('Error marking all notifications as read', err);
    }
  };

  const deleteNotification = async (notificationId) => {
    try {
      await axios.delete(`http://localhost:5000/api/notifications/${notificationId}`);
      setNotifications((prev) => prev.filter((n) => n._id !== notificationId));
      // Update unread count if the deleted notification was unread
      const deletedNotification = notifications.find(n => n._id === notificationId);
      if (deletedNotification && !deletedNotification.read) {
        setUnreadCount((prev) => Math.max(0, prev - 1));
      }
    } catch (err) {
      console.error('Error deleting notification', err);
    }
  };

  const getNotificationIcon = (type) => {
    const Icon = NOTIFICATION_ICONS[type] || FiBell;
    return <Icon size={16} />;
  };

  // Filter notifications if adminOnlyFeedback is true
  const displayedNotifications = adminOnlyFeedback
    ? notifications.filter(n => n.type === 'feedback')
    : notifications;

  return (
    <Popover placement="bottom-end">
      <PopoverTrigger>
        <Box position="relative">
          <IconButton
            aria-label="Notifications"
            icon={<FiBell size={iconSize} />}
            variant="ghost"
            size={buttonSize}
          />
          {unreadCount > 0 && (
            <Badge
              position="absolute"
              top="-1"
              right="-1"
              colorScheme="red"
              borderRadius="full"
              minW="20px"
              textAlign="center"
            >
              {unreadCount}
            </Badge>
          )}
        </Box>
      </PopoverTrigger>
      <PopoverContent w="sm" maxH="400px" overflowY="auto">
        <PopoverArrow />
        <PopoverCloseButton />
        <PopoverBody>
          {loading ? (
            <Box textAlign="center"><Spinner /></Box>
          ) : displayedNotifications.length === 0 ? (
            <Text>No notifications</Text>
          ) : (
            <VStack align="stretch" spacing={2}>
              <HStack justify="space-between" mb={2}>
                <Text fontWeight="bold">Notifications</Text>
                {unreadCount > 0 && (
                  <Button size="xs" onClick={markAllAsRead}>
                    Mark all as read
                  </Button>
                )}
              </HStack>
              {displayedNotifications.map((notification) => (
                <Box
                  key={notification._id}
                  p={2}
                  borderBottom="1px solid"
                  borderColor="gray.200"
                  bg={notification.read ? 'transparent' : 'gray.50'}
                  _hover={{ bg: 'gray.100' }}
                >
                  <VStack align="stretch" spacing={2}>
                    <HStack spacing={2}>
                      <Box color={`${NOTIFICATION_COLORS[notification.type]}.500`}>
                        {getNotificationIcon(notification.type)}
                      </Box>
                      <VStack align="start" spacing={0}>
                        <Text fontWeight="medium">{notification.title}</Text>
                        <Text fontSize="sm" color="gray.600">
                          {notification.message}
                        </Text>
                        <Text fontSize="xs" color="gray.500">
                          {new Date(notification.createdAt).toLocaleString()}
                        </Text>
                      </VStack>
                    </HStack>
                    <HStack justify="flex-end" spacing={2}>
                      {!notification.read && (
                        <Button
                          size="xs"
                          colorScheme="blue"
                          variant="outline"
                          onClick={() => markAsRead(notification._id)}
                        >
                          Mark as read
                        </Button>
                      )}
                      <Button
                        size="xs"
                        colorScheme="red"
                        variant="outline"
                        leftIcon={<Icon as={FiTrash2} />}
                        onClick={() => deleteNotification(notification._id)}
                      >
                        Delete
                      </Button>
                    </HStack>
                  </VStack>
                </Box>
              ))}
            </VStack>
          )}
        </PopoverBody>
      </PopoverContent>
    </Popover>
  );
}
