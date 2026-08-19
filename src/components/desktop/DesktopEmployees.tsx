'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import DataTable, { Column } from '@/components/shared/DataTable';
import StatusBadge from '@/components/shared/StatusBadge';
import { formatCurrency, formatDate } from '@/lib/utils';
import { UserCog, CalendarCheck, Plus, CheckCircle, XCircle, Edit, Trash2, X } from 'lucide-react';
import api from '@/lib/api';
import { toast } from 'sonner';

export default function DesktopEmployees() {
  const [employees, setEmployees] = useState<any[]>([]);
  const [attendanceStats, setAttendanceStats] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const totalItems = employees.length;

  // Modals
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEdit, setIsEdit] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [isAttendanceOpen, setIsAttendanceOpen] = useState(false);
  const [selectedEmp, setSelectedEmp] = useState<any>(null);

  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    designation: 'Machine Operator',
    department: 'Production',
    salary: 18000,
    joinDate: new Date().toISOString().slice(0, 10),
    status: 'ACTIVE',
    address: '',
  });

  const [attStatus, setAttStatus] = useState('PRESENT');

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [eRes, aRes] = await Promise.all([
        api.get(`/employees?search=${encodeURIComponent(search)}`),
        api.get('/employees/attendance/stats'),
      ]);
      setEmployees(eRes.data.data.data || []);
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

  const handleOpenAdd = () => {
    setIsEdit(false);
    setEditId(null);
    setFormData({
      name: '',
      phone: '',
      designation: 'Machine Operator',
      department: 'Production',
      salary: 18000,
      joinDate: new Date().toISOString().slice(0, 10),
      status: 'ACTIVE',
      address: '',
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (emp: any) => {
    setIsEdit(true);
    setEditId(emp.id);
    let joinDateStr = new Date().toISOString().slice(0, 10);
    if (emp.joinDate) {
      try {
        joinDateStr = new Date(emp.joinDate).toISOString().slice(0, 10);
      } catch {
        joinDateStr = String(emp.joinDate).slice(0, 10);
      }
    }
    setFormData({
      name: emp.name || '',
      phone: emp.phone || '',
      designation: emp.designation || 'Machine Operator',
      department: emp.department || 'Production',
      salary: Number(emp.salary) || 0,
      joinDate: joinDateStr,
      status: emp.status || 'ACTIVE',
      address: emp.address || '',
    });
    setIsModalOpen(true);
  };

  const handleDelete = async (emp: any) => {
    if (!window.confirm(`Are you sure you want to delete employee "${emp.name}" (${emp.employeeId})? This will also remove associated attendance records.`)) {
      return;
    }
    try {
      await api.delete(`/employees/${emp.id}`);
      toast.success('Employee deleted successfully!');
      fetchData();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to delete employee');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (isEdit && editId) {
        await api.put(`/employees/${editId}`, formData);
        toast.success('Employee updated successfully!');
      } else {
        await api.post('/employees', formData);
        toast.success('Employee created successfully!');
      }
      setIsModalOpen(false);
      fetchData();
    } catch (err: any) {
      toast.error(err.response?.data?.message || (isEdit ? 'Error updating employee' : 'Error creating employee'));
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
      header: 'Actions',
      cell: (emp) => (
        <div className="flex items-center gap-2">
          <button
            onClick={() => handleOpenEdit(emp)}
            title="Edit Employee"
            className="p-1 rounded-lg text-blue-500 hover:bg-blue-50 hover:text-blue-700 dark:hover:bg-blue-900/30 transition-colors"
          >
            <Edit className="w-4 h-4" />
          </button>
          <button
            onClick={() => handleDelete(emp)}
            title="Delete Employee"
            className="p-1 rounded-lg text-red-500 hover:bg-red-50 hover:text-red-700 dark:hover:bg-red-900/30 transition-colors"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      ),
    },
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
          className="flex items-center gap-1 rounded-lg bg-blue-50 px-2.5 py-1 text-xs font-semibold text-blue-600 hover:bg-blue-100 dark:bg-blue-950/40 dark:text-blue-400 transition-colors"
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
        <Link 
          href="/dashboard/employees/attendance"
          className="flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-bold text-white shadow-lg hover:bg-blue-700 hover:scale-105 transition-all duration-200 dark:bg-blue-600 dark:hover:bg-blue-500"
        >
          <CalendarCheck className="h-5 w-5" />
          View Production & Attendance
        </Link>
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
        onAddClick={handleOpenAdd}
        addButtonLabel="Add Employee"
        isLoading={isLoading}
      />

      {/* Add / Edit Employee Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-3xl border border-gray-200 bg-white p-6 shadow-2xl dark:border-gray-800 dark:bg-gray-900">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-gray-900 dark:text-white">
                {isEdit ? 'Edit Employee' : 'Add New Employee'}
              </h2>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-gray-800 dark:hover:text-gray-300"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
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

              {isEdit && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300">Status</label>
                    <select
                      value={formData.status}
                      onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                      className="mt-1 w-full rounded-xl border border-gray-200 p-2.5 text-sm dark:border-gray-800 dark:bg-gray-950 dark:text-white font-semibold"
                    >
                      <option value="ACTIVE">ACTIVE</option>
                      <option value="INACTIVE">INACTIVE</option>
                      <option value="ON_LEAVE">ON LEAVE</option>
                      <option value="TERMINATED">TERMINATED</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300">Join Date</label>
                    <input
                      type="date"
                      value={formData.joinDate}
                      onChange={(e) => setFormData({ ...formData, joinDate: e.target.value })}
                      className="mt-1 w-full rounded-xl border border-gray-200 p-2.5 text-sm dark:border-gray-800 dark:bg-gray-950 dark:text-white"
                    />
                  </div>
                </div>
              )}

              <div className="flex justify-end gap-3 pt-4 border-t border-gray-100 dark:border-gray-800">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="rounded-xl px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-xl bg-blue-600 px-5 py-2 text-sm font-semibold text-white hover:bg-blue-700"
                >
                  {isEdit ? 'Update Employee' : 'Save Employee'}
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
