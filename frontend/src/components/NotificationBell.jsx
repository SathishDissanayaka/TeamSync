// src/components/NotificationBell.jsx
import React, { useEffect, useState } from 'react';
import {
  IconButton,
  Popover,
  PopoverTrigger,
  PopoverContent,
  PopoverArrow,
  PopoverCloseButton,
  PopoverBody,
  Text,
  Box,
  Spinner,
} from '@chakra-ui/react';
import { FiBell } from 'react-icons/fi';
import axios from 'axios';

export default function NotificationBell({
  companyID,
  iconSize = 20,      // default icon pixel size
  buttonSize = 'sm',  // default Chakra size token
}) {
  const [notes, setNotes]     = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const res = await axios.get(
          `http://localhost:5000/api/requests/assigned/${companyID}`
        );
        setNotes(res.data.slice(0, 5));
      } catch (err) {
        console.error('Error loading notifications', err);
      } finally {
        setLoading(false);
      }
    })();
  }, [companyID]);

  return (
    <Popover placement="bottom-end">
      <PopoverTrigger>
        <IconButton
          aria-label="Notifications"
          icon={<FiBell size={iconSize} />}
          variant="ghost"
          size={buttonSize}
        />
      </PopoverTrigger>
      <PopoverContent w="sm">
        <PopoverArrow />
        <PopoverCloseButton />
        <PopoverBody>
          {loading ? (
            <Box textAlign="center"><Spinner /></Box>
          ) : notes.length === 0 ? (
            <Text>No notifications</Text>
          ) : (
            notes.map((n, i) => (
              <Text key={i} py="1" borderBottom="1px solid" borderColor="gray.200">
                New request: {n.taskName}
              </Text>
            ))
          )}
        </PopoverBody>
      </PopoverContent>
    </Popover>
  );
}
