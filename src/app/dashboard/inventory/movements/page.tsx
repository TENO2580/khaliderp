'use client';

import React, { useEffect, useState } from 'react';
import DataTable, { Column } from '@/components/shared/DataTable';
import StatusBadge from '@/components/shared/StatusBadge';
import { formatCurrency, formatDate, formatNumber } from '@/lib/utils';
import { ArrowUpRight, ArrowDownRight, Layers } from 'lucide-react';

export default function StockMovementsPage() {
  const [movements, setMovements] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');

  const fetchData = async () => {
    setIsLoading(false);
    setMovements([
      {
        id: '1',
        date: new Date().toISOString(),
        itemName: 'Paraffin Wax',
        category: 'Raw Material',
        type: 'PRODUCTION_OUT',
        quantity: -100,
        unit: 'KG',
        reference: 'Production Run #PROD-2026-0001',
        operator: 'Admin',
      },
      {
        id: '2',
        date: new Date().toISOString(),
        itemName: 'Lavender Soy Candle 200g',
        category: 'Finished Goods',
        type: 'PRODUCTION_IN',
        quantity: +100,
        unit: 'PCS',
        reference: 'Production Output #PROD-2026-0001',
        operator: 'Admin',
      },
      {
        id: '3',
        date: new Date().toISOString(),
        itemName: 'Lavender Soy Candle 200g',
        category: 'Finished Goods',
        type: 'SALES_OUT',
        quantity: -20,
        unit: 'PCS',
        reference: 'Sales Order #SO-2026-0001',
        operator: 'Sales Exec',
      },
    ]);
  };

  useEffect(() => {
    fetchData();
  }, [search]);

  const columns: Column<any>[] = [
    {
      header: 'Date & Time',
      cell: (m) => <span className="text-xs text-gray-500">{formatDate(m.date)}</span>,
    },
    {
      header: 'Item Name',
      cell: (m) => (
        <div>
          <p className="font-semibold text-gray-900 dark:text-white">{m.itemName}</p>
          <p className="text-xs text-gray-500">{m.category}</p>
        </div>
      ),
    },
    {
      header: 'Movement Type',
      accessorKey: 'type',
      cell: (m) => <StatusBadge status={m.type} />,
    },
    {
      header: 'Quantity',
      cell: (m) => (
        <span className={`font-bold ${m.quantity > 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
          {m.quantity > 0 ? `+${m.quantity}` : m.quantity} {m.unit}
        </span>
      ),
    },
    {
      header: 'Reference',
      cell: (m) => <span className="font-mono text-xs text-gray-600 dark:text-gray-400">{m.reference}</span>,
    },
    {
      header: 'Operator',
      cell: (m) => <span className="text-xs text-gray-500">{m.operator}</span>,
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Stock Movements & Audit Log</h1>
          <p className="text-sm text-gray-500">Full inventory audit trail for raw material consumption and finished goods sales</p>
        </div>
      </div>

      <DataTable
        columns={columns}
        data={movements}
        searchPlaceholder="Search movement item or reference..."
        onSearch={(q) => setSearch(q)}
        isLoading={isLoading}
      />
    </div>
  );
}
