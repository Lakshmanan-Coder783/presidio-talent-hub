import React, { useState } from 'react';
import { ShieldAlert, Cpu, Network, CheckCircle } from 'lucide-react';

export const Settings: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'general' | 'security' | 'sso'>('general');
  const [successSaved, setSuccessSaved] = useState(false);

  const [platformName, setPlatformName] = useState('Presidio Talent Hub');
  const [proctoring, setProctoring] = useState(true);
  const [tabSwitchLimit, setTabSwitchLimit] = useState('3');
  const [copyPasteBlock, setCopyPasteBlock] = useState(true);
  const [tenantId, setTenantId] = useState('common');
  const [clientId, setClientId] = useState('c5e23308-181a-45ab-bda3-e5679c375193');

  const handleSave = () => {
    setSuccessSaved(true);
    setTimeout(() => {
      setSuccessSaved(false);
    }, 2000);
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Platform Settings</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', marginTop: '4px' }}>
            Configure default corporate setups, proctoring security parameters, and Entra ID SSO credentials.
          </p>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '200px 1fr', gap: '32px', alignItems: 'start' }}>
        
        {/* Left Side: Tabs */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {[
            { id: 'general', label: 'General Config', icon: Cpu },
            { id: 'security', label: 'Assessment Security', icon: ShieldAlert },
            { id: 'sso', label: 'Single Sign-On (SSO)', icon: Network }
          ].map(tab => {
            const Icon = tab.icon;
            const isTabActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  padding: '12px 16px',
                  borderRadius: '8px',
                  border: 'none',
                  background: isTabActive ? 'var(--primary-blue-light)' : 'none',
                  color: isTabActive ? 'var(--primary-blue)' : 'var(--text-secondary)',
                  fontWeight: 600,
                  fontSize: '0.875rem',
                  cursor: 'pointer',
                  textAlign: 'left',
                  outline: 'none',
                  transition: 'all 0.2s'
                }}
              >
                <Icon size={16} />
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Right Side: Tab panel details */}
        <div className="widget-card">
          <div style={{ minHeight: '320px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
            <div>
              {activeTab === 'general' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <div className="widget-title">
                    <h3 style={{ fontSize: '1.125rem', fontWeight: 700 }}>General Configuration</h3>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Enterprise Platform Name</label>
                    <input
                      type="text"
                      className="form-control"
                      value={platformName}
                      onChange={e => setPlatformName(e.target.value)}
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Session Timeout Limit (minutes)</label>
                    <input type="number" className="form-control" defaultValue="120" />
                  </div>

                  <div className="form-group">
                    <label className="form-label">System Timezone</label>
                    <select className="select-filter" style={{ width: '100%', padding: '10px' }} defaultValue="IST">
                      <option value="IST">India Standard Time (IST - UTC+05:30)</option>
                      <option value="EST">Eastern Standard Time (EST - UTC-05:00)</option>
                      <option value="GMT">Greenwich Mean Time (GMT - UTC+00:00)</option>
                    </select>
                  </div>
                </div>
              )}

              {activeTab === 'security' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <div className="widget-title">
                    <h3 style={{ fontSize: '1.125rem', fontWeight: 700 }}>Assessment Security & Proctoring</h3>
                  </div>

                  <div className="form-group" style={{ display: 'flex', alignItems: 'center', gap: '12px', marginTop: '8px' }}>
                    <input
                      type="checkbox"
                      id="proct-check-admin"
                      checked={proctoring}
                      onChange={e => setProctoring(e.target.checked)}
                      style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                    />
                    <label className="form-label" htmlFor="proct-check-admin" style={{ marginBottom: 0, cursor: 'pointer' }}>
                      Enable AI-Proctoring Camera Monitoring (Requires candidate camera permissions)
                    </label>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Max Allowed Tab Switches / Navigation Violations</label>
                    <input
                      type="number"
                      className="form-control"
                      value={tabSwitchLimit}
                      onChange={e => setTabSwitchLimit(e.target.value)}
                    />
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                      The test will automatically terminate if the candidate switches tabs more than this limit.
                    </span>
                  </div>

                  <div className="form-group" style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <input
                      type="checkbox"
                      id="copy-paste-admin"
                      checked={copyPasteBlock}
                      onChange={e => setCopyPasteBlock(e.target.checked)}
                      style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                    />
                    <label className="form-label" htmlFor="copy-paste-admin" style={{ marginBottom: 0, cursor: 'pointer' }}>
                      Disable Right-click & Text Copy-Paste in Coding IDE
                    </label>
                  </div>
                </div>
              )}

              {activeTab === 'sso' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <div className="widget-title">
                    <h3 style={{ fontSize: '1.125rem', fontWeight: 700 }}>Microsoft Entra ID (Azure AD) SSO</h3>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Directory Tenant ID</label>
                    <input
                      type="text"
                      className="form-control"
                      value={tenantId}
                      onChange={e => setTenantId(e.target.value)}
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Application Client ID</label>
                    <input
                      type="text"
                      className="form-control"
                      value={clientId}
                      onChange={e => setClientId(e.target.value)}
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Redirect OAuth URI</label>
                    <input
                      type="text"
                      className="form-control"
                      defaultValue="https://talent.presidio.com/auth/openid/callback"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Bottom Actions */}
            <div style={{ borderTop: '1px solid var(--border)', paddingTop: '16px', marginTop: '24px', display: 'flex', justifyContent: 'flex-end', gap: '12px', alignItems: 'center' }}>
              {successSaved && (
                <span style={{ fontSize: '0.85rem', color: 'var(--success)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <CheckCircle size={14} />
                  Settings saved successfully!
                </span>
              )}
              <button className="btn btn-primary" onClick={handleSave}>
                Save Configurations
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
