import React, { useState, useEffect } from 'react';
import {
  Box, Button, Table, Thead, Tbody, Tr, Th, Td, useDisclosure, Modal, ModalOverlay, ModalContent, ModalHeader, ModalCloseButton, ModalBody,
  ModalFooter, FormControl, FormLabel, Input, Textarea, Select, useToast, Heading, Text, Menu, MenuButton, MenuList, MenuItem, IconButton
} from '@chakra-ui/react';
import { FiMoreVertical } from 'react-icons/fi';
import axios from 'axios';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import EvaluationModals from '../components/EvaluationModals';
import DatePicker from 'react-datepicker'; 
import 'react-datepicker/dist/react-datepicker.css'; 

const Evaluation = () => {
  const [employees, setEmployees] = useState([]);
  const [evaluations, setEvaluations] = useState([]);
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [grade, setGrade] = useState('');
  const [notes, setNotes] = useState('');
  const [furtherAction, setFurtherAction] = useState('');
  const [filterDate, setFilterDate] = useState(new Date()); 
  const [sort, setSort] = useState('none');
  const [searchTerm, setSearchTerm] = useState('');
  const { isOpen, onOpen, onClose } = useDisclosure();
  const { isOpen: isEditOpen, onOpen: onEditOpen, onClose: onEditClose } = useDisclosure();
  const { isOpen: isHistoryOpen, onOpen: onHistoryOpen, onClose: onHistoryClose } = useDisclosure();
  const toast = useToast();

  useEffect(() => {
    fetchEmployees();
    fetchEvaluations();
  }, [filterDate]); 

  const fetchEmployees = async () => {
    try {
      const res = await axios.get('http://localhost:5000/api/employeeStat/users');
      const filteredEmployees = res.data.filter(employee => employee.role !== 'Admin' && employee.role !== 'BusinessOwner');
      setEmployees(filteredEmployees);
    } catch (err) {
      console.error('Failed to fetch employees:', err);
    }
  };

  const fetchEvaluations = async () => {
    try {
      const monthYear = filterDate.toLocaleString('default', { month: 'long', year: 'numeric' }); 
      const url = `http://localhost:5000/api/evaluations/${monthYear}`;
      const res = await axios.get(url);
      setEvaluations(res.data);
    } catch (err) {
      console.error('Failed to fetch evaluations:', err);
    }
  };

  const handleEvaluate = (employee) => {
    setSelectedEmployee(employee);
    const evaluation = evaluations.find((evaluation) => evaluation.employee === employee.fullName);
    if (evaluation) {
      setGrade(evaluation.grade);
      setNotes(evaluation.notes);
      setFurtherAction(evaluation.furtherAction);
    } else {
      setGrade('');
      setNotes('');
      setFurtherAction('');
    }
    onOpen();
  };

  const handleEdit = (employee) => {
    setSelectedEmployee(employee);
    const evaluation = evaluations.find((evaluation) => evaluation.employee === employee.fullName);
    if (evaluation) {
      setGrade(evaluation.grade);
      setNotes(evaluation.notes);
      setFurtherAction(evaluation.furtherAction);
    }
    onEditOpen();
  };

  const handleSaveEvaluation = async () => {
    if (!grade || !notes) {
      toast({
        title: 'Validation Error',
        description: 'Grade and Notes are required.',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
      return;
    }

    try {
      const evaluationData = {
        employee: selectedEmployee.fullName,
        grade,
        notes,
        furtherAction,
        month: filterDate.toLocaleString('default', { month: 'long', year: 'numeric' }), 
      };

      await axios.post('http://localhost:5000/api/evaluations', evaluationData);
      toast({
        title: 'Evaluation saved.',
        description: 'The evaluation has been saved successfully.',
        status: 'success',
        duration: 5000,
        isClosable: true,
      });
      fetchEvaluations();
      onClose();
    } catch (err) {
      console.error('Failed to save evaluation:', err);
      toast({
        title: 'Error',
        description: 'Failed to save evaluation.',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    }
  };

  const handleUpdateEvaluation = async () => {
    if (!grade || !notes) {
      toast({
        title: 'Validation Error',
        description: 'Grade and Notes are required.',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
      return;
    }

    try {
      const evaluationData = {
        grade,
        notes,
        furtherAction,
      };

      await axios.put(`http://localhost:5000/api/evaluations/${selectedEmployee.fullName}`, evaluationData);
      toast({
        title: 'Evaluation updated.',
        description: 'The evaluation has been updated successfully.',
        status: 'success',
        duration: 5000,
        isClosable: true,
      });
      fetchEvaluations();
      onEditClose();
    } catch (err) {
      console.error('Failed to update evaluation:', err);
      toast({
        title: 'Error',
        description: 'Failed to update evaluation.',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    }
  };

  const handleDeleteEvaluation = async (employee) => {
    try {
      await axios.delete(`http://localhost:5000/api/evaluations/${employee.fullName}`);
      toast({
        title: 'Evaluation deleted.',
        description: 'The evaluation has been deleted successfully.',
        status: 'success',
        duration: 5000,
        isClosable: true,
      });
      fetchEvaluations();
    } catch (err) {
      console.error('Failed to delete evaluation:', err);
      toast({
        title: 'Error',
        description: 'Failed to delete evaluation.',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    }
  };

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
  };

  const handleSortChange = (e) => {
    setSort(e.target.value);
  };

  const handleEmployeeClick = (employee) => {
    setSelectedEmployee(employee);
    onHistoryOpen();
  };

  const handleExportPDF = () => {
    const doc = new jsPDF();
    const title = `Employee Evaluations - ${filterDate.toLocaleString('default', { month: 'long', year: 'numeric' })}`; // Change to use filterDate
    doc.text(title, 20, 10);
    autoTable(doc, {
      head: [['Employee', 'Role', 'Acceptance Rate', 'Completed Rate', 'Ontime Rate', 'Grade']],
      body: sortedEmployees.map(employee => {
        const evaluation = evaluations.find(evaluation => evaluation.employee === employee.fullName && evaluation.month === filterDate.toLocaleString('default', { month: 'long', year: 'numeric' })); // Change to use filterDate
        const requests = employee.requests.filter(request => {
          const requestDate = new Date(request.createdAt);
          const startDate = new Date(filterDate.getFullYear(), filterDate.getMonth(), 1); 
          const endDate = new Date(filterDate.getFullYear(), filterDate.getMonth() + 1, 0); 
          return requestDate >= startDate && requestDate <= endDate;
        });
        const accepted = requests.filter(request => request.status === 'ongoing').length;
        const declined = requests.filter(request => request.status === 'declined').length;
        const completed = requests.filter(request => request.status === 'completed').length;
        const acceptanceRate = (accepted / (accepted + declined)) * 100 || 0;
        const completedRate = (completed / requests.length) * 100 || 0;
        const ontimeRate = (requests.filter(request => request.status === 'completed' && new Date(request.deadline) >= new Date(request.completedOn)).length / completed) * 100 || 0;
        return [
          employee.fullName,
          employee.role,
          `${acceptanceRate.toFixed(2)}%`,
          `${completedRate.toFixed(2)}%`,
          `${ontimeRate.toFixed(2)}%`,
          evaluation ? evaluation.grade : 'N/A',
        ];
      }),
    });
    doc.save(`${title}.pdf`);
  };

  const filteredEmployees = employees.filter(employee =>
    employee.fullName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const sortedEmployees = [...filteredEmployees].sort((a, b) => {
    if (sort === 'grade') {
      const aEvaluation = evaluations.find(evaluation => evaluation.employee === a.fullName);
      const bEvaluation = evaluations.find(evaluation => evaluation.employee === b.fullName);
      return (bEvaluation?.grade || '').localeCompare(aEvaluation?.grade || '');
    } else if (sort === 'status') {
      const aEvaluation = evaluations.find(evaluation => evaluation.employee === a.fullName);
      const bEvaluation = evaluations.find(evaluation => evaluation.employee === b.fullName);
      return (aEvaluation ? 1 : -1) - (bEvaluation ? 1 : -1);
    }
    return 0;
  });

  //validation to stop evaluation of future dates
  const isFutureDate = filterDate > new Date();

  return (
    <Box p="8">
      <Heading mb="8">Employee Evaluations</Heading>
      <Box bg="blue.50" p="6" borderRadius="md" minH="80vh">
        <Box display="flex" mb="4">
          <Input
            placeholder="Search by employee name"
            value={searchTerm}
            onChange={handleSearchChange}
            flex="1"
            mr="4"
            outline={"1px solid"}
          />
          <Button onClick={handleExportPDF} colorScheme="blue">
            Export PDF
          </Button>
        </Box>
        <FormControl mb="4" outline={"1px solid black"} borderRadius={"md"} padding={"3"}> 
          <FormLabel>Filter by Month and Year</FormLabel> 
          <DatePicker
            selected={filterDate}
            onChange={(date) => setFilterDate(date)}
            dateFormat="MM/yyyy"
            showMonthYearPicker
            outline={"1px solid black"}
          /> 
        </FormControl>
        <FormControl mb="4">
          <FormLabel>Sort By</FormLabel>
          <Select value={sort} onChange={handleSortChange} outline={"1px solid"}>
            <option value="none">None</option>
            <option value="grade">Grade (Highest First)</option>
            <option value="status">Evaluation Status (Not Evaluated First)</option>
          </Select>
        </FormControl>
        <Table variant="simple" >
          <Thead>
            <Tr>
              <Th>Employee</Th>
              <Th>Role</Th>
              <Th>Acceptance Rate</Th>
              <Th>Completion Rate</Th>
              <Th>Ontime Rate</Th>
              <Th>Grade</Th>
              <Th>Action</Th>
            </Tr>
          </Thead>
          <Tbody>
            {sortedEmployees.map((employee) => {
              const evaluation = evaluations.find((evaluation) => evaluation.employee === employee.fullName && evaluation.month === filterDate.toLocaleString('default', { month: 'long', year: 'numeric' })); // Change to use filterDate
              const requests = employee.requests.filter(request => {
                const requestDate = new Date(request.createdAt);
                const startDate = new Date(filterDate.getFullYear(), filterDate.getMonth(), 1); 
                const endDate = new Date(filterDate.getFullYear(), filterDate.getMonth() + 1, 0); 
                return requestDate >= startDate && requestDate <= endDate;
              });
              const accepted = requests.filter(request => request.status === 'ongoing').length;
              const declined = requests.filter(request => request.status === 'declined').length;
              const completed = requests.filter(request => request.status === 'completed').length;
              const acceptanceRate = (accepted / (accepted + declined)) * 100 || 0;
              const completedRate = (completed / requests.length) * 100 || 0;
              const ontimeRate = (requests.filter(request => request.status === 'completed' && new Date(request.deadline) >= new Date(request.completedOn)).length / completed) * 100 || 0;
              return (
                <Tr key={employee.fullName}>
                  <Td>
                    <Button variant="link" onClick={() => handleEmployeeClick(employee)}>
                      {employee.fullName}
                    </Button>
                  </Td>
                  <Td>{employee.role}</Td>
                  <Td>{`${acceptanceRate.toFixed(0)}%`}</Td>
                  <Td>{`${completedRate.toFixed(0)}%`}</Td>
                  <Td>{`${ontimeRate.toFixed(0)}%`}</Td>
                  <Td>{evaluation ? evaluation.grade : 'N/A'}</Td>
                  <Td>
                    <Box display="flex" alignItems="center">
                      <Button colorScheme="blue" onClick={() => handleEvaluate(employee)} disabled={!!evaluation || isFutureDate}>
                        {evaluation ? 'Evaluated' : 'Evaluate'}
                      </Button>
                      <Menu>
                        <MenuButton as={IconButton} icon={<FiMoreVertical />} variant="outline" ml="2" />
                        <MenuList>
                          <MenuItem onClick={() => handleEdit(employee)} isDisabled={!evaluation}>Edit</MenuItem>
                          <MenuItem onClick={() => handleDeleteEvaluation(employee)} isDisabled={!evaluation}>Delete</MenuItem>
                        </MenuList>
                      </Menu>
                    </Box>
                  </Td>
                </Tr>
              );
            })}
          </Tbody>
        </Table>
      </Box>

      <EvaluationModals
        isOpen={isOpen}
        onClose={onClose}
        isEditOpen={isEditOpen}
        onEditClose={onEditClose}
        selectedEmployee={selectedEmployee}
        grade={grade}
        setGrade={setGrade}
        notes={notes}
        setNotes={setNotes}
        furtherAction={furtherAction}
        setFurtherAction={setFurtherAction}
        handleSaveEvaluation={handleSaveEvaluation}
        handleUpdateEvaluation={handleUpdateEvaluation}
      />

      <Modal isOpen={isHistoryOpen} onClose={onHistoryClose}>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Evaluation Details for {selectedEmployee?.fullName}</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            {evaluations
              .filter(evaluation => evaluation.employee === selectedEmployee?.fullName)
              .map((evaluation, index) => (
                <Box key={index} mb="4" p="4" borderWidth="1px" borderRadius="md">
                  <Text><strong>Grade:</strong> {evaluation.grade}</Text>
                  <Text><strong>Notes:</strong> {evaluation.notes}</Text>
                  <Text><strong>Further Action:</strong> {evaluation.furtherAction}</Text>
                  <Text><strong>Timeframe:</strong> {evaluation.month}</Text>
                </Box>
              ))}
          </ModalBody>
          <ModalFooter>
            <Button variant="ghost" onClick={onHistoryClose}>
              Close
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </Box>
  );
};

export default Evaluation;