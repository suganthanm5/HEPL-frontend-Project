import { useState, useEffect } from 'react';
import Navbar from './Navbar/Navbar';
import Sidebar from './Sidebar/Sidebar';
import { MenuRounded } from '@mui/icons-material';
import './MainLayout.css';

const MainLayout = ({ children, title = 'Dashboard' }) => {
  const [collapsed, setCollapsed] = useState(false);

  // On small screens start collapsed (hidden)
  useEffect(() => {
    const handle = () => {
      if (window.innerWidth <= 768) setCollapsed(true);
    };
    handle();
    window.addEventListener('resize', handle);
    return () => window.removeEventListener('resize', handle);
  }, []);

  return (
    <div className="app-container">
      {/* Mobile top nav */}
      <nav className="mobile-site-nav">
        <button
          className="mobile-nav-toggle"
          onClick={() => setCollapsed((prev) => !prev)}
          aria-label="Toggle menu"
        >
          <MenuRounded sx={{ fontSize: '1.5rem', color: 'var(--color-text-primary)' }} />
        </button>
      </nav>

      <Sidebar collapsed={collapsed} setCollapsed={setCollapsed} />

      <div className="main-content">
        {(title === 'Dashboard' || title === 'Dashboard ') && <Navbar title={title} />}
        <div className="page-container">
          {children}
        </div>
      </div>
    </div>
  );
};

export default MainLayout;