import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import userService from '../../api/userService';
import {
  Box,
  Typography,
  Paper,
  Tabs,
  Tab,
  Switch,
  FormControlLabel,
  Select,
  MenuItem,
  Button,
  Divider,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Avatar,
  Slider,
  RadioGroup,
  Radio,
  FormControl,
  FormLabel,
  Card,
  CardContent,
  Grid,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Snackbar,
  Alert
} from '@mui/material';
import {
  Settings as SettingsIcon,
  Palette as PaletteIcon,
  Security as SecurityIcon,
  NotificationsActive as NotificationsIcon,
  Language as LanguageIcon,
  AccessTime as TimeIcon,
  Store as StoreIcon,
  Info as InfoIcon,
  Storage as StorageIcon,
  SystemUpdate as UpdateIcon,
  Backup as BackupIcon,
  Delete as DeleteIcon,
  Smartphone as PhoneIcon,
  Computer as ComputerIcon,
  Person as PersonIcon,
  ColorLens as ColorLensIcon,
  FormatSize as FontSizeIcon,
  MenuOpen as MenuOpenIcon,
  Lock as LockIcon,
  VpnKey as VpnKeyIcon,
  History as HistoryIcon,
  ArrowBack as ArrowBackIcon,
  Visibility,
  VisibilityOff
} from '@mui/icons-material';
import { translateText, languageCodes } from '../../utils/translate';
import './Settings.css';

