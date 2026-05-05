import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import {
  Drawer,
  Box,
  Typography,
  IconButton,
  Avatar,
  Chip,
  Switch,
  FormControlLabel,
  Divider,
  Badge,
  Button,
  TextField,
  Snackbar,
  Alert,
  List,
  ListItem,
  ListItemText,
  ListItemIcon
} from '@mui/material';
import {
  Close as CloseIcon,
  Person as PersonIcon,
  Settings as SettingsIcon,
  Timeline as ActivityIcon,
  Notifications as NotificationsIcon,
  Message as MessageIcon,
  Lock as LockIcon,
  Help as HelpIcon,
  Logout as LogoutIcon,
  ChevronRight as ChevronRightIcon,
  ArrowBack as ArrowBackIcon,
  Visibility,
  VisibilityOff,
  Check as CheckIcon,
  Info as InfoIcon,
  PhotoCamera as PhotoCameraIcon,
  Error as ErrorIcon,
  Storage as DatabaseIcon,
  AccountCircle as AccountIcon,
  Phone as PhoneIcon,
  LocationOn as LocationIcon,
  Business as BusinessIcon,
  Schedule as ScheduleIcon
} from '@mui/icons-material';
import { addOutlet, addLocation, addDivision } from '../../redux/dashboardSlice';
import { createOutlet } from '../../services/outletService';
import { createLocation } from '../../services/locationService';
import { createDivision } from '../../services/devisionService';
import userService from '../../api/userService';

