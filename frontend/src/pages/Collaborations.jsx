import React, { useState, useEffect } from "react";
import { Box, Heading, Table, Thead, Tbody, Tr, Th, Td, Input, Flex } from "@chakra-ui/react";
import axios from "axios";

const Collaborations = () => {
  const [collaborations, setCollaborations] = useState([]);
  const [users, setUsers] = useState({});
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    // Fetch collaborations
    const fetchCollaborations = async () => {
      try {
        const res = await axios.get("http://localhost:5000/api/collaborations");
        setCollaborations(res.data);
      } catch (err) {
        console.error("Error fetching collaborations", err);
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

    fetchCollaborations();
    fetchUsers();
  }, []);

  const getUserName = (companyID) => {
    return users[companyID] || "Unknown";
  };

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
  };

  const filteredCollaborations = collaborations.filter(collaboration =>
    getUserName(collaboration.assignee).toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <Box p="8">
      <Heading mb="8">Ongoing Collaborations</Heading>
      <Box bg="gray.200" p="6" borderRadius="md" boxShadow="md" minH="80vh">
        <Flex mb="4" justify="space-between">
          <Input
            placeholder="Search by 'Accepted By'"
            value={searchTerm}
            onChange={handleSearchChange}
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
            </Tr>
          </Thead>
          <Tbody>
            {filteredCollaborations.map(collaboration => (
              <Tr key={collaboration._id}>
                <Td>{collaboration.taskName}</Td>
                <Td>{getUserName(collaboration.assignedBy)}</Td>
                <Td>{getUserName(collaboration.assignee)}</Td>
                <Td>{new Date(collaboration.deadline).toLocaleDateString()}</Td>
                <Td>{new Date(collaboration.createdAt).toLocaleDateString()}</Td>
              </Tr>
            ))}
          </Tbody>
        </Table>
      </Box>
    </Box>
  );
};

export default Collaborations;