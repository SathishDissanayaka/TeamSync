import React, { useEffect, useState } from "react";
import { Routes, Route, useNavigate } from "react-router-dom";
import { Box, Flex, Heading, Text, VStack, Button, Grid, GridItem, IconButton,
  Popover, PopoverTrigger, PopoverContent, PopoverArrow, PopoverCloseButton, PopoverBody, Spinner } from "@chakra-ui/react";
  
import { FiHome, FiSend, FiFileText, FiUsers, FiPenTool, FiLogOut } from "react-icons/fi";
import axios from "axios";
import Requests from "./Requests";
import Tasks from "./Tasks";
import Collaborations from "./Collaborations";
import Feedback from "./Feedback";
import MyCollaborationHub from './MyCollaborationHub';

import NotificationBell from "../components/NotificationBell";


const DashboardHome = () => {
  const [fullName, setFullName] = useState("");
  const [companyID, setCompanyID] = useState("");
  const [statistics, setStatistics] = useState({});
  const [notifications, setNotifications] = useState([]);
  const [recentActivities, setRecentActivities] = useState([]);
  const [collaborations, setCollaborations] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem("token");
    const companyID = localStorage.getItem("companyID");
    if (!token) return;

    axios
      .get("http://localhost:5000/api/auth/me", {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then((res) => {
        setFullName(res.data.fullName);
        setCompanyID(res.data.companyID);
      })
      .catch((err) => {
        console.error("Error fetching user profile", err);
      });

    fetchStatistics(companyID);
    fetchNotifications(companyID);
    fetchRecentActivities(companyID);
    fetchCollaborations(companyID);
  }, []);

  const fetchStatistics = async (companyID) => {
    try {
      const [requestsRes, todoRes, incomingRes] = await Promise.all([
        axios.get(`http://localhost:5000/api/requests/pending/${companyID}`),
        axios.get(`http://localhost:5000/api/requests/ongoing/${companyID}`),
        axios.get(`http://localhost:5000/api/requests/assigned/${companyID}`),
      ]);

      setStatistics({
        requestsMade: requestsRes.data.length,
        todoTasks: todoRes.data.length,
        incomingRequests: incomingRes.data.length,
      });
    } catch (err) {
      console.error("Error fetching statistics", err);
    }
  };

  const fetchNotifications = async (companyID) => {
    try {
      const res = await axios.get(`http://localhost:5000/api/requests/assigned/${companyID}`);
      setNotifications(res.data.slice(0, 5));
    } catch (err) {
      console.error("Error fetching notifications", err);
    }
  };

  const fetchRecentActivities = async (companyID) => {
    try {
       // Fetch both in parallel(sahan changes)
       const [ongoingRes, declinedRes] = await Promise.all([
        axios.get(`http://localhost:5000/api/requests/ongoing/${companyID}`),
        axios.get(`http://localhost:5000/api/requests/declined/${companyID}`)
      ]);

      // Merge, sort by updatedAt desc, take top 10
      const merged = [
        ...ongoingRes.data,
        ...declinedRes.data
      ]
        .sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt))
        .slice(0, 10);

      setRecentActivities(merged);
    } catch (err) {
      console.error("Error fetching recent activities", err);
    }
  };


  const fetchCollaborations = async (companyID) => {
    try {
      const res = await axios.get("http://localhost:5000/api/collaborations");
      const filteredCollaborations = res.data.filter(
        (collaboration) =>
          collaboration.assignedBy === companyID || collaboration.assignee === companyID
      );
      setCollaborations(filteredCollaborations);
    } catch (err) {
      console.error("Error fetching collaborations", err);
    }
  };

  return (
    <Box p="8">
      <Heading mb="12" size="lg">
        Welcome, {fullName} {companyID && `(${companyID})`} !
      </Heading>
      <Flex>
        <Box flex="3" mr="4">
          <Grid templateColumns="repeat(3, 1fr)" gap={6} mb="12">
            <GridItem>
              <Box p="6" boxShadow="md" borderRadius="md" bg="blue.50">
                <Heading size="md">Requests Made</Heading>
                <Text mt="2" fontSize="lg">
                  Requests Made: {statistics.requestsMade}
                </Text>
              </Box>
            </GridItem>
            <GridItem>
              <Box p="6" boxShadow="md" borderRadius="md" bg="blue.50">
                <Heading size="md">To-do Tasks</Heading>
                <Text mt="2" fontSize="lg">
                  To-do Tasks: {statistics.todoTasks}
                </Text>
              </Box>
            </GridItem>
            <GridItem>
              <Box p="6" boxShadow="md" borderRadius="md" bg="blue.50">
                <Heading size="md">Incoming Requests</Heading>
                <Text mt="2" fontSize="lg">
                  Incoming Requests: {statistics.incomingRequests}
                </Text>
              </Box>
            </GridItem>
          </Grid>
          <Box p="6" boxShadow="md" borderRadius="md" bg="white" mb="12">
            <Heading size="md" mb="2">
              Your Collaborations
            </Heading>
            {collaborations.map((collaboration, index) => (
              <Text key={index} fontSize="lg">
                {collaboration.taskName} - {collaboration.assignedBy === companyID ? "Requested By You" : "Accepted By You"}
              </Text>
            ))}
          </Box>
          <Box p="6" boxShadow="md" borderRadius="md" bg="white" mb="8">
            <Heading size="md" mb="2">
              Recent Activities
            </Heading>
            {recentActivities.map((activity, index) => (
              <Text key={index} fontSize="lg">
                {activity.taskName} was updated on {new Date(activity.updatedAt).toLocaleDateString()}
              </Text>
            ))}
          </Box>
        </Box>
        <Box flex="1" bg="blue.50" p="6" borderRadius="md" boxShadow="md">
          <Heading size="md" mb="4">Notifications</Heading>
          {notifications.map((notification, index) => (
            <Text key={index} mt="2" fontSize="lg">
              New request: {notification.taskName}
            </Text>
          ))}
        </Box>
      </Flex>
    </Box>
  );
};

