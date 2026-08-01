'use client';

import React, { useEffect, useState } from 'react';
import DataTable, { Column } from '@/components/shared/DataTable';
import StatusBadge from '@/components/shared/StatusBadge';
import { formatCurrency, formatDate } from '@/lib/utils';
import { UserCog, CalendarCheck, Plus, CheckCircle, XCircle } from 'lucide-react';
import api from '@/lib/api';
import { toast } from 'sonner';

export default function EmployeesPage() {
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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Employee & HR Module</h1>
          <p className="text-sm text-gray-500">Manage factory operators, daily attendance & monthly payroll</p>
        </div>
      </div>

      {/* Attendance Stats */}
      {attendanceStats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="rounded-2xl border border-gray-200/80 bg-white p-4 dark:border-gray-800 dark:bg-gray-900">
            <p className="text-xs text-gray-500 uppercase tracking-wider">Total Active Staff</p>
            <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">{attendanceStats.totalEmployees || 0}</p>
          </div>
          <div className="rounded-2xl border border-gray-200/80 bg-white p-4 dark:border-gray-800 dark:bg-gray-900">
            <p className="text-xs text-gray-500 uppercase tracking-wider">Present Today</p>
            <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 mt-1">{attendanceStats.present || 0}</p>
          </div>
          <div className="rounded-2xl border border-gray-200/80 bg-white p-4 dark:border-gray-800 dark:bg-gray-900">
            <p className="text-xs text-gray-500 uppercase tracking-wider">Absent Today</p>
            <p className="text-2xl font-bold text-rose-600 dark:text-rose-400 mt-1">{attendanceStats.absent || 0}</p>
          </div>
          <div className="rounded-2xl border border-gray-200/80 bg-white p-4 dark:border-gray-800 dark:bg-gray-900">
            <p className="text-xs text-gray-500 uppercase tracking-wider">Attendance Rate</p>
            <p className="text-2xl font-bold text-blue-600 dark:text-blue-400 mt-1">{attendanceStats.attendanceRate}%</p>
          </div>
        </div>
      )}

      <DataTable totalItems={totalItems} limit={limit} onLimitChange={(l) => { setLimit(l); setPage(1); }}
        columns={columns}
        data={employees}
        searchPlaceholder="Search employee name or ID..."
        onSearch={(q) => setSearch(q)}
        onAddClick={() => setIsCreateOpen(true)}
        addButtonLabel="Add Employee"
        isLoading={isLoading}
      />

      {/* Add Employee Modal */}
      {isCreateOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-3xl border border-gray-200 bg-white p-6 shadow-2xl dark:border-gray-800 dark:bg-gray-900">
            <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Add New Employee</h2>
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
                    onChange={(e) => setFormData({ ...formData, salary: Number(e.target.value) })}
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

      {/* Mark Attendance Modal */}
      {isAttendanceOpen && selectedEmp && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-3xl border border-gray-200 bg-white p-6 shadow-2xl dark:border-gray-800 dark:bg-gray-900">
            <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-1">Mark Attendance</h2>
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
