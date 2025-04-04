import React, { useState } from "react";
import {
  Box,
  Button,
  FormControl,
  FormLabel,
  Input,
  VStack,
  Heading,
  useToast,
  Text,
} from "@chakra-ui/react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

const Login = () => {
  const [formData, setFormData] = useState({ identifier: "", password: "" });
  const toast = useToast();
  const navigate = useNavigate();

  const handleChange = (e) =>
    setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      // Send identifier as both email and companyID
      const res = await axios.post("http://localhost:5000/api/auth/login", {
        email: formData.identifier,
        companyID: formData.identifier,
        password: formData.password,
      });

      console.log("Login response:", res.data);

      // Successful login: store token, role, and companyID
      localStorage.setItem("token", res.data.token);
      localStorage.setItem("role", res.data.role);
      localStorage.setItem("companyID", res.data.companyID); // Store companyID
      //localStorage.setItem("fullName", res.data.fullName); // Store fullName

      // Redirect based on role
      if (res.data.role === "Admin" || res.data.role === "BusinessOwner" || res.data.role === "Manager") {
        navigate("/admindashboard");
      } else {
        navigate("/dashboard");
      }

      toast({ title: "Login Successful", status: "success", duration: 3000 });
    } catch (error) {
      // If backend returns 403, it means account is locked.
      if (error.response && error.response.status === 403) {
        toast({
          title: "Account Locked",
          description: "Your account has been locked. Please contact an administrator.",
          status: "error",
          duration: 3000,
        });
      } else {
        toast({
          title: "Login Failed",
          description: error.response?.data?.msg || "Invalid credentials",
          status: "error",
          duration: 3000,
        });
      }
    }
  };

  return (
    <Box maxW="400px" mx="auto" mt={10} p={6} borderRadius="lg" boxShadow="lg" bg="white">
      <Heading textAlign="center" mb={6} color="blue.600">
        Login
      </Heading>
      <VStack spacing={4} as="form" onSubmit={handleSubmit}>
        <FormControl isRequired>
          <FormLabel>Email / Company ID</FormLabel>
          <Input
            name="identifier"
            value={formData.identifier}
            onChange={handleChange}
            placeholder="Enter your email or company ID"
          />
        </FormControl>
        <FormControl isRequired>
          <FormLabel>Password</FormLabel>
          <Input
            type="password"
            name="password"
            value={formData.password}
            onChange={handleChange}
            placeholder="Enter your password"
          />
        </FormControl>
        <Button colorScheme="blue" type="submit" width="full">
          Login
        </Button>
        <Text fontSize="sm" color="gray.600">
          Forgot password?{" "}
          <Button variant="link" colorScheme="blue" onClick={() => navigate("/forgot-password")}>
            Reset here
          </Button>
        </Text>
        <Text fontSize="sm" color="gray.600">
          Don't have an account?{" "}
          <Button variant="link" colorScheme="blue" onClick={() => navigate("/")}>
            Sign Up
          </Button>
        </Text>
      </VStack>
    </Box>
  );
};

export default Login;