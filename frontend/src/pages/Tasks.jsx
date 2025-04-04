import React, { useState, useEffect } from "react";
import { Box, Heading, Text, VStack, Button, Flex, Input, Select } from "@chakra-ui/react";
import axios from "axios";
import { useToast } from "@chakra-ui/react";

const MyTasks = () => {
  const [incomingRequests, setIncomingRequests] = useState([]);
  const [todoRequests, setTodoRequests] = useState([]);
  const [users, setUsers] = useState({});
  const [searchTerm, setSearchTerm] = useState("");
  const [sortOption, setSortOption] = useState("priority");
  const [incomingSortOption, setIncomingSortOption] = useState("priority");
  const toast = useToast();

  // Retrieve companyID from localStorage
  const companyID = localStorage.getItem("companyID");

  useEffect(() => {
    // Fetch requests assigned to the current user
    const fetchRequests = async () => {
      try {
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
        const usersMap = res.data.reduce((acc, user) => {
          acc[user.companyID] = user.fullName;
          return acc;
        }, {});
        setUsers(usersMap);
      } catch (err) {
        console.error("Error fetching users", err);
      }
    };

    fetchRequests();
    fetchUsers();
  }, [companyID, toast]);

  const handleAcceptRequest = async (id) => {
    try {
      const res = await axios.put(`http://localhost:5000/api/requests/accept/${id}`);
      setIncomingRequests(incomingRequests.filter(request => request._id !== id));
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

  const handleDeclineRequest = async (id) => {
    try {
      await axios.put(`http://localhost:5000/api/requests/decline/${id}`);
      setIncomingRequests(incomingRequests.filter(request => request._id !== id));
      toast({
        title: "Request declined.",
        description: "The request has been declined.",
        status: "success",
        duration: 5000,
        isClosable: true,
      });
    } catch (err) {
      console.error("Error declining request", err);
      toast({
        title: "Error",
        description: "There was an error declining the request.",
        status: "error",
        duration: 5000,
        isClosable: true,
      });
    }
  };

  const handleMarkAsDone = async (id) => {
    try {
      await axios.put(`http://localhost:5000/api/requests/complete/${id}`);
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

  const getRequesterName = (assignedBy) => {
    return users[assignedBy] || "Unknown";
  };

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
  };

  const handleSortChange = (e) => {
    setSortOption(e.target.value);
  };

  const handleIncomingSortChange = (e) => {
    setIncomingSortOption(e.target.value);
  };

  const sortedTodoRequests = [...todoRequests].sort((a, b) => {
    if (sortOption === "priority") {
      const priorityOrder = { High: 1, Medium: 2, Low: 3 };
      return priorityOrder[a.priority] - priorityOrder[b.priority];
    } else if (sortOption === "deadline") {
      return new Date(a.deadline) - new Date(b.deadline);
    }
    return 0;
  });

  const sortedIncomingRequests = [...incomingRequests].sort((a, b) => {
    if (incomingSortOption === "priority") {
      const priorityOrder = { High: 1, Medium: 2, Low: 3 };
      return priorityOrder[a.priority] - priorityOrder[b.priority];
    } else if (incomingSortOption === "deadline") {
      return new Date(a.deadline) - new Date(b.deadline);
    }
    return 0;
  });

  const filteredTodoRequests = sortedTodoRequests.filter((request) =>
    request.taskName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <Box p="8">
      <Heading mb="8">Your Journal</Heading>
      <Flex>
        <Box flex="1" mr="8" bg="gray.200" p="6" borderRadius="md" boxShadow="md" minH="80vh">
          <Heading size="md" mb="4">To-do</Heading>
          <Flex mb="4" justify="space-between">
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
          <VStack spacing="4">
            {filteredTodoRequests.map(request => (
              <Box key={request._id} p="4" boxShadow="md" borderRadius="md" bg="white" w="100%" border="1px" borderColor="gray.200">
                <Flex justify="space-between">
                  <Box>
                    <Heading size="sm">{request.taskName}</Heading>
                    <Text>{request.description}</Text>
                    <Text>Priority: {request.priority}</Text>
                    <Text>Deadline: {new Date(request.deadline).toLocaleDateString()}</Text>
                  </Box>
                  <Box>
                    <Button size="sm" colorScheme="blue" onClick={() => handleMarkAsDone(request._id)}>Done</Button>
                  </Box>
                </Flex>
              </Box>
            ))}
          </VStack>
        </Box>
        <Box flex="1" bg="gray.200" p="6" borderRadius="md" boxShadow="md" minH="80vh">
          <Heading size="md" mb="4">Incoming Requests</Heading>
          <Flex mb="4" justify="space-between">
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
    </Box>
  );
};

export default MyTasks;