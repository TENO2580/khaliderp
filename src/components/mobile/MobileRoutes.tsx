'use client';

import React, { useState } from 'react';
import useSWR from 'swr';
import api from '@/lib/api';
import { formatCurrency } from '@/lib/utils';
import { MapPin, Users, IndianRupee, ArrowLeft, ChevronRight, Store, Search, LayoutGrid, Table } from 'lucide-react';
import DataTable, { Column } from '@/components/shared/DataTable';
import StatusBadge from '@/components/shared/StatusBadge';
import { useViewMode } from '@/hooks/useViewMode';
import MobileFilterBar from './MobileFilterBar';
import MobilePagination from './MobilePagination';

const fetcher = (url: string) => api.get(url).then(res => res.data.data);
const paginationFetcher = (url: string) => api.get(url).then(res => res.data);

export default function MobileRoutes() {
  const { viewMode, toggleViewMode } = useViewMode();
  const [selectedRoute, setSelectedRoute] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);

  // Fetch summary of all routes
  const { data: routes, isLoading: loadingRoutes } = useSWR('/routes', fetcher);

  // Fetch customers for the selected route
  const { data: routeCustomersData, isLoading: loadingCustomers } = useSWR(
    selectedRoute ? `/customers?route=${encodeURIComponent(selectedRoute)}&page=${page}&limit=${limit}&search=${encodeURIComponent(search)}` : null,
    paginationFetcher
  );

  const customers = routeCustomersData?.data?.data || routeCustomersData?.data || [];
  const totalPages = routeCustomersData?.pagination?.totalPages || 1;
  const totalItems = routeCustomersData?.pagination?.total || 0;

  if (selectedRoute) {
    // Route Detail View
    const columns: Column<any>[] = [
      {
        header: 'Shop Name',
        cell: (c) => (
          <div>
            <div className="font-semibold text-gray-900 dark:text-white">{c.name}</div>
            <div className="text-xs text-gray-500">{c.customerId}</div>
          </div>
        ),
      },
      {
        header: 'Owner / Contact',
        cell: (c) => (
          <div>
            <div className="text-sm text-gray-900 dark:text-white">{c.ownerName || 'N/A'}</div>
            <div className="text-xs text-gray-500">{c.phone || 'N/A'}</div>
          </div>
        ),
      },
      {
        header: 'Outstanding',
        cell: (c) => (
          <span className={`font-bold ${c.outstanding > 0 ? 'text-red-600 dark:text-red-400' : 'text-green-600 dark:text-green-400'}`}>
            {formatCurrency(c.outstanding || 0)}
          </span>
        ),
      },
      {
        header: 'Last Purchase',
        cell: (c) => (
          <span className="text-sm text-gray-600 dark:text-gray-300">
            {c.lastPurchaseDate ? new Date(c.lastPurchaseDate).toLocaleDateString('en-IN') : 'Never'}
          </span>
        ),
      },
      {
        header: 'Status',
        cell: (c) => <StatusBadge status={c.status} />,
      }
    ];

    return (
      <div className="space-y-6 pb-20">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setSelectedRoute(null)}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-5 h-5 text-gray-600 dark:text-gray-400" />
            </button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                <MapPin className="w-6 h-6 text-blue-500" />
                Route: {selectedRoute}
              </h1>
              <p className="text-sm text-gray-500 mt-1">Field Observation & Route Sales Tracking</p>
            </div>
          </div>
          <button
            onClick={toggleViewMode}
            className="rounded-xl bg-white p-2 text-gray-600 shadow-sm border border-gray-200 active:bg-gray-50 dark:border-gray-800 dark:bg-gray-900 dark:text-gray-300 dark:active:bg-gray-800"
          >
            {viewMode === 'card' ? <Table className="h-5 w-5" /> : <LayoutGrid className="h-5 w-5" />}
          </button>
        </div>

        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-6 shadow-sm mb-4">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-xl">
              <Store className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500 uppercase tracking-wider">Total Shops</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{customers.length}</p>
            </div>
          </div>
        </div>

        <MobileFilterBar
          search={search}
          onSearchChange={setSearch}
          searchPlaceholder="Search customers in route..."
        />

        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-6 shadow-sm">
          <div className="mt-6">
            {viewMode === 'table' ? (
              <div className="overflow-hidden rounded-xl border border-gray-200 dark:border-gray-800">
                <DataTable 
                  columns={columns} 
                  data={customers} 
                  hideToolbar={true} 
                  totalItems={totalItems}
                  page={page}
                  totalPages={totalPages}
                  onPageChange={setPage}
                  limit={limit}
                  onLimitChange={setLimit}
                />
              </div>
            ) : (
              <div className="space-y-4">
                {customers.length === 0 && !loadingCustomers && (
                  <div className="text-center py-10 text-gray-500">No shops found in this route.</div>
                )}
                {customers.map((c: any) => (
                  <div key={c.id} className="bg-white dark:bg-gray-900 rounded-xl p-4 shadow-sm border border-gray-200 dark:border-gray-800">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <div className="font-semibold text-gray-900 dark:text-white">{c.name}</div>
                        <div className="text-xs text-gray-500">{c.customerId}</div>
                      </div>
                      <StatusBadge status={c.status} />
                    </div>
                    <div className="text-xs text-gray-600 dark:text-gray-300 mb-3">
                      {c.ownerName || 'N/A'} • {c.phone || 'N/A'}
                    </div>
                    <div className="flex justify-between items-center pt-3 border-t border-gray-100 dark:border-gray-800">
                      <div>
                        <div className="text-[10px] text-gray-500 uppercase">Outstanding</div>
                        <span className={`font-bold ${c.outstanding > 0 ? 'text-red-600 dark:text-red-400' : 'text-green-600 dark:text-green-400'}`}>
                          {formatCurrency(c.outstanding || 0)}
                        </span>
                      </div>
                      <div className="text-right">
                        <div className="text-[10px] text-gray-500 uppercase">Last Purchase</div>
                        <span className="text-sm text-gray-600 dark:text-gray-300">
                          {c.lastPurchaseDate ? new Date(c.lastPurchaseDate).toLocaleDateString('en-IN') : 'Never'}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
                
                <MobilePagination
                  page={page}
                  totalPages={totalPages}
                  onPageChange={setPage}
                  totalItems={totalItems}
                />
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Routes List View
  return (
    <div className="space-y-6 pb-20">
      {/* Title section removed, handled by MobileTopBar */}

      {loadingRoutes ? (
        <div className="flex items-center justify-center h-64">
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {routes?.length === 0 && (
            <div className="col-span-full py-12 text-center text-gray-500 dark:text-gray-400 bg-white dark:bg-gray-900 rounded-2xl border border-dashed border-gray-200 dark:border-gray-800">
              <MapPin className="w-12 h-12 mx-auto mb-3 text-gray-300 dark:text-gray-700" />
              <p className="text-lg font-medium text-gray-900 dark:text-white">No Routes Found</p>
              <p className="text-sm mt-1">Assign routes to customers in the Customer Management page.</p>
            </div>
          )}
          
          {routes?.map((route: any) => (
            <div 
              key={route.name}
              onClick={() => {
                setSelectedRoute(route.name);
                setSearch('');
              }}
              className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-6 shadow-sm hover:shadow-md hover:border-blue-500 dark:hover:border-blue-500 transition-all cursor-pointer group"
            >
              <div className="flex justify-between items-start mb-4">
                <div className="p-3 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-xl">
                  <MapPin className="w-6 h-6" />
                </div>
                <div className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-50 dark:bg-gray-800 group-hover:bg-blue-50 dark:group-hover:bg-blue-900/30 group-hover:text-blue-600 transition-colors">
                  <ChevronRight className="w-5 h-5" />
                </div>
              </div>
              
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4 line-clamp-1">
                {route.name}
              </h3>
              
              <div className="grid grid-cols-2 gap-4 pt-4 border-t border-gray-100 dark:border-gray-800">
                <div>
                  <div className="text-xs text-gray-500 mb-1 flex items-center gap-1">
                    <Store className="w-3.5 h-3.5" />
                    Shops
                  </div>
                  <div className="font-semibold text-gray-900 dark:text-white">
                    {route.shopCount}
                  </div>
                </div>
                <div>
                  <div className="text-xs text-gray-500 mb-1 flex items-center gap-1">
                    <IndianRupee className="w-3.5 h-3.5" />
                    Outstanding
                  </div>
                  <div className="font-bold text-red-600 dark:text-red-400">
                    {formatCurrency(route.totalOutstanding)}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
