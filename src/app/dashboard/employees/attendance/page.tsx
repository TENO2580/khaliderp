'use client';

import React, { useState, useEffect } from 'react';
import { formatCurrency } from '@/lib/utils';
import { ArrowLeft, Save } from 'lucide-react';
import Link from 'next/link';

// Generate days for a given month and year
const generateDays = (year: number, month: number, employeeName: string) => {
  const daysInMonth = new Date(year, month, 0).getDate();
  const data = [];
  for (let i = 1; i <= daysInMonth; i++) {
    const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(i).padStart(2, '0')}`;
    data.push({
      id: `${dateStr}-${employeeName}`,
      date: dateStr,
      name: employeeName,
      isPresent: false,
      targetKg: 125,
      actualKg: 0,
      dailySalary: 600,
      notes: '',
    });
  }
  return data;
};

export default function EmployeeAttendancePage() {
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [employeeName, setEmployeeName] = useState('BINOD'); // Default for mockup
  const [rows, setRows] = useState<any[]>([]);

  useEffect(() => {
    // In a real app, this would fetch from API. 
    // Here we generate an empty grid for the month, but pre-fill some mockup data to match the screenshot.
    const initialRows = generateDays(selectedYear, selectedMonth, employeeName);
    
    // Mocking some data for the first few days to match the design
    const mockDates = [
      { date: `${selectedYear}-08-01`, actualKg: 25 },
      { date: `${selectedYear}-08-03`, actualKg: 75 },
      { date: `${selectedYear}-08-04`, actualKg: 50 },
    ];
    
    const updatedRows = initialRows.map(row => {
      const mockMatch = mockDates.find(m => m.date === row.date);
      if (mockMatch) {
        return { ...row, isPresent: true, actualKg: mockMatch.actualKg };
      }
      return row;
    });

    setRows(updatedRows);
  }, [selectedMonth, selectedYear, employeeName]);

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
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(Number(e.target.value))}
              className="rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm text-gray-700 focus:border-blue-500 focus:outline-none dark:border-gray-800 dark:bg-gray-900 dark:text-gray-200"
            >
              {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
                <option key={m} value={m}>
                  {new Date(2000, m - 1, 1).toLocaleString('default', { month: 'long' })}
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
          <button className="flex items-center gap-2 rounded-xl bg-[#1e3a8a] px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-800 transition-colors">
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
