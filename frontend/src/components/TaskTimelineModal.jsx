import React from 'react';
import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalCloseButton,
  ModalBody,
  VStack,
  HStack,
  Text,
  Progress,
  Box,
  useColorModeValue,
  Badge,
} from '@chakra-ui/react';

const TaskTimelineModal = ({ isOpen, onClose, task, users }) => {
  const bgColor = useColorModeValue('white', 'gray.700');
  const borderColor = useColorModeValue('gray.200', 'gray.600');

  if (!task) return null;

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'High': return 'red';
      case 'Medium': return 'orange';
      case 'Low': return 'green';
      default: return 'gray';
    }
  };

  const getRequesterName = (assignedBy) => {
    return users?.[assignedBy] || assignedBy;
  };

  const getAssigneeName = (assignee) => {
    return users?.[assignee] || assignee;
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="md">
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>Task Progress Timeline</ModalHeader>
        <ModalCloseButton />
        <ModalBody pb={6}>
          <VStack align="stretch" spacing={4}>
            <Box>
              <HStack justify="space-between" mb={2}>
                <Text fontWeight="bold" fontSize="lg">{task.taskName}</Text>
                <Badge colorScheme={getPriorityColor(task.priority)}>{task.priority}</Badge>
              </HStack>
              <Text color="gray.500" fontSize="sm">{task.description}</Text>
            </Box>

            <Box>
              <Text fontSize="sm" color="gray.500">Task Details</Text>
              <HStack spacing={4} mt={1}>
                <Box>
                  <Text fontSize="xs" color="gray.500">Requester</Text>
                  <Text fontSize="sm">{getRequesterName(task.assignedBy)}</Text>
                </Box>
                <Box>
                  <Text fontSize="xs" color="gray.500">Assignee</Text>
                  <Text fontSize="sm">{getAssigneeName(task.assignee)}</Text>
                </Box>
              </HStack>
            </Box>

            <Box>
              <Text fontSize="sm" color="gray.500">Overall Progress</Text>
              <Progress value={task.progress} colorScheme="blue" size="sm" />
              <Text fontSize="xs" color="gray.500" mt={1}>{task.progress}%</Text>
            </Box>

            <VStack align="stretch" spacing={2}>
              <Text fontSize="sm" fontWeight="medium">Progress History</Text>
              {task.progressUpdates && task.progressUpdates.map((update, index) => (
                <Box
                  key={index}
                  p={3}
                  bg={useColorModeValue('gray.50', 'gray.600')}
                  borderRadius="md"
                  borderWidth="1px"
                  borderColor={borderColor}
                >
                  <HStack justify="space-between" mb={1}>
                    <Text fontSize="sm" fontWeight="medium">{update.percentage}%</Text>
                    <Text fontSize="xs" color="gray.500">
                      {new Date(update.updatedAt).toLocaleString()}
                    </Text>
                  </HStack>
                  {update.comment && (
                    <Text fontSize="sm" color="gray.600">{update.comment}</Text>
                  )}
                  <Progress
                    value={update.percentage}
                    colorScheme="blue"
                    size="xs"
                    mt={2}
                  />
                </Box>
              ))}
            </VStack>

            <Box>
              <Text fontSize="sm" color="gray.500">Deadline</Text>
              <Text>{new Date(task.deadline).toLocaleDateString()}</Text>
            </Box>
          </VStack>
        </ModalBody>
      </ModalContent>
    </Modal>
  );
};

export default TaskTimelineModal; 