const ProfileDrawer = ({ open, onClose }) => {
  // Get real data from Redux for the AI bot to be "accurate"
  const { outlets, locations, divisions } = useSelector(state => state.dashboard);
  const dispatch = useDispatch();



  const [darkMode, setDarkMode] = useState(false);
  const [currentView, setCurrentView] = useState('main');
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [user, setUser] = useState({
    id: null,
    name: '',
    email: '',
    role: '',
    initials: '',
    isOnline: true,
    profilePicture: null,
    // Additional database fields
    username: '',
    phone: '',
    address: '',
    department: '',
    joinDate: '',
    lastLogin: '',
    status: '',
    permissions: [],
    createdAt: '',
    updatedAt: ''
  });

  // Load user data from database on component mount
  useEffect(() => {
    fetchUserProfile();
  }, []);

  // Fetch user profile from database
  const fetchUserProfile = async () => {
    setProfileLoading(true);
    try {
      const userData = await userService.getProfile();
      
      const userProfile = {
        id: userData.id || null,
        name: userData.name || 'User',
        email: userData.email || '',
        role: userData.role || 'Staff',
        initials: (userData.name || 'U').split(' ').map(n => n[0]).join('').toUpperCase(),
        isOnline: true,
        profilePicture: userData.profilePicture || null,
        // Additional database fields
        username: userData.username || '',
        phone: userData.phone || '',
        address: userData.address || '',
        department: userData.department || '',
        joinDate: userData.joinDate || userData.createdAt || '',
        lastLogin: userData.lastLogin || '',
        status: userData.status || 'Active',
        permissions: userData.permissions || [],
        createdAt: userData.createdAt || '',
        updatedAt: userData.updatedAt || ''
      };
      
      // Update user state
      setUser(userProfile);
      
      // Initialize profile form with user data
      setProfileForm({
        name: userProfile.name,
        email: userProfile.email,
        role: userProfile.role,
        profilePicture: userProfile.profilePicture,
        username: userProfile.username,
        phone: userProfile.phone,
        address: userProfile.address,
        department: userProfile.department
      });
      
      // Update localStorage with fresh data
      localStorage.setItem('user', JSON.stringify(userProfile));
    } catch (error) {
      console.error('Failed to fetch user profile from database:', error);
      setToast({ 
        open: true, 
        message: 'Failed to load profile from database. Please refresh the page.', 
        severity: 'error' 
      });
    } finally {
      setProfileLoading(false);
    }
  };

  // Utility function to update user data everywhere
  const updateUserData = (newUserData) => {
    setUser(newUserData);
    localStorage.setItem('user', JSON.stringify(newUserData));
    // Dispatch custom event for other components to listen
    window.dispatchEvent(new CustomEvent('userDataUpdated', { detail: newUserData }));
  };



  const [profileForm, setProfileForm] = useState({
    name: '',
    email: '',
    role: '',
    profilePicture: null,
    username: '',
    phone: '',
    address: '',
    department: ''
  });

  const [selectedFile, setSelectedFile] = useState(null);

  // Initialize profile form when user data changes
  useEffect(() => {
    if (user.name) {
      const formData = {
        name: user.name,
        email: user.email,
        role: user.role,
        profilePicture: user.profilePicture,
        username: user.username,
        phone: user.phone,
        address: user.address,
        department: user.department
      };
      setProfileForm(formData);
    }
  }, [user]);
  
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  const [showPassword, setShowPassword] = useState({
    current: false,
    new: false,
    confirm: false
  });

  const [aiAssistant, setAiAssistant] = useState({
    enabled: false,
    messages: [],
    inputMessage: '',
    isTyping: false
  });

  const [toast, setToast] = useState({ open: false, message: '', severity: 'success' });
  const [loading, setLoading] = useState(false);
  const [profileLoading, setProfileLoading] = useState(true);
  
  const [notifications] = useState([
    { id: 1, title: 'New Outlet Added', message: 'Outlet "Downtown Mall Store" has been successfully registered', time: '2 minutes ago', read: false, type: 'outlet' },
    { id: 2, title: 'Product Stock Updated', message: 'Stock levels updated for "Samsung Galaxy S24" - 50 units added', time: '15 minutes ago', read: false, type: 'product' },
    { id: 3, title: 'Location Synchronized', message: 'GPS coordinates updated for "Central Plaza Branch"', time: '1 hour ago', read: true, type: 'location' }
  ]);
  
  const [messages] = useState([
    { id: 1, from: 'System Admin', subject: 'Outlet Registration Approved', preview: 'Your outlet registration for "Tech Hub Store" has been approved and is now active...', time: '10 minutes ago', read: false, type: 'approval' },
    { id: 2, from: 'Inventory Manager', subject: 'Stock Replenishment Required', preview: 'Several products in your outlet are below minimum stock levels. Please review...', time: '1 hour ago', read: false, type: 'inventory' }
  ]);

  const [activityLogs] = useState([
    { id: 1, action: 'Outlet Added', details: 'Created new outlet "Tech Plaza Store" with 15 products', timestamp: '2024-01-15 10:30:00', ip: '192.168.1.100', type: 'create' },
    { id: 2, action: 'Product Updated', details: 'Updated stock quantity for "Dell Laptop" from 10 to 25 units', timestamp: '2024-01-15 09:15:00', ip: '192.168.1.100', type: 'update' }
  ]);

  const handleAiToggle = (enabled) => {
    setAiAssistant(prev => ({ 
      ...prev, 
      enabled,
      messages: enabled ? [
        {
          id: 1,
          type: 'assistant',
          message: '👋 **Welcome to your AI Assistant!**\n\nI\'m here to help you with the Outlet Management System. I have comprehensive knowledge about:\n\n🏪 **Outlet Management** - Multi-location control\n📦 **Inventory System** - Real-time stock tracking\n👤 **User Management** - Profiles and authentication\n📊 **Analytics** - Performance insights\n⚙️ **System Features** - All capabilities\n\n💬 **Ask me anything about:**\n• How the system works\n• Managing outlets and inventory\n• System features and navigation\n• Technical questions\n• Best practices and tips\n\nWhat would you like to know about your outlet management system?',
          timestamp: new Date().toLocaleTimeString()
        }
      ] : []
    }));
    
    setToast({ 
      open: true, 
      message: enabled ? 'AI Assistant enabled! Ask me anything about the system.' : 'AI Assistant disabled.', 
      severity: enabled ? 'success' : 'info'
    });
  };

  const handleAiMessage = async () => {
    if (!aiAssistant.inputMessage.trim()) return;
    
    const input = aiAssistant.inputMessage.trim();
    const userMessage = {
      id: Date.now(),
      type: 'user',
      message: input,
      timestamp: new Date().toLocaleTimeString()
    };
    
    setAiAssistant(prev => ({
      ...prev,
      messages: [...prev.messages, userMessage],
      inputMessage: '',
      isTyping: true
    }));

    // Start generating response
    setTimeout(async () => {
      let response = "";
      
      // 🚀 POWERFUL AI CAPABILITY: DATA CREATION
      const lowerInput = input.toLowerCase();
      
      try {
        // 1. Create Outlet Intent
        if (lowerInput.includes('create outlet') || lowerInput.includes('add outlet')) {
          const nameMatch = input.match(/(?:named|name is|outlet) ["']?([^"']+)["']?/i);
          const addressMatch = input.match(/(?:at|address|in) ["']?([^"']+)["']?/i);
          
          if (nameMatch) {
            const name = nameMatch[1];
            const address = addressMatch ? addressMatch[1] : "Default Address";
            
            response = `🏗️ **System Action: Creating Outlet...**\n\nAttempting to create outlet **"${name}"** at **"${address}"**. Please wait...`;
            
            const newOutlet = { name, address, ownerName: user.name, status: 'Active' };
            const apiRes = await createOutlet(newOutlet);
            dispatch(addOutlet(apiRes.data));
            
            response = `✅ **Success!**\n\nI have successfully created the outlet **"${name}"**. You can now see it in your dashboard!\n\n📍 Address: ${address}\n👤 Owner: ${user.name}`;
          } else {
            response = `🤔 **I need more details!**\n\nTo create an outlet, please specify a name. For example:\n*"Create outlet named 'Green Valley' in 'New York'"*`;
          }
        } 
        // 2. Create Location Intent
        else if (lowerInput.includes('create location') || lowerInput.includes('add location')) {
          const nameMatch = input.match(/(?:named|name is|location) ["']?([^"']+)["']?/i);
          if (nameMatch) {
            const name = nameMatch[1];
            response = `🏗️ **System Action: Creating Location...**`;
            
            const apiRes = await createLocation({ name });
            dispatch(addLocation(apiRes.data));
            
            response = `✅ **Success!**\n\nI have registered **"${name}"** as a new location in the system database.`;
          } else {
            response = `🤔 Please specify the location name. E.g., *"Add location named 'Chennai'"*`;
          }
        }
        // 3. Create Division Intent
        else if (lowerInput.includes('create division') || lowerInput.includes('add division')) {
          const nameMatch = input.match(/(?:named|name is|division) ["']?([^"']+)["']?/i);
          if (nameMatch) {
            const name = nameMatch[1];
            response = `🏗️ **System Action: Creating Division...**`;
            
            const apiRes = await createDivision({ name });
            dispatch(addDivision(apiRes.data));
            
            response = `✅ **Success!**\n\nDivision **"${name}"** has been created and categorized.`;
          } else {
            response = `🤔 Please specify the division name. E.g., *"Add division named 'Electronics'"*`;
          }
        }
        // 4. Default: Use the improved accuracy logic
        else {
          response = generateAiResponse(input, outlets, locations, divisions);
        }
      } catch (err) {
        console.error("AI Action Error:", err);
        response = `❌ **Error performing action**\n\nI tried to process your request but encountered an error: ${err.message || "Unknown error"}. Please check if the backend is connected!`;
      }
      
      const aiMessage = {
        id: Date.now() + 1,
        type: 'assistant',
        message: response,
        timestamp: new Date().toLocaleTimeString()
      };
      
      setAiAssistant(prev => ({
        ...prev,
        messages: [...prev.messages, aiMessage],
        isTyping: false
      }));
    }, 1500);
  };

  // Handle profile picture file selection
  const handleProfilePictureChange = (event) => {
    const file = event.target.files[0];
    if (file) {
      setSelectedFile(file);
      // Create preview URL
      const previewUrl = URL.createObjectURL(file);
      setProfileForm(prev => ({ ...prev, profilePicture: previewUrl }));
    }
  };

  // Handle profile save with database sync
  const handleProfileSave = async () => {
    setLoading(true);
    try {
      let profilePictureUrl = user.profilePicture;
      
      // Upload profile picture if selected
      if (selectedFile) {
        const uploadResult = await userService.uploadProfilePicture(selectedFile);
        profilePictureUrl = uploadResult.profilePictureUrl || uploadResult.url;
      }
      
      // Prepare profile data with current form values
      const profileData = {
        name: profileForm.name.trim(),
        email: profileForm.email.trim(),
        role: profileForm.role,
        profilePicture: profilePictureUrl,
        username: profileForm.username.trim(),
        phone: profileForm.phone.trim(),
        address: profileForm.address.trim(),
        department: profileForm.department.trim()
      };
      
      // Validate required fields
      if (!profileData.name || !profileData.email) {
        setToast({ 
          open: true, 
          message: 'Name and email are required fields', 
          severity: 'error' 
        });
        return;
      }
      
      // Update in database first
      const dbResponse = await userService.updateProfile(profileData);
      
      // Create updated user object with new data
      const updatedUser = {
        ...user,
        name: profileData.name,
        email: profileData.email,
        role: profileData.role,
        profilePicture: profileData.profilePicture,
        username: profileData.username,
        phone: profileData.phone,
        address: profileData.address,
        department: profileData.department,
        initials: profileData.name.split(' ').map(n => n[0]).join('').toUpperCase(),
        updatedAt: new Date().toISOString()
      };
      
      // Update all states with new data
      setUser(updatedUser);
      setProfileForm({
        name: updatedUser.name,
        email: updatedUser.email,
        role: updatedUser.role,
        profilePicture: updatedUser.profilePicture,
        username: updatedUser.username,
        phone: updatedUser.phone,
        address: updatedUser.address,
        department: updatedUser.department
      });
      
      // Update localStorage and notify other components
      updateUserData(updatedUser);
      
      setToast({ 
        open: true, 
        message: `Profile updated successfully in database!`, 
        severity: 'success' 
      });
      
      setSelectedFile(null);
      setCurrentView('main');
      
      // Refresh profile data from database to ensure sync
      setTimeout(() => {
        fetchUserProfile();
      }, 1000);
      
    } catch (error) {
      console.error('Profile update failed:', error);
      setToast({ 
        open: true, 
        message: error.message || 'Failed to update profile in database', 
        severity: 'error' 
      });
    } finally {
      setLoading(false);
    }
  };

  // Handle password change with database sync
  const handlePasswordChange = async () => {
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setToast({ 
        open: true, 
        message: 'Passwords do not match', 
        severity: 'error' 
      });
      return;
    }
    
    if (passwordForm.newPassword.length < 6) {
      setToast({ 
        open: true, 
        message: 'Password must be at least 6 characters long', 
        severity: 'error' 
      });
      return;
    }
    
    setLoading(true);
    try {
      console.log('Attempting to change password in database...');
      
      // Update password in database
      const response = await userService.changePassword({
        newPassword: passwordForm.newPassword,
        confirmPassword: passwordForm.confirmPassword
      });
      
      console.log('Password change successful:', response);
      
      setToast({ 
        open: true, 
        message: 'Password changed successfully in database!', 
        severity: 'success' 
      });
      
      setPasswordForm({ 
        currentPassword: '', 
        newPassword: '', 
        confirmPassword: '' 
      });
      
      setCurrentView('main');
      
    } catch (error) {
      console.error('Password change failed:', error);
      setToast({ 
        open: true, 
        message: error.message || 'Failed to change password in database', 
        severity: 'error' 
      });
    } finally {
      setLoading(false);
    }
  };

  const generateAiResponse = (userMessage) => {
    const message = userMessage.toLowerCase().trim();
    
    // 1. Data-Driven Responses (Accurate counts and lists)
    if (message.includes('how many') || message.includes('count') || message.includes('total')) {
      if (message.includes('outlet')) {
        return `🏪 **Accuracy Report: Outlets**\n\nYou currently have **${outlets.length}** registered outlets in the system.\n\n${outlets.length > 0 ? `The most recent one is **"${outlets[outlets.length - 1].name}"**.` : "You haven't added any outlets yet."}`;
      }
      if (message.includes('location')) {
        return `📍 **Accuracy Report: Locations**\n\nThere are **${locations.length}** locations configured across your network.\n\n${locations.length > 0 ? `Your coverage includes cities like **${[...new Set(locations.slice(0, 3).map(l => l.name))].join(', ')}**.` : ""}`;
      }
      if (message.includes('division')) {
        return `🗂️ **Accuracy Report: Divisions**\n\nThe system is managing **${divisions.length}** operational divisions.\n\nThis helps in categorizing your products and outlets effectively.`;
      }
    }

    // 2. Listing items
    if (message.includes('list') || message.includes('show all') || message.includes('what are')) {
      if (message.includes('outlet')) {
        if (outlets.length === 0) return "You don't have any outlets yet.";
        const list = outlets.slice(0, 5).map(o => `• **${o.name}** (${o.address || 'No address'})`).join('\n');
        return `📋 **Here are your top 5 outlets:**\n\n${list}\n\n${outlets.length > 5 ? `*...and ${outlets.length - 5} more.*` : ""}`;
      }
      if (message.includes('location')) {
        if (locations.length === 0) return "No locations found.";
        const list = locations.slice(0, 5).map(l => `• **${l.name}**`).join('\n');
        return `📋 **Active Locations:**\n\n${list}\n\n${locations.length > 5 ? `*...and ${locations.length - 5} more.*` : ""}`;
      }
    }

    // 3. Search Logic
    if (message.includes('find') || message.includes('search') || message.includes('where is')) {
      const query = message.replace('find', '').replace('search', '').replace('where is', '').trim();
      if (query.length > 2) {
        const foundOutlet = outlets.find(o => o.name.toLowerCase().includes(query));
        if (foundOutlet) {
          return `🔍 **Search Result Found!**\n\nI found the outlet **"${foundOutlet.name}"**.\n📍 Address: ${foundOutlet.address || 'Not specified'}\n👤 Owner: ${foundOutlet.ownerName || 'N/A'}`;
        }
        const foundLocation = locations.find(l => l.name.toLowerCase().includes(query));
        if (foundLocation) {
          return `🔍 **Search Result Found!**\n\nI found the location **"${foundLocation.name}"** in the system database.`;
        }
      }
    }

    // 4. System Knowledge (General Questions)
    if (message.includes('what is this') || message.includes('about this project') || message.includes('help')) {
      return `🏪 **Outlet Management System (OMS) Intelligence**\n\nI am your AI assistant, and I have direct access to your system's database. Currently, I am tracking:\n\n• **${outlets.length}** Outlets\n• **${locations.length}** Locations\n• **${divisions.length}** Divisions\n\n**You can ask me things like:**\n• "How many outlets do I have?"\n• "List my locations"\n• "Search for [Outlet Name]"\n• "What is the tech stack?"`;
    }

    if (message.includes('technology') || message.includes('tech stack') || message.includes('built with')) {
      return `💻 **Technical Architecture**\n\n**Frontend:** React.js, Material UI, Redux Toolkit\n**State Management:** Accurate data synchronization via Thunks\n**Backend:** Spring Boot (via Dev Tunnels)\n**Database:** Dynamic relational mapping\n\nI am optimized to provide real-time accuracy based on your current data session.`;
    }

    // 5. Default Response
    return `🤔 **I'm analyzing your request: "${userMessage}"**\n\nI can provide accurate data about your system. Try asking:\n• "Count my outlets"\n• "List divisions"\n• "Find [City Name]"\n\nCurrently, your system is **Operational** with **${outlets.length}** active outlets.`;
  };

  const handleLogout = () => {
    localStorage.clear();
    window.location.href = '/';
  };

  const menuSections = [
    {
      label: 'ACCOUNT',
      items: [
        { icon: PersonIcon, label: 'My Profile', action: () => { 
          // Ensure form is populated with current user data
          setProfileForm({
            name: user.name || '',
            email: user.email || '',
            role: user.role || '',
            profilePicture: user.profilePicture || null,
            username: user.username || '',
            phone: user.phone || '',
            address: user.address || '',
            department: user.department || ''
          });
          setCurrentView('profile'); 
        } },
        { icon: DatabaseIcon, label: 'Database Info', action: () => setCurrentView('database') },
        { icon: SettingsIcon, label: 'Settings', action: () => setCurrentView('settings') },
        { icon: ActivityIcon, label: 'Activity Log', action: () => setCurrentView('activity') }
      ]
    },
    {
      label: 'NOTIFICATIONS',
      items: [
        { 
          icon: NotificationsIcon, 
          label: 'Notifications', 
          badge: { count: notifications.filter(n => !n.read).length, color: 'error' },
          action: () => setCurrentView('notifications')
        },
        { 
          icon: MessageIcon, 
          label: 'Messages', 
          badge: { count: messages.filter(m => !m.read).length, color: 'primary' },
          action: () => setCurrentView('messages')
        }
      ]
    },
    {
      label: 'SYSTEM',
      items: [
        { icon: LockIcon, label: 'Change Password', action: () => setCurrentView('password') },
        { icon: HelpIcon, label: 'Help & Support', action: () => setCurrentView('help') }
      ]
    }
  ];

  const renderMainView = () => {
    if (profileLoading) {
      return (
        <Box sx={{ 
          display: 'flex', 
          justifyContent: 'center', 
          alignItems: 'center', 
          height: '100%',
          flexDirection: 'column',
          gap: 2
        }}>
          <Typography variant="body2" sx={{ color: '#64748b' }}>Loading profile...</Typography>
        </Box>
      );
    }

    return (
    <>
      <Box sx={{ p: 2, position: 'relative', backgroundColor: '#4f46e5', color: 'white' }}>
        <IconButton onClick={onClose} sx={{ position: 'absolute', top: 8, right: 8, zIndex: 1, color: 'white' }}>
          <CloseIcon />
        </IconButton>

        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', pt: 2 }}>
          <Avatar
            sx={{
              width: 60,
              height: 60,
              backgroundColor: '#EEF2FF',
              color: '#4F46E5',
              fontSize: '20px',
              fontWeight: 'bold',
              mb: 2
            }}
            src={user.profilePicture}
          >
            {!user.profilePicture && user.initials}
          </Avatar>

          <Typography variant="h6" sx={{ fontWeight: 600, mb: 0.5, textAlign: 'center', color: 'white' }}>
            {user.name}
          </Typography>
          
          <Chip
            label={user.role}
            size="small"
            sx={{
              backgroundColor: '#F3F4F6',
              color: '#6B7280',
              fontSize: '12px',
              height: '24px',
              mb: 1
            }}
          />
          
          <Typography variant="body2" sx={{ textAlign: 'center', color: 'rgba(255, 255, 255, 0.9)' }}>
            {user.email}
          </Typography>
        </Box>
      </Box>

      <Box sx={{ flex: 1, px: 2, pb: 2, backgroundColor: '#ffffff', borderRadius: '12px 12px 0 0', mx: 1, mt: 2 }}>
        {menuSections.map((section, sectionIndex) => (
          <Box key={section.label}>
            <Typography
              variant="caption"
              sx={{
                fontSize: '11px',
                textTransform: 'uppercase',
                letterSpacing: '0.08em',
                color: '#64748b',
                fontWeight: 700,
                mb: 2,
                mt: sectionIndex > 0 ? 3 : 2,
                display: 'block',
                px: 2
              }}
            >
              {section.label}
            </Typography>

            {section.items.map((item, itemIndex) => (
              <Box
                key={itemIndex}
                onClick={item.action}
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  padding: '12px 16px',
                  borderRadius: '10px',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  mb: 1,
                  backgroundColor: '#f8fafc',
                  border: '1px solid #e2e8f0',
                  '&:hover': { 
                    backgroundColor: '#e2e8f0',
                    transform: 'translateX(4px)'
                  }
                }}
              >
                <Box
                  sx={{
                    width: 36,
                    height: 36,
                    borderRadius: '10px',
                    backgroundColor: '#4f46e5',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    mr: 3
                  }}
                >
                  <item.icon sx={{ fontSize: 18, color: 'white' }} />
                </Box>

                <Typography variant="body2" sx={{ flex: 1, fontWeight: 600, color: '#1e293b', fontSize: '14px' }}>
                  {item.label}
                </Typography>

                {item.badge ? (
                  <Badge
                    badgeContent={item.badge.count}
                    color={item.badge.color}
                    sx={{ '& .MuiBadge-badge': { fontSize: '10px', height: '18px', minWidth: '18px', fontWeight: 'bold' } }}
                  >
                    <Box sx={{ width: 16 }} />
                  </Badge>
                ) : (
                  <ChevronRightIcon sx={{ fontSize: 18, color: '#64748b' }} />
                )}
              </Box>
            ))}
          </Box>
        ))}
      </Box>
    </>
    );
  };

  const renderProfileView = () => (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column', backgroundColor: '#ffffff', m: 1, borderRadius: '12px' }}>
      <Box sx={{ display: 'flex', alignItems: 'center', p: 3, borderBottom: '1px solid #e2e8f0', backgroundColor: '#f8fafc', borderRadius: '12px 12px 0 0' }}>
        <IconButton 
          onClick={() => setCurrentView('main')} 
          sx={{ 
            mr: 2, 
            backgroundColor: '#4f46e5', 
            color: 'white', 
            '&:hover': { backgroundColor: '#4338ca' },
            width: 40,
            height: 40
          }}
        >
          <ArrowBackIcon />
        </IconButton>
        <Typography variant="h5" sx={{ fontWeight: 700, color: '#1e293b' }}>Edit Profile</Typography>
      </Box>
      
      <Box sx={{ p: 3, flex: 1, overflow: 'auto' }}>
        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', mb: 4 }}>
          <Box sx={{ position: 'relative' }}>
            <Avatar
              sx={{ width: 100, height: 100, mb: 2, border: '4px solid #f1f5f9', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
              src={profileForm.profilePicture || user.profilePicture}
            >
              {!profileForm.profilePicture && !user.profilePicture && user.initials}
            </Avatar>
            <IconButton
              component="label"
              sx={{
                position: 'absolute',
                bottom: 12,
                right: 0,
                backgroundColor: '#4f46e5',
                color: 'white',
                '&:hover': { backgroundColor: '#4338ca' },
                width: 32,
                height: 32,
                border: '2px solid white'
              }}
            >
              <PhotoCameraIcon sx={{ fontSize: 16 }} />
              <input type="file" hidden accept="image/*" onChange={handleProfilePictureChange} />
            </IconButton>
          </Box>
          <Typography variant="caption" sx={{ color: '#64748b' }}>Click camera to change photo</Typography>
        </Box>

        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
          <TextField
            label="Full Name"
            value={profileForm.name}
            onChange={(e) => setProfileForm(prev => ({ ...prev, name: e.target.value }))}
            fullWidth
            variant="outlined"
            size="small"
            InputProps={{
              startAdornment: <PersonIcon sx={{ color: '#94a3b8', mr: 1, fontSize: 20 }} />,
              sx: { borderRadius: '10px' }
            }}
          />
          <TextField
            label="Username"
            value={profileForm.username}
            onChange={(e) => setProfileForm(prev => ({ ...prev, username: e.target.value }))}
            fullWidth
            variant="outlined"
            size="small"
            InputProps={{
              startAdornment: <AccountIcon sx={{ color: '#94a3b8', mr: 1, fontSize: 20 }} />,
              sx: { borderRadius: '10px' }
            }}
          />
          <TextField
            label="Email Address"
            value={profileForm.email}
            onChange={(e) => setProfileForm(prev => ({ ...prev, email: e.target.value }))}
            fullWidth
            variant="outlined"
            size="small"
            InputProps={{
              startAdornment: <MessageIcon sx={{ color: '#94a3b8', mr: 1, fontSize: 20 }} />,
              sx: { borderRadius: '10px' }
            }}
          />
          <TextField
            label="Phone Number"
            value={profileForm.phone}
            onChange={(e) => setProfileForm(prev => ({ ...prev, phone: e.target.value }))}
            fullWidth
            variant="outlined"
            size="small"
            InputProps={{
              startAdornment: <PhoneIcon sx={{ color: '#94a3b8', mr: 1, fontSize: 20 }} />,
              sx: { borderRadius: '10px' }
            }}
          />
          <TextField
            label="Address"
            value={profileForm.address}
            onChange={(e) => setProfileForm(prev => ({ ...prev, address: e.target.value }))}
            fullWidth
            variant="outlined"
            size="small"
            multiline
            rows={2}
            InputProps={{
              startAdornment: <LocationIcon sx={{ color: '#94a3b8', mr: 1, fontSize: 20, alignSelf: 'flex-start', mt: 1 }} />,
              sx: { borderRadius: '10px' }
            }}
          />
          <TextField
            label="Department"
            value={profileForm.department}
            onChange={(e) => setProfileForm(prev => ({ ...prev, department: e.target.value }))}
            fullWidth
            variant="outlined"
            size="small"
            InputProps={{
              startAdornment: <BusinessIcon sx={{ color: '#94a3b8', mr: 1, fontSize: 20 }} />,
              sx: { borderRadius: '10px' }
            }}
          />
          <TextField
            label="Role"
            value={profileForm.role}
            disabled
            fullWidth
            variant="outlined"
            size="small"
            InputProps={{
              startAdornment: <SettingsIcon sx={{ color: '#94a3b8', mr: 1, fontSize: 20 }} />,
              sx: { borderRadius: '10px', backgroundColor: '#f8fafc' }
            }}
          />
          
          <Button
            variant="contained"
            onClick={handleProfileSave}
            disabled={loading}
            fullWidth
            sx={{
              mt: 2,
              backgroundColor: '#4f46e5',
              '&:hover': { backgroundColor: '#4338ca' },
              borderRadius: '12px',
              py: 1.5,
              textTransform: 'none',
              fontWeight: 600,
              boxShadow: '0 4px 6px -1px rgb(79 70 229 / 0.2)'
            }}
          >
            {loading ? 'Saving Changes...' : 'Save Profile Changes'}
          </Button>
        </Box>
      </Box>
    </Box>
  );

  const renderPasswordView = () => (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column', backgroundColor: '#ffffff', m: 1, borderRadius: '12px' }}>
      <Box sx={{ display: 'flex', alignItems: 'center', p: 3, borderBottom: '1px solid #e2e8f0', backgroundColor: '#f8fafc', borderRadius: '12px 12px 0 0' }}>
        <IconButton 
          onClick={() => setCurrentView('main')} 
          sx={{ 
            mr: 2, 
            backgroundColor: '#4f46e5', 
            color: 'white', 
            '&:hover': { backgroundColor: '#4338ca' },
            width: 40,
            height: 40
          }}
        >
          <ArrowBackIcon />
        </IconButton>
        <Typography variant="h5" sx={{ fontWeight: 700, color: '#1e293b' }}>Change Password</Typography>
      </Box>
      
      <Box sx={{ p: 3, flex: 1 }}>
        <Box sx={{ mb: 3, p: 2, backgroundColor: '#fef2f2', borderRadius: '10px', border: '1px solid #fee2e2' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
            <LockIcon sx={{ color: '#ef4444', mr: 1, fontSize: 20 }} />
            <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#b91c1c' }}>Security Requirement</Typography>
          </Box>
          <Typography variant="caption" sx={{ color: '#991b1b', display: 'block' }}>
            Password must be at least 6 characters long and include numbers for better security.
          </Typography>
        </Box>

        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
          <TextField
            label="Current Password"
            type={showPassword.current ? 'text' : 'password'}
            value={passwordForm.currentPassword}
            onChange={(e) => setPasswordForm(prev => ({ ...prev, currentPassword: e.target.value }))}
            fullWidth
            variant="outlined"
            size="small"
            InputProps={{
              endAdornment: (
                <IconButton onClick={() => setShowPassword(p => ({ ...p, current: !p.current }))} size="small">
                  {showPassword.current ? <VisibilityOff /> : <Visibility />}
                </IconButton>
              ),
              sx: { borderRadius: '10px' }
            }}
          />
          <TextField
            label="New Password"
            type={showPassword.new ? 'text' : 'password'}
            value={passwordForm.newPassword}
            onChange={(e) => setPasswordForm(prev => ({ ...prev, newPassword: e.target.value }))}
            fullWidth
            variant="outlined"
            size="small"
            InputProps={{
              endAdornment: (
                <IconButton onClick={() => setShowPassword(p => ({ ...p, new: !p.new }))} size="small">
                  {showPassword.new ? <VisibilityOff /> : <Visibility />}
                </IconButton>
              ),
              sx: { borderRadius: '10px' }
            }}
          />
          <TextField
            label="Confirm New Password"
            type={showPassword.confirm ? 'text' : 'password'}
            value={passwordForm.confirmPassword}
            onChange={(e) => setPasswordForm(prev => ({ ...prev, confirmPassword: e.target.value }))}
            fullWidth
            variant="outlined"
            size="small"
            InputProps={{
              endAdornment: (
                <IconButton onClick={() => setShowPassword(p => ({ ...p, confirm: !p.confirm }))} size="small">
                  {showPassword.confirm ? <VisibilityOff /> : <Visibility />}
                </IconButton>
              ),
              sx: { borderRadius: '10px' }
            }}
          />
          
          <Button
            variant="contained"
            onClick={handlePasswordChange}
            disabled={loading}
            fullWidth
            sx={{
              mt: 2,
              backgroundColor: '#ef4444',
              '&:hover': { backgroundColor: '#dc2626' },
              borderRadius: '12px',
              py: 1.5,
              textTransform: 'none',
              fontWeight: 600
            }}
          >
            {loading ? 'Updating Password...' : 'Update Password'}
          </Button>
        </Box>
      </Box>
    </Box>
  );

  const renderNotificationsView = () => (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column', backgroundColor: '#ffffff', m: 1, borderRadius: '12px' }}>
      <Box sx={{ display: 'flex', alignItems: 'center', p: 3, borderBottom: '1px solid #e2e8f0', backgroundColor: '#f8fafc', borderRadius: '12px 12px 0 0' }}>
        <IconButton 
          onClick={() => setCurrentView('main')} 
          sx={{ 
            mr: 2, 
            backgroundColor: '#4f46e5', 
            color: 'white', 
            '&:hover': { backgroundColor: '#4338ca' },
            width: 40,
            height: 40
          }}
        >
          <ArrowBackIcon />
        </IconButton>
        <Typography variant="h5" sx={{ fontWeight: 700, color: '#1e293b' }}>Notifications</Typography>
        <Badge 
          badgeContent={notifications.filter(n => !n.read).length} 
          color="error" 
          sx={{ ml: 2 }}
        >
          <NotificationsIcon sx={{ color: '#64748b' }} />
        </Badge>
      </Box>
      
      <List sx={{ flex: 1, overflow: 'auto', p: 0 }}>
        {notifications.map((notification, index) => (
          <ListItem 
            key={notification.id}
            sx={{
              borderBottom: index < notifications.length - 1 ? '1px solid #f1f5f9' : 'none',
              py: 2.5,
              px: 3,
              '&:hover': { backgroundColor: '#f8fafc' },
              cursor: 'pointer'
            }}
          >
            <ListItemIcon sx={{ minWidth: 48 }}>
              <Box sx={{
                width: 40,
                height: 40,
                borderRadius: '10px',
                backgroundColor: notification.read ? '#f1f5f9' : '#dbeafe',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                {notification.read ? 
                  <CheckIcon sx={{ color: '#10b981', fontSize: 20 }} /> : 
                  <InfoIcon sx={{ color: '#3b82f6', fontSize: 20 }} />
                }
              </Box>
            </ListItemIcon>
            <ListItemText
              primary={
                <Typography variant="subtitle2" sx={{ 
                  fontWeight: notification.read ? 500 : 700, 
                  color: '#1e293b',
                  mb: 0.5
                }}>
                  {notification.title}
                </Typography>
              }
              secondary={
                <Box>
                  <Typography variant="body2" sx={{ color: '#64748b', mb: 1 }}>
                    {notification.message}
                  </Typography>
                  <Typography variant="caption" sx={{ color: '#94a3b8' }}>
                    {notification.time}
                  </Typography>
                </Box>
              }
            />
          </ListItem>
        ))}
      </List>
    </Box>
  );

  const renderMessagesView = () => (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column', backgroundColor: '#ffffff', m: 1, borderRadius: '12px' }}>
      <Box sx={{ display: 'flex', alignItems: 'center', p: 3, borderBottom: '1px solid #e2e8f0', backgroundColor: '#f8fafc', borderRadius: '12px 12px 0 0' }}>
        <IconButton 
          onClick={() => setCurrentView('main')} 
          sx={{ 
            mr: 2, 
            backgroundColor: '#4f46e5', 
            color: 'white', 
            '&:hover': { backgroundColor: '#4338ca' },
            width: 40,
            height: 40
          }}
        >
          <ArrowBackIcon />
        </IconButton>
        <Typography variant="h5" sx={{ fontWeight: 700, color: '#1e293b' }}>Messages</Typography>
        <Badge 
          badgeContent={messages.filter(m => !m.read).length} 
          color="primary" 
          sx={{ ml: 2 }}
        >
          <MessageIcon sx={{ color: '#64748b' }} />
        </Badge>
      </Box>
      
      <List sx={{ flex: 1, overflow: 'auto', p: 0 }}>
        {messages.map((message, index) => (
          <ListItem 
            key={message.id}
            sx={{
              borderBottom: index < messages.length - 1 ? '1px solid #f1f5f9' : 'none',
              py: 2.5,
              px: 3,
              '&:hover': { backgroundColor: '#f8fafc' },
              cursor: 'pointer',
              backgroundColor: !message.read ? '#fef7ff' : 'transparent'
            }}
          >
            <ListItemIcon sx={{ minWidth: 48 }}>
              <Avatar sx={{
                width: 40,
                height: 40,
                backgroundColor: '#8b5cf6',
                fontSize: '14px',
                fontWeight: 'bold'
              }}>
                {message.from.charAt(0)}
              </Avatar>
            </ListItemIcon>
            <ListItemText
              primary={
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 0.5 }}>
                  <Typography variant="subtitle2" sx={{ 
                    fontWeight: message.read ? 500 : 700, 
                    color: '#1e293b',
                    flex: 1
                  }}>
                    {message.subject}
                  </Typography>
                  <Typography variant="caption" sx={{ color: '#94a3b8', ml: 1 }}>
                    {message.time}
                  </Typography>
                </Box>
              }
              secondary={
                <Box>
                  <Typography variant="caption" sx={{ 
                    color: '#8b5cf6', 
                    fontWeight: 600,
                    display: 'block',
                    mb: 0.5
                  }}>
                    From: {message.from}
                  </Typography>
                  <Typography variant="body2" sx={{ color: '#64748b' }}>
                    {message.preview}
                  </Typography>
                </Box>
              }
            />
          </ListItem>
        ))}
      </List>
    </Box>
  );

  const renderActivityView = () => (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column', backgroundColor: '#ffffff', m: 1, borderRadius: '12px' }}>
      <Box sx={{ display: 'flex', alignItems: 'center', p: 3, borderBottom: '1px solid #e2e8f0', backgroundColor: '#f8fafc', borderRadius: '12px 12px 0 0' }}>
        <IconButton 
          onClick={() => setCurrentView('main')} 
          sx={{ 
            mr: 2, 
            backgroundColor: '#4f46e5', 
            color: 'white', 
            '&:hover': { backgroundColor: '#4338ca' },
            width: 40,
            height: 40
          }}
        >
          <ArrowBackIcon />
        </IconButton>
        <Typography variant="h5" sx={{ fontWeight: 700, color: '#1e293b' }}>Activity Log</Typography>
        <ActivityIcon sx={{ ml: 2, color: '#64748b' }} />
      </Box>
      
      <List sx={{ flex: 1, overflow: 'auto', p: 0 }}>
        {activityLogs.map((log, index) => (
          <ListItem 
            key={log.id}
            sx={{
              borderBottom: index < activityLogs.length - 1 ? '1px solid #f1f5f9' : 'none',
              py: 2.5,
              px: 3,
              '&:hover': { backgroundColor: '#f8fafc' }
            }}
          >
            <ListItemIcon sx={{ minWidth: 48 }}>
              <Box sx={{
                width: 40,
                height: 40,
                borderRadius: '10px',
                backgroundColor: '#dcfce7',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <ActivityIcon sx={{ color: '#16a34a', fontSize: 20 }} />
              </Box>
            </ListItemIcon>
            <ListItemText
              primary={
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 0.5 }}>
                  <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#1e293b' }}>
                    {log.action}
                  </Typography>
                  <Typography variant="caption" sx={{ color: '#94a3b8' }}>
                    {log.timestamp}
                  </Typography>
                </Box>
              }
              secondary={
                <Box>
                  <Typography variant="body2" sx={{ color: '#64748b', mb: 0.5 }}>
                    {log.details}
                  </Typography>
                  <Chip 
                    label={`IP: ${log.ip}`} 
                    size="small" 
                    sx={{ 
                      backgroundColor: '#f1f5f9', 
                      color: '#64748b',
                      fontSize: '11px',
                      height: '20px'
                    }} 
                  />
                </Box>
              }
            />
          </ListItem>
        ))}
      </List>
    </Box>
  );

  const renderHelpView = () => (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column', backgroundColor: '#ffffff', m: 1, borderRadius: '12px' }}>
      <Box sx={{ display: 'flex', alignItems: 'center', p: 3, borderBottom: '1px solid #e2e8f0', backgroundColor: '#f8fafc', borderRadius: '12px 12px 0 0' }}>
        <IconButton 
          onClick={() => setCurrentView('main')} 
          sx={{ 
            mr: 2, 
            backgroundColor: '#4f46e5', 
            color: 'white', 
            '&:hover': { backgroundColor: '#4338ca' },
            width: 40,
            height: 40
          }}
        >
          <ArrowBackIcon />
        </IconButton>
        <Typography variant="h5" sx={{ fontWeight: 700, color: '#1e293b' }}>Help & Support</Typography>
        <HelpIcon sx={{ ml: 2, color: '#64748b' }} />
      </Box>
      
      <Box sx={{ p: 3, flex: 1 }}>
        <Typography variant="h6" sx={{ fontWeight: 600, color: '#1e293b', mb: 2 }}>Need Help?</Typography>
        <Typography variant="body2" sx={{ color: '#64748b', mb: 3 }}>
          Contact our support team for assistance with your outlet management system.
        </Typography>
        
        <Button
          variant="contained"
          fullWidth
          sx={{
            backgroundColor: '#4f46e5',
            '&:hover': { backgroundColor: '#4338ca' },
            borderRadius: '12px',
            py: 1.5,
            textTransform: 'none',
            fontWeight: 600
          }}
        >
          Contact Support
        </Button>
      </Box>
    </Box>
  );

  const renderDatabaseView = () => (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column', backgroundColor: '#ffffff', m: 1, borderRadius: '12px' }}>
      <Box sx={{ display: 'flex', alignItems: 'center', p: 3, borderBottom: '1px solid #e2e8f0', backgroundColor: '#f8fafc', borderRadius: '12px 12px 0 0' }}>
        <IconButton 
          onClick={() => setCurrentView('main')} 
          sx={{ 
            mr: 2, 
            backgroundColor: '#4f46e5', 
            color: 'white', 
            '&:hover': { backgroundColor: '#4338ca' },
            width: 40,
            height: 40
          }}
        >
          <ArrowBackIcon />
        </IconButton>
        <Typography variant="h5" sx={{ fontWeight: 700, color: '#1e293b' }}>Database Information</Typography>
        <DatabaseIcon sx={{ ml: 2, color: '#64748b' }} />
      </Box>
      
      <Box sx={{ p: 3, flex: 1, overflow: 'auto' }}>
        {/* User Identity Section */}
        <Box sx={{ mb: 4, p: 3, backgroundColor: '#f8fafc', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
          <Typography variant="h6" sx={{ fontWeight: 700, color: '#1e293b', mb: 3, display: 'flex', alignItems: 'center' }}>
            <PersonIcon sx={{ mr: 1, color: '#4f46e5' }} />
            User Identity
          </Typography>
          <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
            <Box>
              <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 600 }}>User ID</Typography>
              <Typography variant="body2" sx={{ color: '#1e293b', fontWeight: 500 }}>{user.id || 'N/A'}</Typography>
            </Box>
            <Box>
              <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 600 }}>Username</Typography>
              <Typography variant="body2" sx={{ color: '#1e293b', fontWeight: 500 }}>{user.username || 'N/A'}</Typography>
            </Box>
            <Box>
              <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 600 }}>Full Name</Typography>
              <Typography variant="body2" sx={{ color: '#1e293b', fontWeight: 500 }}>{user.name || 'N/A'}</Typography>
            </Box>
            <Box>
              <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 600 }}>Email</Typography>
              <Typography variant="body2" sx={{ color: '#1e293b', fontWeight: 500 }}>{user.email || 'N/A'}</Typography>
            </Box>
          </Box>
        </Box>

        {/* Contact & Location Section */}
        <Box sx={{ mb: 4, p: 3, backgroundColor: '#f0fdf4', borderRadius: '12px', border: '1px solid #dcfce7' }}>
          <Typography variant="h6" sx={{ fontWeight: 700, color: '#1e293b', mb: 3, display: 'flex', alignItems: 'center' }}>
            <PhoneIcon sx={{ mr: 1, color: '#10b981' }} />
            Contact & Location
          </Typography>
          <Box sx={{ display: 'grid', gridTemplateColumns: '1fr', gap: 2 }}>
            <Box>
              <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 600 }}>Phone Number</Typography>
              <Typography variant="body2" sx={{ color: '#1e293b', fontWeight: 500 }}>{user.phone || 'Not provided'}</Typography>
            </Box>
            <Box>
              <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 600 }}>Address</Typography>
              <Typography variant="body2" sx={{ color: '#1e293b', fontWeight: 500 }}>{user.address || 'Not provided'}</Typography>
            </Box>
          </Box>
        </Box>

        {/* Organization Section */}
        <Box sx={{ mb: 4, p: 3, backgroundColor: '#fef7ff', borderRadius: '12px', border: '1px solid #f3e8ff' }}>
          <Typography variant="h6" sx={{ fontWeight: 700, color: '#1e293b', mb: 3, display: 'flex', alignItems: 'center' }}>
            <BusinessIcon sx={{ mr: 1, color: '#8b5cf6' }} />
            Organization
          </Typography>
          <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
            <Box>
              <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 600 }}>Role</Typography>
              <Chip 
                label={user.role || 'N/A'} 
                size="small" 
                sx={{ 
                  backgroundColor: '#8b5cf6', 
                  color: 'white',
                  fontWeight: 600,
                  mt: 0.5
                }} 
              />
            </Box>
            <Box>
              <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 600 }}>Department</Typography>
              <Typography variant="body2" sx={{ color: '#1e293b', fontWeight: 500 }}>{user.department || 'Not assigned'}</Typography>
            </Box>
            <Box>
              <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 600 }}>Status</Typography>
              <Chip 
                label={user.status || 'Active'} 
                size="small" 
                sx={{ 
                  backgroundColor: user.status === 'Active' ? '#10b981' : '#ef4444', 
                  color: 'white',
                  fontWeight: 600,
                  mt: 0.5
                }} 
              />
            </Box>
            <Box>
              <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 600 }}>Permissions</Typography>
              <Typography variant="body2" sx={{ color: '#1e293b', fontWeight: 500 }}>
                {user.permissions && user.permissions.length > 0 ? user.permissions.join(', ') : 'Standard access'}
              </Typography>
            </Box>
          </Box>
        </Box>

        {/* System Timestamps Section */}
        <Box sx={{ mb: 4, p: 3, backgroundColor: '#fef2f2', borderRadius: '12px', border: '1px solid #fee2e2' }}>
          <Typography variant="h6" sx={{ fontWeight: 700, color: '#1e293b', mb: 3, display: 'flex', alignItems: 'center' }}>
            <ScheduleIcon sx={{ mr: 1, color: '#ef4444' }} />
            System Timestamps
          </Typography>
          <Box sx={{ display: 'grid', gridTemplateColumns: '1fr', gap: 2 }}>
            <Box>
              <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 600 }}>Account Created</Typography>
              <Typography variant="body2" sx={{ color: '#1e293b', fontWeight: 500 }}>
                {user.createdAt ? new Date(user.createdAt).toLocaleString() : 'N/A'}
              </Typography>
            </Box>
            <Box>
              <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 600 }}>Last Updated</Typography>
              <Typography variant="body2" sx={{ color: '#1e293b', fontWeight: 500 }}>
                {user.updatedAt ? new Date(user.updatedAt).toLocaleString() : 'N/A'}
              </Typography>
            </Box>
            <Box>
              <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 600 }}>Join Date</Typography>
              <Typography variant="body2" sx={{ color: '#1e293b', fontWeight: 500 }}>
                {user.joinDate ? new Date(user.joinDate).toLocaleDateString() : 'N/A'}
              </Typography>
            </Box>
            <Box>
              <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 600 }}>Last Login</Typography>
              <Typography variant="body2" sx={{ color: '#1e293b', fontWeight: 500 }}>
                {user.lastLogin ? new Date(user.lastLogin).toLocaleString() : 'N/A'}
              </Typography>
            </Box>
          </Box>
        </Box>

        {/* Database Status */}
        <Box sx={{ p: 3, backgroundColor: '#dbeafe', borderRadius: '12px', border: '1px solid #bfdbfe' }}>
          <Typography variant="h6" sx={{ fontWeight: 700, color: '#1e293b', mb: 2, display: 'flex', alignItems: 'center' }}>
            <DatabaseIcon sx={{ mr: 1, color: '#3b82f6' }} />
            Database Status
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Chip 
              label="Connected" 
              size="small" 
              sx={{ 
                backgroundColor: '#10b981', 
                color: 'white',
                fontWeight: 600
              }} 
            />
            <Typography variant="body2" sx={{ color: '#64748b' }}>
              Data synchronized from backend database
            </Typography>
          </Box>
        </Box>
      </Box>
    </Box>
  );
  const renderSettingsView = () => (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column', backgroundColor: '#ffffff', m: 1, borderRadius: '12px' }}>
      <Box sx={{ display: 'flex', alignItems: 'center', p: 3, borderBottom: '1px solid #e2e8f0', backgroundColor: '#f8fafc', borderRadius: '12px 12px 0 0' }}>
        <IconButton 
          onClick={() => setCurrentView('main')} 
          sx={{ 
            mr: 2, 
            backgroundColor: '#4f46e5', 
            color: 'white', 
            '&:hover': { backgroundColor: '#4338ca' },
            width: 40,
            height: 40
          }}
        >
          <ArrowBackIcon />
        </IconButton>
        <Typography variant="h5" sx={{ fontWeight: 700, color: '#1e293b' }}>Settings</Typography>
      </Box>
      
      <Box sx={{ p: 3, flex: 1 }}>
        <Box sx={{ mb: 4 }}>
          <Typography variant="h6" sx={{ fontWeight: 600, color: '#1e293b', mb: 2 }}>AI Assistant</Typography>
          <Box sx={{ 
            backgroundColor: aiAssistant.enabled ? '#f0fdf4' : '#f8fafc', 
            borderRadius: '12px', 
            p: 2,
            border: `1px solid ${aiAssistant.enabled ? '#10b981' : '#e2e8f0'}`
          }}>
            <FormControlLabel
              control={
                <Switch 
                  checked={aiAssistant.enabled} 
                  onChange={(e) => handleAiToggle(e.target.checked)}
                />
              }
              label={
                <Box sx={{ ml: 1 }}>
                  <Typography variant="body2" sx={{ fontWeight: 600, color: '#1e293b' }}>Enable AI Assistant</Typography>
                  <Typography variant="caption" sx={{ color: '#64748b' }}>Get intelligent help based on your data</Typography>
                </Box>
              }
              sx={{ width: '100%', m: 0 }}
            />
            {aiAssistant.enabled && (
              <Box sx={{ display: 'flex', gap: 1, mt: 2 }}>
                <Button
                  onClick={() => setCurrentView('aiChat')}
                  variant="contained"
                  size="small"
                  sx={{
                    backgroundColor: '#8b5cf6',
                    '&:hover': { backgroundColor: '#7c3aed' },
                    textTransform: 'none',
                    borderRadius: '8px',
                    flex: 1
                  }}
                >
                  Open AI Chat
                </Button>
              </Box>
            )}
          </Box>
        </Box>
      </Box>
    </Box>
  );

  const renderAiChatView = () => (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column', backgroundColor: '#ffffff', m: 1, borderRadius: '12px' }}>
      <Box sx={{ display: 'flex', alignItems: 'center', p: 3, borderBottom: '1px solid #e2e8f0', backgroundColor: '#f8fafc', borderRadius: '12px 12px 0 0' }}>
        <IconButton 
          onClick={() => setCurrentView('settings')} 
          sx={{ 
            mr: 2, 
            backgroundColor: '#8b5cf6', 
            color: 'white', 
            '&:hover': { backgroundColor: '#7c3aed' },
            width: 40,
            height: 40
          }}
        >
          <ArrowBackIcon />
        </IconButton>
        <Typography variant="h5" sx={{ fontWeight: 700, color: '#1e293b', flex: 1 }}>AI Assistant</Typography>
      </Box>
      
      <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <Box sx={{ flex: 1, overflow: 'auto', p: 2 }}>
          {aiAssistant.messages.map((msg) => (
            <Box key={msg.id} sx={{ mb: 2, display: 'flex', justifyContent: msg.type === 'user' ? 'flex-end' : 'flex-start' }}>
              <Box sx={{
                maxWidth: '80%',
                p: 2,
                borderRadius: '12px',
                backgroundColor: msg.type === 'user' ? '#4f46e5' : '#f1f5f9',
                color: msg.type === 'user' ? 'white' : '#1e293b'
              }}>
                <Typography variant="body2" sx={{ whiteSpace: 'pre-line', lineHeight: 1.5 }}>
                  {msg.message}
                </Typography>
                <Typography variant="caption" sx={{ 
                  display: 'block', 
                  mt: 1, 
                  opacity: 0.7,
                  color: msg.type === 'user' ? 'rgba(255,255,255,0.8)' : '#64748b'
                }}>
                  {msg.timestamp}
                </Typography>
              </Box>
            </Box>
          ))}
          {aiAssistant.isTyping && (
            <Box sx={{ display: 'flex', justifyContent: 'flex-start', mb: 2 }}>
              <Box sx={{ p: 2, borderRadius: '12px', backgroundColor: '#f1f5f9', color: '#64748b' }}>
                <Typography variant="body2">AI is thinking...</Typography>
              </Box>
            </Box>
          )}
        </Box>
        
        <Box sx={{ p: 2, borderTop: '1px solid #e2e8f0' }}>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <TextField
              value={aiAssistant.inputMessage}
              onChange={(e) => setAiAssistant(prev => ({ ...prev, inputMessage: e.target.value }))}
              onKeyPress={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleAiMessage();
                }
              }}
              placeholder="Ask me to create an outlet or query data..."
              fullWidth
              variant="outlined"
              size="small"
              multiline
              maxRows={3}
              sx={{
                '& .MuiOutlinedInput-root': {
                  borderRadius: '20px',
                  backgroundColor: '#f8fafc'
                }
              }}
            />
            <IconButton 
              onClick={handleAiMessage}
              disabled={!aiAssistant.inputMessage.trim() || aiAssistant.isTyping}
              sx={{
                backgroundColor: '#8b5cf6',
                color: 'white',
                '&:hover': { backgroundColor: '#7c3aed' },
                '&:disabled': { backgroundColor: '#e5e7eb' }
              }}
            >
              <ChevronRightIcon />
            </IconButton>
          </Box>
          
          <Box sx={{ mt: 2, display: 'flex', flexWrap: 'wrap', gap: 1 }}>
            {[
              "Create outlet named 'Apple Store' in 'LA'",
              "Add location 'London'",
              "New division 'Retail'",
              'How many outlets?',
              'List all locations'
            ].map((suggestion) => (
              <Chip
                key={suggestion}
                label={suggestion}
                size="small"
                onClick={() => {
                  setAiAssistant(prev => ({ ...prev, inputMessage: suggestion }));
                  setTimeout(() => handleAiMessage(), 100);
                }}
                sx={{
                  backgroundColor: '#f3e8ff',
                  color: '#7c3aed',
                  '&:hover': { backgroundColor: '#e9d5ff' },
                  cursor: 'pointer',
                  fontSize: '11px'
                }}
              />
            ))}
          </Box>
        </Box>
      </Box>
    </Box>
  );

  const renderCurrentView = () => {
    switch (currentView) {
      case 'profile': return renderProfileView();
      case 'database': return renderDatabaseView();
      case 'password': return renderPasswordView();
      case 'notifications': return renderNotificationsView();
      case 'messages': return renderMessagesView();
      case 'activity': return renderActivityView();
      case 'settings': return renderSettingsView();
      case 'aiChat': return renderAiChatView();
      case 'help': return renderHelpView();
      default: return renderMainView();
    }
  };

  return (
    <Drawer
      anchor="right"
      open={open}
      onClose={onClose}
      PaperProps={{
        sx: {
          width: 320,
          borderLeft: '1px solid #e5e7eb',
          display: 'flex',
          flexDirection: 'column',
          height: '100%',
          backgroundColor: '#f1f5f9',
          boxShadow: '-2px 0 10px rgba(0, 0, 0, 0.08)'
        }
      }}
    >
      {renderCurrentView()}

      <Snackbar
        open={toast.open}
        autoHideDuration={4000}
        onClose={() => setToast(prev => ({ ...prev, open: false }))}
        anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
      >
        <Alert
          onClose={() => setToast(prev => ({ ...prev, open: false }))}
          severity={toast.severity}
          sx={{ width: '100%' }}
        >
          {toast.message}
        </Alert>
      </Snackbar>
    </Drawer>
  );
};

