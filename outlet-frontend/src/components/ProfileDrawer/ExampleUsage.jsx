// Example usage of ProfileDrawer in your layout component

import React, { useState } from 'react';
import { User } from 'lucide-react';
import ProfileDrawer from '../components/ProfileDrawer/ProfileDrawer';

const ExampleLayout = () => {
  const [isProfileDrawerOpen, setIsProfileDrawerOpen] = useState(false);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top Navigation Bar */}
      <nav className="bg-blue-700 text-white px-6 py-4 flex justify-between items-center">
        <h1 className="text-xl font-bold">Division Management</h1>
        
        {/* Profile Button */}
        <button
          onClick={() => setIsProfileDrawerOpen(true)}
          className="flex items-center gap-2 px-3 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 transition-colors"
        >
          <User size={20} />
          <span className="hidden md:block">Profile</span>
        </button>
      </nav>

      {/* Main Content */}
      <main className="p-6">
        <h2 className="text-2xl font-bold mb-4">Dashboard Content</h2>
        <p>Your main application content goes here...</p>
      </main>

      {/* Profile Drawer */}
      <ProfileDrawer
        isOpen={isProfileDrawerOpen}
        onClose={() => setIsProfileDrawerOpen(false)}
      />
    </div>
  );
};

export default ExampleLayout;

/*
INTEGRATION NOTES:

1. Install required dependencies:
   npm install lucide-react

2. Import and use the ProfileDrawer component:
   import ProfileDrawer from './components/ProfileDrawer/ProfileDrawer';

3. Add state management for drawer open/close:
   const [isProfileDrawerOpen, setIsProfileDrawerOpen] = useState(false);

4. Add a trigger button (usually in your navbar):
   <button onClick={() => setIsProfileDrawerOpen(true)}>
     Open Profile
   </button>

5. Include the ProfileDrawer component:
   <ProfileDrawer
     isOpen={isProfileDrawerOpen}
     onClose={() => setIsProfileDrawerOpen(false)}
   />

6. The component will automatically:
   - Fetch user data from API or localStorage
   - Handle theme switching
   - Provide logout functionality
   - Show loading states
   - Handle keyboard shortcuts (Esc to close)
   - Handle click outside to close

7. Customize the API endpoints in ProfileDrawer.jsx:
   - fetchUserProfile(): Change '/api/auth/me' to your endpoint
   - handleLogout(): Change '/api/auth/logout' to your endpoint

8. The component is fully responsive and includes:
   - 320px width on desktop
   - Full screen on mobile
   - Smooth animations
   - Dark mode support
   - Accessibility features
*/