import React, { useState, useEffect } from "react";
import {
  Box,
  Heading,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Button,
  Select,
  Container,
  useToast,
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
} from "@chakra-ui/react";
import axios from "axios";

const UserManagement = () => {
  const [users, setUsers] = useState([]);
  const [editedRoles, setEditedRoles] = useState({});
  const [selectedUser, setSelectedUser] = useState(null); // Store the selected user
  const [isModalOpen, setIsModalOpen] = useState(false); // Control modal visibility
  const toast = useToast();

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const res = await axios.get("http://localhost:5000/api/admin/users", {
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
        });
        setUsers(res.data);
        const rolesMap = {};
        res.data.forEach((user) => {
          rolesMap[user._id] = user.role;
        });
        setEditedRoles(rolesMap);
      } catch (error) {
        toast({
          title: "Error",
          description: error.response?.data?.message || "Failed to fetch users",
          status: "error",
          duration: 3000,
        });
      }
    };
    fetchUsers();
  }, [toast]);

  // Handle role change in dropdown
  const handleRoleChange = async (userId, newRole) => {
    try {
      await axios.put(
        `http://localhost:5000/api/admin/users/${userId}`,
        { role: newRole },
        { headers: { Authorization: `Bearer ${localStorage.getItem("token")}` } }
      );
      setEditedRoles((prev) => ({ ...prev, [userId]: newRole }));
      setUsers((prevUsers) =>
        prevUsers.map((user) =>
          user._id === userId ? { ...user, role: newRole } : user
        )
      );
      toast({
        title: "Success",
        description: "User role updated successfully!",
        status: "success",
        duration: 3000,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: error.response?.data?.message || "Failed to update user role",
        status: "error",
        duration: 3000,
      });
    }
  };

  // Open modal to view/edit user
  const handleViewUser = (user) => {
    setSelectedUser(user); // Set the user data to be viewed/edited
    setIsModalOpen(true); // Open the modal
  };

  // Close modal
  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedUser(null);
  };

  // Update user data in the database
  const handleUpdateUser = async () => {
    try {
      const updatedUser = {
        fullName: selectedUser.fullName,
        email: selectedUser.email,
        companyID: selectedUser.companyID,
        dob: selectedUser.dob,
        gender: selectedUser.gender,
        role: selectedUser.role,
        contactNumber: selectedUser.contactNumber,
      };

      await axios.put(
        `http://localhost:5000/api/admin/users/${selectedUser._id}`,
        updatedUser,
        { headers: { Authorization: `Bearer ${localStorage.getItem("token")}` } }
      );

      // Update local users state
      setUsers((prevUsers) =>
        prevUsers.map((user) =>
          user._id === selectedUser._id ? { ...user, ...updatedUser } : user
        )
      );

      toast({
        title: "Success",
        description: "User updated successfully!",
        status: "success",
        duration: 3000,
      });

      handleCloseModal(); // Close modal after update
      window.location.reload(); // Refresh the page to reflect changes
    } catch (error) {
      toast({
        title: "Error",
        description: error.response?.data?.message || "Failed to update user",
        status: "error",
        duration: 3000,
      });
    }
  };

  // Lock (terminate) user account
  const handleTerminateUser = async (userId) => {
    try {
      await axios.put(
        `http://localhost:5000/api/admin/users/${userId}/terminate`,
        {},
        { headers: { Authorization: `Bearer ${localStorage.getItem("token")}` } }
      );
      // Update local state to show button change
      setUsers((prevUsers) =>
        prevUsers.map((user) =>
          user._id === userId ? { ...user, locked: true } : user
        )
      );
      toast({
        title: "Success",
        description: "User account locked",
        status: "success",
        duration: 3000,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: error.response?.data?.message || "Failed to lock account",
        status: "error",
        duration: 3000,
      });
    }
  };

  // Unlock user account
  const handleUnlockUser = async (userId) => {
    try {
      await axios.put(
        `http://localhost:5000/api/admin/users/${userId}/unlock`,
        {},
        { headers: { Authorization: `Bearer ${localStorage.getItem("token")}` } }
      );
      // Update local state to show button change
      setUsers((prevUsers) =>
        prevUsers.map((user) =>
          user._id === userId ? { ...user, locked: false } : user
        )
      );
      toast({
        title: "Success",
        description: "User account unlocked",
        status: "success",
        duration: 3000,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: error.response?.data?.message || "Failed to unlock account",
        status: "error",
        duration: 3000,
      });
    }
  };

  // Delete user
  const handleDeleteUser = async (userId) => {
    try {
      await axios.delete(`http://localhost:5000/api/admin/users/${userId}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      });
      setUsers((prevUsers) => prevUsers.filter((user) => user._id !== userId));
      toast({
        title: "Deleted",
        description: "User removed",
        status: "success",
        duration: 3000,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: error.response?.data?.message || "Failed to delete user",
        status: "error",
        duration: 3000,
      });
    }
  };

  return (
    <Container maxW="container.lg" mt={10}>
      <Box p={6} borderRadius="lg" boxShadow="lg" bg="white">
        <Heading textAlign="center" mb={6} color="blue.600">
          Admin Dashboard - User Management
        </Heading>
        <Table variant="striped" colorScheme="blue">
          <Thead>
            <Tr>
              <Th>Name</Th>
              <Th>Email</Th>
              <Th>Role</Th>
              <Th>Actions</Th>
            </Tr>
          </Thead>
          <Tbody>
            {users.map((user) => (
              <Tr key={user._id}>
                <Td>{user.fullName}</Td>
                <Td>{user.email}</Td>
                <Td>
                  <Select
                    value={editedRoles[user._id] || user.role}
                    onChange={(e) => handleRoleChange(user._id, e.target.value)}
                  >
                    <option value="Employee">Employee</option>
                    <option value="BusinessOwner">Business owner</option>
                    <option value="TeamLeads">Team Leads</option>
                    <option value="HR">HR</option>
                    <option value="Admin">Admin</option>
                    <option value="ITSupport">IT support</option>
                    <option value="Manager">Manager</option>
                  </Select>
                </Td>
                <Td>
                  <Button
                    colorScheme={user.locked ? "green" : "red"}
                    size="sm"
                    mr="2"
                    onClick={() =>
                      user.locked ? handleUnlockUser(user._id) : handleTerminateUser(user._id)
                    }
                  >
                    {user.locked ? "Unlock" : "Terminate"}
                  </Button>
                  <Button colorScheme="blue" size="sm" mr="2" onClick={() => handleViewUser(user)}>
                    View
                  </Button>
                  <Button colorScheme="red" size="sm" onClick={() => handleDeleteUser(user._id)}>
                    Delete
                  </Button>
                </Td>
              </Tr>
            ))}
          </Tbody>
        </Table>
      </Box>

      {/* Modal for viewing/editing user */}
      {selectedUser && (
        <Modal isOpen={isModalOpen} onClose={handleCloseModal}>
          <ModalOverlay />
          <ModalContent>
            <ModalHeader>Edit User</ModalHeader>
            <ModalCloseButton />
            <ModalBody>
              <FormControl isRequired>
                <FormLabel>Full Name</FormLabel>
                <Input
                  value={selectedUser.fullName}
                  onChange={(e) =>
                    setSelectedUser({ ...selectedUser, fullName: e.target.value })
                  }
                />
              </FormControl>
              <FormControl isRequired mt={4}>
                <FormLabel>Email</FormLabel>
                <Input
                  type="email"
                  value={selectedUser.email}
                  onChange={(e) =>
                    setSelectedUser({ ...selectedUser, email: e.target.value })
                  }
                />
              </FormControl>
              <FormControl isRequired mt={4}>
                <FormLabel>Company ID</FormLabel>
                <Input
                  value={selectedUser.companyID}
                  onChange={(e) =>
                    setSelectedUser({ ...selectedUser, companyID: e.target.value })
                  }
                />
              </FormControl>
              <FormControl isRequired mt={4}>
                <FormLabel>Role</FormLabel>
                <Select
                  value={selectedUser.role}
                  onChange={(e) =>
                    setSelectedUser({ ...selectedUser, role: e.target.value })
                  }
                >
                  <option value="Employee">Employee</option>
                  <option value="BusinessOwner">Business owner</option>
                  <option value="TeamLeads">Team Leads</option>
                  <option value="HR">HR</option>
                  <option value="Admin">Admin</option>
                  <option value="ITSupport">IT support</option>
                  <option value="Manager">Manager</option>
                </Select>
              </FormControl>
              <FormControl isRequired mt={4}>
                <FormLabel>Contact Number</FormLabel>
                <Input
                  value={selectedUser.contactNumber}
                  onChange={(e) =>
                    setSelectedUser({ ...selectedUser, contactNumber: e.target.value })
                  }
                />
              </FormControl>
            </ModalBody>

            <ModalFooter>
              <Button colorScheme="blue" onClick={handleUpdateUser}>
                Save Changes
              </Button>
              <Button variant="ghost" onClick={handleCloseModal} ml={3}>
                Cancel
              </Button>
            </ModalFooter>
          </ModalContent>
        </Modal>
      )}
    </Container>
  );
};

export default UserManagement;