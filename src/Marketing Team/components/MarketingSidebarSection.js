import React, { useState } from "react";
import { ListItem, ListItemButton, ListItemIcon, ListItemText, Collapse } from "@mui/material";
import { styled } from "@mui/material/styles";
import { Badge } from "@mui/material";
import { FiChevronDown, FiChevronRight } from "react-icons/fi";

const SidebarSection = ({ section, index, activeSection, setActiveSection, activeSubsection, setActiveSubsection }) => {
  const [expanded, setExpanded] = useState(false);

  const hasSubsections = section.items && section.items.length > 0;

  return (
    <React.Fragment key={section.title}>
      <ListItem disablePadding>
        <ListItemButton
          selected={activeSection === section.title && !activeSubsection}
          onClick={() => {
            if (hasSubsections) {
              setExpanded(!expanded);
            } else {
              setActiveSection(section.title);
              setActiveSubsection(null);
            }
          }}
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
      
      <Collapse in={expanded || (activeSubsection && section.items.includes(activeSubsection))} timeout="auto" unmountOnExit>
        {section.items.map((item) => (
          <ListItem key={item} disablePadding sx={{ pl: 4 }}>
            <ListItemButton
              selected={activeSubsection === item}
              onClick={() => {
                setActiveSection(section.title);
                setActiveSubsection(item);
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
                  color: activeSubsection === item ? 'white' : 'rgba(255, 255, 255, 0.7)'
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