import React from 'react';
import { 
  Card, CardContent, Box, Typography, Button, 
  Dialog, DialogTitle, DialogContent, DialogActions, 
  TextField, CircularProgress, Chip 
} from '@mui/material';
import { FiPlus, FiX, FiFileText, FiUser } from 'react-icons/fi';
import { FaTools } from 'react-icons/fa';

const SkillsExpertise = ({
  skills,
  skillsLoading,
  newSkill,
  setNewSkill,
  addSkillOpen,
  setAddSkillOpen,
  handleAddSkill,
  handleRemoveSkill
}) => {
  return (
    <Card className="shadow-lg rounded-xl border border-gray-200 mb-6">
      <CardContent className="p-6">
        <Box className="flex justify-between items-center mb-4">
          <Typography variant="h6" className="font-bold text-gray-800">
            Skills & Expertise
          </Typography>
          <Button
            variant="outlined"
            size="small"
            startIcon={<FiPlus size={16} />}
            onClick={() => setAddSkillOpen(true)}
            sx={{
              borderColor: "#4f46e5",
              color: "#4f46e5",
              "&:hover": { backgroundColor: "#eef2ff" },
              textTransform: "none",
              borderRadius: "8px",
              padding: "6px 12px",
              fontSize: "0.875rem",
            }}
          >
            Add Skill
          </Button>
        </Box>

        {skillsLoading ? (
          <Box className="flex justify-center py-4">
            <CircularProgress size={24} color="inherit" />
          </Box>
        ) : skills.length > 0 ? (
          <Box className="flex flex-wrap gap-3">
            {skills.map((skill, index) => (
              <Chip
                key={index}
                label={skill}
                onDelete={() => handleRemoveSkill(skill)}
                sx={{
                  backgroundColor: "#eef2ff",
                  color: "#4f46e5",
                  fontWeight: 500,
                  fontSize: "0.875rem",
                  padding: "4px 8px",
                  borderRadius: "6px",
                  "& .MuiChip-deleteIcon": {
                    color: "#818cf8",
                    "&:hover": { color: "#4f46e5" },
                  },
                  "&:hover": {
                    backgroundColor: "#e0e7ff",
                  },
                }}
                deleteIcon={<FiX size={16} />}
              />
            ))}
          </Box>
        ) : (
          <Box className="text-center py-6">
            <FiFileText className="mx-auto text-gray-300 mb-3" size={40} />
            <Typography variant="body2" className="text-gray-500 mb-2">
              No skills added yet
            </Typography>
            <Typography variant="caption" className="text-gray-400">
              Add your expertise to showcase your strengths
            </Typography>
          </Box>
        )}
      </CardContent>

      <Dialog
        open={addSkillOpen}
        onClose={() => setAddSkillOpen(false)}
        maxWidth="xs"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: "12px",
            boxShadow: "0 10px 25px rgba(0, 0, 0, 0.1)",
          },
        }}
      >
        <DialogTitle
          sx={{
            backgroundColor: "#f9fafb",
            borderBottom: "1px solid #e5e7eb",
            fontWeight: 600,
            display: "flex",
            alignItems: "center",
            gap: "8px",
            padding: "16px 24px",
          }}
        >
          <FaTools className="text-indigo-600" />
          Add New Skill
        </DialogTitle>
        <DialogContent sx={{ padding: "24px" }}>
          <TextField
            fullWidth
            label="Skill Name"
            value={newSkill}
            onChange={(e) => setNewSkill(e.target.value)}
            variant="outlined"
            size="small"
            placeholder="e.g., Agile Methodology, React.js"
            InputProps={{
              startAdornment: (
                <FiUser className="mr-2 text-gray-400" size={18} />
              ),
              sx: {
                borderRadius: "8px",
              },
            }}
            sx={{
              "& .MuiOutlinedInput-root": {
                "& fieldset": {
                  borderColor: "#e5e7eb",
                },
                "&:hover fieldset": {
                  borderColor: "#a5b4fc",
                },
                "&.Mui-focused fieldset": {
                  borderColor: "#6366f1",
                },
              },
            }}
            onKeyPress={(e) => {
              if (e.key === "Enter") handleAddSkill();
            }}
          />
          <Box className="mt-3">
            <Typography variant="caption" className="text-gray-500">
              <strong>Suggestions:</strong> Project Planning, Risk Management, Team Leadership
            </Typography>
          </Box>
        </DialogContent>
        <DialogActions
          sx={{
            padding: "16px 24px",
            borderTop: "1px solid #e5e7eb",
          }}
        >
          <Button
            onClick={() => setAddSkillOpen(false)}
            variant="text"
            sx={{
              color: "#6b7280",
              "&:hover": {
                backgroundColor: "#f3f4f6",
              },
            }}
          >
            Cancel
          </Button>
          <Button
            onClick={handleAddSkill}
            variant="contained"
            disabled={!newSkill.trim() || skillsLoading}
            sx={{
              backgroundColor: "#4f46e5",
              "&:hover": { backgroundColor: "#4338ca" },
              borderRadius: "8px",
              padding: "8px 16px",
              textTransform: "none",
              fontWeight: 500,
            }}
            startIcon={
              skillsLoading ? (
                <CircularProgress size={16} color="inherit" />
              ) : null
            }
          >
            {skillsLoading ? "Adding..." : "Add Skill"}
          </Button>
        </DialogActions>
      </Dialog>
    </Card>
  );
};

export default SkillsExpertise;