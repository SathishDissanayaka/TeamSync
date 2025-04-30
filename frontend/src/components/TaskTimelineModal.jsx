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
} from '@chakra-ui/react';

const TaskTimelineModal = ({ isOpen, onClose, task }) => {
  const bgColor = useColorModeValue('white', 'gray.700');
  const borderColor = useColorModeValue('gray.200', 'gray.600');

  if (!task) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="md">
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>Task Progress Timeline</ModalHeader>
        <ModalCloseButton />
        <ModalBody pb={6}>
          <VStack align="stretch" spacing={4}>
            <Box>
              <Text fontWeight="bold" fontSize="lg">{task.taskName}</Text>
              <Text color="gray.500" fontSize="sm">{task.description}</Text>
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