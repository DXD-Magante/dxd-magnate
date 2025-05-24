import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Typography, 
  Button, 
  Card, 
  CardContent, 
  Chip, 
  Divider, 
  IconButton, 
  Tooltip, 
  CircularProgress,
  Paper,
  Tabs,
  Tab,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  Snackbar,
  Alert,
  Checkbox,
  ListItemText,
  FormGroup,
  FormControlLabel,
  FormHelperText
} from '@mui/material';
import { 
  FiPlus, 
  FiRefreshCw, 
  FiEdit2, 
  FiTrash2, 
  FiExternalLink,
  FiBarChart2,
  FiDollarSign,
  FiCalendar,
  FiUsers,
  FiTarget
} from 'react-icons/fi';
import { collection, addDoc, getDocs, updateDoc, doc, deleteDoc, serverTimestamp } from 'firebase/firestore';
import { db, auth } from '../../services/firebase';
import { format } from 'date-fns';

const GOOGLE_ADS_CLIENT_ID = '778430544439-37a6j5s493pmg21r4u3ndrh83hhidk7q.apps.googleusercontent.com';
const GOOGLE_ADS_API_KEY = 'AIzaSyB8gbDwWVrFwt7jIRV-XFybwdyFGUB_8vE';
const GOOGLE_ADS_SCOPE = 'https://www.googleapis.com/auth/adwords';
const DISCOVERY_DOC = 'https://googleads.googleapis.com/$discovery/rest';

