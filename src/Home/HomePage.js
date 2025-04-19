import React, { useEffect } from "react";
import Aos from "aos";
import "aos/dist/aos.css";
import Slider from "react-slick";
import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";
import { 
  Box, 
  Button, 
  Typography, 
  Container, 
  Grid, 
  Card, 
  CardContent,
  useTheme,
  useMediaQuery
} from "@mui/material";
import { 
  FiArrowRight, 
  FiCheckCircle, 
  FiTrendingUp, 
  FiShield, 
  FiUsers,
  FiBriefcase,
  FiBarChart2,
  FiGlobe
} from "react-icons/fi";
import { 
  FaFacebook, 
  FaTwitter, 
  FaLinkedin, 
  FaInstagram 
} from "react-icons/fa";

// Hero Section
const HeroSection = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  return (
    <Box className="relative bg-gradient-to-r from-blue-900 to-blue-700 text-white py-20">
      <Container maxWidth="lg">
        <Grid container alignItems="center" spacing={6}>
          <Grid item xs={12} md={6}>
            <Typography 
              variant="h1" 
              className="text-4xl md:text-5xl font-bold mb-4"
              data-aos="fade-up"
            >
              Digital Transformation <span className="text-blue-300">Redefined</span>
            </Typography>
            <Typography 
              variant="subtitle1" 
              className="text-xl mb-8 text-blue-100"
              data-aos="fade-up" 
              data-aos-delay="100"
            >
              DXD Magnate delivers cutting-edge digital solutions to propel your business forward.
            </Typography>
            <Box className="flex flex-wrap gap-4" data-aos="fade-up" data-aos-delay="200">
              <Button 
                variant="contained" 
                color="primary" 
                size="large"
                endIcon={<FiArrowRight />}
                className="bg-blue-500 hover:bg-blue-600"
              >
                Get Started
              </Button>
              <Button 
                variant="outlined" 
                color="inherit" 
                size="large"
                className="text-white border-white hover:bg-white hover:bg-opacity-10"
              >
                Learn More
              </Button>
            </Box>
          </Grid>
          <Grid item xs={12} md={6} data-aos="fade-left">
            <Box className="relative">
              <img 
                src="https://images.unsplash.com/photo-1551288049-bebda4e38f71?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80" 
                alt="Digital Transformation" 
                className="rounded-lg shadow-2xl w-full"
              />
              <Box className="absolute -bottom-6 -right-6 bg-white p-4 rounded-lg shadow-lg hidden md:block">
                <Typography variant="h6" className="text-blue-900 font-bold">
                  +85% ROI
                </Typography>
                <Typography variant="body2" className="text-gray-600">
                  Average client results
                </Typography>
              </Box>
            </Box>
          </Grid>
        </Grid>
      </Container>
    </Box>
  );
};

