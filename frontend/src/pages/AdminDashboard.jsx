import React, { useEffect, useState } from 'react';
import { Routes, Route, useNavigate } from 'react-router-dom';
import { Box, Flex, Heading, Text, VStack, Button, Grid, GridItem } from '@chakra-ui/react';
import { FiHome, FiUsers, FiFileText, FiBell, FiTerminal, FiLogOut, FiActivity,FiSend,FiSettings} from 'react-icons/fi';
import axios from 'axios';
import UserManagement from './UserManagement'; // Import the User Management component
import Evaluation from './Evaluation'; // Import the Evaluation component
//sahan changes
import DeclinedTasks from './DeclinedTasks';

// Dashboard Home component that fetches profile data
const DashboardHome = () => {
  const [fullName, setFullName] = useState('');
  const [companyID, setCompanyID] = useState('');
  const [statistics, setStatistics] = useState({});
  const [recentActivities, setRecentActivities] = useState([]);
  const [notifications, setNotifications] = useState([]);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) return;

    axios.get('http://localhost:5000/api/auth/me', {
      headers: { Authorization: `Bearer ${token}` },
    })
    .then((res) => {
      setFullName(res.data.fullName);
      setCompanyID(res.data.companyID);
    })
    .catch((err) => {
      console.error('Error fetching user profile', err);
    });

    fetchStatistics();
    fetchRecentActivities();
    fetchNotifications();
  }, []);

  const fetchStatistics = async () => {
    try {
      const res = await axios.get('http://localhost:5000/api/employeeStat/users');
      const employees = res.data;

      let totalAcceptanceRate = 0;
      let totalCompletionRate = 0;
      let totalOntimeRate = 0;
      let totalEvaluations = 0;

      employees.forEach(employee => {
        const requests = employee.requests.filter(request => {
          const requestDate = new Date(request.createdAt);
          const startDate = new Date(new Date().setDate(1));
          const endDate = new Date();
          return requestDate >= startDate && requestDate <= endDate;
        });

        const accepted = requests.filter(request => request.status === 'ongoing').length;
        const declined = requests.filter(request => request.status === 'declined').length;
        const completed = requests.filter(request => request.status === 'completed').length;
        const acceptanceRate = (accepted / (accepted + declined)) * 100 || 0;
        const completedRate = (completed / requests.length) * 100 || 0;
        const ontimeRate = (requests.filter(request => request.status === 'completed' && new Date(request.deadline) >= new Date(request.completedOn)).length / completed) * 100 || 0;

        totalAcceptanceRate += acceptanceRate;
        totalCompletionRate += completedRate;
        totalOntimeRate += ontimeRate;
        totalEvaluations++;
      });

      setStatistics({
        averageAcceptanceRate: (totalAcceptanceRate / totalEvaluations).toFixed(0),
        averageCompletionRate: (totalCompletionRate / totalEvaluations).toFixed(0),
        averageOntimeRate: (totalOntimeRate / totalEvaluations).toFixed(0),
      });
    } catch (err) {
      console.error('Error fetching statistics', err);
    }
  };

  const fetchRecentActivities = async () => {
    try {
      const res = await axios.get('http://localhost:5000/api/evaluations/all');
      const sortedActivities = res.data.sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt)).slice(0, 10);
      setRecentActivities(sortedActivities);
    } catch (err) {
      console.error('Error fetching recent activities', err);
    }
  };

  const fetchNotifications = async () => {
    try {
      const currentMonth = new Date().toLocaleString('default', { month: 'long', year: 'numeric' });
      const usersRes = await axios.get('http://localhost:5000/api/employeeStat/users');
      const evaluationsRes = await axios.get('http://localhost:5000/api/evaluations/all');
      const users = usersRes.data;
      const evaluations = evaluationsRes.data;

      const employeesNotEvaluated = users.filter(user => {
        const userEvaluations = evaluations.filter(evaluation => evaluation.employee === user.fullName && evaluation.month === currentMonth);
        return userEvaluations.length === 0;
      }).map(user => user.fullName);

      setNotifications(employeesNotEvaluated);
    } catch (err) {
      console.error('Error fetching notifications', err);
    }
  };

  return (
    <Box p="10">
      <Heading mb="14" size="lg">
        Welcome, {fullName} {companyID && `(${companyID})`} !
      </Heading>
      <Flex>
        <Box flex="3" mr="6">
          <Grid templateColumns="repeat(3, 1fr)" gap={8} mb="14">
            <GridItem>
              <Box p="8" boxShadow="md" borderRadius="md" bg="blue.50" minH="150px">
                <Heading size="md">Average Acceptance Rate</Heading>
                <Text mt="4" fontSize="xl">
                  {statistics.averageAcceptanceRate}%
                </Text>
              </Box>
            </GridItem>
            <GridItem>
              <Box p="8" boxShadow="md" borderRadius="md" bg="blue.50" minH="150px">
                <Heading size="md">Average Completion Rate</Heading>
                <Text mt="4" fontSize="xl">
                  {statistics.averageCompletionRate}%
                </Text>
              </Box>
            </GridItem>
            <GridItem>
              <Box p="8" boxShadow="md" borderRadius="md" bg="blue.50" minH="150px">
                <Heading size="md">Average Ontime Rate</Heading>
                <Text mt="4" fontSize="xl">
                  {statistics.averageOntimeRate}%
                </Text>
              </Box>
            </GridItem>
          </Grid>
          <Box p="8" boxShadow="md" borderRadius="md" bg="white" mb="14" minH="50vh">
            <Heading size="md" mb="8">
              Recent Activities
            </Heading>
            {recentActivities.map((activity, index) => (
              <Box key={index} mb="6">
                <Flex align="center">
                  <FiTerminal />
                  <Text fontSize="xl" ml="4">
                    {activity.employee} was evaluated on {new Date(activity.updatedAt).toLocaleDateString()}
                  </Text>
                </Flex>
                <Box borderBottom="1px" borderColor="black" mt="4" />
              </Box>
            ))}
          </Box>
        </Box>
        <Box flex="1" bg="blue.50" p="8" borderRadius="md" boxShadow="md" minH="50vh">
          <Heading size="md" mb="8">Notifications</Heading>
          {notifications.map((notification, index) => (
            <Box key={index} mb="6">
              <Flex align="center">
                <FiBell />
                <Text fontSize="xl" ml="4">
                  {notification} has not yet been evaluated this month.
                </Text>
              </Flex>
              <Box borderBottom="1px" borderColor="black" mt="4" />
            </Box>
          ))}
        </Box>
      </Flex>
    </Box>
  );
};