const CampaignsContent = () => {
  const [campaigns, setCampaigns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [googleAdsLoading, setGoogleAdsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState(0);
  const [openDialog, setOpenDialog] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [currentCampaign, setCurrentCampaign] = useState(null);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const [googleClient, setGoogleClient] = useState(null);
  const [googleAuthStatus, setGoogleAuthStatus] = useState('not_initialized');
  // Form state with enhanced target audience
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    status: 'active',
    budget: '',
    startDate: '',
    endDate: '',
    targetAudience: {
      genders: [],
      ageRanges: [],
      locations: [],
      interests: [],
      languages: [],
      devices: [],
      incomeLevels: []
    },
    platforms: [],
    objective: 'awareness',
    googleAdsCustomerId: ''
  });

  const statusColors = {
    active: 'success',
    paused: 'warning',
    ended: 'error',
    draft: 'default'
  };

  const platformOptions = ['Google Ads', 'Facebook', 'Instagram', 'LinkedIn', 'Twitter', 'YouTube'];
  const objectiveOptions = [
    { value: 'awareness', label: 'Brand Awareness' },
    { value: 'traffic', label: 'Website Traffic' },
    { value: 'leads', label: 'Lead Generation' },
    { value: 'sales', label: 'Sales' },
    { value: 'engagement', label: 'Engagement' }
  ];

  // Target audience options
  const genderOptions = ['Male', 'Female', 'Non-binary', 'Other'];
  const ageRangeOptions = [
    '13-17', '18-24', '25-34', '35-44', '45-54', '55-64', '65+'
  ];
  const countryOptions = [
    { code: 'US', name: 'United States', regions: ['Northeast', 'Midwest', 'South', 'West'] },
    { code: 'CA', name: 'Canada', regions: ['Alberta', 'British Columbia', 'Manitoba', 'Ontario', 'Quebec', 'Saskatchewan', 'Newfoundland and Labrador', 'Nova Scotia', 'New Brunswick', 'Prince Edward Island'] },
    { code: 'UK', name: 'United Kingdom', regions: ['England', 'Scotland', 'Wales', 'Northern Ireland'] },
    { code: 'AU', name: 'Australia', regions: ['New South Wales', 'Queensland', 'South Australia', 'Victoria', 'Western Australia', 'Tasmania', 'Northern Territory', 'Australian Capital Territory'] },
    { code: 'DE', name: 'Germany', regions: ['Baden-Württemberg', 'Bavaria', 'Berlin', 'Brandenburg', 'Bremen', 'Hamburg', 'Hesse', 'Lower Saxony', 'Mecklenburg-Vorpommern', 'North Rhine-Westphalia', 'Rhineland-Palatinate', 'Saarland', 'Saxony', 'Saxony-Anhalt', 'Schleswig-Holstein', 'Thuringia'] },
    { code: 'FR', name: 'France', regions: ['Auvergne-Rhône-Alpes', 'Bourgogne-Franche-Comté', 'Brittany', 'Centre-Val de Loire', 'Corsica', 'Grand Est', 'Hauts-de-France', 'Île-de-France', 'Normandy', 'Nouvelle-Aquitaine', 'Occitanie', 'Pays de la Loire', 'Provence-Alpes-Côte d\'Azur'] },
    { code: 'JP', name: 'Japan', regions: ['Hokkaido', 'Tohoku', 'Kanto', 'Chubu', 'Kansai', 'Chugoku', 'Shikoku', 'Kyushu'] },
    { code: 'BR', name: 'Brazil', regions: ['North', 'Northeast', 'Central-West', 'Southeast', 'South'] },
    { code: 'IN', name: 'India', regions: ['Northern', 'Western', 'Southern', 'Eastern', 'Central', 'North-Eastern'] },
    { code: 'IT', name: 'Italy', regions: ['Abruzzo', 'Aosta Valley', 'Apulia', 'Basilicata', 'Calabria', 'Campania', 'Emilia-Romagna', 'Friuli-Venezia Giulia', 'Lazio', 'Liguria', 'Lombardy', 'Marche', 'Molise', 'Piedmont', 'Sardinia', 'Sicily', 'Trentino-Alto Adige', 'Tuscany', 'Umbria', 'Veneto'] },
    { code: 'MX', name: 'Mexico', regions: ['Northwest', 'Northeast', 'West', 'East', 'North Central', 'South Central', 'Southwest', 'Southeast'] },
    { code: 'ZA', name: 'South Africa', regions: ['Eastern Cape', 'Free State', 'Gauteng', 'KwaZulu-Natal', 'Limpopo', 'Mpumalanga', 'Northern Cape', 'North West', 'Western Cape'] },
    { code: 'ES', name: 'Spain', regions: ['Andalusia', 'Aragon', 'Asturias', 'Balearic Islands', 'Basque Country', 'Canary Islands', 'Cantabria', 'Castile and León', 'Castilla-La Mancha', 'Catalonia', 'Extremadura', 'Galicia', 'La Rioja', 'Madrid', 'Murcia', 'Navarre', 'Valencia'] },
    { code: 'SE', name: 'Sweden', regions: ['Stockholm', 'Västra Götaland', 'Skåne', 'Östergötland', 'Jönköping', 'Kronoberg', 'Kalmar', 'Gotland', 'Blekinge', 'Halland', 'Värmland', 'Örebro', 'Västmanland', 'Dalarna', 'Gävleborg', 'Uppsala', 'Södermanland', 'Jämtland', 'Västerbotten', 'Norrbotten'] },
    { code: 'NL', name: 'Netherlands', regions: ['Drenthe', 'Flevoland', 'Friesland', 'Gelderland', 'Groningen', 'Limburg', 'North Brabant', 'North Holland', 'Overijssel', 'South Holland', 'Utrecht', 'Zeeland'] },
    { code: 'CN', name: 'China', regions: ['North China', 'Northeast China', 'East China', 'South Central China', 'Southwest China', 'Northwest China'] },
];
  const interestOptions = [
    'Technology', 'Sports', 'Fashion', 'Travel', 'Food', 'Music', 'Movies', 'Gaming'
  ];
  const languageOptions = [

    'Tamil', 'English', 'Malayalam', 'Hindi', 'Marathi', 'Telugu', 'Gujarati', 'Kannada', 'Bengali', 'Punjabi', 'Odia', 'Urdu',
    
    'French', 'Breton', 'Occitan', 'Alsatian', 'Corsican',
    
    'Welsh', 'Scottish Gaelic', 'Irish', 'Cornish',
    
    'Spanish', 'Chinese (Mandarin)', 'Tagalog', 'Vietnamese', 'French', 'German', 'Navajo',

    'German', 'Italian', 'Portuguese', 'Dutch', 'Russian', 'Polish', 'Swedish', 'Danish', 'Norwegian', 'Finnish', 'Greek', 'Czech', 'Hungarian', 'Romanian', 'Ukrainian', 'Serbian', 'Croatian',

    'Japanese', 'Korean', 'Indonesian', 'Malay', 'Thai', 'Vietnamese', 'Burmese', 'Khmer', 'Filipino (Tagalog)', 'Persian (Farsi)', 'Arabic', 'Hebrew', 'Turkish',
   
    'Swahili', 'Amharic', 'Yoruba', 'Zulu', 'Afrikaans',
    
    'Portuguese (Brazilian)', 'Quechua', 'Haitian Creole',
    
    'Esperanto'
];
  const deviceOptions = [
    'Mobile', 'Desktop', 'Tablet'
  ];
  const incomeLevelOptions = [
    'Low', 'Middle', 'High'
  ];

  useEffect(() => {
    fetchCampaigns();
    loadGoogleAdsApi();
  }, []);

  const loadGoogleAdsApi = () => {
    const script = document.createElement('script');
    script.src = 'https://apis.google.com/js/api.js';
    script.onload = () => {
      window.gapi.load('client:auth2', initGoogleClient);
    };
    document.body.appendChild(script);
  };

  // Initialize Google Client
  const initGoogleClient = () => {
    window.gapi.client.init({
      apiKey: GOOGLE_ADS_API_KEY,
      clientId: GOOGLE_ADS_CLIENT_ID,
      scope: GOOGLE_ADS_SCOPE,
      discoveryDocs: [DISCOVERY_DOC]
    }).then(() => {
      setGoogleClient(window.gapi);
    }).catch(err => {
      console.error('Error initializing Google client:', err);
      setSnackbar({ open: true, message: 'Failed to initialize Google Ads API', severity: 'error' });
    });
  };

  // Authenticate with Google Ads
  const authenticateGoogleAds = async () => {
    if (!googleClient) {
      setSnackbar({ open: true, message: 'Google API not loaded yet', severity: 'error' });
      return false;
    }

    try {
      await googleClient.auth2.getAuthInstance().signIn();
      return true;
    } catch (error) {
      console.error('Google authentication error:', error);
      setSnackbar({ open: true, message: 'Failed to authenticate with Google Ads', severity: 'error' });
      return false;
    }
  };

  // Fetch campaigns from Firestore
  const fetchCampaigns = async () => {
    try {
      setLoading(true);
      const querySnapshot = await getDocs(collection(db, 'campaigns'));
      const campaignsData = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setCampaigns(campaignsData);
    } catch (error) {
      console.error('Error fetching campaigns:', error);
      setSnackbar({ open: true, message: 'Failed to fetch campaigns', severity: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const fetchGoogleAdsCampaigns = async () => {
    try {
      setGoogleAdsLoading(true);
      
      // 1. Authenticate with Google Ads
      const isAuthenticated = await authenticateGoogleAds();
      if (!isAuthenticated) {
        setSnackbar({
          open: true,
          message: 'Authentication with Google Ads failed',
          severity: 'error'
        });
        return;
      }
  
      // 2. Get customer ID (formatted without dashes)
      let customerId = '4144166621'; // Your Google Ads customer ID
      
      // Optional: Fallback to manual input if needed
      if (!customerId) {
        const manualInput = window.prompt(
          'Enter your Google Ads Customer ID (e.g., 1234567890):',
          '414-416-6621'
        );
        
        if (!manualInput) {
          setSnackbar({
            open: true,
            message: 'Google Ads sync canceled',
            severity: 'info'
          });
          return;
        }
        
        // Remove any non-numeric characters
        customerId = manualInput.replace(/\D/g, '');
      }
  
      // 3. Validate customer ID format
      if (!/^\d{10}$/.test(customerId)) {
        setSnackbar({
          open: true,
          message: 'Invalid Google Ads Customer ID. Must be 10 digits.',
          severity: 'error'
        });
        return;
      }
  
      // 4. Make the API request
      const response = await googleClient.client.request({
        path: `https://googleads.googleapis.com/v14/customers/${customerId}/googleAds:search`,
        method: 'POST',
        body: {
          query: `
            SELECT 
              campaign.id, 
              campaign.name, 
              campaign.status, 
              campaign.start_date, 
              campaign.end_date,
              campaign.advertising_channel_type,
              metrics.impressions,
              metrics.clicks,
              metrics.ctr,
              metrics.average_cpc,
              metrics.cost_micros,
              campaign.campaign_budget
            FROM campaign
            WHERE campaign.status != 'REMOVED'
            ORDER BY campaign.id
          `
        }
      });
  
      // 5. Handle empty response
      if (!response.result?.results?.length) {
        setSnackbar({
          open: true,
          message: 'No active campaigns found in this Google Ads account',
          severity: 'info'
        });
        return;
      }
  
      // 6. Transform the response data
      const googleAdsCampaigns = response.result.results.map(campaign => ({
        id: `google-${campaign.campaign.id}`,
        name: campaign.campaign.name,
        description: `Google Ads campaign (${campaign.campaign.advertising_channel_type})`,
        status: mapGoogleAdsStatus(campaign.campaign.status),
        budget: campaign.campaign.campaign_budget 
          ? (campaign.campaign.campaign_budget.split('/')[1] || 0) / 1000000 
          : campaign.metrics.cost_micros 
            ? campaign.metrics.cost_micros / 1000000 
            : 0,
        startDate: formatGoogleAdsDate(campaign.campaign.start_date),
        endDate: campaign.campaign.end_date 
          ? formatGoogleAdsDate(campaign.campaign.end_date) 
          : '',
        platforms: ['Google Ads'],
        objective: mapGoogleAdsObjective(campaign.campaign.advertising_channel_type),
        isGoogleAds: true,
        clicks: campaign.metrics.clicks || 0,
        impressions: campaign.metrics.impressions || 0,
        ctr: campaign.metrics.ctr 
          ? `${(campaign.metrics.ctr * 100).toFixed(2)}%` 
          : '0%',
        cost: campaign.metrics.cost_micros 
          ? campaign.metrics.cost_micros / 1000000 
          : 0
      }));
  
      // 7. Update state with new campaigns
      setCampaigns(prev => [
        ...googleAdsCampaigns,
        ...prev.filter(c => !c.isGoogleAds) // Keep non-Google campaigns
      ]);
      
      setSnackbar({ 
        open: true, 
        message: `Synced ${googleAdsCampaigns.length} Google Ads campaigns`, 
        severity: 'success' 
      });
  
    } catch (error) {
      alert(error)
      console.error('Error fetching Google Ads campaigns:', error);
      
      let errorMessage = 'Failed to sync Google Ads campaigns';
      if (error.result?.error) {
        // Handle specific API errors
        switch(error.result.error.status) {
          case 'UNAUTHENTICATED':
            errorMessage = 'Session expired. Please sign in again.';
            break;
          case 'PERMISSION_DENIED':
            errorMessage = `No access to account 414-416-6621. Check permissions.`;
            break;
          case 'INVALID_ARGUMENT':
            errorMessage = 'Invalid customer ID or query parameters';
            break;
          default:
            errorMessage = error.result.error.message;
        }
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      setSnackbar({ 
        open: true, 
        message: errorMessage,
        severity: 'error' 
      });
    } finally {
      setGoogleAdsLoading(false);
    }
  };
  

  const getGoogleAdsCustomerId = async () => {
    try {
      const response = await googleClient.client.request({
        path: 'https://googleads.googleapis.com/v14/customers:listAccessibleCustomers',
        method: 'GET'
      });
      
      if (response.result.resourceNames?.length > 0) {
        return response.result.resourceNames[0].split('/')[1];
      }
      
      return localStorage.getItem('googleAdsCustomerId') || formData.googleAdsCustomerId || null;
    } catch (error) {
      console.error('Error fetching customer ID:', error);
      return null;
    }
  };

  const mapGoogleAdsObjective = (channelType) => {
    const mapping = {
      'SEARCH': 'traffic',
      'DISPLAY': 'awareness',
      'SHOPPING': 'sales',
      'VIDEO': 'engagement',
      'MULTI_CHANNEL': 'leads',
      'LOCAL': 'leads',
      'SMART': 'awareness',
      'PERFORMANCE_MAX': 'sales',
      'DISCOVERY': 'awareness'
    };
    return mapping[channelType] || 'awareness';
  };
  const mapGoogleAdsStatus = (status) => {
    const statusMap = {
      'ENABLED': 'active',
      'PAUSED': 'paused',
      'REMOVED': 'ended',
      'UNSPECIFIED': 'draft',
      'UNKNOWN': 'draft'
    };
    return statusMap[status] || status.toLowerCase();
  };
  
  const formatGoogleAdsDate = (dateStr) => {
    if (!dateStr) return '';
    // Google Ads dates are in YYYY-MM-DD format
    const [year, month, day] = dateStr.split('-');
    return new Date(year, month - 1, day).toISOString();
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    
    if (name.startsWith('targetAudience.')) {
      const field = name.split('.')[1];
      setFormData(prev => ({
        ...prev,
        targetAudience: {
          ...prev.targetAudience,
          [field]: value
        }
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  const handlePlatformChange = (event) => {
    const { value } = event.target;
    setFormData(prev => ({
      ...prev,
      platforms: typeof value === 'string' ? value.split(',') : value
    }));
  };

  const handleMultiSelectChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      targetAudience: {
        ...prev.targetAudience,
        [field]: value
      }
    }));
  };

  const handleLocationChange = (countryCode, region, isChecked) => {
    setFormData(prev => {
      const newLocations = [...prev.targetAudience.locations];
      const locationIndex = newLocations.findIndex(loc => loc.country === countryCode);
      
      if (isChecked) {
        if (locationIndex === -1) {
          newLocations.push({
            country: countryCode,
            regions: [region]
          });
        } else {
          if (!newLocations[locationIndex].regions.includes(region)) {
            newLocations[locationIndex].regions.push(region);
          }
        }
      } else {
        if (locationIndex !== -1) {
          newLocations[locationIndex].regions = newLocations[locationIndex].regions.filter(r => r !== region);
          if (newLocations[locationIndex].regions.length === 0) {
            newLocations.splice(locationIndex, 1);
          }
        }
      }
      
      return {
        ...prev,
        targetAudience: {
          ...prev.targetAudience,
          locations: newLocations
        }
      };
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      const campaignData = {
        ...formData,
        memberId: auth.currentUser.uid,
        createdAt: editMode && currentCampaign ? currentCampaign.createdAt : serverTimestamp(),
        lastUpdated: serverTimestamp(),
        budget: parseFloat(formData.budget),
        isGoogleAds: false
      };

      if (editMode && currentCampaign) {
        await updateDoc(doc(db, 'campaigns', currentCampaign.id), campaignData);
        setSnackbar({ open: true, message: 'Campaign updated successfully', severity: 'success' });
      } else {
        await addDoc(collection(db, 'campaigns'), campaignData);
        setSnackbar({ open: true, message: 'Campaign created successfully', severity: 'success' });
      }

      fetchCampaigns();
      handleCloseDialog();
    } catch (error) {
      console.error('Error saving campaign:', error);
      setSnackbar({ open: true, message: 'Failed to save campaign', severity: 'error' });
    }
  };

  const handleEdit = (campaign) => {
    setCurrentCampaign(campaign);
    setFormData({
      name: campaign.name,
      description: campaign.description,
      status: campaign.status,
      budget: campaign.budget,
      startDate: campaign.startDate,
      endDate: campaign.endDate,
      targetAudience: campaign.targetAudience || {
        genders: [],
        ageRanges: [],
        locations: [],
        interests: [],
        languages: [],
        devices: [],
        incomeLevels: []
      },
      platforms: campaign.platforms,
      objective: campaign.objective
    });
    setEditMode(true);
    setOpenDialog(true);
  };

  const handleDelete = async (id) => {
    try {
      await deleteDoc(doc(db, 'campaigns', id));
      setSnackbar({ open: true, message: 'Campaign deleted successfully', severity: 'success' });
      fetchCampaigns();
    } catch (error) {
      console.error('Error deleting campaign:', error);
      setSnackbar({ open: true, message: 'Failed to delete campaign', severity: 'error' });
    }
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setEditMode(false);
    setCurrentCampaign(null);
    setFormData({
      name: '',
      description: '',
      status: 'active',
      budget: '',
      startDate: '',
      endDate: '',
      targetAudience: {
        genders: [],
        ageRanges: [],
        locations: [],
        interests: [],
        languages: [],
        devices: [],
        incomeLevels: []
      },
      platforms: [],
      objective: 'awareness'
    });
  };

  const filteredCampaigns = campaigns.filter(campaign => {
    if (activeTab === 0) return true;
    if (activeTab === 1) return campaign.status === 'active';
    if (activeTab === 2) return campaign.status === 'paused';
    if (activeTab === 3) return campaign.status === 'ended';
    return true;
  });

  const formatTargetAudience = (audience) => {
    if (!audience) return 'Not specified';
    
    const parts = [];
    if (audience.genders?.length > 0) parts.push(`Genders: ${audience.genders.join(', ')}`);
    if (audience.ageRanges?.length > 0) parts.push(`Ages: ${audience.ageRanges.join(', ')}`);
    if (audience.locations?.length > 0) {
      const locs = audience.locations.map(loc => 
        `${loc.country}${loc.regions?.length > 0 ? ` (${loc.regions.join(', ')})` : ''}`
      );
      parts.push(`Locations: ${locs.join('; ')}`);
    }
    
    return parts.length > 0 ? parts.join(' | ') : 'Not specified';
  };

  return (
    <Box className="p-4">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <div>
          <Typography variant="h4" className="font-bold text-gray-900">
            Campaign Management
          </Typography>
          <Typography variant="body2" className="text-gray-500">
            Manage and track all your marketing campaigns
          </Typography>
        </div>
        
        <div className="flex flex-wrap gap-2">
          <Button
            variant="contained"
            color="primary"
            startIcon={<FiPlus />}
            onClick={() => setOpenDialog(true)}
          >
            Add Campaign
          </Button>
          <Button
            variant="outlined"
            startIcon={<FiRefreshCw className={googleAdsLoading ? "animate-spin" : ""} />}
            onClick={fetchGoogleAdsCampaigns}
            disabled={googleAdsLoading}
          >
            Sync Google Ads
          </Button>
        </div>
      </div>
      
      {/* Filters */}
      <Paper className="p-2 mb-6 rounded-lg shadow-sm">
        <Tabs 
          value={activeTab}
          onChange={(e, newValue) => setActiveTab(newValue)}
          variant="scrollable"
          scrollButtons="auto"
        >
          <Tab label="All Campaigns" />
          <Tab label="Active" />
          <Tab label="Paused" />
          <Tab label="Ended" />
        </Tabs>
      </Paper>
      
      {/* Campaigns List */}
      {loading ? (
        <div className="flex justify-center items-center h-64">
          <CircularProgress />
        </div>
      ) : filteredCampaigns.length === 0 ? (
        <Paper className="p-8 text-center rounded-lg shadow-xs">
          <FiBarChart2 className="mx-auto text-gray-400" size={48} />
          <Typography variant="h6" className="mt-4 text-gray-600">
            No campaigns found
          </Typography>
          <Typography variant="body2" className="text-gray-500 mt-2">
            {activeTab === 0 ? "You don't have any campaigns yet." : 
             `No ${activeTab === 1 ? 'active' : activeTab === 2 ? 'paused' : 'ended'} campaigns.`}
          </Typography>
          <Button
            variant="contained"
            color="primary"
            startIcon={<FiPlus />}
            className="mt-4"
            onClick={() => setOpenDialog(true)}
          >
            Create Your First Campaign
          </Button>
        </Paper>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredCampaigns.map((campaign) => (
            <Card key={campaign.id} className="rounded-lg shadow-xs hover:shadow-md transition-shadow">
              <CardContent>
                <div className="flex justify-between items-start mb-2">
                  <Typography variant="h6" className="font-medium">
                    {campaign.name}
                  </Typography>
                  <Chip
                    label={campaign.status}
                    size="small"
                    color={statusColors[campaign.status] || 'default'}
                    className="capitalize"
                  />
                </div>
                
                <Typography variant="body2" className="text-gray-600 mb-3">
                  {campaign.description}
                </Typography>
                
                <div className="grid grid-cols-2 gap-2 mb-3">
                  <div className="flex items-center gap-1">
                    <FiDollarSign className="text-gray-500" size={14} />
                    <Typography variant="body2" className="text-gray-700">
                      ${campaign.budget?.toLocaleString() || '0'}
                    </Typography>
                  </div>
                  
                  <div className="flex items-center gap-1">
                    <FiCalendar className="text-gray-500" size={14} />
                    <Typography variant="body2" className="text-gray-700">
                      {format(new Date(campaign.startDate), 'MMM d, yyyy')} - {campaign.endDate ? format(new Date(campaign.endDate), 'MMM d, yyyy') : 'Ongoing'}
                    </Typography>
                  </div>
                  
                  <div className="flex items-center gap-1 col-span-2">
                    <FiTarget className="text-gray-500" size={14} />
                    <Typography variant="body2" className="text-gray-700">
                      {objectiveOptions.find(o => o.value === campaign.objective)?.label || campaign.objective}
                    </Typography>
                  </div>
                </div>
                
                <div className="mb-3">
                  <Typography variant="caption" className="text-gray-500">
                    Target Audience
                  </Typography>
                  <Typography variant="body2" className="text-gray-700 line-clamp-2">
                    {formatTargetAudience(campaign.targetAudience)}
                  </Typography>
                </div>
                
                <div className="flex flex-wrap gap-1 mb-3">
                  {campaign.platforms?.map((platform, index) => (
                    <Chip
                      key={index}
                      label={platform}
                      size="small"
                      variant="outlined"
                    />
                  ))}
                </div>
                
                {campaign.isGoogleAds && (
                  <div className="bg-blue-50 p-2 rounded mb-3">
                    <Typography variant="body2" className="text-blue-800 font-medium">
                      Google Ads Performance
                    </Typography>
                    <div className="grid grid-cols-2 gap-2 mt-1">
                      <div>
                        <Typography variant="caption" className="text-gray-500">
                          Clicks
                        </Typography>
                        <Typography variant="body2" className="font-medium">
                          {campaign.clicks}
                        </Typography>
                      </div>
                      <div>
                        <Typography variant="caption" className="text-gray-500">
                          Impressions
                        </Typography>
                        <Typography variant="body2" className="font-medium">
                          {campaign.impressions?.toLocaleString()}
                        </Typography>
                      </div>
                      <div>
                        <Typography variant="caption" className="text-gray-500">
                          CTR
                        </Typography>
                        <Typography variant="body2" className="font-medium">
                          {campaign.ctr}
                        </Typography>
                      </div>
                      <div>
                        <Typography variant="caption" className="text-gray-500">
                          Cost
                        </Typography>
                        <Typography variant="body2" className="font-medium">
                          ${campaign.cost?.toLocaleString()}
                        </Typography>
                      </div>
                    </div>
                  </div>
                )}
                
                <Divider className="my-2" />
                
                <div className="flex justify-between items-center mt-2">
                  <Typography variant="caption" className="text-gray-500">
                    {campaign.isGoogleAds ? 'Synced from Google Ads' : `Created by ${campaign.memberId}`}
                  </Typography>
                  
                  <div className="flex gap-1">
                    {!campaign.isGoogleAds && (
                      <>
                        <Tooltip title="Edit">
                          <IconButton size="small" onClick={() => handleEdit(campaign)}>
                            <FiEdit2 size={16} className="text-gray-600 hover:text-blue-600" />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Delete">
                          <IconButton size="small" onClick={() => handleDelete(campaign.id)}>
                            <FiTrash2 size={16} className="text-gray-600 hover:text-red-600" />
                          </IconButton>
                        </Tooltip>
                      </>
                    )}
                    {campaign.isGoogleAds && (
                      <Tooltip title="View in Google Ads">
                        <IconButton size="small">
                          <FiExternalLink size={16} className="text-gray-600 hover:text-blue-600" />
                        </IconButton>
                      </Tooltip>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
      
      {/* Add/Edit Campaign Dialog */}
      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle>{editMode ? 'Edit Campaign' : 'Add New Campaign'}</DialogTitle>
        <DialogContent>
          <form onSubmit={handleSubmit} className="space-y-4 mt-2">
            <TextField
              fullWidth
              label="Campaign Name"
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              required
              variant="outlined"
            />
            
            <TextField
              fullWidth
              label="Description"
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              multiline
              rows={3}
              variant="outlined"
            />
            
            <FormControl fullWidth variant="outlined">
              <InputLabel>Status</InputLabel>
              <Select
                label="Status"
                name="status"
                value={formData.status}
                onChange={handleInputChange}
                required
              >
                <MenuItem value="active">Active</MenuItem>
                <MenuItem value="paused">Paused</MenuItem>
                <MenuItem value="ended">Ended</MenuItem>
                <MenuItem value="draft">Draft</MenuItem>
              </Select>
            </FormControl>
            
            <TextField
              fullWidth
              label="Budget ($)"
              name="budget"
              type="number"
              value={formData.budget}
              onChange={handleInputChange}
              required
              variant="outlined"
              inputProps={{ min: 0, step: 0.01 }}
            />
            
            <div className="grid grid-cols-2 gap-4">
              <TextField
                fullWidth
                label="Start Date"
                name="startDate"
                type="date"
                value={formData.startDate}
                onChange={handleInputChange}
                required
                variant="outlined"
                InputLabelProps={{ shrink: true }}
              />
              
              <TextField
                fullWidth
                label="End Date"
                name="endDate"
                type="date"
                value={formData.endDate}
                onChange={handleInputChange}
                variant="outlined"
                InputLabelProps={{ shrink: true }}
              />
            </div>
            
            <div className="space-y-4">
              <Typography variant="subtitle1" className="font-medium">
                Target Audience Details
              </Typography>
              
              <FormControl fullWidth variant="outlined">
                <InputLabel>Genders</InputLabel>
                <Select
                  multiple
                  label="Genders"
                  name="targetAudience.genders"
                  value={formData.targetAudience.genders}
                  onChange={(e) => handleMultiSelectChange('genders', e.target.value)}
                  renderValue={(selected) => selected.join(', ')}
                >
                  {genderOptions.map((gender) => (
                    <MenuItem key={gender} value={gender}>
                      <Checkbox checked={formData.targetAudience.genders.indexOf(gender) > -1} />
                      <ListItemText primary={gender} />
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              
              <FormControl fullWidth variant="outlined">
                <InputLabel>Age Ranges</InputLabel>
                <Select
                  multiple
                  label="Age Ranges"
                  name="targetAudience.ageRanges"
                  value={formData.targetAudience.ageRanges}
                  onChange={(e) => handleMultiSelectChange('ageRanges', e.target.value)}
                  renderValue={(selected) => selected.join(', ')}
                >
                  {ageRangeOptions.map((age) => (
                    <MenuItem key={age} value={age}>
                      <Checkbox checked={formData.targetAudience.ageRanges.indexOf(age) > -1} />
                      <ListItemText primary={age} />
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              
              <div>
                <Typography variant="body2" className="mb-2">Locations</Typography>
                <Paper className="p-3 max-h-64 overflow-auto">
                  {countryOptions.map((country) => (
                    <div key={country.code} className="mb-3">
                      <FormControlLabel
                        control={
                          <Checkbox
                            checked={formData.targetAudience.locations.some(loc => 
                              loc.country === country.code && loc.regions.length === country.regions.length
                            )}
                            indeterminate={formData.targetAudience.locations.some(loc => 
                              loc.country === country.code && 
                              loc.regions.length > 0 && 
                              loc.regions.length < country.regions.length
                            )}
                            onChange={(e) => {
                              country.regions.forEach(region => {
                                handleLocationChange(country.code, region, e.target.checked);
                              });
                            }}
                          />
                        }
                        label={country.name}
                      />
                      <FormGroup className="ml-6">
                        {country.regions.map((region) => (
                          <FormControlLabel
                            key={region}
                            control={
                              <Checkbox
                                checked={formData.targetAudience.locations.some(loc => 
                                  loc.country === country.code && loc.regions.includes(region)
                                )}
                                onChange={(e) => handleLocationChange(country.code, region, e.target.checked)}
                              />
                            }
                            label={region}
                          />
                        ))}
                      </FormGroup>
                    </div>
                  ))}
                </Paper>
                <FormHelperText>Select countries and regions to target</FormHelperText>
              </div>
              
              <FormControl fullWidth variant="outlined">
                <InputLabel>Interests</InputLabel>
                <Select
                  multiple
                  label="Interests"
                  name="targetAudience.interests"
                  value={formData.targetAudience.interests}
                  onChange={(e) => handleMultiSelectChange('interests', e.target.value)}
                  renderValue={(selected) => selected.join(', ')}
                >
                  {interestOptions.map((interest) => (
                    <MenuItem key={interest} value={interest}>
                      <Checkbox checked={formData.targetAudience.interests.indexOf(interest) > -1} />
                      <ListItemText primary={interest} />
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              
              <FormControl fullWidth variant="outlined">
                <InputLabel>Languages</InputLabel>
                <Select
                  multiple
                  label="Languages"
                  name="targetAudience.languages"
                  value={formData.targetAudience.languages}
                  onChange={(e) => handleMultiSelectChange('languages', e.target.value)}
                  renderValue={(selected) => selected.join(', ')}
                >
                  {languageOptions.map((language) => (
                    <MenuItem key={language} value={language}>
                      <Checkbox checked={formData.targetAudience.languages.indexOf(language) > -1} />
                      <ListItemText primary={language} />
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              
              <FormControl fullWidth variant="outlined">
                <InputLabel>Devices</InputLabel>
                <Select
                  multiple
                  label="Devices"
                  name="targetAudience.devices"
                  value={formData.targetAudience.devices}
                  onChange={(e) => handleMultiSelectChange('devices', e.target.value)}
                  renderValue={(selected) => selected.join(', ')}
                >
                  {deviceOptions.map((device) => (
                    <MenuItem key={device} value={device}>
                      <Checkbox checked={formData.targetAudience.devices.indexOf(device) > -1} />
                      <ListItemText primary={device} />
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              
              <FormControl fullWidth variant="outlined">
                <InputLabel>Income Levels</InputLabel>
                <Select
                  multiple
                  label="Income Levels"
                  name="targetAudience.incomeLevels"
                  value={formData.targetAudience.incomeLevels}
                  onChange={(e) => handleMultiSelectChange('incomeLevels', e.target.value)}
                  renderValue={(selected) => selected.join(', ')}
                >
                  {incomeLevelOptions.map((level) => (
                    <MenuItem key={level} value={level}>
                      <Checkbox checked={formData.targetAudience.incomeLevels.indexOf(level) > -1} />
                      <ListItemText primary={level} />
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </div>
            
            <FormControl fullWidth variant="outlined">
              <InputLabel>Platforms</InputLabel>
              <Select
                multiple
                label="Platforms"
                name="platforms"
                value={formData.platforms}
                onChange={handlePlatformChange}
                renderValue={(selected) => selected.join(', ')}
              >
                {platformOptions.map((platform) => (
                  <MenuItem key={platform} value={platform}>
                    {platform}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            
            <FormControl fullWidth variant="outlined">
              <InputLabel>Objective</InputLabel>
              <Select
                label="Objective"
                name="objective"
                value={formData.objective}
                onChange={handleInputChange}
                required
              >
                {objectiveOptions.map((option) => (
                  <MenuItem key={option.value} value={option.value}>
                    {option.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </form>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button 
            onClick={handleSubmit} 
            color="primary" 
            variant="contained"
          >
            {editMode ? 'Update' : 'Create'} Campaign
          </Button>
        </DialogActions>
      </Dialog>
      
      {/* Snackbar for notifications */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar(prev => ({ ...prev, open: false }))}
      >
        <Alert 
          onClose={() => setSnackbar(prev => ({ ...prev, open: false }))} 
          severity={snackbar.severity}
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default CampaignsContent;