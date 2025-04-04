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

const ForgotPassword = () => {
  const [identifier, setIdentifier] = useState("");
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [step, setStep] = useState(1); // 1: enter identifier, 2: enter OTP & new password
  const toast = useToast();
  const navigate = useNavigate();

  const handleSendOtp = async () => {
    try {
      // Send identifier as both email and companyID
      await axios.post("http://localhost:5000/api/auth/forgot-password", {
        email: identifier,
        companyID: identifier,
      });
      toast({
        title: "OTP Sent",
        description: "Check your email for the OTP",
        status: "success",
        duration: 3000,
      });
      setStep(2);
    } catch (error) {
      toast({
        title: "Error",
        description: error.response?.data?.msg || "Failed to send OTP",
        status: "error",
        duration: 3000,
      });
    }
  };

  const handleResetPassword = async () => {
    try {
      // Call verify-otp endpoint with email, otp, and newPassword
      await axios.post("http://localhost:5000/api/auth/verify-otp", {
        email: identifier,
        otp,
        newPassword,
      });
      toast({
        title: "Password Reset",
        description: "Your password has been reset",
        status: "success",
        duration: 3000,
      });
      navigate("/login");
    } catch (error) {
      toast({
        title: "Error",
        description: error.response?.data?.msg || "Failed to reset password",
        status: "error",
        duration: 3000,
      });
    }
  };

  return (
    <Box maxW="400px" mx="auto" mt={10} p={6} borderRadius="lg" boxShadow="lg" bg="white">
      <Heading textAlign="center" mb={6} color="blue.600">Forgot Password</Heading>
      <VStack spacing={4}>
        {step === 1 && (
          <>
            <FormControl isRequired>
              <FormLabel>Email or Company ID</FormLabel>
              <Input
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                placeholder="Enter your email or company ID"
              />
            </FormControl>
            <Button colorScheme="blue" onClick={handleSendOtp} width="full">
              Send OTP
            </Button>
          </>
        )}
        {step === 2 && (
          <>
            <FormControl isRequired>
              <FormLabel>OTP</FormLabel>
              <Input
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                placeholder="Enter OTP"
              />
            </FormControl>
            <FormControl isRequired>
              <FormLabel>New Password</FormLabel>
              <Input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Enter new password"
              />
            </FormControl>
            <Button colorScheme="green" onClick={handleResetPassword} width="full">
              Reset Password
            </Button>
          </>
        )}
        <Text fontSize="sm" color="gray.600">
          Remembered your password?{" "}
          <Button variant="link" colorScheme="blue" onClick={() => navigate("/login")}>
            Login
          </Button>
        </Text>
      </VStack>
    </Box>
  );
};

export default ForgotPassword;
