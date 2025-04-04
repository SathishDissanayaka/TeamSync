import React, { useState, useEffect } from "react";
import {
  Box,
  Button,
  Heading,
  VStack,
  Text,
  Flex,
  useDisclosure,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalCloseButton,
  ModalBody,
  ModalFooter,
  FormControl,
  FormLabel,
  Input,
  Select,
  useToast,
  FormErrorMessage,
} from "@chakra-ui/react";
import axios from "axios";

const Requests = () => {
  const [pendingRequests, setPendingRequests] = useState([]);
  const [completedRequests, setCompletedRequests] = useState([]);
  const [users, setUsers] = useState([]);
  const { isOpen, onOpen, onClose } = useDisclosure();
  const toast = useToast();
  const [newRequest, setNewRequest] = useState({
    taskName: "",
    description: "",
    priority: "",
    deadline: "",
    assignee: "",
    assignedBy: "",
  });
  const [errors, setErrors] = useState({});
  const [isEditing, setIsEditing] = useState(false);
  const [currentRequestId, setCurrentRequestId] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");

  // Retrieve companyID from localStorage
  const companyID = localStorage.getItem("companyID");

  useEffect(() => {
    // Fetch users first, then fetch requests
    const fetchData = async () => {
      try {
        const usersRes = await axios.get("http://localhost:5000/api/admin/users");
        setUsers(usersRes.data);

        const pendingRes = await axios.get(`http://localhost:5000/api/requests/pending/${companyID}`);
        setPendingRequests(pendingRes.data);

        const completedRes = await axios.get(`http://localhost:5000/api/requests/completed/${companyID}`);
        setCompletedRequests(completedRes.data);
      } catch (err) {
        console.error("Error fetching data", err);
      }
    };

    fetchData();
  }, [companyID]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewRequest({ ...newRequest, [name]: value });
  };

  const validateForm = () => {
    const newErrors = {};
    if (!newRequest.taskName) newErrors.taskName = "Task Name is required";
    if (!newRequest.description) newErrors.description = "Description is required";
    if (!newRequest.priority) newErrors.priority = "Priority is required";
    if (!newRequest.deadline) newErrors.deadline = "Deadline is required";
    if (!newRequest.assignee) newErrors.assignee = "Assignee is required";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleCreateRequest = async () => {
    if (!validateForm()) return;

    try {
      const requestData = { ...newRequest, assignedBy: companyID };
      const res = await axios.post("http://localhost:5000/api/requests", requestData, {
        headers: {
          "Content-Type": "application/json",
        },
      });
      setPendingRequests([...pendingRequests, res.data]);
      toast({
        title: "Request created.",
        description: "Your request has been created successfully.",
        status: "success",
        duration: 5000,
        isClosable: true,
      });
      onClose();
    } catch (err) {
      console.error("Error creating request", err.response ? err.response.data : err);
      toast({
        title: "Error",
        description: err.response?.data?.error || "There was an error creating your request.",
        status: "error",
        duration: 5000,
        isClosable: true,
      });
    }
  };

  const handleEditRequest = (id) => {
    const requestToEdit = pendingRequests.find((request) => request._id === id);
    setNewRequest({
      taskName: requestToEdit.taskName,
      description: requestToEdit.description,
      priority: requestToEdit.priority,
      deadline: requestToEdit.deadline,
      assignee: requestToEdit.assignee,
      assignedBy: requestToEdit.assignedBy,
    });
    setCurrentRequestId(id);
    setIsEditing(true);
    onOpen();
  };

  const handleUpdateRequest = async () => {
    if (!validateForm()) return;

    try {
      const requestData = { ...newRequest, assignedBy: companyID };
      const res = await axios.put(`http://localhost:5000/api/requests/${currentRequestId}`, requestData, {
        headers: {
          "Content-Type": "application/json",
        },
      });
      setPendingRequests(pendingRequests.map((request) => (request._id === currentRequestId ? res.data : request)));
      toast({
        title: "Request updated.",
        description: "Your request has been updated successfully.",
        status: "success",
        duration: 5000,
        isClosable: true,
      });
      onClose();
    } catch (err) {
      console.error("Error updating request", err.response ? err.response.data : err);
      toast({
        title: "Error",
        description: err.response?.data?.error || "There was an error updating your request.",
        status: "error",
        duration: 5000,
        isClosable: true,
      });
    }
  };

  const handleDeleteRequest = async (id) => {
    try {
      await axios.delete(`http://localhost:5000/api/requests/${id}`);
      setPendingRequests(pendingRequests.filter((request) => request._id !== id));
      toast({
        title: "Request deleted.",
        description: "The request has been deleted successfully.",
        status: "success",
        duration: 5000,
        isClosable: true,
      });
    } catch (err) {
      console.error("Error deleting request", err.response ? err.response.data : err);
      toast({
        title: "Error",
        description: err.response?.data?.error || "There was an error deleting your request.",
        status: "error",
        duration: 5000,
        isClosable: true,
      });
    }
  };

  const handleModalClose = () => {
    setIsEditing(false);
    setCurrentRequestId(null);
    setNewRequest({
      taskName: "",
      description: "",
      priority: "",
      deadline: "",
      assignee: "",
      assignedBy: "",
    });
    setErrors({});
    onClose();
  };

  const getAssigneeName = (assignee) => {
    const user = users.find((user) => user.companyID === assignee);
    return user ? user.fullName : "Unknown";
  };

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
  };

  const filteredCompletedRequests = completedRequests.filter((request) =>
    request.taskName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <Box p="8">
      <Heading mb="8">Your Requests</Heading>
      <Flex>
        <Box flex="1" mr="8" bg="gray.200" p="6" borderRadius="md" boxShadow="md" minH="80vh">

            <Heading size="md" mb="3">Pending Requests</Heading>
            <Button mb="4" colorScheme="blue" onClick={onOpen}>
              + Make Request
            </Button>

          <VStack spacing="4">
            {pendingRequests.map((request) => (
              <Box key={request._id} p="4" boxShadow="md" borderRadius="md" bg="white" w="100%" border="1px" borderColor="gray.200">
                <Flex justify="space-between">
                  <Box>
                    <Heading size="sm">{request.taskName}</Heading>
                    <Text>{request.description}</Text>
                    <Text>Priority: {request.priority}</Text>
                    <Text>Deadline: {new Date(request.deadline).toLocaleDateString()}</Text>
                    <Text>Assignee: {getAssigneeName(request.assignee)}</Text>
                  </Box>
                  <Box>
                    <Button size="sm" colorScheme="gray" onClick={() => handleEditRequest(request._id)}>
                      Edit
                    </Button>
                    <Button size="sm" ml="2" colorScheme="red" onClick={() => handleDeleteRequest(request._id)}>
                      Delete
                    </Button>
                  </Box>
                </Flex>
              </Box>
            ))}
          </VStack>
        </Box>
        <Box flex="1" bg="gray.200" p="6" borderRadius="md" boxShadow="md" minH="80vh">
          <Heading size="md" mb="4">Past Requests</Heading>
          <Input
            placeholder="Search by request name"
            value={searchTerm}
            onChange={handleSearchChange}
            mb="4"
            outline={"1px solid"}
          />
          <VStack spacing="4">
            {filteredCompletedRequests.map((request) => (
              <Box key={request._id} p="4" boxShadow="md" borderRadius="md" bg="white" w="100%" border="1px" borderColor="gray.200">
                <Heading size="sm">{request.taskName}</Heading>
                <Text>{request.description}</Text>
                <Text>Priority: {request.priority}</Text>
                <Text>Deadline: {new Date(request.deadline).toLocaleDateString()}</Text>
                <Text>Assignee: {getAssigneeName(request.assignee)}</Text>
              </Box>
            ))}
          </VStack>
        </Box>
      </Flex>
      <Modal isOpen={isOpen} onClose={handleModalClose}>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>{isEditing ? "Edit Request" : "Create a New Request"}</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <FormControl mb="4" isInvalid={errors.taskName}>
              <FormLabel>Task Name</FormLabel>
              <Input name="taskName" value={newRequest.taskName} onChange={handleInputChange} />
              <FormErrorMessage>{errors.taskName}</FormErrorMessage>
            </FormControl>
            <FormControl mb="4" isInvalid={errors.description}>
              <FormLabel>Description</FormLabel>
              <Input name="description" value={newRequest.description} onChange={handleInputChange} />
              <FormErrorMessage>{errors.description}</FormErrorMessage>
            </FormControl>
            <FormControl mb="4" isInvalid={errors.priority}>
              <FormLabel>Priority</FormLabel>
              <Select name="priority" value={newRequest.priority} onChange={handleInputChange}>
                <option value="Low">Low</option>
                <option value="Medium">Medium</option>
                <option value="High">High</option>
              </Select>
              <FormErrorMessage>{errors.priority}</FormErrorMessage>
            </FormControl>
            <FormControl mb="4" isInvalid={errors.deadline}>
              <FormLabel>Deadline</FormLabel>
              <Input type="date" name="deadline" value={newRequest.deadline} onChange={handleInputChange} />
              <FormErrorMessage>{errors.deadline}</FormErrorMessage>
            </FormControl>
            <FormControl mb="4" isInvalid={errors.assignee}>
              <FormLabel>Assignee</FormLabel>
              <Select name="assignee" value={newRequest.assignee} onChange={handleInputChange}>
                {users.map((user) => (
                  <option key={user.companyID} value={user.companyID}>
                    {user.fullName}
                  </option>
                ))}
              </Select>
              <FormErrorMessage>{errors.assignee}</FormErrorMessage>
            </FormControl>
          </ModalBody>
          <ModalFooter>
            <Button colorScheme="blue" mr="3" onClick={isEditing ? handleUpdateRequest : handleCreateRequest}>
              {isEditing ? "Update" : "Create"}
            </Button>
            <Button variant="ghost" onClick={handleModalClose}>
              Cancel
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </Box>
  );
};

export default Requests;