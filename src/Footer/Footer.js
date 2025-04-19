// components/Footer.js
import React from "react";
import { 
  Box, 
  Typography, 
  Container, 
  Grid 
} from "@mui/material";
import { 
  FaFacebook, 
  FaTwitter, 
  FaLinkedin, 
  FaInstagram 
} from "react-icons/fa";

const Footer = () => {
  const socialIcons = [
    { icon: <FaFacebook />, url: "#" },
    { icon: <FaTwitter />, url: "#" },
    { icon: <FaLinkedin />, url: "#" },
    { icon: <FaInstagram />, url: "#" }
  ];

  const links = [
    {
      title: "Company",
      items: ["About Us", "Careers", "Blog", "Contact"]
    },
    {
      title: "Services",
      items: ["Web Development", "Digital Marketing", "UI/UX Design", "Cloud Solutions"]
    },
    {
      title: "Legal",
      items: ["Privacy Policy", "Terms of Service", "Cookie Policy"]
    }
  ];

  return (
    <Box className="bg-gray-900 text-white pt-16 pb-8">
      <Container maxWidth="lg">
        <Grid container spacing={8}>
          <Grid item xs={12} md={4}>
            <Typography variant="h5" className="font-bold mb-4">
              DXD Magnate
            </Typography>
            <Typography variant="body2" className="mb-6 text-gray-400">
              Delivering exceptional digital experiences and solutions to help businesses thrive in the digital age.
            </Typography>
            <Box className="flex space-x-4">
              {socialIcons.map((social, index) => (
                <a 
                  key={index} 
                  href={social.url} 
                  className="text-gray-400 hover:text-white transition-colors duration-300 text-xl"
                >
                  {social.icon}
                </a>
              ))}
            </Box>
          </Grid>
          
          {links.map((link, index) => (
            <Grid item xs={12} sm={4} md={2} key={index}>
              <Typography variant="h6" className="font-bold mb-4">
                {link.title}
              </Typography>
              <Box className="space-y-2">
                {link.items.map((item, itemIndex) => (
                  <Typography 
                    key={itemIndex} 
                    variant="body2" 
                    className="text-gray-400 hover:text-white cursor-pointer transition-colors duration-300"
                  >
                    {item}
                  </Typography>
                ))}
              </Box>
            </Grid>
          ))}
          
          <Grid item xs={12} sm={4} md={2}>
            <Typography variant="h6" className="font-bold mb-4">
              Contact
            </Typography>
            <Typography variant="body2" className="text-gray-400">
              info@dxdmagnate.com
            </Typography>
            <Typography variant="body2" className="text-gray-400 mt-2">
              +1 (555) 123-4567
            </Typography>
          </Grid>
        </Grid>
        
        <Box className="border-t border-gray-800 mt-12 pt-8 text-center">
          <Typography variant="body2" className="text-gray-400">
            © {new Date().getFullYear()} DXD Magnate. All rights reserved.
          </Typography>
        </Box>
      </Container>
    </Box>
  );
};

export default Footer;