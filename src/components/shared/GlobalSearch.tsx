'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Search, X, Users, Package, ShoppingCart, Factory, UserCog, Receipt } from 'lucide-react';
import api from '@/lib/api';

interface GlobalSearchProps {
  open: boolean;
  onClose: () => void;
}

export default function GlobalSearch({ open, onClose }: GlobalSearchProps) {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<{
    customers: any[];
    salesOrders: any[];
    batches: any[];
  }>({ customers: [], salesOrders: [], batches: [] });
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!query.trim() || query.length < 2) {
      setResults({ customers: [], salesOrders: [], batches: [] });
      return;
    }

    const timer = setTimeout(async () => {
      setIsLoading(true);
      try {
        const [cRes, sRes, bRes] = await Promise.all([
          api.get(`/customers?search=${encodeURIComponent(query)}&limit=3`),
          api.get(`/sales?search=${encodeURIComponent(query)}&limit=3`),
          api.get(`/production/batches/list?search=${encodeURIComponent(query)}&limit=3`),
        ]);

        setResults({
          customers: cRes.data.data.data || [],
          salesOrders: sRes.data.data.data || [],
          batches: bRes.data.data.data || [],
        });
      } catch {
        // Ignore
      } finally {
        setIsLoading(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [query]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 backdrop-blur-sm bg-black/40 p-4">
      <div className="w-full max-w-xl rounded-2xl border border-gray-200 bg-white shadow-2xl dark:border-gray-800 dark:bg-gray-900 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        <div className="flex items-center border-b border-gray-200 px-4 py-3 dark:border-gray-800">
          <Search className="h-5 w-5 text-gray-400 mr-3" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search customers, orders, batches..."
            className="flex-1 bg-transparent text-sm text-gray-900 placeholder-gray-400 focus:outline-none dark:text-white"
            autoFocus
          />
          <button onClick={onClose} className="p-1 text-gray-400 hover:text-gray-600 rounded-lg">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="max-h-96 overflow-y-auto p-4 space-y-4">
          {isLoading && <p className="text-center text-xs text-gray-400 py-4">Searching ERP database...</p>}

          {!isLoading && query.length >= 2 && (
            <>
              {results.customers.length > 0 && (
                <div>
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-2 flex items-center gap-1.5">
                    <Users className="h-3.5 w-3.5" /> Customers
                  </h4>
                  <div className="space-y-1">
                    {results.customers.map((c) => (
                      <div
                        key={c.id}
                        onClick={() => {
                          router.push(`/dashboard/customers`);
                          onClose();
                        }}
                        className="flex justify-between items-center p-2.5 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 cursor-pointer text-sm"
                      >
                        <div>
                          <p className="font-semibold text-gray-900 dark:text-white">{c.name}</p>
                          <p className="text-xs text-gray-500">{c.customerId} • {c.phone || 'No phone'}</p>
                        </div>
                        <span className="text-xs text-blue-600 font-medium">View →</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {results.salesOrders.length > 0 && (
                <div>
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-2 flex items-center gap-1.5">
                    <ShoppingCart className="h-3.5 w-3.5" /> Sales Orders
                  </h4>
                  <div className="space-y-1">
                    {results.salesOrders.map((o) => (
                      <div
                        key={o.id}
                        onClick={() => {
                          router.push(`/dashboard/sales`);
                          onClose();
                        }}
                        className="flex justify-between items-center p-2.5 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 cursor-pointer text-sm"
                      >
                        <div>
                          <p className="font-semibold text-gray-900 dark:text-white">{o.orderNumber}</p>
                          <p className="text-xs text-gray-500">{o.customer?.name} • ₹{o.totalAmount}</p>
                        </div>
                        <span className="text-xs text-blue-600 font-medium">View →</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {results.batches.length > 0 && (
                <div>
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-2 flex items-center gap-1.5">
                    <Factory className="h-3.5 w-3.5" /> Batches
                  </h4>
                  <div className="space-y-1">
                    {results.batches.map((b) => (
                      <div
                        key={b.id}
                        onClick={() => {
                          router.push(`/dashboard/batches`);
                          onClose();
                        }}
                        className="flex justify-between items-center p-2.5 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 cursor-pointer text-sm"
                      >
                        <div>
                          <p className="font-semibold text-gray-900 dark:text-white">{b.batchNumber}</p>
                          <p className="text-xs text-gray-500">Produced: {b.producedQty} KG</p>
                        </div>
                        <span className="text-xs text-blue-600 font-medium">View →</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {results.customers.length === 0 && results.salesOrders.length === 0 && results.batches.length === 0 && (
                <p className="text-center text-xs text-gray-400 py-6">No matching records found.</p>
              )}
            </>
          )}

          {!query && (
            <div className="text-center py-8 text-gray-400">
              <p className="text-xs">Type a customer name, order #, or batch # to search globally across the ERP.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