const generateAiResponse = (userMessage, outlets = [], locations = [], divisions = []) => {
  const message = userMessage.toLowerCase().trim();
  
  // --- 1. DATA QUERIES (OUTLETS, LOCATIONS, DIVISIONS) ---
  if (message.includes('how many') || message.includes('count') || message.includes('total') || message.includes('number of')) {
    if (message.includes('outlet')) {
      return `🏪 **System Accuracy Report: Outlets**\n\nThere are currently **${outlets.length}** outlets registered. \n\n${outlets.length > 0 ? `The latest addition is **"${outlets[0]?.name}"**.` : "No outlets found."}`;
    }
    if (message.includes('location')) {
      return `📍 **System Accuracy Report: Locations**\n\nThere are **${locations.length}** distinct locations configured in the network.`;
    }
    if (message.includes('division')) {
      return `🗂️ **System Accuracy Report: Divisions**\n\nYour business is organized into **${divisions.length}** operational divisions.`;
    }
    return `📊 **System Totals:**\n• Outlets: ${outlets.length}\n• Locations: ${locations.length}\n• Divisions: ${divisions.length}`;
  }

  // --- 2. LISTING & SUMMARIZING ---
  if (message.includes('list') || message.includes('show all') || message.includes('what are')) {
    if (message.includes('outlet')) {
      if (outlets.length === 0) return "You don't have any outlets yet.";
      return `📋 **Active Outlets (Top 5):**\n\n${outlets.slice(0, 5).map(o => `• **${o.name}** - ${o.address || 'Global'}`).join('\n')}`;
    }
    if (message.includes('location')) {
      if (locations.length === 0) return "No locations found.";
      return `📍 **Available Locations:**\n\n${locations.slice(0, 10).map(l => `• ${l.name}`).join('\n')}`;
    }
  }

  // --- 3. SEARCH & LOCATE ---
  if (message.includes('find') || message.includes('search') || message.includes('where is') || message.includes('who owns')) {
    const query = message.replace(/(find|search|where is|who owns)/g, '').trim();
    if (query.length > 1) {
      const outlet = outlets.find(o => o.name.toLowerCase().includes(query) || (o.address && o.address.toLowerCase().includes(query)));
      if (outlet) {
        return `🔍 **Result Found (Outlet):**\n\n🏠 **${outlet.name}**\n📍 Address: ${outlet.address || 'N/A'}\n👤 Owner: ${outlet.ownerName || 'Staff'}\n✅ Status: ${outlet.status || 'Active'}`;
      }
      const loc = locations.find(l => l.name.toLowerCase().includes(query));
      if (loc) {
        return `🔍 **Result Found (Location):**\n\nI found a matching location entry: **"${loc.name}"**. It is currently linked to your distribution network.`;
      }
    }
  }

  // --- 4. TECHNICAL & PROJECT INFO ---
  if (message.includes('tech') || message.includes('built with') || message.includes('framework') || message.includes('language')) {
    return `💻 **Technical Stack Profile:**\n\n**Frontend:** React 18, Vite, Redux Toolkit (State Management)\n**Styling:** Material UI (MUI) - modern responsive components.\n**API Layer:** Axios with centralized interceptors.\n**Backend:** Spring Boot (Java) hosted via Microsoft Dev Tunnels.\n**Data Flow:** Real-time synchronization between the Drawer and Dashboard.`;
  }

  if (message.includes('dev tunnel') || message.includes('connection') || message.includes('api error') || message.includes('timeout')) {
    return `🔌 **Connectivity Help:**\n\nYou are using **Microsoft Dev Tunnels** to connect to the Spring Boot backend. \n\n**Common Fixes:**\n1. Ensure you clicked **"Continue"** on the tunnel landing page.\n2. Verify the backend port 8080 is active.\n3. Check ` + "`.env`" + ` for the correct ` + "`VITE_API_BASE_URL`" + `.`;
  }

  // --- 5. SYSTEM NAVIGATION ---
  if (message.includes('how to') || message.includes('where can i') || message.includes('navigate')) {
    if (message.includes('password')) return "🔐 To change your password, click the **'Change Password'** option in this drawer under the **'SYSTEM'** section.";
    if (message.includes('profile')) return "👤 Click **'My Profile'** at the top of this drawer to edit your name, email, and profile picture.";
    if (message.includes('setting')) return "⚙️ Click **'Settings'** in the 'ACCOUNT' section of this drawer to toggle the AI Assistant.";
    return "🗺️ **Navigation Guide:**\n• **Main:** Dashboard cards show stats.\n• **Sidebar:** Navigate between Outlets, Locations, and Divisions.\n• **Drawer (Right):** Access your personal settings and this AI helper.";
  }

  // --- 6. USER ROLES & SECURITY ---
  if (message.includes('role') || message.includes('admin') || message.includes('security') || message.includes('permissions')) {
    return `🛡️ **Role-Based Access Control:**\n\n• **Administrator:** Full control over outlets, products, and users.\n• **Manager:** Can update outlet data and view reports.\n• **Staff:** View-only or limited inventory management.\n\nYour session is secured via **JWT (JSON Web Tokens)** stored in cookies.`;
  }

  // --- 7. FALLBACK / GENERAL KNOWLEDGE ---
  return `🤔 **I've analyzed your question: "${userMessage}"**\n\nTo give you the most correct answer, try being more specific:\n• *"How many outlets?"* (I'll check the live DB)\n• *"Search for [Store Name]"*\n• *"Create outlet named [Name] at [City]"*\n• *"What is the tech stack?"*\n\nI have direct access to **${outlets.length}** outlets and **${locations.length}** locations in your current environment.`;
};

export default ProfileDrawer;