import React from 'react';
import {
  Card,
  CardContent,
  Typography,
  Box,
  Divider,
  Chip
} from '@mui/material';
import { FiStar, FiAward } from 'react-icons/fi';

const FeedbackSection = ({ feedback }) => {
  return (
    <Card className="shadow-lg rounded-xl border border-gray-200">
      <CardContent className="p-6">
        <Typography variant="h6" className="font-bold text-gray-800 mb-4">
          Feedback & Recognition
        </Typography>
        
        {feedback.map((item, index) => (
          <Box key={index} className="mb-4">
            <Box className="flex items-center mb-2">
              {[...Array(5)].map((_, i) => (
                <FiStar key={i} className="text-yellow-400" />
              ))}
            </Box>
            <Typography variant="body2" className="italic mb-1">
              "{item.quote}"
            </Typography>
            <Box className="flex justify-between">
              <Typography variant="caption" className="text-gray-600">
                - {item.client}
              </Typography>
              <Typography variant="caption" className="text-gray-500">
                {item.date}
              </Typography>
            </Box>
          </Box>
        ))}
        
        <Divider className="my-4" />
        
        <Box>
          <Typography variant="subtitle2" className="text-gray-800 mb-2">
            Awards & Recognition
          </Typography>
          <Box className="flex items-center space-x-2">
            <FiAward className="text-amber-500" />
            <Typography variant="body2">
              Employee of the Month - January 2025
            </Typography>
          </Box>
        </Box>
      </CardContent>
    </Card>
  );
};

export default FeedbackSection;