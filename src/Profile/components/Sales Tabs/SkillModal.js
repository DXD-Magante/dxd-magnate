import React, { useState } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Chip,
  IconButton,
  Autocomplete,
  Divider,
  Tooltip,
  Box,
  Typography
} from "@mui/material";
import { FiX, FiPlus, FiEdit2, FiCheck, FiSearch } from "react-icons/fi";

const SkillsModal = ({ open, onClose, currentSkills = [], onSave }) => {
  const [skills, setSkills] = useState(currentSkills);
  const [inputValue, setInputValue] = useState("");
  const [searchQuery, setSearchQuery] = useState("");

  // Common skills suggestions
  const skillSuggestions = [
    "Negotiation",
    "CRM Software",
    "Sales Strategy",
    "Cold Calling",
    "Presentation",
    "Closing Techniques",
    "Market Research",
    "Customer Relationship",
    "Product Knowledge",
    "Social Selling",
    "Time Management",
    "Active Listening",
    "Objection Handling",
    "Prospecting",
    "Sales Forecasting",
    "Contract Negotiation",
    "B2B Sales",
    "B2C Sales",
    "SaaS Sales",
    "Solution Selling"
  ];

  const filteredSuggestions = skillSuggestions.filter(skill =>
    skill.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleAddSkill = () => {
    if (inputValue.trim() && !skills.includes(inputValue.trim())) {
      setSkills([...skills, inputValue.trim()]);
      setInputValue("");
    }
  };

  const handleRemoveSkill = (skillToRemove) => {
    setSkills(skills.filter(skill => skill !== skillToRemove));
  };

  const handleAddSuggestedSkill = (skill) => {
    if (!skills.includes(skill)) {
      setSkills([...skills, skill]);
    }
  };

  const handleSave = () => {
    onSave(skills);
    onClose();
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: "12px",
          boxShadow: "0px 10px 30px rgba(0, 0, 0, 0.1)",
          overflow: "hidden"
        }
      }}
    >
      <DialogTitle className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white">
        <Box className="flex items-center justify-between">
          <Typography variant="h6" className="font-bold">
            <FiEdit2 className="inline mr-2" />
            Manage Your Skills
          </Typography>
          <IconButton onClick={onClose} className="text-white hover:bg-white/10">
            <FiX />
          </IconButton>
        </Box>
      </DialogTitle>

      <DialogContent className="py-6">
        <Box className="mb-6">
          <Typography variant="body2" className="text-gray-600 mb-2">
            Add or remove skills to showcase your expertise
          </Typography>
          
          {/* Current Skills */}
          <Box className="mb-4">
            <Typography variant="subtitle2" className="font-medium text-gray-700 mb-2">
              Your Current Skills ({skills.length})
            </Typography>
            {skills.length > 0 ? (
              <Box className="flex flex-wrap gap-2">
                {skills.map((skill) => (
                  <Chip
                    key={skill}
                    label={skill}
                    onDelete={() => handleRemoveSkill(skill)}
                    deleteIcon={<FiX size={14} />}
                    className="bg-indigo-100 text-indigo-800 hover:bg-indigo-200 transition-colors"
                    sx={{
                      "& .MuiChip-deleteIcon": {
                        color: "#4f46e5",
                        "&:hover": { color: "#4338ca" }
                      }
                    }}
                  />
                ))}
              </Box>
            ) : (
              <Typography variant="body2" className="text-gray-500 italic">
                No skills added yet
              </Typography>
            )}
          </Box>

          <Divider className="my-4" />

          {/* Add New Skill */}
          <Box className="mb-6">
            <Typography variant="subtitle2" className="font-medium text-gray-700 mb-2">
              Add New Skill
            </Typography>
            <Box className="flex gap-2">
              <TextField
                fullWidth
                variant="outlined"
                size="small"
                placeholder="Type a skill and press enter"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyPress={(e) => e.key === "Enter" && handleAddSkill()}
                InputProps={{
                  startAdornment: (
                    <FiSearch className="text-gray-400 mr-2" />
                  )
                }}
              />
              <Button
                variant="contained"
                color="primary"
                startIcon={<FiPlus />}
                onClick={handleAddSkill}
                disabled={!inputValue.trim()}
                className="bg-indigo-600 hover:bg-indigo-700 whitespace-nowrap"
              >
                Add
              </Button>
            </Box>
          </Box>

          {/* Suggested Skills */}
          <Box>
            <Typography variant="subtitle2" className="font-medium text-gray-700 mb-2">
              Suggested Skills
            </Typography>
            <TextField
              fullWidth
              variant="outlined"
              size="small"
              placeholder="Search suggested skills..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="mb-3"
              InputProps={{
                startAdornment: (
                  <FiSearch className="text-gray-400 mr-2" />
                )
              }}
            />
            <Box className="flex flex-wrap gap-2">
              {filteredSuggestions.map((skill) => (
                <Tooltip key={skill} title="Click to add" arrow>
                  <Chip
                    label={skill}
                    onClick={() => handleAddSuggestedSkill(skill)}
                    className={`cursor-pointer transition-all ${
                      skills.includes(skill)
                        ? "bg-green-100 text-green-800"
                        : "bg-gray-100 text-gray-800 hover:bg-gray-200"
                    }`}
                    icon={skills.includes(skill) ? <FiCheck className="text-green-500" /> : null}
                  />
                </Tooltip>
              ))}
              {filteredSuggestions.length === 0 && (
                <Typography variant="body2" className="text-gray-500 italic">
                  No matching skills found
                </Typography>
              )}
            </Box>
          </Box>
        </Box>
      </DialogContent>

      <DialogActions className="border-t px-6 py-4">
        <Button
          onClick={onClose}
          variant="outlined"
          className="border-gray-300 text-gray-700 hover:border-gray-400"
        >
          Cancel
        </Button>
        <Button
          onClick={handleSave}
          variant="contained"
          color="primary"
          startIcon={<FiCheck />}
          className="bg-indigo-600 hover:bg-indigo-700"
        >
          Save Skills
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default SkillsModal;