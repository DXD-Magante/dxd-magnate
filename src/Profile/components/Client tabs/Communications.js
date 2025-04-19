import React from 'react';
import {
  Card, CardContent, Typography, Box, Button,
  List, ListItem, Paper, Chip
} from '@mui/material';
import { FiMail, FiUsers, FiMessageSquare } from 'react-icons/fi';

const CommunicationTab = ({ communications, formatDate }) => {
  return (
    <Card className="shadow-lg rounded-xl border border-gray-200 mb-6">
      <CardContent className="p-6">
        <Typography variant="h6" className="font-bold text-gray-800 mb-4">
          All Communications
        </Typography>
        
        <Box className="flex space-x-2 mb-4">
          <Button variant="contained" size="small">All</Button>
          <Button variant="outlined" size="small" startIcon={<FiMail />}>Emails</Button>
          <Button variant="outlined" size="small" startIcon={<FiMessageSquare />}>Messages</Button>
          <Button variant="outlined" size="small" startIcon={<FiUsers />}>Meetings</Button>
        </Box>
        
        <List className="space-y-3">
          {communications.map((comm) => (
            <ListItem key={comm.id} className="p-0">
              <Paper className="w-full p-3 rounded-lg hover:shadow-sm">
                <Box className="flex items-start">
                  <Box className="mr-3 mt-1">
                    {comm.type === "Email" ? (
                      <FiMail className="text-blue-500" />
                    ) : comm.type === "Meeting" ? (
                      <FiUsers className="text-purple-500" />
                    ) : (
                      <FiMessageSquare className="text-green-500" />
                    )}
                  </Box>
                  <Box className="flex-1">
                    <Typography variant="subtitle2" className="font-medium">
                      {comm.subject}
                    </Typography>
                    <Typography variant="body2" className="text-gray-600">
                      {comm.summary}
                    </Typography>
                    <Typography variant="caption" className="text-gray-500 mt-1">
                      {formatDate(comm.date)}
                    </Typography>
                  </Box>
                  <Button
                    variant="text"
                    size="small"
                    className="text-indigo-600 hover:bg-indigo-50"
                  >
                    View
                  </Button>
                </Box>
              </Paper>
            </ListItem>
          ))}
        </List>
      </CardContent>
    </Card>
  );
};

export default CommunicationTab;