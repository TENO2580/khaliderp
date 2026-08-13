'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import DataTable, { Column } from '@/components/shared/DataTable';
import StatusBadge from '@/components/shared/StatusBadge';
import { formatCurrency, formatDate } from '@/lib/utils';
import { CalendarCheck, Edit, Trash2, Plus, X, LayoutGrid, Table } from 'lucide-react';
import api from '@/lib/api';
import { toast } from 'sonner';
import { useViewMode } from '@/hooks/useViewMode';
import MobileFilterBar from './MobileFilterBar';

export default function MobileEmployees() {
  const { viewMode, toggleViewMode } = useViewMode();
  const [employees, setEmployees] = useState<any[]>([]);
  const [attendanceStats, setAttendanceStats] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const totalItems = employees.length;

  // Modals
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isAttendanceOpen, setIsAttendanceOpen] = useState(false);
  const [selectedEmp, setSelectedEmp] = useState<any>(null);

  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    designation: 'Machine Operator',
    department: 'Production',
    salary: 18000,
    joinDate: new Date().toISOString().slice(0, 10),
  });

  const [attStatus, setAttStatus] = useState('PRESENT');

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [eRes, aRes] = await Promise.all([
        api.get(`/employees?search=${encodeURIComponent(search)}`),
        api.get('/employees/attendance/stats'),
      ]);
      setEmployees(eRes.data.data.data);
      setAttendanceStats(aRes.data.data);
    } catch {
      toast.error('Failed to load employee list');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [search, limit]);

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/employees', formData);
      toast.success('Employee created!');
      setIsCreateOpen(false);
      fetchData();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Error creating employee');
    }
  };

  const handleAttendanceSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEmp) return;
    try {
      await api.post('/employees/attendance', {
        employeeId: selectedEmp.id,
        date: new Date().toISOString(),
        status: attStatus,
      });
      toast.success(`Attendance marked (${attStatus}) for ${selectedEmp.name}`);
      setIsAttendanceOpen(false);
      fetchData();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Error marking attendance');
    }
  };

  const columns: Column<any>[] = [
    {
      header: 'EMP ID',
      accessorKey: 'employeeId',
      cell: (e) => <span className="font-mono text-xs font-semibold text-blue-600 dark:text-blue-400">{e.employeeId}</span>,
    },
    {
      header: 'Employee Name',
      cell: (e) => (
        <div>
          <p className="font-semibold text-gray-900 dark:text-white">{e.name}</p>
          <p className="text-xs text-gray-500">{e.phone || 'No phone'}</p>
        </div>
      ),
    },
    {
      header: 'Designation & Dept',
      cell: (e) => (
        <div>
          <p className="text-xs font-semibold text-gray-800 dark:text-gray-200">{e.designation}</p>
          <p className="text-xs text-gray-500">{e.department}</p>
        </div>
      ),
    },
    {
      header: 'Monthly Salary',
      cell: (e) => <span className="font-semibold text-gray-900 dark:text-white">{formatCurrency(e.salary)}</span>,
    },
    {
      header: 'Status',
      cell: (e) => <StatusBadge status={e.status} />,
    },
    {
      header: 'Attendance',
      cell: (e) => (
        <button
          onClick={() => {
            setSelectedEmp(e);
            setIsAttendanceOpen(true);
          }}
          className="flex items-center gap-1 rounded-lg bg-blue-50 px-2.5 py-1 text-xs font-semibold text-blue-600 hover:bg-blue-100 dark:bg-blue-950/40 dark:text-blue-400"
        >
          <CalendarCheck className="h-3.5 w-3.5" /> Mark Today
        </button>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-end mb-4">
        <button
          onClick={toggleViewMode}
          className="rounded-xl bg-white p-2 text-gray-600 shadow-sm border border-gray-200 active:bg-gray-50 dark:border-gray-800 dark:bg-gray-900 dark:text-gray-300 dark:active:bg-gray-800"
        >
          {viewMode === 'card' ? <Table className="h-5 w-5" /> : <LayoutGrid className="h-5 w-5" />}
        </button>
      </div>

      <MobileFilterBar
        search={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search employees..."
      />

      {/* Mobile Attendance Stats */}
      {attendanceStats && (
        <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
          <div className="min-w-[140px] flex-shrink-0 rounded-2xl border border-gray-200/80 bg-white p-4 dark:border-gray-800 dark:bg-gray-900 shadow-sm">
            <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1">Total Staff</p>
            <p className="text-xl font-bold text-gray-900 dark:text-white">{attendanceStats.totalEmployees || 0}</p>
          </div>
          <div className="min-w-[140px] flex-shrink-0 rounded-2xl border border-gray-200/80 bg-white p-4 dark:border-gray-800 dark:bg-gray-900 shadow-sm">
            <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1">Present Today</p>
            <p className="text-xl font-bold text-emerald-600 dark:text-emerald-400">{attendanceStats.present || 0}</p>
          </div>
          <div className="min-w-[140px] flex-shrink-0 rounded-2xl border border-gray-200/80 bg-white p-4 dark:border-gray-800 dark:bg-gray-900 shadow-sm">
            <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1">Absent Today</p>
            <p className="text-xl font-bold text-rose-600 dark:text-rose-400">{attendanceStats.absent || 0}</p>
          </div>
          <div className="min-w-[140px] flex-shrink-0 rounded-2xl border border-gray-200/80 bg-white p-4 dark:border-gray-800 dark:bg-gray-900 shadow-sm">
            <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1">Attendance Rate</p>
            <p className="text-xl font-bold text-blue-600 dark:text-blue-400">{attendanceStats.attendanceRate}%</p>
          </div>
        </div>
      )}

      {viewMode === 'table' ? (
        <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-800 overflow-hidden">
          <DataTable columns={columns} data={employees} hideToolbar={true} />
        </div>
      ) : (
        <div className="space-y-4">
          {employees.length === 0 && !isLoading && (
            <div className="text-center py-10 text-gray-500">No employees found.</div>
          )}
          {employees.map((e: any) => (
            <div key={e.id} className="bg-white dark:bg-gray-900 rounded-xl p-4 shadow-sm border border-gray-200 dark:border-gray-800">
              <div className="flex justify-between items-start mb-2">
                <div>
                  <div className="font-semibold text-gray-900 dark:text-white">{e.name}</div>
                  <div className="text-xs font-semibold text-gray-800 dark:text-gray-200 mt-1">{e.designation}</div>
                  <div className="text-xs text-gray-500">{e.department}</div>
                </div>
                <StatusBadge status={e.status} />
              </div>
              <div className="flex justify-between items-center mt-3 pt-3 border-t border-gray-100 dark:border-gray-800">
                <span className="font-semibold text-gray-900 dark:text-white">
                  {formatCurrency(e.salary)}<span className="text-[10px] text-gray-500 font-normal">/mo</span>
                </span>
                <button
                  onClick={() => {
                    setSelectedEmp(e);
                    setIsAttendanceOpen(true);
                  }}
                  className="flex items-center gap-1 rounded-lg bg-blue-50 px-2.5 py-1 text-xs font-semibold text-blue-600 hover:bg-blue-100 dark:bg-blue-950/40 dark:text-blue-400"
                >
                  <CalendarCheck className="h-3.5 w-3.5" /> Mark Today
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
      
      {/* Link to advanced Attendance View & Add New Employee */}
      <div className="fixed bottom-[88px] right-4 flex flex-col gap-3 z-40">
        <Link 
          href="/dashboard/employees/attendance"
          className="w-14 h-14 bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 rounded-full shadow-lg flex items-center justify-center transition-colors"
        >
          <CalendarCheck className="w-6 h-6" />
        </Link>
        <button 
          onClick={() => setIsCreateOpen(true)}
          className="w-14 h-14 bg-blue-600 text-white rounded-full shadow-lg flex items-center justify-center active:bg-blue-700 transition-colors"
        >
          <Plus className="w-6 h-6" />
        </button>
      </div>

      {/* Mobile Add Employee Modal */}
      {isCreateOpen && (
        <div className="fixed inset-0 z-50 flex flex-col bg-gray-50 dark:bg-gray-950 overflow-y-auto pt-4 pb-20 px-4">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">
              Add New Employee
            </h2>
            <button onClick={() => setIsCreateOpen(false)} className="p-2 rounded-full bg-gray-200 dark:bg-gray-800">
              <X className="w-5 h-5 text-gray-600 dark:text-gray-400" />
            </button>
          </div>
          <div className="space-y-6 flex-1">
            <form onSubmit={handleCreateSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300">Full Name *</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="mt-1 w-full rounded-xl border border-gray-200 p-2.5 text-sm dark:border-gray-800 dark:bg-gray-950 dark:text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300">Phone</label>
                  <input
                    type="text"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="mt-1 w-full rounded-xl border border-gray-200 p-2.5 text-sm dark:border-gray-800 dark:bg-gray-950 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300">Salary (₹/mo)</label>
                  <input
                    type="number"
                    value={formData.salary}
                    onChange={(e) => setFormData({ ...formData, salary: (e.target.value === '' ? '' : Number(e.target.value)) as any })}
                    className="mt-1 w-full rounded-xl border border-gray-200 p-2.5 text-sm dark:border-gray-800 dark:bg-gray-950 dark:text-white font-bold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300">Designation</label>
                  <input
                    type="text"
                    value={formData.designation}
                    onChange={(e) => setFormData({ ...formData, designation: e.target.value })}
                    className="mt-1 w-full rounded-xl border border-gray-200 p-2.5 text-sm dark:border-gray-800 dark:bg-gray-950 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300">Department</label>
                  <select
                    value={formData.department}
                    onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                    className="mt-1 w-full rounded-xl border border-gray-200 p-2.5 text-sm dark:border-gray-800 dark:bg-gray-950 dark:text-white"
                  >
                    <option value="Production">Production</option>
                    <option value="Warehouse">Warehouse</option>
                    <option value="Sales">Sales</option>
                    <option value="Administration">Administration</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setIsCreateOpen(false)}
                  className="rounded-xl px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 dark:text-gray-400"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-xl bg-blue-600 px-5 py-2 text-sm font-semibold text-white hover:bg-blue-700"
                >
                  Save Employee
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Mobile Mark Attendance Modal */}
      {isAttendanceOpen && selectedEmp && (
        <div className="fixed inset-0 z-50 flex flex-col bg-gray-50 dark:bg-gray-950 overflow-y-auto pt-4 pb-20 px-4">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">
              Mark Today's Attendance
            </h2>
            <button onClick={() => setIsAttendanceOpen(false)} className="p-2 rounded-full bg-gray-200 dark:bg-gray-800">
              <X className="w-5 h-5 text-gray-600 dark:text-gray-400" />
            </button>
          </div>
          <div className="space-y-6 flex-1">
            <p className="text-xs text-gray-500 mb-4">{selectedEmp.name} ({selectedEmp.employeeId})</p>

            <form onSubmit={handleAttendanceSubmit} className="space-y-4">
              <div className="space-y-2">
                {['PRESENT', 'ABSENT', 'HALF_DAY', 'ON_LEAVE'].map((status) => (
                  <label
                    key={status}
                    className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer ${
                      attStatus === status ? 'border-blue-600 bg-blue-50/50 dark:bg-blue-950/40' : 'border-gray-200 dark:border-gray-800'
                    }`}
                  >
                    <input
                      type="radio"
                      name="attendanceStatus"
                      value={status}
                      checked={attStatus === status}
                      onChange={() => setAttStatus(status)}
                      className="text-blue-600"
                    />
                    <span className="text-sm font-semibold text-gray-900 dark:text-white">{status.replace('_', ' ')}</span>
                  </label>
                ))}
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsAttendanceOpen(false)}
                  className="rounded-xl px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 dark:text-gray-400"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-xl bg-blue-600 px-5 py-2 text-sm font-semibold text-white hover:bg-blue-700"
                >
                  Confirm Attendance
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
