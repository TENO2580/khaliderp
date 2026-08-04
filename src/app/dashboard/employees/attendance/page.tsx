'use client';

import React, { useState, useEffect } from 'react';
import { formatCurrency } from '@/lib/utils';
import { ArrowLeft, Save } from 'lucide-react';
import Link from 'next/link';
import api from '@/lib/api';
import { toast } from 'sonner';

export default function EmployeeAttendancePage() {
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [employees, setEmployees] = useState<any[]>([]);
  const [selectedEmployeeId, setSelectedEmployeeId] = useState('');
  const [rows, setRows] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Fetch employees list
  useEffect(() => {
    const fetchEmployees = async () => {
      try {
        const res = await api.get('/employees?limit=100');
        const emps = res.data.data.data;
        setEmployees(emps);
        if (emps.length > 0) {
          setSelectedEmployeeId(emps[0].id);
        }
      } catch (err) {
        toast.error('Failed to load employees');
      }
    };
    fetchEmployees();
  }, []);

  // Fetch attendance for selected employee and month
  useEffect(() => {
    if (!selectedEmployeeId) return;
    
    const fetchAttendance = async () => {
      setIsLoading(true);
      try {
        const res = await api.get(`/employees/attendance/bulk?employeeId=${selectedEmployeeId}&month=${selectedMonth}&year=${selectedYear}`);
        setRows(res.data.data);
      } catch (err) {
        toast.error('Failed to load attendance');
      } finally {
        setIsLoading(false);
      }
    };
    fetchAttendance();
  }, [selectedEmployeeId, selectedMonth, selectedYear]);

  const updateRow = (id: string, field: string, value: any) => {
    setRows(prev => prev.map(row => {
      if (row.id === id) {
        return { ...row, [field]: value };
      }
      return row;
    }));
  };

  const calculateEfficiency = (actual: number, target: number) => {
    if (!target) return 0;
    return (actual / target) * 100;
  };

  const calculateCostPerKg = (salary: number, actual: number) => {
    if (!actual) return 0;
    return salary / actual;
  };

  const handleSave = async () => {
    try {
      await api.put('/employees/attendance/bulk', {
        employeeId: selectedEmployeeId,
        records: rows,
      });
      toast.success('Attendance records saved!');
    } catch (err) {
      toast.error('Failed to save attendance records');
    }
  };

  const daysPresent = rows.filter(r => r.isPresent).length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link
            href="/dashboard/employees"
            className="rounded-xl border border-gray-200 bg-white p-2 text-gray-500 hover:bg-gray-50 dark:border-gray-800 dark:bg-gray-900 dark:text-gray-400 dark:hover:bg-gray-800"
          >
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-[#1e3a8a] dark:text-blue-400">Employee Production & Attendance</h1>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex gap-2">
            <select
              value={selectedEmployeeId}
              onChange={(e) => setSelectedEmployeeId(e.target.value)}
              className="rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm text-gray-700 focus:border-blue-500 focus:outline-none dark:border-gray-800 dark:bg-gray-900 dark:text-gray-200"
            >
              {employees.map(emp => (
                <option key={emp.id} value={emp.id}>{emp.name}</option>
              ))}
            </select>
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(Number(e.target.value))}
              className="rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm text-gray-700 focus:border-blue-500 focus:outline-none dark:border-gray-800 dark:bg-gray-900 dark:text-gray-200"
            >
              {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
                <option key={m} value={m}>
                  {new Date(2000, m - 1, 1).toLocaleString('default', { month: 'short' })}
                </option>
              ))}
            </select>
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(Number(e.target.value))}
              className="rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm text-gray-700 focus:border-blue-500 focus:outline-none dark:border-gray-800 dark:bg-gray-900 dark:text-gray-200"
            >
              {[2024, 2025, 2026, 2027].map((y) => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>
          </div>
          <button 
            onClick={handleSave}
            disabled={isLoading}
            className="flex items-center gap-2 rounded-xl bg-[#1e3a8a] px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-800 transition-colors disabled:opacity-50"
          >
            <Save className="h-4 w-4" /> Save Records
          </button>
        </div>
      </div>

      <div className="flex justify-center -mt-2 mb-4">
        <div className="border border-black bg-white shadow-sm w-32">
          <div className="bg-gray-200 px-2 py-1 border-b border-black text-center text-sm font-bold text-gray-800">
            Days Present
          </div>
          <div className="px-2 py-2 text-center text-xl font-extrabold text-black">
            {daysPresent}
          </div>
        </div>
      </div>

      <div className="overflow-x-auto rounded-lg border border-gray-200 bg-white shadow-sm dark:border-gray-800 dark:bg-gray-900">
        <table className="w-full text-left text-sm text-gray-600 dark:text-gray-400">
          <thead className="bg-[#1e3a8a] text-white">
            <tr>
              <th className="px-4 py-3 font-semibold text-center">Date</th>
              <th className="px-4 py-3 font-semibold text-center">Name</th>
              <th className="px-4 py-3 font-semibold text-center">Attendance</th>
              <th className="px-4 py-3 font-semibold text-center">Target KG</th>
              <th className="px-4 py-3 font-semibold text-center">Actual KG</th>
              <th className="px-4 py-3 font-semibold text-center">Efficiency</th>
              <th className="px-4 py-3 font-semibold text-center">Daily Salary</th>
              <th className="px-4 py-3 font-semibold text-center">Cost/KG</th>
              <th className="px-4 py-3 font-semibold">Notes</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
            {rows.map((row, idx) => {
              const efficiency = calculateEfficiency(row.actualKg, row.targetKg);
              const costPerKg = calculateCostPerKg(row.dailySalary, row.actualKg);

              return (
                <tr key={row.id} className={idx % 2 === 0 ? 'bg-white dark:bg-gray-900' : 'bg-gray-50/80 dark:bg-gray-800/50'}>
                  <td className="px-4 py-2 text-center font-medium">{row.date}</td>
                  <td className="px-4 py-2 text-center">{row.name}</td>
                  <td className="px-4 py-2 text-center">
                    <input
                      type="checkbox"
                      checked={row.isPresent}
                      onChange={(e) => updateRow(row.id, 'isPresent', e.target.checked)}
                      className="h-4 w-4 rounded border-gray-300 text-[#1e3a8a] focus:ring-[#1e3a8a] cursor-pointer"
                    />
                  </td>
                  <td className="px-4 py-2 text-center">
                    <input
                      type="number"
                      value={row.targetKg || ''}
                      onChange={(e) => updateRow(row.id, 'targetKg', Number(e.target.value))}
                      className="w-16 rounded border border-gray-200 bg-transparent px-2 py-1 text-center text-sm focus:border-[#1e3a8a] focus:outline-none dark:border-gray-700"
                    />
                  </td>
                  <td className="px-4 py-2 text-center">
                    <input
                      type="number"
                      value={row.actualKg || ''}
                      onChange={(e) => updateRow(row.id, 'actualKg', Number(e.target.value))}
                      disabled={!row.isPresent}
                      className="w-16 rounded border border-gray-200 bg-transparent px-2 py-1 text-center text-sm disabled:opacity-50 focus:border-[#1e3a8a] focus:outline-none dark:border-gray-700"
                    />
                  </td>
                  <td className="px-4 py-2 text-center">{efficiency.toFixed(1)}%</td>
                  <td className="px-4 py-2 text-center">
                    <input
                      type="number"
                      value={row.dailySalary || ''}
                      onChange={(e) => updateRow(row.id, 'dailySalary', Number(e.target.value))}
                      className="w-20 rounded border border-gray-200 bg-transparent px-2 py-1 text-center text-sm focus:border-[#1e3a8a] focus:outline-none dark:border-gray-700"
                    />
                  </td>
                  <td className="px-4 py-2 text-center">{formatCurrency(costPerKg)}</td>
                  <td className="px-4 py-2">
                    <input
                      type="text"
                      value={row.notes}
                      onChange={(e) => updateRow(row.id, 'notes', e.target.value)}
                      className="w-full rounded border border-gray-200 bg-transparent px-2 py-1 text-sm focus:border-[#1e3a8a] focus:outline-none dark:border-gray-700"
                      placeholder="Notes..."
                    />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