const UserSidebar = () => {
  const navigate = useNavigate();

  return (
        //sahan changes notification button
    <Box bg="blue.200" w="250px" minH="100vh" p="4">
           {/* Sidebar header with the bell popover */}
      <Flex align="center" mb="8">
        <Heading size="lg" fontSize="2xl">TeamSync</Heading>

       {/* the bell will fetch & pop over on click */}
        <Box ml="auto">
          <NotificationBell companyID={localStorage.getItem("companyID")}
            iconSize={28}      
            buttonSize="md"  />
        </Box>
      </Flex>

      <VStack align="start" spacing="4">
        <Button variant="ghost" leftIcon={<FiHome />} onClick={() => navigate("/dashboard")}>
          Dashboard
        </Button>
        <Button variant="ghost" leftIcon={<FiSend />} onClick={() => navigate("/dashboard/requests")}>
          Requests
        </Button>
        <Button variant="ghost" leftIcon={<FiFileText />} onClick={() => navigate("/dashboard/tasks")}>
          Journal
        </Button>
        <Button variant="ghost" leftIcon={<FiUsers />} onClick={() => navigate("/dashboard/collaborations")}>
          Collaborations
        </Button>
        <Button variant="ghost" leftIcon={<FiPenTool />} onClick={() => navigate("/dashboard/my-collaboration-hub")}>My Collaboration Hub</Button>
        <Button variant="ghost" leftIcon={<FiPenTool />} onClick={() => navigate("/dashboard/feedback")}>
          Feedback
        </Button>
      </VStack>
      <Box mt="4">
        <Button
          variant="ghost"
          leftIcon={<FiLogOut />}
          onClick={() => {
            localStorage.removeItem("token");
            localStorage.removeItem("role");
            navigate("/login");
          }}
        >
          Logout
        </Button>
      </Box>
    </Box>
  );
};

const UserDashboardLayout = () => (
  <Flex>
    <UserSidebar />
    <Box flex="1" bg="gray.100" minH="100vh">
      <Routes>
        <Route path="/" element={<DashboardHome />} />
        <Route path="dashboard" element={<DashboardHome />} />
        <Route path="requests" element={<Requests />} />
        <Route path="tasks" element={<Tasks />} />
        <Route path="collaborations" element={<Collaborations />} />
        <Route path="my-collaboration-hub" element={<MyCollaborationHub />} />
        <Route path="feedback" element={<Feedback />} />
      </Routes>
    </Box>
  </Flex>
);

const Dashboard = () => {
  return <UserDashboardLayout />;
};

export default Dashboard;