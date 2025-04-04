import React, { useState } from "react";
import {
  Box,
  Button,
  FormControl,
  FormLabel,
  Input,
  Select,
  VStack,
  Heading,
  Text,
  useToast,
} from "@chakra-ui/react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

const Signup = () => {
  const [formData, setFormData] = useState({
    fullName: "",
    companyID: "TS", // Set initial value to "TS"
    dob: "",
    email: "",
    gender: "",
    role: "",
    password: "",
    confirmPassword: "",
    contactNumber: "",
  });
  const toast = useToast();
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Check if passwords match
    if (formData.password !== formData.confirmPassword) {
      toast({
        title: "Error",
        description: "Passwords do not match",
        status: "error",
        duration: 3000,
      });
      return;
    }

    // Validate password complexity:
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\W_]).{8,}$/;
    if (!passwordRegex.test(formData.password)) {
      toast({
        title: "Weak Password",
        description:
          "Password must include an uppercase letter, a lowercase letter, a number, a special character, and be at least 8 characters long.",
        status: "error",
        duration: 3000,
      });
      return;
    }

    // Validate Company ID (must start with "TS" and then 5 digits)
    const companyIDRegex = /^TS\d{5}$/;
    if (!companyIDRegex.test(formData.companyID)) {
      toast({
        title: "Invalid Company ID",
        description: "Company ID must be in the format TS12345",
        status: "error",
        duration: 3000,
      });
      return;
    }

    try {
      const { confirmPassword: _CONFIRM_PASSWORD, ...userData } = formData;

      await axios.post("http://localhost:5000/api/auth/signup", userData);

      toast({
        title: "Signup Successful",
        description: "You have successfully signed up",
        status: "success",
        duration: 3000,
      });
      navigate("/login");
    } catch (error) {
      toast({
        title: "Signup Failed",
        description: error.response?.data?.msg || "An error occurred during signup",
        status: "error",
        duration: 3000,
      });
    }
  };

  const handleCompanyIDChange = (e) => {
    let newValue = e.target.value.toUpperCase(); // Enforce "TS" prefix as uppercase

    // Ensure it starts with 'TS' and only accepts numbers after 'TS'
    if (newValue.startsWith('TS') && /^\d*$/.test(newValue.slice(2))) {
      setFormData({ ...formData, companyID: newValue });
    } else if (newValue.startsWith('TS')) {
      setFormData({ ...formData, companyID: newValue.slice(0, 7) });
    } else {
      setFormData({ ...formData, companyID: 'TS' + newValue.slice(2) });
    }
  };

  return (
    <Box maxW="400px" mx="auto" mt={10} p={6} borderRadius="lg" boxShadow="lg" bg="white">
      <Heading textAlign="center" mb={6} color="blue.600">
        Sign Up
      </Heading>
      <VStack spacing={4} as="form" onSubmit={handleSubmit}>
        <FormControl isRequired>
          <FormLabel>Full Name</FormLabel>
          <Input
            name="fullName"
            value={formData.fullName}
            onChange={handleChange}
            placeholder="Enter your full name"
          />
        </FormControl>
        <FormControl isRequired>
          <FormLabel>Company ID</FormLabel>
          <Input
            name="companyID"
            value={formData.companyID}
            onChange={handleCompanyIDChange}
            placeholder="TS12345"
            maxLength="7" // Limit to "TS" + 5 numbers
            _placeholder={{
              color: 'gray.400', // Light grey color for the placeholder text
            }}
          />
          <Text fontSize="xs" color="gray.600" mt={1}>
            Company ID must be in the format TS12345
          </Text>
        </FormControl>
        <FormControl isRequired>
          <FormLabel>Date of Birth</FormLabel>
          <Input
            type="date"
            name="dob"
            value={formData.dob}
            onChange={handleChange}
          />
        </FormControl>
        <FormControl isRequired>
          <FormLabel>Email</FormLabel>
          <Input
            type="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            placeholder="Enter your email"
          />
        </FormControl>
        <FormControl isRequired>
          <FormLabel>Gender</FormLabel>
          <Select name="gender" value={formData.gender} onChange={handleChange}>
            <option value="">Select gender</option>
            <option value="Male">Male</option>
            <option value="Female">Female</option>
            <option value="Other">Other</option>
          </Select>
        </FormControl>
        <FormControl isRequired>
          <FormLabel>Role</FormLabel>
          <Select name="role" value={formData.role} onChange={handleChange}>
            <option value="">Select role</option>
            <option value="Employee">Employee</option>
            <option value="BusinessOwner">Business owner</option>
            <option value="TeamLeads">Team Leads</option>
            <option value="HR">HR</option>
            <option value="Admin">Admin</option>
            <option value="ITSupport">IT support</option>
            <option value="Manager">Manager</option>
          </Select>
        </FormControl>
        <FormControl isRequired>
          <FormLabel>Password</FormLabel>
          <Input
            type="password"
            name="password"
            value={formData.password}
            onChange={handleChange}
            placeholder="Enter password"
          />
          <Text fontSize="xs" color="gray.600" mt={1}>
            Must include an uppercase letter, lowercase letter, number, special character, and be at least 8 characters long.
          </Text>
        </FormControl>
        <FormControl isRequired>
          <FormLabel>Confirm Password</FormLabel>
          <Input
            type="password"
            name="confirmPassword"
            value={formData.confirmPassword}
            onChange={handleChange}
            placeholder="Confirm password"
          />
        </FormControl>
        <FormControl isRequired>
          <FormLabel>Contact Number</FormLabel>
          <Input
            name="contactNumber"
            value={formData.contactNumber}
            onChange={handleChange}
            placeholder="Enter contact number"
          />
        </FormControl>
        <Button colorScheme="blue" type="submit" width="full">
          Sign Up
        </Button>
        <Text mt={4} textAlign="center">
          I already have an account?{" "}
          <Text
            as="span"
            color="blue.500"
            fontWeight="bold"
            cursor="pointer"
            onClick={() => navigate("/login")}
          >
            Login
          </Text>
        </Text>
      </VStack>
    </Box>
  );
};

export default Signup;
