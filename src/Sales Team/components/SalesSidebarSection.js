import React, { useState } from "react";
import { ListItem, ListItemButton, ListItemIcon, ListItemText } from "@mui/material";
import { styled } from "@mui/material/styles";
import AddClientModal from './AddClientModal';

const SalesSidebarSection = ({ section, activeSection, setActiveSection, activeSubSection, setActiveSubSection }) => {
    const [addClientOpen, setAddClientOpen] = useState(false);
    
    const handleSectionClick = () => {
      setActiveSection(section.title);
      // For Dashboard, clear subsection. For others, set first subsection if none selected
      if (section.title === "Dashboard") {
        setActiveSubSection(null);
      } else if (!section.items.includes(activeSubSection)) {
        setActiveSubSection(section.items[0]);
      }
    };
    
    return (
    <React.Fragment key={section.title}>
      <ListItem disablePadding>
        <ListItemButton
          selected={activeSection === section.title}
          onClick={handleSectionClick}
          sx={{
            borderRadius: '8px',
            mb: 1,
            '&.Mui-selected': {
              backgroundColor: '#4f46e5',
              '&:hover': {
                backgroundColor: '#4f46e5',
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
        </ListItemButton>
      </ListItem>
      
      {activeSection === section.title && section.title !== "Dashboard" && section.items.map((item) => (
        <ListItem key={item} disablePadding sx={{ pl: 4 }}>
          <ListItemButton
            selected={activeSubSection === item}
            sx={{
              borderRadius: '6px',
              py: 0.5,
              '&.Mui-selected': {
                backgroundColor: 'rgba(255, 255, 255, 0.12)',
              },
              '&:hover': {
                backgroundColor: 'rgba(255, 255, 255, 0.05)',
              },
            }}
            onClick={() => item === "Add Client" ? setAddClientOpen(true) : setActiveSubSection(item)}
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

      <AddClientModal 
        open={addClientOpen} 
        onClose={() => setAddClientOpen(false)} 
      />
    </React.Fragment>
  );
};

export default SalesSidebarSection;