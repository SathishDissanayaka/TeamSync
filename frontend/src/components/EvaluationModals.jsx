import React from 'react';
import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalCloseButton,
  ModalBody,
  ModalFooter,
  FormControl,
  FormLabel,
  Select,
  Textarea,
  Input,
  Button,
} from '@chakra-ui/react';

const EvaluationModals = ({
  isOpen,
  onClose,
  isEditOpen,
  onEditClose,
  selectedEmployee,
  grade,
  setGrade,
  notes,
  setNotes,
  furtherAction,
  setFurtherAction,
  handleSaveEvaluation,
  handleUpdateEvaluation,
  currentMonth,
  lastMonth,
  filter,
}) => {
  return (
    <>
      <Modal isOpen={isOpen} onClose={onClose}>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Evaluate {selectedEmployee?.fullName}</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <FormControl mb="4" isRequired>
              <FormLabel>Grade</FormLabel>
              <Select value={grade} onChange={(e) => setGrade(e.target.value)}>
                <option value="">Select grade</option>
                <option value="A">A</option>
                <option value="B">B</option>
                <option value="C">C</option>
                <option value="D">D</option>
                <option value="F">F</option>
              </Select>
            </FormControl>
            <FormControl mb="4" isRequired>
              <FormLabel>Notes</FormLabel>
              <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} />
            </FormControl>
            <FormControl mb="4">
              <FormLabel>Further Action</FormLabel>
              <Input value={furtherAction} onChange={(e) => setFurtherAction(e.target.value)} />
            </FormControl>
            <Input type="hidden" value={filter === 'thisMonth' ? currentMonth : lastMonth} readOnly />
          </ModalBody>
          <ModalFooter>
            <Button colorScheme="blue" mr="3" onClick={handleSaveEvaluation}>
              Save
            </Button>
            <Button variant="ghost" onClick={onClose}>
              Cancel
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      <Modal isOpen={isEditOpen} onClose={onEditClose}>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Edit Evaluation for {selectedEmployee?.fullName}</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <FormControl mb="4" isRequired>
              <FormLabel>Grade</FormLabel>
              <Select value={grade} onChange={(e) => setGrade(e.target.value)}>
                <option value="">Select grade</option>
                <option value="A">A</option>
                <option value="B">B</option>
                <option value="C">C</option>
                <option value="D">D</option>
                <option value="F">F</option>
              </Select>
            </FormControl>
            <FormControl mb="4" isRequired>
              <FormLabel>Notes</FormLabel>
              <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} />
            </FormControl>
            <FormControl mb="4">
              <FormLabel>Further Action</FormLabel>
              <Input value={furtherAction} onChange={(e) => setFurtherAction(e.target.value)} />
            </FormControl>
          </ModalBody>
          <ModalFooter>
            <Button colorScheme="blue" mr="3" onClick={handleUpdateEvaluation}>
              Update
            </Button>
            <Button variant="ghost" onClick={onEditClose}>
              Cancel
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>


    </>
  );
};

export default EvaluationModals;
