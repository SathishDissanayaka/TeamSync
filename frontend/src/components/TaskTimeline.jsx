import React from 'react';
import {Box,VStack,HStack,Text,Progress,Badge,useColorModeValue,} from '@chakra-ui/react';

const TaskTimeline = ({ task }) => {
  const bgColor = useColorModeValue('white', 'gray.700');
  const borderColor = useColorModeValue('gray.200', 'gray.600');

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending': return 'yellow';
      case 'ongoing': return 'blue';
      case 'completed': return 'green';
      case 'declined': return 'red';
      default: return 'gray';
    }
  };

  return (
    <Box
      p={4}
      bg={bgColor}
      borderRadius="md"
      boxShadow="sm"
      borderWidth="1px"
      borderColor={borderColor}
    >
      <VStack align="stretch" spacing={4}>
        <HStack justify="space-between">
          <Text fontWeight="bold">{task.taskName}</Text>
          <Badge colorScheme={getStatusColor(task.status)}>{task.status}</Badge>
        </HStack>

        <Box>
          <Text fontSize="sm" color="gray.500">Progress</Text>
          <Progress value={task.progress} colorScheme="blue" size="sm" />
          <Text fontSize="xs" color="gray.500" mt={1}>{task.progress}%</Text>
        </Box>

        <VStack align="stretch" spacing={2}>
          <Text fontSize="sm" fontWeight="medium">Timeline</Text>
          {task.progressUpdates && task.progressUpdates.map((update, index) => (
            <Box
              key={index}
              p={2}
              bg={useColorModeValue('gray.50', 'gray.600')}
              borderRadius="md"
            >
              <HStack justify="space-between">
                <Text fontSize="sm">{update.comment}</Text>
                <Text fontSize="xs" color="gray.500">
                  {new Date(update.updatedAt).toLocaleDateString()}
                </Text>
              </HStack>
              <Progress
                value={update.percentage}
                colorScheme="blue"
                size="xs"
                mt={1}
              />
            </Box>
          ))}
        </VStack>

        <Box>
          <Text fontSize="sm" color="gray.500">Deadline</Text>
          <Text>{new Date(task.deadline).toLocaleDateString()}</Text>
        </Box>
      </VStack>
    </Box>
  );
};

export default TaskTimeline; 