const Settings = () => {
  const { role } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState(0);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const [loading, setLoading] = useState(false);
  const [passwordForm, setPasswordForm] = useState({ newPassword: '', confirmPassword: '' });
  const [showPassword, setShowPassword] = useState({ new: false, confirm: false });

  // General Settings
  const [theme, setTheme] = useState(localStorage.getItem('darkMode') === 'true' ? 'dark' : 'light');
  const [language, setLanguage] = useState(localStorage.getItem('language') || 'english');
  const [timeFormat, setTimeFormat] = useState(localStorage.getItem('timeFormat') || '12h');
  const [itemsPerPage, setItemsPerPage] = useState(parseInt(localStorage.getItem('itemsPerPage') || '10', 10));

  // Notifications
  const [emailNotif, setEmailNotif] = useState(localStorage.getItem('emailNotif') !== 'false');
  const [pushNotif, setPushNotif] = useState(localStorage.getItem('pushNotif') !== 'false');
  const [stockAlerts, setStockAlerts] = useState(localStorage.getItem('stockAlerts') || 'immediate');

  // Outlet Preferences
  const [defaultOutlet, setDefaultOutlet] = useState(localStorage.getItem('defaultOutlet') || 'all');
  const [lowStockThreshold, setLowStockThreshold] = useState(parseInt(localStorage.getItem('lowStockThreshold') || '20', 10));
  const [refreshInterval, setRefreshInterval] = useState(localStorage.getItem('refreshInterval') || '5');

  // Appearance
  const colorMap = {
    'Purple': '#4f46e5',
    'Blue': '#2563eb',
    'Green': '#10b981',
    'Orange': '#f59e0b',
    'Red': '#ef4444',
    'Pink': '#ec4899',
    'Violet': '#8b5cf6'
  };
  const reverseColorMap = Object.fromEntries(Object.entries(colorMap).map(([k, v]) => [v, k]));
  const storedColorName = localStorage.getItem('themeColor') || 'Purple';
  
  const [sidebarCollapsed, setSidebarCollapsed] = useState(localStorage.getItem('sidebarCollapsed') === 'true');
  const [colorAccent, setColorAccent] = useState(colorMap[storedColorName] || '#4f46e5');
  const [fontSize, setFontSize] = useState((localStorage.getItem('fontSize') || 'Medium').toLowerCase());

  // Apply Changes Immediately
  useEffect(() => {
    localStorage.setItem('darkMode', theme === 'dark');
    const colorName = reverseColorMap[colorAccent] || 'Purple';
    localStorage.setItem('themeColor', colorName);
    
    const formattedFontSize = fontSize.charAt(0).toUpperCase() + fontSize.slice(1);
    localStorage.setItem('fontSize', formattedFontSize);
    
    const prevLanguage = localStorage.getItem('language');
    localStorage.setItem('language', language);
    localStorage.setItem('timeFormat', timeFormat);
    localStorage.setItem('itemsPerPage', itemsPerPage.toString());
    
    localStorage.setItem('emailNotif', emailNotif);
    localStorage.setItem('pushNotif', pushNotif);
    localStorage.setItem('stockAlerts', stockAlerts);
    localStorage.setItem('defaultOutlet', defaultOutlet);
    localStorage.setItem('lowStockThreshold', lowStockThreshold.toString());
    localStorage.setItem('refreshInterval', refreshInterval);
    localStorage.setItem('sidebarCollapsed', sidebarCollapsed);
    
    const testTranslation = async () => {
      if (language !== prevLanguage && languageCodes[language]) {
         const translated = await translateText("Dashboard", languageCodes[language]);
         console.log(`Translated "Dashboard" to ${language}: `, translated);
      }
    };
    testTranslation();
    
    window.dispatchEvent(new Event('settingsUpdated'));
  }, [theme, colorAccent, fontSize, language, timeFormat, itemsPerPage, emailNotif, pushNotif, stockAlerts, defaultOutlet, lowStockThreshold, refreshInterval, sidebarCollapsed]);

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  const handleOpenProfileDrawer = () => {
    window.dispatchEvent(new Event('openProfileDrawer'));
  };

  const handlePasswordChange = async () => {
    if (!passwordForm.newPassword || !passwordForm.confirmPassword) {
      setSnackbar({ open: true, message: 'Both password fields are required', severity: 'error' });
      return;
    }
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setSnackbar({ open: true, message: 'New passwords do not match', severity: 'error' });
      return;
    }
    if (passwordForm.newPassword.length < 6) {
      setSnackbar({ open: true, message: 'Password must be at least 6 characters long', severity: 'error' });
      return;
    }
   
    if (!/\d/.test(passwordForm.newPassword)) {
      setSnackbar({ open: true, message: 'Password must include at least one number (0-9)', severity: 'error' });
      return;
    }
    setLoading(true);
    try {
      await userService.changePassword({
        newPassword: passwordForm.newPassword,
      });
      setSnackbar({ open: true, message: 'Password changed successfully!', severity: 'success' });
      setPasswordForm({ newPassword: '', confirmPassword: '' });
      setShowPassword({ new: false, confirm: false });
    } catch (error) {
      const msg = error.response?.data?.message || error.message || 'Failed to change password';
      setSnackbar({ open: true, message: msg, severity: 'error' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box className="settings-container">
      <Box className="settings-header" sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
        <IconButton onClick={() => navigate(-1)} sx={{ bgcolor: 'white', boxShadow: 1, '&:hover': { bgcolor: '#f1f5f9' } }}>
          <ArrowBackIcon />
        </IconButton>
        <Box>
          <Typography variant="h4" className="settings-title" sx={{ m: 0 }}>
            Settings
          </Typography>
          <Typography variant="body1" className="settings-subtitle">
            Manage your account settings and preferences.
          </Typography>
        </Box>
      </Box>

      <Paper className="settings-content-wrapper" elevation={0}>
        <Box className="settings-sidebar">
          <Tabs
            orientation="vertical"
            variant="scrollable"
            value={activeTab}
            onChange={handleTabChange}
            className="settings-tabs"
            TabIndicatorProps={{ style: { display: 'none' } }}
          >
            <Tab icon={<SettingsIcon />} iconPosition="start" label="General" className={`settings-tab ${activeTab === 0 ? 'active' : ''}`} />
            <Tab icon={<PersonIcon />} iconPosition="start" label="Profile" className={`settings-tab ${activeTab === 1 ? 'active' : ''}`} />
            <Tab icon={<SecurityIcon />} iconPosition="start" label="Security" className={`settings-tab ${activeTab === 2 ? 'active' : ''}`} />
            <Tab icon={<NotificationsIcon />} iconPosition="start" label="Notifications" className={`settings-tab ${activeTab === 3 ? 'active' : ''}`} />
            
            {(role === 'ADMIN' || role === 'MANAGER') && (
              <Tab icon={<StoreIcon />} iconPosition="start" label="Outlet Preferences" className={`settings-tab ${activeTab === 4 ? 'active' : ''}`} />
            )}
            
            <Tab icon={<PaletteIcon />} iconPosition="start" label="Appearance" className={`settings-tab ${activeTab === 5 ? 'active' : ''}`} />
            
            {role === 'ADMIN' && (
              <Tab icon={<InfoIcon />} iconPosition="start" label="System" className={`settings-tab ${activeTab === 6 ? 'active' : ''}`} />
            )}
          </Tabs>
        </Box>

        <Box className="settings-panel">
          {/* General Settings */}
          {activeTab === 0 && (
            <Box className="settings-section animate-fade-in">
              <Typography variant="h5" className="section-title">General Settings</Typography>
              <Divider className="section-divider" />
              
              
              <Grid container spacing={4}>
                <Grid item xs={12} md={6}>
                  <Box className="setting-item">
                    <Typography className="setting-label">Theme Preference</Typography>
                    <FormControl component="fieldset">
                      <RadioGroup row value={theme} onChange={(e) => setTheme(e.target.value)}>
                        <FormControlLabel value="light" control={<Radio sx={{ color: colorAccent, '&.Mui-checked': { color: colorAccent } }} />} label="Light" />
                        <FormControlLabel value="dark" control={<Radio sx={{ color: colorAccent, '&.Mui-checked': { color: colorAccent } }} />} label="Dark" />
                      </RadioGroup>
                    </FormControl>
                  </Box>
                  
                  <Box className="setting-item">
                    <Typography className="setting-label">Language</Typography>
                    <Select
                      value={language}
                      onChange={(e) => setLanguage(e.target.value)}
                      fullWidth
                      size="small"
                      className="setting-select"
                    >
                      <MenuItem value="english">English</MenuItem>
                      <MenuItem value="tamil">Tamil (தமிழ்)</MenuItem>
                    </Select>
                  </Box>
                </Grid>

                <Grid item xs={12} md={6}>
                  <Box className="setting-item">
                    <Typography className="setting-label">Date & Time Format</Typography>
                    <Select
                      value={timeFormat}
                      onChange={(e) => setTimeFormat(e.target.value)}
                      fullWidth
                      size="small"
                      className="setting-select"
                    >
                      <MenuItem value="12h">12-hour (1:00 PM)</MenuItem>
                      <MenuItem value="24h">24-hour (13:00)</MenuItem>
                    </Select>
                  </Box>
                  
                  <Box className="setting-item">
                    <Typography className="setting-label">Items per page</Typography>
                    <Select
                      value={itemsPerPage}
                      onChange={(e) => setItemsPerPage(e.target.value)}
                      fullWidth
                      size="small"
                      className="setting-select"
                    >
                      <MenuItem value={10}>10 items</MenuItem>
                      <MenuItem value={25}>25 items</MenuItem>
                      <MenuItem value={50}>50 items</MenuItem>
                      <MenuItem value={100}>100 items</MenuItem>
                    </Select>
                  </Box>
                </Grid>
              </Grid>
            </Box>
          )}

          {/* Profile Settings */}
          {activeTab === 1 && (
            <Box className="settings-section animate-fade-in">
              <Typography variant="h5" className="section-title">Profile</Typography>
              <Divider className="section-divider" />
              
              <Box className="profile-management-card">
                <Box className="pmc-header">
                  <Avatar sx={{ width: 80, height: 80, bgcolor: colorAccent, fontSize: '2rem' }}>A</Avatar>
                  <Box className="pmc-info">
                    <Typography variant="h6">Admin User</Typography>
                    <Typography variant="body2" color="textSecondary">admin@company.com</Typography>
                    <Typography variant="body2" className="role-badge">Administrator</Typography>
                  </Box>
                </Box>
                <Typography variant="body1" sx={{ mt: 3, mb: 2, color: '#475569' }}>
                  Manage your personal information, profile picture, and account details through the Profile Drawer.
                </Typography>
                <Button 
                  variant="contained" 
                  color="primary"
                  startIcon={<PersonIcon />}
                  onClick={handleOpenProfileDrawer}
                  disableElevation
                >
                  Open Profile Drawer
                </Button>
              </Box>
            </Box>
          )}

          {/* Security Settings */}
          {activeTab === 2 && (
            <Box className="settings-section animate-fade-in">
              <Typography variant="h5" className="section-title">Security</Typography>
              <Divider className="section-divider" />
              
              <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
                  <Card className="security-card" variant="outlined">
                    <CardContent>
                      <Box className="sc-header">
                        <LockIcon className="sc-icon" />
                        <Typography variant="h6">Change Password</Typography>
                      </Box>
                      <Typography variant="body2" color="textSecondary" sx={{ mb: 2 }}>
                        Password must be at least 6 characters long and include numbers for better security.
                      </Typography>
                      
                      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 2 }}>
                        <TextField
                          label="New Password"
                          type={showPassword.new ? 'text' : 'password'}
                          value={passwordForm.newPassword}
                          onChange={(e) => setPasswordForm(prev => ({ ...prev, newPassword: e.target.value }))}
                          fullWidth
                          size="small"
                          InputProps={{
                            endAdornment: (
                              <IconButton onClick={() => setShowPassword(p => ({ ...p, new: !p.new }))} size="small" tabIndex="-1">
                                {showPassword.new ? <VisibilityOff fontSize="small" /> : <Visibility fontSize="small" />}
                              </IconButton>
                            )
                          }}
                        />
                        <TextField
                          label="Confirm New Password"
                          type={showPassword.confirm ? 'text' : 'password'}
                          value={passwordForm.confirmPassword}
                          onChange={(e) => setPasswordForm(prev => ({ ...prev, confirmPassword: e.target.value }))}
                          fullWidth
                          size="small"
                          InputProps={{
                            endAdornment: (
                              <IconButton onClick={() => setShowPassword(p => ({ ...p, confirm: !p.confirm }))} size="small" tabIndex="-1">
                                {showPassword.confirm ? <VisibilityOff fontSize="small" /> : <Visibility fontSize="small" />}
                              </IconButton>
                            )
                          }}
                        />
                        <Button 
                          variant="contained" 
                          color="primary"
                          onClick={handlePasswordChange}
                          disabled={loading}
                          sx={{ mt: 1 }} 
                          disableElevation
                        >
                          {loading ? 'Updating...' : 'Update Password'}
                        </Button>
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>

                <Grid item xs={12} md={6}>
                  <Card className="security-card" variant="outlined">
                    <CardContent>
                      <Box className="sc-header">
                        <VpnKeyIcon className="sc-icon" />
                        <Typography variant="h6">Two-Factor Authentication (2FA)</Typography>
                      </Box>
                      <Typography variant="body2" color="textSecondary" sx={{ mb: 2 }}>
                        Add additional security to your account using two factor authentication.
                      </Typography>
                      <Button variant="contained" color="primary" disableElevation>Enable 2FA</Button>
                    </CardContent>
                  </Card>
                </Grid>
              </Grid>

              <Box sx={{ mt: 4 }}>
                <Typography variant="h6" sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                  <HistoryIcon /> Active Sessions
                </Typography>
                <List className="sessions-list">
                  <ListItem className="session-item">
                    <ListItemIcon><ComputerIcon sx={{ color: '#10b981' }} /></ListItemIcon>
                    <ListItemText primary="Windows 11 • Chrome" secondary="Chennai, India • Active Now" />
                    <Button size="small" color="error">Log out</Button>
                  </ListItem>
                  <Divider />
                  <ListItem className="session-item">
                    <ListItemIcon><PhoneIcon sx={{ color: '#64748b' }} /></ListItemIcon>
                    <ListItemText primary="iPhone 14 Pro • Safari" secondary="Mumbai, India • Last active 2 hours ago" />
                    <Button size="small" color="error">Log out</Button>
                  </ListItem>
                </List>
              </Box>
            </Box>
          )}

          {/* Notifications */}
          {activeTab === 3 && (
            <Box className="settings-section animate-fade-in">
              <Typography variant="h5" className="section-title">Notifications</Typography>
              <Divider className="section-divider" />

              <List>
                <ListItem className="setting-list-item">
                  <ListItemText 
                    primary="Email Notifications" 
                    secondary="Receive daily summaries and critical alerts via email" 
                  />
                  <Switch 
                    checked={emailNotif} 
                    onChange={(e) => setEmailNotif(e.target.checked)} 
                    sx={{ '& .MuiSwitch-switchBase.Mui-checked': { color: colorAccent }, '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': { backgroundColor: colorAccent } }}
                  />
                </ListItem>
                <Divider />
                <ListItem className="setting-list-item">
                  <ListItemText 
                    primary="Push Notifications" 
                    secondary="Receive real-time notifications in your browser" 
                  />
                  <Switch 
                    checked={pushNotif} 
                    onChange={(e) => setPushNotif(e.target.checked)} 
                    sx={{ '& .MuiSwitch-switchBase.Mui-checked': { color: colorAccent }, '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': { backgroundColor: colorAccent } }}
                  />
                </ListItem>
              </List>

              <Box className="setting-item" sx={{ mt: 3 }}>
                <Typography className="setting-label">Stock Alert Preferences</Typography>
                <Select
                  value={stockAlerts}
                  onChange={(e) => setStockAlerts(e.target.value)}
                  fullWidth
                  size="small"
                  className="setting-select"
                >
                  <MenuItem value="immediate">Immediate Notification</MenuItem>
                  <MenuItem value="daily">Daily Summary</MenuItem>
                  <MenuItem value="weekly">Weekly Summary</MenuItem>
                  <MenuItem value="none">Mute Alerts</MenuItem>
                </Select>
              </Box>
            </Box>
          )}

          {/* Outlet Preferences */}
          {activeTab === 4 && (role === 'ADMIN' || role === 'MANAGER') && (
            <Box className="settings-section animate-fade-in">
              <Typography variant="h5" className="section-title">Outlet Preferences</Typography>
              <Divider className="section-divider" />

              <Grid container spacing={4}>
                <Grid item xs={12} md={6}>
                  <Box className="setting-item">
                    <Typography className="setting-label">Default Outlet View</Typography>
                    <Select
                      value={defaultOutlet}
                      onChange={(e) => setDefaultOutlet(e.target.value)}
                      fullWidth
                      size="small"
                      className="setting-select"
                    >
                      <MenuItem value="all">All Outlets</MenuItem>
                      <MenuItem value="main">Main Branch (HQ)</MenuItem>
                      <MenuItem value="north">North Zone Outlets</MenuItem>
                    </Select>
                  </Box>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Box className="setting-item">
                    <Typography className="setting-label">Auto-refresh Interval (minutes)</Typography>
                    <Select
                      value={refreshInterval}
                      onChange={(e) => setRefreshInterval(e.target.value)}
                      fullWidth
                      size="small"
                      className="setting-select"
                    >
                      <MenuItem value={1}>1 Minute</MenuItem>
                      <MenuItem value={5}>5 Minutes</MenuItem>
                      <MenuItem value={15}>15 Minutes</MenuItem>
                      <MenuItem value={30}>30 Minutes</MenuItem>
                      <MenuItem value="never">Never (Manual)</MenuItem>
                    </Select>
                  </Box>
                </Grid>
              </Grid>

              <Box className="setting-item" sx={{ mt: 2 }}>
                <Typography className="setting-label">Low Stock Alert Threshold</Typography>
                <Typography variant="body2" color="textSecondary" sx={{ mb: 2 }}>
                  Trigger an alert when stock falls below {lowStockThreshold} units.
                </Typography>
                <Slider
                  value={lowStockThreshold}
                  onChange={(e, val) => setLowStockThreshold(val)}
                  valueLabelDisplay="auto"
                  step={5}
                  marks
                  min={5}
                  max={100}
                  sx={{ color: colorAccent }}
                />
              </Box>
            </Box>
          )}

          {/* Appearance */}
          {activeTab === 5 && (
            <Box className="settings-section animate-fade-in">
              <Typography variant="h5" className="section-title">Appearance</Typography>
              <Divider className="section-divider" />

              <List>
                <ListItem className="setting-list-item">
                  <ListItemIcon><MenuOpenIcon sx={{ color: colorAccent }} /></ListItemIcon>
                  <ListItemText 
                    primary="Collapse Sidebar by Default" 
                    secondary="Start with a minimized sidebar to maximize screen space" 
                  />
                  <Switch 
                    checked={sidebarCollapsed} 
                    onChange={(e) => setSidebarCollapsed(e.target.checked)} 
                    sx={{ '& .MuiSwitch-switchBase.Mui-checked': { color: colorAccent }, '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': { backgroundColor: colorAccent } }}
                  />
                </ListItem>
              </List>

              <Grid container spacing={4} sx={{ mt: 1 }}>
                <Grid item xs={12} md={6}>
                  <Box className="setting-item">
                    <Typography className="setting-label" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <ColorLensIcon fontSize="small" /> Brand Accent Color
                    </Typography>
                    <Box className="color-picker-group">
                      {['#4f46e5', '#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#ec4899', '#8b5cf6'].map(color => (
                        <Box 
                          key={color} 
                          className={`color-swatch ${colorAccent === color ? 'selected' : ''}`}
                          style={{ backgroundColor: color }}
                          onClick={() => setColorAccent(color)}
                        />
                      ))}
                    </Box>
                  </Box>
                </Grid>

                <Grid item xs={12} md={6}>
                  <Box className="setting-item">
                    <Typography className="setting-label" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <FontSizeIcon fontSize="small" /> Interface Font Size
                    </Typography>
                    <Select
                      value={fontSize}
                      onChange={(e) => setFontSize(e.target.value)}
                      fullWidth
                      size="small"
                      className="setting-select"
                    >
                      <MenuItem value="small">Compact</MenuItem>
                      <MenuItem value="medium">Standard</MenuItem>
                      <MenuItem value="large">Large</MenuItem>
                    </Select>
                  </Box>
                </Grid>
              </Grid>
            </Box>
          )}

          {/* System */}
          {activeTab === 6 && role === 'ADMIN' && (
            <Box className="settings-section animate-fade-in">
              <Typography variant="h5" className="section-title">System Information</Typography>
              <Divider className="section-divider" />

              <List className="system-info-list">
                <ListItem className="system-info-item">
                  <ListItemIcon><UpdateIcon sx={{ color: '#64748b' }} /></ListItemIcon>
                  <ListItemText primary="App Version" secondary="v2.4.1 (Latest build)" />
                  <Button size="small" variant="outlined" onClick={() => alert("You are already on the latest version!")}>Check Updates</Button>
                </ListItem>
                <Divider />
                <ListItem className="system-info-item">
                  <ListItemIcon><StorageIcon sx={{ color: '#64748b' }} /></ListItemIcon>
                  <ListItemText primary="Database Connection" secondary="MySQL Connected • Latency: 12ms" />
                </ListItem>
              </List>

              <Typography variant="h6" sx={{ mt: 4, mb: 2 }}>Data Management</Typography>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <Button 
                    variant="outlined" 
                    fullWidth 
                    startIcon={<BackupIcon />}
                    sx={{ py: 1.5, borderColor: '#cbd5e1', color: '#334155', '&:hover': { backgroundColor: '#f8fafc' } }}
                    onClick={() => alert("Data export started. You will receive an email shortly.")}
                  >
                    Export System Data
                  </Button>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Button 
                    variant="outlined" 
                    fullWidth 
                    startIcon={<DeleteIcon />}
                    color="error"
                    sx={{ py: 1.5 }}
                    onClick={() => { localStorage.clear(); window.location.reload(); }}
                  >
                    Clear Application Cache
                  </Button>
                </Grid>
              </Grid>
            </Box>
          )}

          <Box className="settings-footer">
            <Button 
              variant="contained" 
              color="primary"
              className="save-btn" 
              onClick={() => setSnackbar({ open: true, message: 'Settings have been automatically saved and applied!', severity: 'success' })}
            >
              Save Changes
            </Button>
          </Box>
        </Box>
      </Paper>

      <Snackbar open={snackbar.open} autoHideDuration={4000} onClose={() => setSnackbar({ ...snackbar, open: false })}>
        <Alert severity={snackbar.severity}>{snackbar.message}</Alert>
      </Snackbar>
    </Box>
  );
};

export default Settings;
