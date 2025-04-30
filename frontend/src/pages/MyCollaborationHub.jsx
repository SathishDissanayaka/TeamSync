import React, { useState, useEffect } from "react";
import { Box, Heading, Table, Thead, Tbody, Tr, Th, Td, VStack, Text, Flex, Button, Progress, HStack, useDisclosure, Modal, ModalOverlay, ModalContent, ModalHeader, ModalCloseButton, ModalBody, ModalFooter, FormControl, FormLabel, Textarea } from "@chakra-ui/react";
import axios from "axios";
import Chat from '../components/Chat';
import { useNavigate } from 'react-router-dom';
import TaskTimelineModal from '../components/TaskTimelineModal';

const MyCollaborationHub = () => {
  const [acceptedRequests, setAcceptedRequests] = useState([]);
  const [declinedRequests, setDeclinedRequests] = useState([]);
  const [users, setUsers] = useState([]);
  const { isOpen: isAcceptedChatOpen, onOpen: onAcceptedChatOpen, onClose: onAcceptedChatClose } = useDisclosure();
  const [selectedAcceptedRequestForChat, setSelectedAcceptedRequestForChat] = useState(null);
  const [selectedChatId, setSelectedChatId] = useState(null);
  const navigate = useNavigate();
  const { isOpen: isTimelineOpen, onOpen: onTimelineOpen, onClose: onTimelineClose } = useDisclosure();
  const [selectedTaskForTimeline, setSelectedTaskForTimeline] = useState(null);

  // Get current user
  const companyID = localStorage.getItem("companyID");


  useEffect(() => {
    // Fetch users, accepted, and declined requests
    const fetchData = async () => {
      try {
        const usersRes = await axios.get("http://localhost:5000/api/admin/users");
        setUsers(usersRes.data);
        // Accepted (ongoing) requests created by me
        const acceptedRes = await axios.get(`http://localhost:5000/api/requests/ongoing?assignedBy=${companyID}`);
        setAcceptedRequests(acceptedRes.data);
        // Declined requests created by me
        const declinedRes = await axios.get(`http://localhost:5000/api/requests/declined?assignedBy=${companyID}`);
        setDeclinedRequests(declinedRes.data);
      } catch (err) {
        console.error("Error fetching collaboration hub data", err);
      }
    };
    fetchData();
  }, [companyID]);

  const getAssigneeName = (assignee) => {
    const user = users.find((user) => user.companyID === assignee);
    return user ? user.fullName : "Unknown";
  };

  // Filter accepted requests: only those requested by current user and status ongoing
  const filteredAcceptedRequests = acceptedRequests.filter(
    (req) => req.assignedBy === companyID && req.status === 'ongoing'
  );
  // Filter declined requests: only those requested by current user
  const filteredDeclinedRequests = declinedRequests.filter(
    (req) => req.assignedBy === companyID
  );

  // Convert users array to a map for easy lookup
  const usersMap = Array.isArray(users)
    ? users.reduce((acc, user) => {
        acc[user.companyID] = user.fullName;
        return acc;
      }, {})
    : users;

  // Handler for opening chat modal for accepted requests
  const handleAcceptedChatClick = async (request) => {
    setSelectedAcceptedRequestForChat(request);
    // Try to find an existing chat for this task
    try {
      const res = await axios.get(`http://localhost:5000/api/chat/task/${request._id}`);
      setSelectedChatId(res.data._id);
    } catch {
      // If not found, create it
      const res = await axios.post('http://localhost:5000/api/chat', {
        name: request.taskName,
        type: 'task',
        participants: [request.assignedBy, request.assignee],
        taskId: request._id,
      });
      setSelectedChatId(res.data._id);
    }
    onAcceptedChatOpen();
  };

  // Handler for deleting a declined request
  const handleDeleteDeclinedRequest = async (requestId) => {
    try {
      await axios.delete(`http://localhost:5000/api/requests/declined/${requestId}`);
      setDeclinedRequests(prev => prev.filter(r => r._id !== requestId));
    } catch (err) {
      alert('Failed to delete request');
    }
  };

  return (
    <Box p="8">
      <Heading mb="8">My Collaboration Hub</Heading>
      {/* Accepted Requests Section */}
      <Box bg="gray.200" p="6" borderRadius="md" boxShadow="md" mb={8}>
        <Heading size="md" mb="4">Accepted Requests</Heading>
        <Table variant="simple">
          <Thead>
            <Tr>
              <Th>Task Name</Th>
              <Th>Assignee</Th>
              <Th>Priority</Th>
              <Th>Deadline</Th>
              <Th>Progress</Th>
              <Th>Actions</Th>
            </Tr>
          </Thead>
          <Tbody>
            {filteredAcceptedRequests.map((request) => (
              <Tr 
                key={request._id}
                cursor="pointer"
                onClick={() => {
                  setSelectedTaskForTimeline(request);
                  onTimelineOpen();
                }}
                _hover={{ bg: 'gray.50' }}
              >
                <Td>{request.taskName}</Td>
                <Td>{getAssigneeName(request.assignee)}</Td>
                <Td>{request.priority}</Td>
                <Td>{new Date(request.deadline).toLocaleDateString()}</Td>
                <Td>
                  <Progress value={request.progress || 0} colorScheme="blue" size="sm" />
                  <Text fontSize="xs" color="gray.500">{request.progress || 0}%</Text>
                </Td>
                <Td>
                  <Button 
                    size="sm" 
                    colorScheme="blue" 
                    onClick={(e) => {
                      e.stopPropagation();
                      handleAcceptedChatClick(request);
                    }}
                  >
                    Chat
                  </Button>
                </Td>
              </Tr>
            ))}
          </Tbody>
        </Table>
      </Box>
      {/* Declined Requests Section */}
      <Box bg="gray.200" p="6" borderRadius="md" boxShadow="md">
        <Heading size="md" mb="4">Declined Requests</Heading>
        <Table variant="simple">
          <Thead>
            <Tr>
              <Th>Task Name</Th>
              <Th>Assignee</Th>
              <Th>Declined On</Th>
              <Th>Reason</Th>
              <Th>Alt Date</Th>
              <Th>Action</Th>
            </Tr>
          </Thead>
          <Tbody>
            {filteredDeclinedRequests.map((request) => {
              // Fallback for fields: try both Declined and Request field names
              const taskName = request.taskName || request.title || "";
              const declinedOn = request.declinedOn || (request.request && request.request.declinedOn) || "";
              const altDate = request.alternativeDate || (request.request && request.request.alternativeDate) || "";
              const reason = request.declinedReason || (request.request && request.request.declinedReason) || "";
              return (
                <Tr key={request._id}>
                  <Td>{taskName}</Td>
                  <Td>{getAssigneeName(request.assignee)}</Td>
                  <Td>{declinedOn ? new Date(declinedOn).toLocaleDateString() : ''}</Td>
                  <Td>{reason}</Td>
                  <Td>{altDate ? new Date(altDate).toLocaleDateString() : ''}</Td>
                  <Td>
                    <Button size="sm" colorScheme="blue" mr={2} onClick={() => {
                      localStorage.setItem('reallocateRequest', JSON.stringify(request));
                      navigate('/dashboard/requests');
                    }}>Reallocate</Button>
                    <Button size="sm" colorScheme="red" onClick={() => handleDeleteDeclinedRequest(request._id)}>Delete</Button>
                  </Td>
                </Tr>
              );
            })}
          </Tbody>
        </Table>
      </Box>
      {/* Add TaskTimelineModal */}
      <TaskTimelineModal 
        isOpen={isTimelineOpen}
        onClose={onTimelineClose}
        task={selectedTaskForTimeline}
        users={usersMap}
      />
      {/* Chat Modal for accepted requests */}
      <Modal isOpen={isAcceptedChatOpen} onClose={onAcceptedChatClose} size="xl">
        <ModalOverlay />
        <ModalContent h="80vh">
          <ModalHeader>Chat - {selectedAcceptedRequestForChat?.taskName}</ModalHeader>
          <ModalCloseButton />
          <ModalBody p={0}>
            {selectedChatId && (
              <Chat
                chatId={selectedChatId}
                currentUser={companyID}
                users={usersMap}
              />
            )}
          </ModalBody>
        </ModalContent>
      </Modal>
    </Box>
  );
};

export default MyCollaborationHub; 