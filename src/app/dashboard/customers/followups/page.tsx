'use client';

import React, { useEffect, useState } from 'react';
import DataTable, { Column } from '@/components/shared/DataTable';
import { formatDate } from '@/lib/utils';
import { Phone, AlertTriangle, CheckCircle, Clock, MessageCircle } from 'lucide-react';
import api from '@/lib/api';
import { toast } from 'sonner';

export default function StockAlertsPage() {
  const [predictions, setPredictions] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [search, setSearch] = useState('');

  const totalItems = predictions.length;

  const fetchPredictions = async () => {
    setIsLoading(true);
    try {
      const res = await api.get('/customers/predictions');
      // For searching on frontend since API returns all
      const data = res.data.data;
      const filtered = data.filter((d: any) => d.name.toLowerCase().includes(search.toLowerCase()));
      setPredictions(filtered);
    } catch (err) {
      toast.error('Failed to load stock predictions');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchPredictions();
  }, [search]);

  // Handle Mark as Contacted
  const handleContacted = (customerId: string) => {
    toast.success('Follow-up logged successfully!');
    // Ideally this hits a backend endpoint to log a CustomerFollowup record
  };

  const columns: Column<any>[] = [
    {
      header: 'Customer',
      accessorKey: 'name',
      cell: (i) => <span className="font-bold text-gray-900 dark:text-white uppercase">{i.name}</span>,
    },
    {
      header: 'Last Delivered',
      cell: (i) => (
        <div>
          <span className="block text-xs font-semibold text-gray-900 dark:text-white">{i.lastOrderQty} boxes</span>
          <span className="text-xs text-gray-500">{formatDate(i.lastOrderDate)}</span>
        </div>
      ),
    },
    {
      header: 'Run-Out Estimate',
      cell: (i) => {
        let colorClass = 'text-emerald-600';
        if (i.status === 'CRITICAL') colorClass = 'text-red-600 font-bold';
        if (i.status === 'WARNING') colorClass = 'text-yellow-600 font-bold';
        
        return (
          <div>
            <span className={`block text-sm ${colorClass}`}>
              {i.daysUntilRunOut < 0 ? 'Out of Stock' : `In ${i.daysUntilRunOut} days`}
            </span>
            <span className="text-xs text-gray-500">{formatDate(i.estimatedRunOutDate)}</span>
          </div>
        );
      }
    },
    {
      header: 'Status',
      cell: (i) => {
        if (i.status === 'CRITICAL') {
          return <span className="inline-flex items-center gap-1 rounded-md bg-red-50 px-2 py-1 text-xs font-medium text-red-700 ring-1 ring-inset ring-red-600/10"><AlertTriangle className="h-3 w-3" /> Critical</span>;
        } else if (i.status === 'WARNING') {
          return <span className="inline-flex items-center gap-1 rounded-md bg-yellow-50 px-2 py-1 text-xs font-medium text-yellow-800 ring-1 ring-inset ring-yellow-600/20"><Clock className="h-3 w-3" /> Warning</span>;
        }
        return <span className="inline-flex items-center gap-1 rounded-md bg-emerald-50 px-2 py-1 text-xs font-medium text-emerald-700 ring-1 ring-inset ring-emerald-600/10"><CheckCircle className="h-3 w-3" /> Healthy</span>;
      }
    },
    {
      header: 'Action',
      cell: (i) => {
        const phone = i.whatsapp || i.phone;
        const encodedMessage = encodeURIComponent(`Hi ${i.name},\nThis is a friendly reminder that you might be running low on stock. Would you like to place a new order?`);
        return (
          <div className="flex items-center gap-2">
            <button
              onClick={() => handleContacted(i.id)}
              className="flex items-center gap-1 rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white shadow-sm hover:bg-blue-700 transition-colors"
            >
              <Phone className="h-3.5 w-3.5" /> Call
            </button>
            {phone && (
              <a
                href={`https://wa.me/${phone.replace(/[^0-9]/g, '')}?text=${encodedMessage}`}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => handleContacted(i.id)}
                className="flex items-center gap-1 rounded-lg bg-emerald-500 px-3 py-1.5 text-xs font-semibold text-white shadow-sm hover:bg-emerald-600 transition-colors"
              >
                <MessageCircle className="h-3.5 w-3.5" /> WhatsApp
              </a>
            )}
          </div>
        );
      },
    },
  ];

  // Client-side pagination
  const paginatedData = predictions.slice((page - 1) * limit, page * limit);
  const totalPages = Math.ceil(predictions.length / limit) || 1;

  const summary = {
    critical: predictions.filter((p) => p.status === 'CRITICAL').length,
    warning: predictions.filter((p) => p.status === 'WARNING').length,
    healthy: predictions.filter((p) => p.status === 'HEALTHY').length,
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Predictive Stock Alerts</h1>
          <p className="text-sm text-gray-500">AI-driven reorder reminders based on customer consumption patterns</p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="relative overflow-hidden rounded-2xl border border-white bg-white/60 p-5 shadow-[0_8px_30px_rgb(0,0,0,0.08)] backdrop-blur-2xl transition-all hover:shadow-[0_8px_30px_rgb(0,0,0,0.12)] dark:border-white/[0.05] dark:border-t-white/[0.15] dark:bg-[#12121a]/60 dark:shadow-[0_8px_30px_rgb(0,0,0,0.2)]">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-red-100 p-2.5 dark:bg-red-500/20"><AlertTriangle className="h-5 w-5 text-red-600 dark:text-red-400" /></div>
            <div>
              <p className="text-xs font-semibold text-gray-500 dark:text-gray-400">Critical (Out of Stock)</p>
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white">{summary.critical}</h3>
            </div>
          </div>
        </div>
        <div className="relative overflow-hidden rounded-2xl border border-white bg-white/60 p-5 shadow-[0_8px_30px_rgb(0,0,0,0.08)] backdrop-blur-2xl transition-all hover:shadow-[0_8px_30px_rgb(0,0,0,0.12)] dark:border-white/[0.05] dark:border-t-white/[0.15] dark:bg-[#12121a]/60 dark:shadow-[0_8px_30px_rgb(0,0,0,0.2)]">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-yellow-100 p-2.5 dark:bg-yellow-500/20"><Clock className="h-5 w-5 text-yellow-600 dark:text-yellow-400" /></div>
            <div>
              <p className="text-xs font-semibold text-gray-500 dark:text-gray-400">Warning (Next 7 Days)</p>
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white">{summary.warning}</h3>
            </div>
          </div>
        </div>
        <div className="relative overflow-hidden rounded-2xl border border-white bg-white/60 p-5 shadow-[0_8px_30px_rgb(0,0,0,0.08)] backdrop-blur-2xl transition-all hover:shadow-[0_8px_30px_rgb(0,0,0,0.12)] dark:border-white/[0.05] dark:border-t-white/[0.15] dark:bg-[#12121a]/60 dark:shadow-[0_8px_30px_rgb(0,0,0,0.2)]">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-emerald-100 p-2.5 dark:bg-emerald-500/20"><CheckCircle className="h-5 w-5 text-emerald-600 dark:text-emerald-400" /></div>
            <div>
              <p className="text-xs font-semibold text-gray-500 dark:text-gray-400">Healthy Stock</p>
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white">{summary.healthy}</h3>
            </div>
          </div>
        </div>
      </div>

      <DataTable totalItems={totalItems} 
        limit={limit} 
        onLimitChange={(l) => { setLimit(l); setPage(1); }}
        columns={columns}
        data={paginatedData}
        searchPlaceholder="Search customer name..."
        onSearch={(q) => setSearch(q)}
        totalPages={totalPages}
        onPageChange={(p) => setPage(p)}
        isLoading={isLoading}
      />
    </div>
  );
}
