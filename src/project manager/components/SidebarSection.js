import React, { useState } from "react";
import { 
  ListItem, ListItemButton, ListItemIcon, 
  ListItemText, Collapse 
} from "@mui/material";
import { FiChevronDown, FiChevronRight } from "react-icons/fi";

const SidebarSection = ({ 
  section, 
  activeSection, 
  setActiveSection,
  activeSubSection,
  setActiveSubSection 
}) => {
  const [expanded, setExpanded] = useState(false);
  const hasSubsections = section.items && section.items.length > 0;

  const handleSectionClick = () => {
    if (hasSubsections) {
      setExpanded(!expanded);
      if (section.title === "Dashboard") {
        setActiveSection(section.title);
        setActiveSubSection(null);
      }
    } else {
      setActiveSection(section.title);
      setActiveSubSection(null);
    }
  };

  return (
    <React.Fragment key={section.title}>
      <ListItem disablePadding>
        <ListItemButton
          selected={activeSection === section.title && !activeSubSection}
          onClick={handleSectionClick}
          sx={{
            borderRadius: '8px',
            mb: 1,
            '&.Mui-selected': {
              backgroundColor: section.title === "Dashboard" ? '#4f46e5' : 'transparent',
              '&:hover': {
                backgroundColor: section.title === "Dashboard" ? '#4f46e5' : 'rgba(255, 255, 255, 0.08)',
              },
            },
            '&:hover': {
              backgroundColor: 'rgba(255, 255, 255, 0.08)',
            },
          }}
        >
          <ListItemIcon sx={{ color: 'inherit', minWidth: '40px' }}>
            {section.icon}
          </ListItemIcon>
          <ListItemText 
            primary={section.title} 
            primaryTypographyProps={{ 
              fontSize: '0.875rem',
              fontWeight: 'medium'
            }} 
          />
          {hasSubsections && (
            expanded ? <FiChevronDown size={16} /> : <FiChevronRight size={16} />
          )}
        </ListItemButton>
      </ListItem>
      
      <Collapse in={expanded || (activeSubSection && section.items.includes(activeSubSection))} timeout="auto" unmountOnExit>
        {section.items.map((item) => (
          <ListItem key={item} disablePadding sx={{ pl: 4 }}>
            <ListItemButton
              selected={activeSubSection === item}
              onClick={() => {
                setActiveSection(section.title);
                setActiveSubSection(item);
              }}
              sx={{
                borderRadius: '6px',
                py: 0.5,
                '&.Mui-selected': {
                  backgroundColor: '#4f46e5',
                  '&:hover': {
                    backgroundColor: '#4f46e5',
                  },
                },
                '&:hover': {
                  backgroundColor: 'rgba(255, 255, 255, 0.05)',
                },
              }}
            >
              <ListItemText 
                primary={item} 
                primaryTypographyProps={{ 
                  fontSize: '0.8125rem',
                  color: activeSubSection === item ? 'white' : 'rgba(255, 255, 255, 0.7)'
                }} 
                sx={{ my: 0 }} 
              />
            </ListItemButton>
          </ListItem>
        ))}
      </Collapse>
    </React.Fragment>
  );
};

export default SidebarSection;