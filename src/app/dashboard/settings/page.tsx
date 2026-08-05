'use client';

import React, { useState, useEffect } from 'react';
import { Settings, Shield, Building, Database, Save, RotateCcw, UserCircle } from 'lucide-react';
import { toast } from 'sonner';
import api from '@/lib/api';
import { formatDate } from '@/lib/utils';

export default function SettingsPage() {
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

  useEffect(() => {
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

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">ERP System Settings</h1>
        <p className="text-sm text-gray-500">Configure company profile, GST rates, user permissions & database backups</p>
      </div>

      {/* Tabs */}
      <div className="flex space-x-2 border-b border-gray-200 dark:border-gray-800">
        <button
          onClick={() => setActiveTab('company')}
          className={`flex items-center gap-2 border-b-2 px-4 py-3 text-sm font-semibold transition-colors ${
            activeTab === 'company'
              ? 'border-blue-600 text-blue-600 dark:text-blue-400'
              : 'border-transparent text-gray-500 hover:text-gray-900 dark:hover:text-white'
          }`}
        >
          <Building className="h-4 w-4" /> Company Profile
        </button>
        <button
          onClick={() => setActiveTab('permissions')}
          className={`flex items-center gap-2 border-b-2 px-4 py-3 text-sm font-semibold transition-colors ${
            activeTab === 'permissions'
              ? 'border-blue-600 text-blue-600 dark:text-blue-400'
              : 'border-transparent text-gray-500 hover:text-gray-900 dark:hover:text-white'
          }`}
        >
          <Shield className="h-4 w-4" /> Users & Permissions
        </button>
        <button
          onClick={() => setActiveTab('backup')}
          className={`flex items-center gap-2 border-b-2 px-4 py-3 text-sm font-semibold transition-colors ${
            activeTab === 'backup'
              ? 'border-blue-600 text-blue-600 dark:text-blue-400'
              : 'border-transparent text-gray-500 hover:text-gray-900 dark:hover:text-white'
          }`}
        >
          <Database className="h-4 w-4" /> Backup & Restore
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
    </div>
  );
}
