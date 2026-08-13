'use client';

import React, { useState, useEffect } from 'react';
import { Settings, Shield, Building, Database, Save, RotateCcw, UserCircle, Monitor } from 'lucide-react';
import { toast } from 'sonner';
import api from '@/lib/api';
import { formatDate } from '@/lib/utils';
import { useAuth } from '@/lib/auth';

export default function MobileSettings() {
  const { user, updateUser } = useAuth();
  const [activeTab, setActiveTab] = useState('company');

  const [companyForm, setCompanyForm] = useState({
    companyName: 'Lakshmi Candles Manufacturing Company',
    gstNumber: '33AABCT0000A1ZA',
    address: '124 Industrial Estate, Guindy, Chennai',
    state: 'Tamil Nadu',
    pincode: '600032',
    phone: '+91 98765 43210',
    invoicePrefix: 'INV-2026-',
    defaultGst: 18,
  });

  const handleCompanySave = (e: React.FormEvent) => {
    e.preventDefault();
    toast.success('Company profile & GST settings updated!');
  };

  const handleBackup = () => {
    toast.success('Database backup initiated. Downloading SQL dump...');
  };

  const [users, setUsers] = useState<any[]>([]);
  const [isLoadingUsers, setIsLoadingUsers] = useState(false);

  // Customization state
  const [customization, setCustomization] = useState({ 
    font: 'roboto', 
    size: 'medium',
    tableDensity: 'comfortable',
    tableLayout: 'full'
  });

  useEffect(() => {
    // If we have database preferences from user context, use those, else local
    const p = user?.preferences || {};
    setCustomization({
      font: p.fontFamily || localStorage.getItem('app-font') || 'roboto',
      size: p.fontSize || localStorage.getItem('app-font-size') || 'medium',
      tableDensity: p.tableDensity || localStorage.getItem('app-table-density') || 'comfortable',
      tableLayout: p.tableWidth || localStorage.getItem('app-table-layout') || 'full'
    });

    if (activeTab === 'permissions') {
      setIsLoadingUsers(true);
      api.get('/users')
        .then((res) => {
          setUsers(res.data.data);
        })
        .catch(() => {
          toast.error('Failed to load users');
        })
        .finally(() => {
          setIsLoadingUsers(false);
        });
    }
  }, [activeTab]);

  const handleCustomizationSave = async () => {
    const preferencesPayload = {
      fontFamily: customization.font,
      fontSize: customization.size,
      tableDensity: customization.tableDensity,
      tableWidth: customization.tableLayout
    };

    try {
      // Save globally via API
      await api.put('/users/preferences', preferencesPayload);
      
      // Update local auth context (which applies them to DOM/localStorage)
      updateUser({ preferences: { ...user?.preferences, ...preferencesPayload } });
      
      toast.success('Display customization updated and saved globally!');
    } catch (err) {
      toast.error('Failed to save display preferences globally');
    }
  };

  return (
    <div className="space-y-6">
      {/* Title section removed, handled by MobileTopBar */}

      {/* Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide -mx-4 px-4">
        <button
          onClick={() => setActiveTab('company')}
          className={`flex items-center gap-2 whitespace-nowrap rounded-full px-4 py-2 text-sm font-semibold transition-all ${
            activeTab === 'company'
              ? 'bg-gray-900 text-white shadow-md dark:bg-white dark:text-gray-900'
              : 'bg-white text-gray-600 hover:bg-gray-50 border border-gray-200 dark:bg-gray-900 dark:border-gray-800 dark:text-gray-400'
          }`}
        >
          <Building className="h-4 w-4" /> Company
        </button>
        <button
          onClick={() => setActiveTab('permissions')}
          className={`flex items-center gap-2 whitespace-nowrap rounded-full px-4 py-2 text-sm font-semibold transition-all ${
            activeTab === 'permissions'
              ? 'bg-gray-900 text-white shadow-md dark:bg-white dark:text-gray-900'
              : 'bg-white text-gray-600 hover:bg-gray-50 border border-gray-200 dark:bg-gray-900 dark:border-gray-800 dark:text-gray-400'
          }`}
        >
          <Shield className="h-4 w-4" /> Users
        </button>
        <button
          onClick={() => setActiveTab('backup')}
          className={`flex items-center gap-2 whitespace-nowrap rounded-full px-4 py-2 text-sm font-semibold transition-all ${
            activeTab === 'backup'
              ? 'bg-gray-900 text-white shadow-md dark:bg-white dark:text-gray-900'
              : 'bg-white text-gray-600 hover:bg-gray-50 border border-gray-200 dark:bg-gray-900 dark:border-gray-800 dark:text-gray-400'
          }`}
        >
          <Database className="h-4 w-4" /> Backup
        </button>
        <button
          onClick={() => setActiveTab('customization')}
          className={`flex items-center gap-2 whitespace-nowrap rounded-full px-4 py-2 text-sm font-semibold transition-all ${
            activeTab === 'customization'
              ? 'bg-gray-900 text-white shadow-md dark:bg-white dark:text-gray-900'
              : 'bg-white text-gray-600 hover:bg-gray-50 border border-gray-200 dark:bg-gray-900 dark:border-gray-800 dark:text-gray-400'
          }`}
        >
          <Monitor className="h-4 w-4" /> Display
        </button>
      </div>

      {/* Company Tab */}
      {activeTab === 'company' && (
        <div className="max-w-2xl rounded-2xl border border-gray-200/80 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-900">
          <form onSubmit={handleCompanySave} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300">Company Name</label>
              <input
                type="text"
                value={companyForm.companyName}
                onChange={(e) => setCompanyForm({ ...companyForm, companyName: e.target.value })}
                className="mt-1 w-full rounded-xl border border-gray-200 p-2.5 text-sm dark:border-gray-800 dark:bg-gray-950 dark:text-white font-semibold"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300">GSTIN / Tax ID</label>
                <input
                  type="text"
                  value={companyForm.gstNumber}
                  onChange={(e) => setCompanyForm({ ...companyForm, gstNumber: e.target.value })}
                  className="mt-1 w-full rounded-xl border border-gray-200 p-2.5 text-sm dark:border-gray-800 dark:bg-gray-950 dark:text-white uppercase font-mono"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300">Phone</label>
                <input
                  type="text"
                  value={companyForm.phone}
                  onChange={(e) => setCompanyForm({ ...companyForm, phone: e.target.value })}
                  className="mt-1 w-full rounded-xl border border-gray-200 p-2.5 text-sm dark:border-gray-800 dark:bg-gray-950 dark:text-white"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300">Registered Address</label>
              <textarea
                rows={2}
                value={companyForm.address}
                onChange={(e) => setCompanyForm({ ...companyForm, address: e.target.value })}
                className="mt-1 w-full rounded-xl border border-gray-200 p-2.5 text-sm dark:border-gray-800 dark:bg-gray-950 dark:text-white"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300">Invoice Number Prefix</label>
                <input
                  type="text"
                  value={companyForm.invoicePrefix}
                  onChange={(e) => setCompanyForm({ ...companyForm, invoicePrefix: e.target.value })}
                  className="mt-1 w-full rounded-xl border border-gray-200 p-2.5 text-sm dark:border-gray-800 dark:bg-gray-950 dark:text-white font-mono"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300">Default GST Rate (%)</label>
                <input
                  type="number"
                  value={companyForm.defaultGst}
                  onChange={(e) => setCompanyForm({ ...companyForm, defaultGst: (e.target.value === '' ? '' : Number(e.target.value)) as any })}
                  className="mt-1 w-full rounded-xl border border-gray-200 p-2.5 text-sm dark:border-gray-800 dark:bg-gray-950 dark:text-white font-bold"
                />
              </div>
            </div>

            <div className="pt-4 flex justify-end">
              <button
                type="submit"
                className="flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 shadow-sm"
              >
                <Save className="h-4 w-4" /> Save Configuration
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Permissions Tab */}
      {activeTab === 'permissions' && (
        <div className="rounded-2xl border border-gray-200/80 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-900 space-y-4">
          <h3 className="text-base font-bold text-gray-900 dark:text-white">Role Access Permissions Matrix</h3>
          <p className="text-xs text-gray-500">Configured Role-Based Access Control (RBAC) rules across system modules</p>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-gray-50 text-xs uppercase font-semibold text-gray-500 dark:bg-gray-950">
                <tr>
                  <th className="p-3">Role</th>
                  <th className="p-3">Permissions Scope</th>
                  <th className="p-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-800 text-xs">
                <tr>
                  <td className="p-3 font-bold text-gray-900 dark:text-white">ADMIN</td>
                  <td className="p-3 font-mono text-blue-600">* (Full Enterprise Control)</td>
                  <td className="p-3 font-semibold text-emerald-600">Active</td>
                </tr>
                <tr>
                  <td className="p-3 font-bold text-gray-900 dark:text-white">PRODUCTION MANAGER</td>
                  <td className="p-3 font-mono">production:*, batch:*, inventory:read, raw_materials:*</td>
                  <td className="p-3 font-semibold text-emerald-600">Active</td>
                </tr>
                <tr>
                  <td className="p-3 font-bold text-gray-900 dark:text-white">SALES EXECUTIVE</td>
                  <td className="p-3 font-mono">customers:*, sales:*, invoices:*, payments:*</td>
                  <td className="p-3 font-semibold text-emerald-600">Active</td>
                </tr>
                <tr>
                  <td className="p-3 font-bold text-gray-900 dark:text-white">ACCOUNTANT</td>
                  <td className="p-3 font-mono">invoices:*, payments:*, expenses:*, reports:*</td>
                  <td className="p-3 font-semibold text-emerald-600">Active</td>
                </tr>
              </tbody>
            </table>
          </div>

          <div className="mt-8">
            <h3 className="text-base font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <UserCircle className="h-5 w-5 text-gray-500" /> System Users
            </h3>
            <p className="text-xs text-gray-500 mb-4">List of all users with access to the system</p>
            
            <div className="overflow-x-auto rounded-xl border border-gray-200 dark:border-gray-800">
              <table className="w-full text-left text-sm">
                <thead className="bg-gray-50 text-xs uppercase font-semibold text-gray-500 dark:bg-gray-950">
                  <tr>
                    <th className="p-3">Name</th>
                    <th className="p-3">Email</th>
                    <th className="p-3">Role</th>
                    <th className="p-3">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-800 text-sm">
                  {isLoadingUsers ? (
                    <tr>
                      <td colSpan={4} className="p-6 text-center text-gray-500">Loading users...</td>
                    </tr>
                  ) : users.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="p-6 text-center text-gray-500">No users found.</td>
                    </tr>
                  ) : (
                    users.map((u: any) => (
                      <tr key={u.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                        <td className="p-3 font-medium text-gray-900 dark:text-white">{u.name}</td>
                        <td className="p-3 text-gray-500">{u.email}</td>
                        <td className="p-3">
                          <span className={`inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ring-1 ring-inset ${
                            u.role === 'SUPER_ADMIN' || u.role === 'ADMIN' 
                              ? 'bg-purple-50 text-purple-700 ring-purple-700/10 dark:bg-purple-900/20 dark:text-purple-400 dark:ring-purple-900/50'
                              : 'bg-blue-50 text-blue-700 ring-blue-700/10 dark:bg-blue-900/20 dark:text-blue-400 dark:ring-blue-900/50'
                          }`}>
                            {u.role.replace('_', ' ')}
                          </span>
                        </td>
                        <td className="p-3">
                          {u.isActive ? (
                            <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">Active</span>
                          ) : (
                            <span className="text-xs font-semibold text-red-600 dark:text-red-400">Inactive</span>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Backup Tab */}
      {activeTab === 'backup' && (
        <div className="max-w-xl rounded-2xl border border-gray-200/80 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-900 space-y-6">
          <div>
            <h3 className="text-base font-bold text-gray-900 dark:text-white">Database Backup & Recovery</h3>
            <p className="text-xs text-gray-500">Create full snapshots of PostgreSQL data including audit logs</p>
          </div>

          <div className="flex gap-4">
            <button
              onClick={handleBackup}
              className="flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-700"
            >
              <Database className="h-4 w-4" /> Download Backup SQL
            </button>
            <button
              onClick={() => toast.info('Select a .sql backup file to restore database state')}
              className="flex items-center gap-2 rounded-xl border border-gray-200 px-5 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50 dark:border-gray-800 dark:text-gray-300"
            >
              <RotateCcw className="h-4 w-4" /> Restore Database
            </button>
          </div>
        </div>
      )}

      {/* Customization Tab */}
      {activeTab === 'customization' && (
        <div className="max-w-xl rounded-2xl border border-gray-200/80 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-900 space-y-6">
          <div>
            <h3 className="text-base font-bold text-gray-900 dark:text-white">Display Preferences</h3>
            <p className="text-xs text-gray-500">Customize typography and text scaling for your ERP session.</p>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300">Font Family</label>
              <select
                value={customization.font}
                onChange={(e) => setCustomization({ ...customization, font: e.target.value })}
                className="mt-1 w-full rounded-xl border border-gray-200 p-2.5 text-sm dark:border-gray-800 dark:bg-gray-950 dark:text-white font-semibold"
              >
                <option value="roboto">Roboto (Salesforce Style)</option>
                <option value="inter">Inter (Modern & Clean)</option>
                <option value="open-sans">Open Sans (Classic & Readable)</option>
                <option value="geist">Geist (Tech & Sharp)</option>
                <option value="nunito">Nunito (Friendly & Soft)</option>
              </select>
            </div>
            
            <div>
              <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300">Font Size</label>
              <select
                value={customization.size}
                onChange={(e) => setCustomization({ ...customization, size: e.target.value })}
                className="mt-1 w-full rounded-xl border border-gray-200 p-2.5 text-sm dark:border-gray-800 dark:bg-gray-950 dark:text-white font-semibold"
              >
                <option value="xs">Extra Small (12px)</option>
                <option value="small">Small (14px)</option>
                <option value="medium">Medium (16px)</option>
                <option value="large">Large (18px)</option>
                <option value="xl">Extra Large (20px)</option>
              </select>
            </div>
          </div>
          
          <hr className="border-gray-200 dark:border-gray-800" />
          
          <div>
            <h3 className="text-base font-bold text-gray-900 dark:text-white">Table Display Preferences</h3>
            <p className="text-xs text-gray-500">Configure global layout and padding for all data grids.</p>
          </div>
          
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300">Default Table Density</label>
              <select
                value={customization.tableDensity}
                onChange={(e) => setCustomization({ ...customization, tableDensity: e.target.value })}
                className="mt-1 w-full rounded-xl border border-gray-200 p-2.5 text-sm dark:border-gray-800 dark:bg-gray-950 dark:text-white font-semibold"
              >
                <option value="compact">Compact (High Density)</option>
                <option value="comfortable">Comfortable (Standard)</option>
                <option value="spacious">Spacious (Low Density)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300">Default Table Width</label>
              <select
                value={customization.tableLayout}
                onChange={(e) => setCustomization({ ...customization, tableLayout: e.target.value })}
                className="mt-1 w-full rounded-xl border border-gray-200 p-2.5 text-sm dark:border-gray-800 dark:bg-gray-950 dark:text-white font-semibold"
              >
                <option value="full">Fill Screen (100% Width)</option>
                <option value="auto">Fit Content (Tight Columns)</option>
              </select>
            </div>
          </div>

          <div className="pt-4 flex justify-end">
            <button
              onClick={handleCustomizationSave}
              className="flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 shadow-sm"
            >
              <Save className="h-4 w-4" /> Save Preferences
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
