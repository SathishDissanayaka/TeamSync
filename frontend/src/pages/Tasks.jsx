import React, { useState, useEffect } from "react";
import axios from "axios";
//sahan changes (i added some elements from chakra)
import { Box, Heading, Text, VStack, Flex, Input, Select,Button, useToast, useDisclosure,Modal, ModalOverlay, ModalContent, ModalHeader,
          ModalCloseButton, ModalBody, ModalFooter,FormControl, FormLabel, Textarea, Progress, HStack} from "@chakra-ui/react";
import Chat from '../components/Chat';


const MyTasks = () => {
  const [incomingRequests, setIncomingRequests] = useState([]);
  const [todoRequests, setTodoRequests] = useState([]);
  const [users, setUsers] = useState({});
  const [searchTerm, setSearchTerm] = useState("");
  const [sortOption, setSortOption] = useState("priority");
  const [incomingSortOption, setIncomingSortOption] = useState("priority");
  const toast = useToast();

    //sahan changes (decline forum modal)
    const { isOpen, onOpen, onClose } = useDisclosure();
    const [currentId, setCurrentId]   = useState(null);
    const [reason, setReason]         = useState('');
    const [altDate, setAltDate]       = useState('');

  const { isOpen: isProgressOpen, onOpen: onProgressOpen, onClose: onProgressClose } = useDisclosure();
  const [selectedTask, setSelectedTask] = useState(null);
  const [progressUpdate, setProgressUpdate] = useState({
    progress: 0,
    comment: ''
  });

  const { isOpen: isChatOpen, onOpen: onChatOpen, onClose: onChatClose } = useDisclosure();
  const [selectedTaskForChat, setSelectedTaskForChat] = useState(null);
  const [selectedChatId, setSelectedChatId] = useState(null);

  // Retrieve companyID from localStorage
  const companyID = localStorage.getItem("companyID");

  useEffect(() => {
    // Fetch requests assigned to the current user
    const fetchRequests = async () => {
      try {
        // Get requests that are assigned to the current user
        const res = await axios.get(`http://localhost:5000/api/requests/assigned/${companyID}`);
        setIncomingRequests(res.data);

        const ongoingRes = await axios.get(`http://localhost:5000/api/requests/ongoing/${companyID}`);
        setTodoRequests(ongoingRes.data);
      } catch (err) {
        console.error("Error fetching requests", err);
        toast({
          title: "Error",
          description: "Failed to fetch requests.",
          status: "error",
          duration: 5000,
          isClosable: true,
        });
      }
    };

    // Fetch all users to map companyID to full name
    const fetchUsers = async () => {
      try {
        const res = await axios.get("http://localhost:5000/api/admin/users");

        // Create a map where the key is companyID and value is fullName
        const usersMap = res.data.reduce((acc, user) => {
          acc[user.companyID] = user.fullName;
          return acc;
        }, {});
        // Update the state with the processed data
        setUsers(usersMap);
      } catch (err) {
        console.error("Error fetching users", err);
      }
    };
    //calling above functions
    fetchRequests();
    fetchUsers();
  }, [companyID, toast]); //dependency array,(re-run if companyid changes)

    // accept a request funcion
  const handleAcceptRequest = async (id) => {
    try {
      const res = await axios.put(`http://localhost:5000/api/requests/accept/${id}`);
      // Remove the accepted request from the incomingRequests list
      setIncomingRequests(incomingRequests.filter(request => request._id !== id));
      // Add the accepted request to the todoRequests list
      setTodoRequests([...todoRequests, res.data]);
      toast({
        title: "Request accepted.",
        description: "The request has been moved to your To-do list.",
        status: "success",
        duration: 5000,
        isClosable: true,
      });
    } catch (err) {
      console.error("Error accepting request", err);
      toast({
        title: "Error",
        description: "There was an error accepting the request.",
        status: "error",
        duration: 5000,
        isClosable: true,
      });
    }
  };

    //declines Task (sahan changes)
  // opens the modal

  const handleDeclineRequest = (id) => {
    setCurrentId(id);
    onOpen();
  };

// called when the modal's "Submit" button is clicked
  const handleDeclineSubmit = async () => {
    if (!reason || !altDate) {
      return toast({ title: "Please fill in both fields", status: "error" });
    }
    // block past dates
    if (new Date(altDate) < new Date(new Date().toDateString())) {
      return toast({ title: "Date cannot be in the past", status: "error" });
    }

    try {
      await axios.put(
        `http://localhost:5000/api/requests/decline/${currentId}`,
        { declinedReason: reason, alternativeDate: altDate }
      );
      // remove from list
      setIncomingRequests(rs => rs.filter(r => r._id !== currentId));
      toast({
        title: "Request declined",
        description: "Your reason and new date have been saved.",
        status: "success",
        duration: 5000,
        isClosable: true,
      });
      onClose();
      setReason("");
      setAltDate("");
    } catch (err) {
      console.error("Error declining request", err);
      toast({
        title: "Error",
        description: err.response?.data?.error || "Failed to decline.",
        status: "error",
        duration: 5000,
        isClosable: true,
      });
    }
  };


    // Mark complete a task 
  const handleMarkAsDone = async (id) => {
    try {
      await axios.put(`http://localhost:5000/api/requests/complete/${id}`);
            // Remove the completed request from the todoRequests list
      setTodoRequests(todoRequests.filter(request => request._id !== id));
      toast({
        title: "Request completed.",
        description: "The request has been marked as completed.",
        status: "success",
        duration: 5000,
        isClosable: true,
      });
    } catch (err) {
      console.error("Error marking request as done", err);
      toast({
        title: "Error",
        description: "There was an error marking the request as done.",
        status: "error",
        duration: 5000,
        isClosable: true,
      });
    }
  };
  // Helper function to get the full name of the requester using their companyID
  const getRequesterName = (assignedBy) => {
    return users[assignedBy] || "Unknown";
  };

  // Update search term when user types in the search box
  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
  };
  // Update the sorting option for the to-do list
  const handleSortChange = (e) => {
    setSortOption(e.target.value);
  };
  // Update the sorting option for incoming requests
  const handleIncomingSortChange = (e) => {
    setIncomingSortOption(e.target.value);
  };

  // Sort the to-do requests based on (priority or deadline) 
  const sortedTodoRequests = [...todoRequests].sort((a, b) => {
    if (sortOption === "priority") {
      const priorityOrder = { High: 1, Medium: 2, Low: 3 };
      return priorityOrder[a.priority] - priorityOrder[b.priority];
    } else if (sortOption === "deadline") {
      return new Date(a.deadline) - new Date(b.deadline);
    }
    return 0;
  });

    //same logic
  const sortedIncomingRequests = [...incomingRequests].sort((a, b) => {
    if (incomingSortOption === "priority") {
      const priorityOrder = { High: 1, Medium: 2, Low: 3 };
      return priorityOrder[a.priority] - priorityOrder[b.priority];
    } else if (incomingSortOption === "deadline") {
      return new Date(a.deadline) - new Date(b.deadline);
    }
    return 0;
  });

    // Filter the to-do requests based on the search term 
  const filteredTodoRequests = sortedTodoRequests.filter((request) =>
    request.taskName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleProgressUpdate = async () => {
    const currentProgress = selectedTask?.progress || 0;
    const newProgress = progressUpdate.progress;
    if (newProgress === undefined || newProgress === null || isNaN(newProgress)) {
      toast({
        title: "Error",
        description: "Progress is required and must be a number.",
        status: "error",
        duration: 3000,
      });
      return;
    }
    if (newProgress <= currentProgress) {
      toast({
        title: "Error",
        description: `Progress must be greater than current progress (${currentProgress}%)`,
        status: "error",
        duration: 3000,
      });
      return;
    }
    try {
      await axios.put(`http://localhost:5000/api/requests/progress/${selectedTask._id}`, {
        progress: newProgress,
        comment: progressUpdate.comment,
        companyID: companyID
      });

      // Update local state
      setTodoRequests(prev => prev.map(task => 
        task._id === selectedTask._id 
          ? { ...task, progress: newProgress } 
          : task
      ));

      // --- Send progress update message to chat ---
      let chatId = selectedChatId;
      if (!chatId) {
        // Try to fetch chatId by taskId
        try {
          const chatRes = await axios.get(`http://localhost:5000/api/chat/task/${selectedTask._id}`);
          chatId = chatRes.data._id;
        } catch (err) {
          // If chat does not exist, create it
          const chatRes = await axios.post('http://localhost:5000/api/chat', {
            name: selectedTask.taskName,
            type: 'task',
            participants: [selectedTask.assignedBy, selectedTask.assignee],
            taskId: selectedTask._id,
          });
          chatId = chatRes.data._id;
        }
      }
      if (chatId) {
        let msg = `Progress updated to ${newProgress}%.`;
        if (progressUpdate.comment && progressUpdate.comment.trim()) {
          msg += ` Comment: ${progressUpdate.comment.trim()}`;
        }
        await axios.post(`http://localhost:5000/api/chat/${chatId}/messages`, {
          sender: companyID,
          content: msg,
        });
      }
      // --- End send progress update message ---

      toast({
        title: "Progress updated",
        description: "Task progress has been updated successfully",
        status: "success",
        duration: 3000,
      });

      onProgressClose();
      setProgressUpdate({ progress: 0, comment: '' });
    } catch (err) {
      toast({
        title: "Error",
        description: "Failed to update progress",
        status: "error",
        duration: 3000,
      });
    }
  };

  const handleChatClick = async (task) => {
    try {
      // Try to find an existing chat for this task
      const res = await axios.get(`http://localhost:5000/api/chat/task/${task._id}`);
      setSelectedTaskForChat(task);
      setSelectedChatId(res.data._id);
    } catch (err) {
      // If not found, create it
      const res = await axios.post('http://localhost:5000/api/chat', {
        name: task.taskName,
        type: 'task',
        participants: [task.assignedBy, task.assignee], // adjust as needed
        taskId: task._id,
      });
      setSelectedTaskForChat(task);
      setSelectedChatId(res.data._id);
    }
    onChatOpen();
  };

  return (
    <Box p="8">
      <Heading mb="8">Your Journal</Heading>
      <Flex>
        <Box flex="1" mr="8" bg="gray.200" p="6" borderRadius="md" boxShadow="md" minH="80vh">
          <Heading size="md" mb="4">To-do</Heading>
          <Flex mb="4" justify="space-between">
            {/* Search bar */}
            <Input
              placeholder="Search by request name"
              value={searchTerm}
              onChange={handleSearchChange}
              width="60%"
              outline={"1px solid"}
            />
            <Select value={sortOption} onChange={handleSortChange} width="35%" outline={"1px solid"}>
              <option value="priority">Sort by Priority</option>
              <option value="deadline">Sort by Deadline</option>
            </Select>
          </Flex>
          <VStack spacing="4">  {/* Vertically Align the stack */}
            {filteredTodoRequests.map(request => (
              <Box key={request._id} p="4" boxShadow="md" borderRadius="md" bg="white" w="100%" border="1px" borderColor="gray.200">
                <Flex justify="space-between">
                  <Box>
                    <Heading size="sm">{request.taskName}</Heading>
                    <Text>{request.description}</Text>
                    <Text>Priority: {request.priority}</Text>
                    <Text>Deadline: {new Date(request.deadline).toLocaleDateString()}</Text>
                    <Box mt={2}>
                      <Text fontSize="sm">Progress: {request.progress || 0}%</Text>
                      <Progress value={request.progress || 0} colorScheme="blue" size="sm" />
                    </Box>
                  </Box>
                  {/*
                    Use HStack to prevent button overlay and provide spacing between action buttons.
                    This ensures a clean, non-overlapping layout for task actions.
                  */}
                  <HStack spacing={2} align="start">
                    <Button size="sm" colorScheme="blue" onClick={() => {
                      setSelectedTask(request);
                      setProgressUpdate({ progress: request.progress || 0, comment: '' });
                      onProgressOpen();
                    }}>Update Progress</Button>
                    <Button size="sm" colorScheme="purple" onClick={() => handleChatClick(request)}>Chat</Button>
                    <Button size="sm" colorScheme="green" onClick={() => handleMarkAsDone(request._id)}>Done</Button>
                  </HStack>
                </Flex>
              </Box>
            ))}
          </VStack>
        </Box>
        <Box flex="1" bg="gray.200" p="6" borderRadius="md" boxShadow="md" minH="80vh">
          <Heading size="md" mb="4">Incoming Requests</Heading>
          <Flex mb="4" justify="space-between">
            {/* select sort option */}
            <Select value={incomingSortOption} onChange={handleIncomingSortChange} width="35%" outline={"1px solid"}>
              <option value="priority">Sort by Priority</option>
              <option value="deadline">Sort by Deadline</option>
            </Select>
          </Flex>
          <VStack spacing="4">
            {sortedIncomingRequests.map(request => (
              <Box key={request._id} p="4" boxShadow="md" borderRadius="md" bg="white" w="100%" border="1px" borderColor="gray.200">
                <Flex justify="space-between">
                  <Box>
                    <Heading size="sm">{request.taskName}</Heading>
                    <Text>{request.description}</Text>
                    <Text>Priority: {request.priority}</Text>
                    <Text>Deadline: {new Date(request.deadline).toLocaleDateString()}</Text>
                    <Text>Requester: {getRequesterName(request.assignedBy)}</Text>
                  </Box>
                  <Box>
                    <Button size="sm" colorScheme="green" onClick={() => handleAcceptRequest(request._id)}>Accept</Button>
                    <Button size="sm" ml="2" colorScheme="red" onClick={() => handleDeclineRequest(request._id)}>Decline</Button>
                  </Box>
                </Flex>
              </Box>
            ))}
          </VStack>
        </Box>
      </Flex>

      {/* Modal for Declining a Request (Sahan Changes) */}
             
      <Modal isOpen={isOpen} onClose={() => {
      onClose();
      setReason("");
      setAltDate(""); }}>

      <ModalOverlay/>
      <ModalContent>
        <ModalHeader>Decline Request</ModalHeader>
        <ModalCloseButton/>
        <ModalBody>
          <FormControl isRequired>
            <FormLabel>Reason</FormLabel>
            <Textarea
              value={reason}
              onChange={e => setReason(e.target.value)}
            />
          </FormControl>
          <FormControl mt={4} isRequired>
            <FormLabel>Alternative Date</FormLabel>
            <Input
              type="date"
              min={new Date().toISOString().split('T')[0]}
              value={altDate}
              onChange={e => setAltDate(e.target.value)}
            />
          </FormControl>
        </ModalBody>
        <ModalFooter>
          <Button variant="ghost" onClick={() => { onClose(); setReason(""); setAltDate("");}}>
            Cancel
          </Button>
          <Button colorScheme="red" ml={3} onClick={handleDeclineSubmit}>
            Decline
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>

    {/* Progress Update Modal */}
    <Modal isOpen={isProgressOpen} onClose={onProgressClose}>
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>Update Progress</ModalHeader>
        <ModalCloseButton />
        <ModalBody>
          <VStack spacing={4}>
            <FormControl isRequired>
              <FormLabel>Progress (%)</FormLabel>
              <Input
                type="number"
                min="0"
                max="100"
                value={progressUpdate.progress}
                onChange={(e) => setProgressUpdate(prev => ({ ...prev, progress: parseInt(e.target.value) }))}
                required
              />
            </FormControl>
            <FormControl>
              <FormLabel>Comment</FormLabel>
              <Textarea
                value={progressUpdate.comment}
                onChange={(e) => setProgressUpdate(prev => ({ ...prev, comment: e.target.value }))}
                placeholder="Add a comment about the progress..."
              />
            </FormControl>
          </VStack>
        </ModalBody>
        <ModalFooter>
          <Button variant="ghost" mr={3} onClick={onProgressClose}>
            Cancel
          </Button>
          <Button colorScheme="blue" onClick={handleProgressUpdate}>
            Update
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>

    {/* Chat Modal */}
    <Modal isOpen={isChatOpen} onClose={onChatClose} size="xl">
      <ModalOverlay />
      <ModalContent h="80vh" pb={6}>
        <ModalHeader>Chat - {selectedTaskForChat?.taskName}</ModalHeader>
        <ModalCloseButton />
        <ModalBody p={0}>
          {selectedTaskForChat && selectedChatId && (
            <Chat
              chatId={selectedChatId}
              currentUser={companyID}
              users={users}
            />
          )}
        </ModalBody>
      </ModalContent>
    </Modal>

    </Box>
  );
};

export default MyTasks;