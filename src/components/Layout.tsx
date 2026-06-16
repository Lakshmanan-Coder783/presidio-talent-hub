import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import {
  LayoutDashboard,
  School,
  Users,
  FileText,
  Database,
  Calendar,
  Gift,
  BarChart3,
  Settings as SettingsIcon,
  LogOut,
  Bell,
  Search,
  User,
  Menu,
  ChevronDown
} from 'lucide-react';

interface LayoutProps {
  children: React.ReactNode;
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

export const Layout: React.FC<LayoutProps> = ({ children, activeTab, setActiveTab }) => {
  const { logout } = useApp();
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const [showMobileSidebar, setShowMobileSidebar] = useState(false);

  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'campus-drives', label: 'Campus Drives', icon: School },
    { id: 'candidates', label: 'Candidates', icon: Users },
    { id: 'assessments', label: 'Assessments', icon: FileText },
    { id: 'question-bank', label: 'Question Bank', icon: Database },
    { id: 'interviews', label: 'Interviews', icon: Calendar },
    { id: 'offers', label: 'Offers', icon: Gift },
    { id: 'reports', label: 'Reports & Analytics', icon: BarChart3 },
    { id: 'settings', label: 'Settings', icon: SettingsIcon },
  ];

  const getBreadcrumbLabel = () => {
    const active = menuItems.find(item => item.id === activeTab);
    return active ? active.label : 'Dashboard';
  };

  return (
    <div className="app-container">
      {/* Sidebar Navigation */}
      <aside className={`sidebar ${showMobileSidebar ? 'mobile-show' : ''}`} style={{
        display: showMobileSidebar ? 'flex' : undefined,
        position: showMobileSidebar ? 'fixed' : undefined,
        height: showMobileSidebar ? '100%' : undefined
      }}>
        <div className="sidebar-header">
          <div style={{
            width: '32px',
            height: '32px',
            borderRadius: '8px',
            backgroundColor: 'var(--primary-blue)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#ffffff',
            fontWeight: 800,
            fontSize: '1.2rem',
            fontFamily: 'var(--font-display)'
          }}>P</div>
          <span className="sidebar-logo-text">Presidio Talent</span>
        </div>

        <ul className="sidebar-menu">
          {menuItems.map(item => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <li
                key={item.id}
                className={`sidebar-item ${isActive ? 'active' : ''}`}
                onClick={() => {
                  setActiveTab(item.id);
                  setShowMobileSidebar(false);
                }}
              >
                <Icon />
                {item.label}
              </li>
            );
          })}
        </ul>

        <div className="sidebar-footer">
          <span>v1.0.0 Stable</span>
          <button
            onClick={logout}
            style={{
              background: 'none',
              border: 'none',
              color: '#94a3b8',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              fontSize: '0.75rem',
              fontWeight: 500
            }}
            onMouseEnter={e => e.currentTarget.style.color = '#ffffff'}
            onMouseLeave={e => e.currentTarget.style.color = '#94a3b8'}
          >
            <LogOut size={12} />
            Logout
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="main-layout">
        {/* Top Navbar */}
        <header className="top-navbar">
          <div className="top-left">
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <button
                className="nav-btn"
                style={{ display: 'none', padding: '4px' }}
                onClick={() => setShowMobileSidebar(!showMobileSidebar)}
                ref={el => {
                  if (el) {
                    // Quick inline styling helper to show Menu button on responsive sizes
                    el.style.display = window.innerWidth <= 768 ? 'block' : 'none';
                  }
                }}
              >
                <Menu size={20} />
              </button>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 700, fontFamily: 'var(--font-display)' }}>
                {getBreadcrumbLabel()}
              </h2>
            </div>
            <div className="breadcrumbs">
              <span>Admin</span>
              <span>/</span>
              <span>{getBreadcrumbLabel()}</span>
            </div>
          </div>

          <div className="top-right">
            {/* Search Input bar */}
            <div className="search-container" style={{ display: window.innerWidth <= 768 ? 'none' : 'block' }}>
              <Search className="search-icon" />
              <input type="text" className="search-input" placeholder="Search anything..." />
            </div>

            <div className="nav-actions">
              {/* Notification bell */}
              <button className="nav-btn">
                <Bell size={20} />
                <span className="badge-dot"></span>
              </button>

              {/* User Profile */}
              <div 
                className="user-profile" 
                style={{ position: 'relative' }}
                onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
              >
                <div className="avatar">AD</div>
                <div className="user-info" style={{ display: window.innerWidth <= 640 ? 'none' : 'flex' }}>
                  <span className="user-name">TA Admin</span>
                  <span className="user-role">Talent Acquisition</span>
                </div>
                <ChevronDown size={14} style={{ color: 'var(--text-secondary)' }} />

                {/* Profile drop-down menu */}
                {profileDropdownOpen && (
                  <div 
                    style={{
                      position: 'absolute',
                      top: '48px',
                      right: 0,
                      backgroundColor: '#ffffff',
                      border: '1px solid var(--border)',
                      borderRadius: '8px',
                      boxShadow: 'var(--shadow-lg)',
                      width: '180px',
                      zIndex: 200,
                      overflow: 'hidden'
                    }}
                    onClick={e => e.stopPropagation()}
                  >
                    <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--border)', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                      Signed in as <br />
                      <b style={{ color: 'var(--text-primary)' }}>admin@presidio.com</b>
                    </div>
                    <div 
                      style={{
                        padding: '10px 16px',
                        fontSize: '0.875rem',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        transition: 'background-color 0.2s'
                      }}
                      onMouseEnter={e => e.currentTarget.style.backgroundColor = 'var(--bg-slate)'}
                      onMouseLeave={e => e.currentTarget.style.backgroundColor = ''}
                      onClick={() => {
                        setProfileDropdownOpen(false);
                        setActiveTab('settings');
                      }}
                    >
                      <User size={14} />
                      Profile Settings
                    </div>
                    <div 
                      style={{
                        padding: '10px 16px',
                        fontSize: '0.875rem',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        color: 'var(--error)',
                        borderTop: '1px solid var(--border)',
                        transition: 'background-color 0.2s'
                      }}
                      onMouseEnter={e => e.currentTarget.style.backgroundColor = 'var(--bg-slate)'}
                      onMouseLeave={e => e.currentTarget.style.backgroundColor = ''}
                      onClick={() => {
                        setProfileDropdownOpen(false);
                        logout();
                      }}
                    >
                      <LogOut size={14} />
                      Sign Out
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </header>

        {/* Content Render Area */}
        <main className="content-body">
          {children}
        </main>
      </div>
    </div>
  );
};
