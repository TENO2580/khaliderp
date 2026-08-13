'use client';

import { useState, useEffect } from 'react';
import { Scale, Package, Battery, Save, Search, Plus, FileSpreadsheet, Edit, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import Link from 'next/link';
import api from '@/lib/api';

export default function MobilePricing() {
  const [profile, setProfile] = useState<any>(null);
  const [products, setProducts] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [search, setSearch] = useState('');
  
  // Create Product Modal State
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newProduct, setNewProduct] = useState({
    name: '',
    category: 'CANDLES',
    weightKg: 0,
    qty: 1,
    sellingPrice: 0,
    mrp: 0,
    regionalPrice: 0,
    prodCostPerKg: '' // Optional override
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [profileRes, productsRes] = await Promise.all([
        api.get('/pricing'),
        api.get('/products?limit=100') // Fetching all for now
      ]);
      
      setProfile(profileRes.data.data);
      setProducts(productsRes.data.data.products);
    } catch (error) {
      toast.error('Failed to fetch pricing data');
    } finally {
      setIsLoading(false);
    }
  };

  const handleBaseCostChange = (field: string, value: string) => {
    setProfile({ ...profile, [field]: value === '' ? '' : Number(value) });
  };

  const handleSaveProfile = async () => {
    setIsSaving(true);
    try {
      await api.put('/pricing', profile);
      toast.success('Global pricing updated & products recalculated!');
      fetchData(); // Refresh everything
    } catch (error) {
      toast.error('Failed to save profile');
    } finally {
      setIsSaving(false);
    }
  };

  const handleCreateProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/products', newProduct);
      toast.success('Product created successfully!');
      setShowCreateModal(false);
      fetchData();
    } catch (error) {
      toast.error('Failed to create product');
    }
  };

  const handleDeleteProduct = async (id: string) => {
    if (!confirm('Are you sure you want to delete this product?')) return;
    try {
      await api.delete(`/products/${id}`);
      toast.success('Product deleted');
      setProducts(products.filter(p => p.id !== id));
    } catch (error) {
      toast.error('Failed to delete product');
    }
  };

  if (isLoading || !profile) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const totalCostPerKg = 
    Number(profile.waxCost || 0) + 
    Number(profile.otherMaterials || 0) + 
    Number(profile.labourCost || 0) + 
    Number(profile.electricityCost || 0) + 
    Number(profile.energyCost || 0) + 
    Number(profile.transportCost || 0);

  const totalVariantCostPerKg = totalCostPerKg + Number(profile.packagingOverhead || 0);
  const profitMarginPerKg = Number(profile.sellingPrice || 0) - totalVariantCostPerKg;
  const profitMarginPercent = Number(profile.sellingPrice || 0) > 0 ? (profitMarginPerKg / Number(profile.sellingPrice)) * 100 : 0;

  const filteredProducts = products.filter(p => p.name.toLowerCase().includes(search.toLowerCase()) || p.category?.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between bg-white dark:bg-gray-900 p-6 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-sm">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Unit Economics & Pricing Engine</h1>
          <p className="text-sm text-gray-500 mt-1">Manage global 1 KG costs and product-specific economics</p>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
        
        {/* Left Column: Global Costing Profile & Live Stock */}
        <div className="xl:col-span-1 space-y-6">
          <div className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-gray-900 shadow-sm">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                <Scale className="h-5 w-5 text-blue-500" />
                1 KG Global Costs
              </h2>
              <button
                onClick={handleSaveProfile}
                disabled={isSaving}
                className="p-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors"
                title="Save & Recalculate All"
              >
                <Save className="h-4 w-4" />
              </button>
            </div>
            
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300">Wax Cost (₹)</label>
                  <input type="number" step="any" value={profile.waxCost} onChange={(e) => handleBaseCostChange('waxCost', e.target.value)} className="mt-1 w-full rounded-xl border border-gray-200 p-2 text-sm dark:border-gray-800 dark:bg-gray-950" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300">Other Mat. (₹)</label>
                  <input type="number" step="any" value={profile.otherMaterials} onChange={(e) => handleBaseCostChange('otherMaterials', e.target.value)} className="mt-1 w-full rounded-xl border border-gray-200 p-2 text-sm dark:border-gray-800 dark:bg-gray-950" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300">Labour (₹)</label>
                  <input type="number" step="any" value={profile.labourCost} onChange={(e) => handleBaseCostChange('labourCost', e.target.value)} className="mt-1 w-full rounded-xl border border-gray-200 p-2 text-sm dark:border-gray-800 dark:bg-gray-950" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300">Electricity (₹)</label>
                  <input type="number" step="any" value={profile.electricityCost} onChange={(e) => handleBaseCostChange('electricityCost', e.target.value)} className="mt-1 w-full rounded-xl border border-gray-200 p-2 text-sm dark:border-gray-800 dark:bg-gray-950" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300">Energy (₹)</label>
                  <input type="number" step="any" value={profile.energyCost} onChange={(e) => handleBaseCostChange('energyCost', e.target.value)} className="mt-1 w-full rounded-xl border border-gray-200 p-2 text-sm dark:border-gray-800 dark:bg-gray-950" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300">Transport (₹)</label>
                  <input type="number" step="any" value={profile.transportCost} onChange={(e) => handleBaseCostChange('transportCost', e.target.value)} className="mt-1 w-full rounded-xl border border-gray-200 p-2 text-sm dark:border-gray-800 dark:bg-gray-950" />
                </div>
                <div className="col-span-2">
                  <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300">Pkg. Overhead (₹/KG)</label>
                  <input type="number" step="any" value={profile.packagingOverhead} onChange={(e) => handleBaseCostChange('packagingOverhead', e.target.value)} className="mt-1 w-full rounded-xl border border-gray-200 p-2 text-sm dark:border-gray-800 dark:bg-gray-950" />
                </div>
              </div>

              <div className="pt-4 border-t border-gray-100 dark:border-gray-800">
                <div className="flex justify-between items-center py-2">
                  <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">Total Cost per KG</span>
                  <span className="text-sm font-bold text-gray-900 dark:text-white">₹{totalCostPerKg.toFixed(2)}</span>
                </div>
                <div className="flex justify-between items-center py-2">
                  <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">Bulk Selling Price/KG</span>
                  <input type="number" step="any" value={profile.sellingPrice} onChange={(e) => handleBaseCostChange('sellingPrice', e.target.value)} className="w-24 text-right font-bold rounded-xl border border-gray-200 p-1.5 text-sm dark:border-gray-800 dark:bg-gray-950" />
                </div>
              </div>
            </div>
          </div>
          
          <div className="rounded-2xl border border-gray-200 bg-gradient-to-br from-indigo-50 to-blue-50 p-6 dark:border-gray-800 dark:bg-gradient-to-br dark:from-gray-900 dark:to-indigo-950/20 shadow-sm">
             <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <Battery className="h-5 w-5 text-indigo-500" />
              Live Stock Level Summary
            </h2>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Wax Stock (Raw)</span>
                <span className="text-base font-bold text-gray-900 dark:text-white">1425.00 KG</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Candle Stock (Finished)</span>
                <span className="text-base font-bold text-gray-900 dark:text-white">44.30 KG</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Product List */}
        <div className="xl:col-span-3 space-y-6">
          <div className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-gray-900 shadow-sm">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
              <h2 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                <Package className="h-5 w-5 text-green-500" />
                Dynamic Products
              </h2>
              <div className="flex gap-3">
                <div className="relative w-64">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search products..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="w-full pl-9 pr-4 py-2 text-sm rounded-xl border border-gray-200 dark:border-gray-800 dark:bg-gray-950 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <button
                  onClick={() => setShowCreateModal(true)}
                  className="flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 transition-colors"
                >
                  <Plus className="h-4 w-4" />
                  New Product
                </button>
              </div>
            </div>
            
            <div className="overflow-x-auto rounded-xl border border-gray-200 dark:border-gray-800">
              <table className="w-full text-left text-sm whitespace-nowrap">
                <thead className="bg-gray-50 dark:bg-gray-800/50 text-gray-600 dark:text-gray-400 border-b border-gray-200 dark:border-gray-800">
                  <tr>
                    <th className="px-4 py-3 font-semibold">Product Name</th>
                    <th className="px-4 py-3 font-semibold text-center">Category</th>
                    <th className="px-4 py-3 font-semibold text-center">Weight</th>
                    <th className="px-4 py-3 font-semibold text-right">Prod Cost</th>
                    <th className="px-4 py-3 font-semibold text-right">Selling Price</th>
                    <th className="px-4 py-3 font-semibold text-right">Margin (₹)</th>
                    <th className="px-4 py-3 font-semibold text-right">Margin (%)</th>
                    <th className="px-4 py-3 font-semibold text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                  {filteredProducts.map((p) => (
                    <tr key={p.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                      <td className="px-4 py-3 font-medium text-gray-900 dark:text-white">{p.name}</td>
                      <td className="px-4 py-3 text-center text-gray-500">
                        <span className="px-2 py-1 rounded-md bg-gray-100 dark:bg-gray-800 text-xs font-medium">
                          {p.category}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center">{p.weightKg * p.qty} KG</td>
                      <td className="px-4 py-3 text-right text-gray-500">₹{p.totalProdCost.toFixed(2)}</td>
                      <td className="px-4 py-3 text-right font-semibold text-gray-900 dark:text-white">₹{p.sellingPrice.toFixed(2)}</td>
                      <td className={`px-4 py-3 text-right font-bold ${p.marginAmt >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                        ₹{p.marginAmt.toFixed(2)}
                      </td>
                      <td className={`px-4 py-3 text-right font-bold ${p.marginPct >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                        {p.marginPct.toFixed(2)}%
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-center gap-2">
                          <Link href={`/dashboard/pricing/${p.id}`} className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
                            <Edit className="h-4 w-4" />
                          </Link>
                          <button onClick={() => handleDeleteProduct(p.id)} className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {filteredProducts.length === 0 && (
                    <tr>
                      <td colSpan={8} className="px-4 py-8 text-center text-gray-500">No products found.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      {/* Create Product Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white dark:bg-gray-900 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl border border-gray-200 dark:border-gray-800">
            <div className="p-6 border-b border-gray-100 dark:border-gray-800 flex justify-between items-center bg-gray-50/50 dark:bg-gray-800/20">
              <h2 className="text-lg font-bold">Create New Product</h2>
              <button onClick={() => setShowCreateModal(false)} className="text-gray-500 hover:text-gray-700">✕</button>
            </div>
            <form onSubmit={handleCreateProduct} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Product Name *</label>
                <input required type="text" value={newProduct.name} onChange={e => setNewProduct({...newProduct, name: e.target.value})} className="w-full rounded-xl border border-gray-200 p-2.5 text-sm dark:border-gray-800 dark:bg-gray-950" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Category</label>
                  <select value={newProduct.category} onChange={e => setNewProduct({...newProduct, category: e.target.value})} className="w-full rounded-xl border border-gray-200 p-2.5 text-sm dark:border-gray-800 dark:bg-gray-950">
                    <option value="CANDLES">CANDLES</option>
                    <option value="RS_CASE">RS_CASE</option>
                    <option value="RAW_MATERIAL">RAW_MATERIAL</option>
                    <option value="OTHER">OTHER</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Selling Price (₹) *</label>
                  <input required type="number" step="any" value={newProduct.sellingPrice || ''} onChange={e => setNewProduct({...newProduct, sellingPrice: Number(e.target.value)})} className="w-full rounded-xl border border-gray-200 p-2.5 text-sm dark:border-gray-800 dark:bg-gray-950" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Unit Weight (KG) *</label>
                  <input required type="number" step="any" value={newProduct.weightKg || ''} onChange={e => setNewProduct({...newProduct, weightKg: Number(e.target.value)})} className="w-full rounded-xl border border-gray-200 p-2.5 text-sm dark:border-gray-800 dark:bg-gray-950" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Quantity in Case *</label>
                  <input required type="number" step="any" value={newProduct.qty || ''} onChange={e => setNewProduct({...newProduct, qty: Number(e.target.value)})} className="w-full rounded-xl border border-gray-200 p-2.5 text-sm dark:border-gray-800 dark:bg-gray-950" />
                </div>
              </div>
              <div className="pt-4 flex justify-end gap-3">
                <button type="button" onClick={() => setShowCreateModal(false)} className="px-4 py-2 rounded-xl text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800 transition-colors">
                  Cancel
                </button>
                <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors">
                  Create Product
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
