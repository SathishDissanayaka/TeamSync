import React, { useState, useEffect, useRef } from 'react';
import {
  Box,
  VStack,
  HStack,
  Input,
  Button,
  Text,
  Avatar,
  useToast,
  Flex,
  IconButton,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
} from '@chakra-ui/react';
import { FiSend, FiPaperclip, FiMoreVertical } from 'react-icons/fi';
import axios from 'axios';
import io from 'socket.io-client';

const Chat = ({ chatId, currentUser, users }) => {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [chat, setChat] = useState(null);
  const messagesEndRef = useRef(null);
  const toast = useToast();
  const socketRef = useRef();

  useEffect(() => {
    if (!chatId || !currentUser) return;
    // Initialize socket connection
    socketRef.current = io('http://localhost:5000', {
      query: { chatId }
    });

    socketRef.current.on('new_message', (message) => {
      setMessages(prev => Array.isArray(prev) ? [...prev, message] : [message]);
    });

    socketRef.current.on('connect_error', (err) => {
      toast({
        title: 'Connection Error',
        description: 'Failed to connect to chat server.',
        status: 'error',
        duration: 3000,
      });
    });

    return () => {
      socketRef.current.disconnect();
    };
  }, [chatId, currentUser]);

  useEffect(() => {
    if (!chatId || !currentUser) return;
    const fetchChat = async () => {
      try {
        const res = await axios.get(`http://localhost:5000/api/chat/id/${chatId}`);
        setChat(res.data);
        setMessages(Array.isArray(res.data.messages) ? res.data.messages : []);
      } catch (err) {
        toast({
          title: 'Error',
          description: 'Failed to load chat',
          status: 'error',
          duration: 3000,
        });
        console.error('Error fetching chat:', err);
      }
    };

    fetchChat();
  }, [chatId, currentUser]);

  const scrollToBottom = () => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth', block: 'end' });
    }
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async () => {
    if (!newMessage.trim()) return;

    try {
      const res = await axios.post(`http://localhost:5000/api/chat/${chatId}/messages`, {
        sender: currentUser,
        content: newMessage
      });

      setMessages(prev => Array.isArray(prev) ? [...prev, res.data] : [res.data]);
      setNewMessage('');
      socketRef.current.emit('send_message', res.data);
    } catch (err) {
      toast({
        title: 'Error',
        description: 'Failed to send message',
        status: 'error',
        duration: 3000,
      });
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  // Defensive: fallback for messages
  const safeMessages = Array.isArray(messages) ? messages : [];
  console.log('Rendering messages:', safeMessages);

  if (chat === null && chatId && currentUser) {
    // Still loading
    return <Box p={4}>Loading chat...</Box>;
  }
  if (chat === undefined) {
    // Error loading chat
    return <Box p={4} color="red.500">Error loading chat. Please try again later.</Box>;
  }

  return (
    <Box h="100%" display="flex" flexDirection="column">
      {/* Chat header */}
      <Box p={4} borderBottom="1px" borderColor="gray.200">
        <HStack justify="space-between">
          <Text fontWeight="bold">{chat?.name || 'Chat'}</Text>
          <Menu>
            <MenuButton
              as={IconButton}
              icon={<FiMoreVertical />}
              variant="ghost"
              size="sm"
            />
            <MenuList>
              <MenuItem onClick={() => {
                const names = chat?.participants?.map(cid => users?.[cid] || cid).join(', ') || "No participants";
                toast({
                  title: "Participants",
                  description: names,
                  status: "info",
                  duration: 4000,
                  isClosable: true,
                });
              }}>View Participants</MenuItem>
              <MenuItem onClick={async () => {
                try {
                  await axios.put(`http://localhost:5000/api/chat/${chatId}/clear`);
                  setMessages([]);
                  toast({
                    title: "Chat cleared",
                    status: "success",
                    duration: 2000,
                  });
                } catch (err) {
                  toast({
                    title: "Error",
                    description: "Failed to clear chat",
                    status: "error",
                    duration: 3000,
                  });
                }
              }}>Clear Chat</MenuItem>
            </MenuList>
          </Menu>
        </HStack>
      </Box>

      {/* Messages */}
      <VStack
        flex={1}
        overflowY="auto"
        p={4}
        spacing={4}
        align="stretch"
        style={{ maxHeight: '60vh' }}
        pb={8}
      >
        {safeMessages.map((message, index) => {
          if (!message || typeof message !== 'object') return null;
          const sender = message.sender || '';
          const content = message.content || '';
          const createdAt = message.createdAt ? new Date(message.createdAt).toLocaleTimeString() : '';
          return (
            <Box
              key={message._id ? message._id : index}
              alignSelf={sender === currentUser ? 'flex-end' : 'flex-start'}
              maxW="70%"
            >
              <HStack spacing={2}>
                {sender !== currentUser && (
                  <Avatar size="sm" name={sender} />
                )}
                <Box
                  bg={sender === currentUser ? 'blue.500' : 'gray.100'}
                  color={sender === currentUser ? 'white' : 'black'}
                  p={3}
                  borderRadius="lg"
                >
                  <Text>{content}</Text>
                  <Text fontSize="xs" color={sender === currentUser ? 'whiteAlpha.700' : 'gray.500'}>
                    {createdAt}
                  </Text>
                </Box>
              </HStack>
            </Box>
          );
        })}
        <Box h="40px" />
        <div ref={messagesEndRef} />
      </VStack>

      {/* Message input */}
      <Box p={4} pb={6} borderTop="1px" borderColor="gray.200" borderBottomRadius="md">
        <HStack>
          <Input
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Type a message..."
          />
          <IconButton
            icon={<FiSend />}
            colorScheme="blue"
            onClick={handleSendMessage}
            aria-label="Send message"
          />
        </HStack>
      </Box>
      <Box h="16px" bg="transparent" />
    </Box>
  );
};

export default Chat; 