import React, { useState, useEffect } from "react";
import {
  Box, Heading, Table, Thead, Tbody, Tr, Th, Td,
  Input, Flex, useToast, Button
} from "@chakra-ui/react";
import axios from "axios";
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

const DeclinedTasks = () => {
  const [entries, setEntries]     = useState([]);
  const [users, setUsers]         = useState({});
  const [searchTerm, setSearchTerm] = useState("");
  const toast = useToast();
  const companyID = localStorage.getItem("companyID");

  useEffect(() => {
    // 1) Fetch TS→full‑name map
    const fetchUsers = async () => {
      try {
        const res = await axios.get("http://localhost:5000/api/admin/users");
        const map = res.data.reduce((acc, u) => {
          acc[u.companyID] = u.fullName;
          return acc;
        }, {});
        setUsers(map);
      } catch (err) {
        console.error("Error loading users", err);
        toast({ title: "Error", description: "Cannot load users", status: "error" });
      }
    };

    // 2) Fetch all declined entries
    const fetchAllDeclined = async () => {
      try {
        // If the user is a manager, fetch all declined entries
          const res = await axios.get("http://localhost:5000/api/requests/declined"
        );
        setEntries(res.data);
      } catch (err) {
        console.error("Error loading declined entries", err);
        toast({ title: "Error", description: "Cannot load declined tasks", status: "error" });
      }
    };

    fetchUsers();
    fetchAllDeclined();
  }, [companyID, toast]);

  const getName = (code) => users[code] || code;

  // filter by assignee's name
  const filtered = entries.filter(e =>
    getName(e.assignee).toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleExportPDF = () => {
    const doc = new jsPDF();
    const title = 'Declined Requests Report';
    doc.text(title, 20, 10);
    autoTable(doc, {
      head: [['Task Name', 'Requested By', 'Declined By', 'Declined On', 'Reason', 'Alternative Date']],
      body: filtered.map(entry => [
        entry.title,
        getName(entry.assignedBy),
        getName(entry.assignee),
        new Date(entry.declinedOn).toLocaleDateString(),
        entry.declinedReason,
        new Date(entry.alternativeDate).toLocaleDateString()
      ]),
    });
    doc.save(`${title}.pdf`);
  };

  return (
    <Box p="8">
      <Heading mb="6">Declined Requests</Heading>
      <Flex mb="4" justify="space-between">
        <Input
          placeholder="Search by Assignee"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          width="40%"
          outline="1px solid"
        />
        <Button colorScheme="blue" onClick={handleExportPDF}>
          Export PDF
        </Button>
      </Flex>
      <Box bg="white" p="4" borderRadius="md" boxShadow="md">
        <Table variant="simple">
          <Thead>
            <Tr>
              <Th>Task Name</Th>
              <Th>Requested By</Th>
              <Th>Declined By</Th>
              <Th>Declined On</Th>
              <Th>Reason</Th>
              <Th>Alt. Date</Th>
            </Tr>
          </Thead>
          <Tbody>
            {filtered.map((d) => (
              <Tr key={d._id}>
                <Td>{d.title}</Td>
                <Td>{getName(d.assignedBy)}</Td>
                <Td>{getName(d.assignee)}</Td>
                <Td>{new Date(d.declinedOn).toLocaleDateString()}</Td>
                <Td>{d.declinedReason}</Td>
                <Td>{new Date(d.alternativeDate).toLocaleDateString()}</Td>
              </Tr>
            ))}
          </Tbody>
        </Table>
      </Box>
    </Box>
  );
};

export default DeclinedTasks;