// Features Section
const FeaturesSection = () => {
  const features = [
    {
      icon: <FiTrendingUp className="text-3xl text-blue-600" />,
      title: "Growth Strategies",
      description: "Data-driven approaches to accelerate your business growth."
    },
    {
      icon: <FiShield className="text-3xl text-blue-600" />,
      title: "Secure Solutions",
      description: "Enterprise-grade security for all our digital products."
    },
    {
      icon: <FiUsers className="text-3xl text-blue-600" />,
      title: "User-Centric Design",
      description: "Intuitive interfaces that drive engagement and conversion."
    },
    {
      icon: <FiBriefcase className="text-3xl text-blue-600" />,
      title: "Business Solutions",
      description: "Tailored software for your unique business needs."
    }
  ];

  return (
    <Box className="py-16 bg-gray-50">
      <Container maxWidth="lg">
        <Box className="text-center mb-16" data-aos="fade-up">
          <Typography variant="overline" className="text-blue-600 font-bold">
            OUR ADVANTAGES
          </Typography>
          <Typography variant="h3" className="font-bold mt-2">
            Why Choose DXD Magnate
          </Typography>
        </Box>
        
        <Grid container spacing={4} sx={{alignItems:'center', justifyContent:'center'}}>
          {features.map((feature, index) => (
            <Grid item xs={12} sm={6} md={3} key={index} data-aos="fade-up" data-aos-delay={index * 100}>
              <Card className="h-full hover:shadow-lg transition-shadow duration-300">
                <CardContent className="text-center p-6">
                  <Box className="mb-4">
                    {feature.icon}
                  </Box>
                  <Typography variant="h6" className="font-bold mb-2">
                    {feature.title}
                  </Typography>
                  <Typography variant="body2" color="textSecondary">
                    {feature.description}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Container>
    </Box>
  );
};

// Services Section
const ServicesSection = () => {
  const services = [
    {
      title: "Web Development",
      description: "Custom websites and web applications that drive results.",
      icon: <FiGlobe className="text-2xl text-blue-600" />
    },
    {
      title: "Digital Marketing",
      description: "Comprehensive strategies to grow your online presence.",
      icon: <FiBarChart2 className="text-2xl text-blue-600" />
    },
    {
      title: "UI/UX Design",
      description: "Beautiful, intuitive designs that enhance user experience.",
      icon: <FiUsers className="text-2xl text-blue-600" />
    },
    {
      title: "Cloud Solutions",
      description: "Scalable cloud infrastructure for your business needs.",
      icon: <FiTrendingUp className="text-2xl text-blue-600" />
    }
  ];

  return (
    <Box className="py-16">
      <Container maxWidth="lg">
        <Grid container alignItems="center" spacing={6}>
          <Grid item xs={12} md={6} data-aos="fade-right">
            <img 
              src="https://images.unsplash.com/photo-1522071820081-009f0129c71c?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80" 
              alt="Our Services" 
              className="rounded-lg shadow-xl w-full"
            />
          </Grid>
          <Grid item xs={12} md={6} data-aos="fade-left">
            <Typography variant="overline" className="text-blue-600 font-bold">
              OUR SERVICES
            </Typography>
            <Typography variant="h3" className="font-bold mt-2 mb-6">
              Comprehensive Digital Solutions
            </Typography>
            
            <Box className="space-y-6">
              {services.map((service, index) => (
                <Box key={index} className="flex items-start">
                  <Box className="bg-blue-100 p-2 rounded-full mr-4">
                    {service.icon}
                  </Box>
                  <Box>
                    <Typography variant="h6" className="font-bold">
                      {service.title}
                    </Typography>
                    <Typography variant="body2" color="textSecondary" className="mt-1">
                      {service.description}
                    </Typography>
                  </Box>
                </Box>
              ))}
            </Box>
            
            <Button 
              variant="outlined" 
              color="primary" 
              size="large"
              endIcon={<FiArrowRight />}
              className="mt-8"
            >
              Explore All Services
            </Button>
          </Grid>
        </Grid>
      </Container>
    </Box>
  );
};

// Testimonials Section
const TestimonialsSection = () => {
  const settings = {
    dots: true,
    infinite: true,
    speed: 500,
    slidesToShow: 1,
    slidesToScroll: 1,
    autoplay: true,
    autoplaySpeed: 5000,
    arrows: false
  };

  const testimonials = [
    {
      quote: "DXD Magnate transformed our digital presence and helped us triple our online revenue in just six months.",
      author: "Sarah Johnson",
      position: "CEO, TechNova"
    },
    {
      quote: "Their team's expertise in UX design significantly improved our customer engagement metrics.",
      author: "Michael Chen",
      position: "Product Manager, FinEdge"
    },
    {
      quote: "The cloud solutions provided by DXD Magnate have made our operations more efficient and scalable.",
      author: "Emma Rodriguez",
      position: "CTO, HealthPlus"
    }
  ];

  return (
    <Box className="py-16 bg-blue-900 text-white">
      <Container maxWidth="lg">
        <Box className="text-center mb-12" data-aos="fade-up">
          <Typography variant="overline" className="text-blue-300 font-bold">
            CLIENT TESTIMONIALS
          </Typography>
          <Typography variant="h3" className="font-bold mt-2">
            What Our Clients Say
          </Typography>
        </Box>
        
        <Box data-aos="fade-up" data-aos-delay="100" className="px-4">
          <Slider {...settings}>
            {testimonials.map((testimonial, index) => (
              <Box key={index} className="px-2">
                <Box className="bg-blue-800 p-8 rounded-lg">
                  <Typography variant="h5" className="italic mb-6">
                    "{testimonial.quote}"
                  </Typography>
                  <Typography variant="h6" className="font-bold">
                    {testimonial.author}
                  </Typography>
                  <Typography variant="body2" className="text-blue-300">
                    {testimonial.position}
                  </Typography>
                </Box>
              </Box>
            ))}
          </Slider>
        </Box>
      </Container>
    </Box>
  );
};

// Stats Section
const StatsSection = () => {
  const stats = [
    { value: "200+", label: "Projects Completed" },
    { value: "98%", label: "Client Satisfaction" },
    { value: "50+", label: "Expert Team Members" },
    { value: "15", label: "Industry Awards" }
  ];

  return (
    <Box className="py-16 bg-gray-100" sx={{justifyContent:'center', alignItems:'center', textAlign:'center', display:'flex'}} >
      <Container maxWidth="lg"  >
        <Grid container spacing={4}>
          {stats.map((stat, index) => (
            <Grid item xs={6} sm={3} key={index} data-aos="fade-up" data-aos-delay={index * 100} >
              <Box className="text-center">
                <Typography variant="h2" className="font-bold text-blue-900">
                  {stat.value}
                </Typography>
                <Typography variant="h6" color="textSecondary">
                  {stat.label}
                </Typography>
              </Box>
            </Grid>
          ))}
        </Grid>
      </Container>
    </Box>
  );
};

// CTA Section
const CTASection = () => {
    return (
      <Box className="py-20 bg-gradient-to-r from-blue-600 to-blue-800 text-white">
        <Container maxWidth="lg">
          <Box 
            className="text-center px-4"
            data-aos="fade-up"
            sx={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <Typography 
              variant="h3" 
              className="font-bold mb-4"
              sx={{
                fontSize: { xs: '2rem', md: '2.5rem' },
                lineHeight: 1.2,
                fontWeight: 700
              }}
            >
              Ready to Transform Your Business?
            </Typography>
            
            <Typography 
              variant="subtitle1" 
              className="mb-8"
              sx={{
                maxWidth: '680px',
                fontSize: '1.1rem',
                opacity: 0.9,
                marginBottom: '2rem'
              }}
            >
              Let's discuss how DXD Magnate can help you achieve your digital goals.
            </Typography>
            
            <Button 
  variant="contained"
  size="large"
  endIcon={<FiArrowRight className="text-lg" />}
  sx={{
    backgroundColor: '#FF6B6B', // Coral red for high visibility
    color: 'white',
    padding: '12px 32px',
    fontSize: '1rem',
    fontWeight: 600,
    borderRadius: '8px',
    textTransform: 'none',
    boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
    '&:hover': {
      backgroundColor: '#FF5252', // Slightly darker on hover
      transform: 'translateY(-2px)',
      boxShadow: '0 6px 8px rgba(0, 0, 0, 0.15)'
    },
    transition: 'all 0.3s ease',
    border: '2px solid transparent',
    '&:hover': {
      borderColor: 'rgba(255, 255, 255, 0.5)'
    }
  }}
>
  Get a Free Consultation
</Button>
          </Box>
        </Container>
      </Box>
    );
  };



const HomePage = () => {
    useEffect(() => {
        Aos.init({
          duration: 1000, // Animation duration
          once: false, // Allow animations to repeat on scroll
        });
      }, []);
    

  return (
    <Box className="overflow-hidden">
      <HeroSection />
      <FeaturesSection />
      <ServicesSection />
      <TestimonialsSection />
      <StatsSection />
      <CTASection />
    </Box>
  );
};

export default HomePage;