import { 
    AppBar, 
    Toolbar, 
    Container, 
    Typography, 
    Button, 
    Box, 
    IconButton, 
    Drawer, 
    List, 
    ListItem, 
    ListItemText, 
    Divider,
    useTheme,
    useMediaQuery
  } from "@mui/material";
  import { FiArrowRight, FiMenu } from "react-icons/fi";
  import { useState } from "react";
  import { Link } from "react-router-dom";
  
  const HomeNavbar = () => {
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('md'));
    const [mobileOpen, setMobileOpen] = useState(false);
  
    const handleDrawerToggle = () => {
      setMobileOpen(!mobileOpen);
    };
  
    const navItems = [
      { name: 'Home', path: '/home' },
      { name: 'About', path: '/about' },
      { name: 'Services', path: '/services' },
      { name: 'Contact', path: '/contact' },
    ];
  
    const drawer = (
      <Box 
        sx={{ 
          width: 250,
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          padding: '20px 0',
          backgroundColor: 'background.paper'
        }}
      >
        <Box sx={{ padding: '0 20px', marginBottom: '20px' }}>
          <Typography 
            variant="h6" 
            sx={{ 
              fontWeight: 700, 

              display: 'flex',
              alignItems: 'center'
            }}
          >
            <Box 
              component="img" 
              src={require('../../assets/dxd-logo.png')} 
              alt="DXD Magnate Logo" 
              sx={{ 
                height: 30, 
                marginRight: 1,
               
              }} 
            />
            DXD MAGNATE
          </Typography>
        </Box>
        <Divider />
        <List>
          {navItems.map((item) => (
            <ListItem 
              button 
              key={item.name}
              component={Link}
              to={item.path}
              sx={{
                '&:hover': {
                  backgroundColor: theme.palette.primary.light,
                  color: theme.palette.primary.contrastText,
                }
              }}
            >
              <ListItemText primary={item.name} />
            </ListItem>
          ))}
        </List>
        <Box sx={{ marginTop: 'auto', padding: '20px' }}>
          <Button 
            variant="contained" 
            fullWidth
            endIcon={<FiArrowRight />}
            component={Link}
            onClick={() => window.location.href ="/login"}
            sx={{
              backgroundColor: theme.palette.primary.main,
              color: 'white',
              '&:hover': {
                backgroundColor: theme.palette.primary.dark,
              }
            }}
          >
            Get Started
          </Button>
        </Box>
      </Box>
    );
  
    return (
      <AppBar 
        position="fixed" 
        elevation={0}
        sx={{ 
          backgroundColor: '#fff',
          color: theme.palette.text.primary,
          padding: '10px 0',
          transition: 'all 0.3s ease',
        }}
      >
        <Container maxWidth="lg">
          <Toolbar sx={{ justifyContent: 'space-between', padding: '0 !important' }}>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <Typography 
                variant="h6" 
                sx={{ 
                  fontWeight: 700,
                  display: 'flex',
                  alignItems: 'center',

                }}
                component={Link}
                to="/home"
              >
                <Box 
                  component="img" 
                  src={require('../../assets/dxd-logo.png')}
                  alt="DXD Magnate Logo" 
                  sx={{ 
                    height: 60, 
                    marginRight: 1,
                   
                  }} 
                />
                DXD MAGNATE
              </Typography>
            </Box>
  
            {isMobile ? (
              <>
                <IconButton
                  color="inherit"
                  aria-label="open drawer"
                  edge="end"
                  onClick={handleDrawerToggle}
                  sx={{ ml: 2 }}
                >
                  <FiMenu />
                </IconButton>
                <Drawer
                  anchor="right"
                  open={mobileOpen}
                  onClose={handleDrawerToggle}
                  ModalProps={{
                    keepMounted: true,
                  }}
                  sx={{
                    '& .MuiDrawer-paper': {
                      boxSizing: 'border-box',
                      width: 250,
                    },
                  }}
                >
                  {drawer}
                </Drawer>
              </>
            ) : (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                {navItems.map((item) => (
                  <Button
                    key={item.name}
                    component={Link}
                    to={item.path}
                    sx={{
                      color: theme.palette.text.primary,
                      fontWeight: 500,
                      textTransform: 'none',
                      fontSize: '1rem',
                      '&:hover': {
                        color: theme.palette.primary.main,
                        backgroundColor: 'transparent',
                      }
                    }}
                  >
                    {item.name}
                  </Button>
                ))}
                <Button
                  variant="contained"
                  endIcon={<FiArrowRight />}
                  component={Link}
                  onClick={() => window.location.href ="/login"}
                  sx={{
                    backgroundColor: theme.palette.primary.main,
                    color: 'white',
                    textTransform: 'none',
                    padding: '8px 20px',
                    borderRadius: '8px',
                    fontWeight: 500,
                    '&:hover': {
                      backgroundColor: theme.palette.primary.dark,
                    }
                  }}
                >
                  Get Started
                </Button>
              </Box>
            )}
          </Toolbar>
        </Container>
      </AppBar>
    );
  };
  
  export default HomeNavbar;