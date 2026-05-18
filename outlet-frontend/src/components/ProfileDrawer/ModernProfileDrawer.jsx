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
import { createDivision } from '../../services/divisionService';
import userService from '../../api/userService';
import { setCookie, deleteCookie } from '../../utils/cookieUtils';

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
      
      // Update cookies with fresh data
      setCookie('user', JSON.stringify(userProfile));
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
    setCookie('user', JSON.stringify(newUserData));
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

  const handlePasswordChange = async () => {
    if (!passwordForm.currentPassword) {
      setToast({ open: true, message: 'Current password is required', severity: 'error' });
      return;
    }
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setToast({ open: true, message: 'Passwords do not match', severity: 'error' });
      return;
    }
    if (passwordForm.newPassword.length < 6) {
      setToast({ open: true, message: 'Password must be at least 6 characters long', severity: 'error' });
      return;
    }
    setLoading(true);
    try {
      await userService.changePassword({
        oldPassword: passwordForm.currentPassword,
        newPassword: passwordForm.newPassword,
      });
      setToast({ open: true, message: 'Password changed successfully!', severity: 'success' });
      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
      setCurrentView('main');
    } catch (error) {
      const msg = error.response?.data?.message || error.message || 'Failed to change password';
      setToast({ open: true, message: msg, severity: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    deleteCookie("token");
    deleteCookie("user");
    deleteCookie("username");
    deleteCookie("email");
    deleteCookie("role");
    deleteCookie("outletId");
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
          <Typography variant="h6" sx={{ fontWeight: 600, color: '#1e293b', mb: 2 }}>Display Preferences</Typography>
          <Box sx={{ 
            backgroundColor: darkMode ? '#f0fdf4' : '#f8fafc', 
            borderRadius: '12px', 
            p: 2,
            border: `1px solid ${darkMode ? '#10b981' : '#e2e8f0'}`
          }}>
            <FormControlLabel
              control={
                <Switch 
                  checked={darkMode} 
                  onChange={(e) => setDarkMode(e.target.checked)}
                />
              }
              label={
                <Box sx={{ ml: 1 }}>
                  <Typography variant="body2" sx={{ fontWeight: 600, color: '#1e293b' }}>Dark Mode</Typography>
                  <Typography variant="caption" sx={{ color: '#64748b' }}>Switch between light and dark themes</Typography>
                </Box>
              }
              sx={{ width: '100%', m: 0 }}
            />
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

export default ProfileDrawer;