// Sidebar component
const AdminSidebar = () => {
  const navigate = useNavigate();
  const role = localStorage.getItem("role");

  return (
    <Box bg="blue.300" w="250px" minH="100vh" p="4">
      <Heading size="md" mb="8">TeamSync Admin</Heading>
      <VStack align="start" spacing="4">
        <Button variant="ghost" leftIcon={<FiHome />} onClick={() => navigate("/admindashboard")}>
          Dashboard
        </Button>

        <Button variant="ghost" leftIcon={<FiActivity />} onClick={() => navigate("/admindashboard/evaluation")}>
          Evaluation
        </Button>
        
        //sahan changes
        <Button variant="ghost" leftIcon={<FiSend />} onClick={() => navigate("/admindashboard/declinedtask")}>
          Declined Requests
        </Button>


        {(role === "Admin" || role === "BusinessOwner" || role === "Manager")&& (
          <Button variant="ghost" leftIcon={<FiUsers />} onClick={() => navigate("/admindashboard/user-management")}>
            User Management
          </Button>
        )}
      </VStack>
      <Box mt="4">
        <Button variant="ghost" leftIcon={<FiLogOut />} onClick={() => {
          // Optionally clear the token on logout
          localStorage.removeItem('token');
          localStorage.removeItem('role');
          navigate("/login");
        }}>
          Logout
        </Button>
      </Box>
    </Box>
  );
};

// Layout combining the sidebar and nested routes
const AdminDashboardLayout = () => (
  <Flex>
    <AdminSidebar />
    <Box flex="1" bg="gray.100" minH="100vh">
      <Routes>
        <Route index element={<DashboardHome />} />
        <Route path="dashboard" element={<DashboardHome />} />
        <Route path="declinedtask" element={<DeclinedTasks />} /> // Declined Tasks page sahan changes
        <Route path="user-management" element={<UserManagement />} />
        <Route path="evaluation" element={<Evaluation />} />
        <Route
          path="settings"
          element={<Box p="8"><Heading>Settings Page</Heading></Box>}
        />
      </Routes>
    </Box>
  </Flex>
);

const AdminDashboard = () => {
  return <AdminDashboardLayout />;
};

export default AdminDashboard;