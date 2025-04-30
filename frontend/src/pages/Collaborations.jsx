import React, { useState, useEffect } from "react";
import axios from "axios";
import {
  Box,
  Heading,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Input,
  Flex,
  Progress,
  Text,
} from "@chakra-ui/react";

const Collaborations = () => {
  const [collaborations, setCollaborations] = useState([]);
  const [users, setUsers] = useState({});
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch all users
        const usersRes = await axios.get("http://localhost:5000/api/admin/users");
        const usersMap = usersRes.data.reduce((acc, user) => {
          acc[user.companyID] = user.fullName;
          return acc;
        }, {});
        setUsers(usersMap);

        // Fetch ongoing collaborations
        const collabRes = await axios.get("http://localhost:5000/api/requests/ongoing");
        setCollaborations(collabRes.data);
      } catch (err) {
        console.error("Error fetching data:", err);
      }
    };

    fetchData();
  }, []);

  const getUserName = (companyID) => {
    return users[companyID] || companyID;
  };

  const filteredCollaborations = collaborations.filter((collab) =>
    getUserName(collab.assignedBy).toLowerCase().includes(searchTerm.toLowerCase()) ||
    getUserName(collab.assignee).toLowerCase().includes(searchTerm.toLowerCase()) ||
    collab.taskName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <Box p="8">
      <Heading mb="8">Ongoing Collaborations</Heading>
      <Box bg="gray.200" p="6" borderRadius="md" boxShadow="md" minH="80vh">
        <Flex mb="4" justify="space-between">
          <Input
            placeholder="Search by Employee Name or Task Name"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            width="60%"
            outline={"1px solid"}
          />
        </Flex>
        <Table variant="simple">
          <Thead>
            <Tr>
              <Th>Task Name</Th>
              <Th>Requested By</Th>
              <Th>Accepted By</Th>
              <Th>Expected On</Th>
              <Th>Initiated On</Th>
              <Th>Progress</Th>
            </Tr>
          </Thead>
          <Tbody>
            {filteredCollaborations.map((collaboration) => (
              <Tr key={collaboration._id}>
                <Td>{collaboration.taskName}</Td>
                <Td>{getUserName(collaboration.assignedBy)}</Td>
                <Td>{getUserName(collaboration.assignee)}</Td>
                <Td>{new Date(collaboration.deadline).toLocaleDateString()}</Td>
                <Td>{new Date(collaboration.createdAt).toLocaleDateString()}</Td>
                <Td>{typeof collaboration.progress === 'number' ? `${collaboration.progress}%` : '0%'}</Td>
              </Tr>
            ))}
          </Tbody>
        </Table>
      </Box>
    </Box>
  );
};

export default Collaborations;