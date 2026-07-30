'use client';

import React, { useEffect, useState } from 'react';
import DataTable, { Column } from '@/components/shared/DataTable';
import { formatCurrency, formatNumber } from '@/lib/utils';
import { Flame, AlertTriangle, Plus } from 'lucide-react';
import api from '@/lib/api';
import { toast } from 'sonner';

export default function RawMaterialsPage() {
  const [materials, setMaterials] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');

  // Modal state
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    category: 'WAX',
    unit: 'KG',
    currentStock: 100,
    reorderLevel: 20,
    unitCost: 85,
  });

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const res = await api.get(`/inventory/raw-materials?search=${encodeURIComponent(search)}`);
      setMaterials(res.data.data.data);
    } catch {
      toast.error('Failed to load raw materials');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [search]);

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/inventory/raw-materials', formData);
      toast.success('Raw material saved!');
      setIsCreateOpen(false);
      fetchData();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Error saving raw material');
    }
  };

  const columns: Column<any>[] = [
    {
      header: 'Material Name',
      accessorKey: 'name',
      cell: (m) => <span className="font-semibold text-gray-900 dark:text-white">{m.name}</span>,
    },
    {
      header: 'Category',
      accessorKey: 'category',
      cell: (m) => (
        <span className="rounded-full bg-blue-50 px-2.5 py-0.5 text-xs font-semibold text-blue-700 dark:bg-blue-950/40 dark:text-blue-400">
          {m.category}
        </span>
      ),
    },
    {
      header: 'Current Stock',
      cell: (m) => {
        const isLow = m.currentStock <= m.reorderLevel;
        return (
          <div className="flex items-center gap-2">
            <span className="font-bold text-gray-900 dark:text-white text-base">
              {formatNumber(m.currentStock)} {m.unit}
            </span>
            {isLow && (
              <span className="flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-xs font-bold text-amber-700 dark:bg-amber-950/40 dark:text-amber-400">
                <AlertTriangle className="h-3 w-3" /> Reorder Soon
              </span>
            )}
          </div>
        );
      },
    },
    {
      header: 'Reorder Level',
      cell: (m) => <span className="text-xs text-gray-500">{m.reorderLevel} {m.unit}</span>,
    },
    {
      header: 'Unit Cost',
      cell: (m) => <span className="text-xs font-medium text-gray-700 dark:text-gray-300">{formatCurrency(m.unitCost)} / {m.unit}</span>,
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Raw Materials Stock</h1>
          <p className="text-sm text-gray-500">Track wax, fragrance oils, dyes, containers & wicks</p>
        </div>
      </div>

      <DataTable
        columns={columns}
        data={materials}
        searchPlaceholder="Search material..."
        onSearch={(q) => setSearch(q)}
        onAddClick={() => setIsCreateOpen(true)}
        addButtonLabel="Add Raw Material"
        isLoading={isLoading}
      />

      {/* Add Material Modal */}
      {isCreateOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-3xl border border-gray-200 bg-white p-6 shadow-2xl dark:border-gray-800 dark:bg-gray-900">
            <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Add Raw Material</h2>
            <form onSubmit={handleCreateSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300">Material Name *</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="mt-1 w-full rounded-xl border border-gray-200 p-2.5 text-sm dark:border-gray-800 dark:bg-gray-950 dark:text-white"
                  placeholder="e.g. Soy Wax"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300">Category</label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="mt-1 w-full rounded-xl border border-gray-200 p-2.5 text-sm dark:border-gray-800 dark:bg-gray-950 dark:text-white"
                  >
                    <option value="WAX">Wax</option>
                    <option value="COLOR">Color Dye</option>
                    <option value="FRAGRANCE">Fragrance Oil</option>
                    <option value="CONTAINER">Container</option>
                    <option value="WICK">Wick</option>
                    <option value="BOX">Packaging Box</option>
                    <option value="LABEL">Label</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300">Unit</label>
                  <input
                    type="text"
                    value={formData.unit}
                    onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                    className="mt-1 w-full rounded-xl border border-gray-200 p-2.5 text-sm dark:border-gray-800 dark:bg-gray-950 dark:text-white"
                    placeholder="KG / PCS / LTR"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs text-gray-600">Stock</label>
                  <input
                    type="number"
                    value={formData.currentStock}
                    onChange={(e) => setFormData({ ...formData, currentStock: Number(e.target.value) })}
                    className="mt-1 w-full rounded-xl border border-gray-200 p-2 text-sm dark:border-gray-800 dark:bg-gray-950"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-600">Reorder</label>
                  <input
                    type="number"
                    value={formData.reorderLevel}
                    onChange={(e) => setFormData({ ...formData, reorderLevel: Number(e.target.value) })}
                    className="mt-1 w-full rounded-xl border border-gray-200 p-2 text-sm dark:border-gray-800 dark:bg-gray-950"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-600">Unit Cost (₹)</label>
                  <input
                    type="number"
                    value={formData.unitCost}
                    onChange={(e) => setFormData({ ...formData, unitCost: Number(e.target.value) })}
                    className="mt-1 w-full rounded-xl border border-gray-200 p-2 text-sm dark:border-gray-800 dark:bg-gray-950"
                  />
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
                  Save Material
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
