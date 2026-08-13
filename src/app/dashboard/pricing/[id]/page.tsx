'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Save, Package, TrendingUp, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import { calculateProductPricing } from '@/lib/pricing-engine';

export default function ProductPricingDetail({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [product, setProduct] = useState<any>(null);
  const [globalProfile, setGlobalProfile] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [prodRes, profRes] = await Promise.all([
          fetch(`/api/products/${params.id}`),
          fetch('/api/pricing')
        ]);
        
        if (prodRes.ok && profRes.ok) {
          const prodData = await prodRes.json();
          const profData = await profRes.json();
          setProduct(prodData.data);
          setGlobalProfile(profData.data);
        } else {
          toast.error('Failed to load data');
          router.push('/dashboard/pricing');
        }
      } catch (e) {
        toast.error('Error fetching data');
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, [params.id, router]);

  const handleChange = (field: string, value: string | number) => {
    let newVal: any = value;
    if (typeof value === 'string' && value !== '' && !isNaN(Number(value)) && field !== 'name' && field !== 'category' && field !== 'description' && field !== 'sku') {
      newVal = Number(value);
    }
    
    const updatedProduct = { ...product, [field]: newVal };
    
    // Recalculate margins on the fly if global profile exists
    if (globalProfile && typeof newVal === 'number' || newVal === '') {
      const calcs = calculateProductPricing(
        { ...updatedProduct, [field]: newVal === '' ? null : Number(newVal) }, 
        globalProfile
      );
      updatedProduct.totalProdCost = calcs.totalProdCost;
      updatedProduct.marginAmt = calcs.marginAmt;
      updatedProduct.marginPct = calcs.marginPct;
      updatedProduct.sellingCostPerKg = calcs.sellingCostPerKg;
    }
    
    setProduct(updatedProduct);
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const res = await fetch(`/api/products/${params.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(product),
      });

      if (!res.ok) throw new Error('Failed to save');
      toast.success('Product updated successfully!');
      router.push('/dashboard/pricing');
    } catch (e) {
      toast.error('Failed to save product');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading || !product) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const isProfitable = product.marginAmt >= 0;

  return (
    <div className="max-w-5xl mx-auto space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      
      {/* Header */}
      <div className="flex items-center justify-between bg-white dark:bg-gray-900 p-6 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-sm">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => router.push('/dashboard/pricing')}
            className="p-2 rounded-xl bg-gray-50 text-gray-600 hover:bg-gray-100 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700 transition-colors"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <Package className="h-6 w-6 text-blue-500" />
              {product.name}
            </h1>
            <p className="text-sm text-gray-500 mt-1">Product Pricing Engine</p>
          </div>
        </div>
        <button
          onClick={handleSave}
          disabled={isSaving}
          className="flex items-center gap-2 rounded-xl bg-blue-600 px-6 py-2.5 text-sm font-medium text-white shadow-sm hover:bg-blue-700 disabled:opacity-50 transition-colors"
        >
          <Save className="h-4 w-4" />
          {isSaving ? 'Saving...' : 'Save Product'}
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Product Inputs */}
        <div className="md:col-span-2 space-y-6">
          <div className="bg-white dark:bg-gray-900 p-6 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-sm">
            <h2 className="text-lg font-bold mb-4">Basic Information</h2>
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2 md:col-span-1">
                <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">Name</label>
                <input type="text" value={product.name} onChange={(e) => handleChange('name', e.target.value)} className="w-full rounded-xl border border-gray-200 p-2.5 dark:border-gray-800 dark:bg-gray-950" />
              </div>
              <div className="col-span-2 md:col-span-1">
                <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">Category</label>
                <select value={product.category || 'CANDLES'} onChange={(e) => handleChange('category', e.target.value)} className="w-full rounded-xl border border-gray-200 p-2.5 dark:border-gray-800 dark:bg-gray-950">
                  <option value="CANDLES">CANDLES</option>
                  <option value="RS_CASE">RS_CASE</option>
                  <option value="RAW_MATERIAL">RAW_MATERIAL</option>
                  <option value="OTHER">OTHER</option>
                </select>
              </div>
              <div className="col-span-2">
                <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">Description</label>
                <input type="text" value={product.description || ''} onChange={(e) => handleChange('description', e.target.value)} className="w-full rounded-xl border border-gray-200 p-2.5 dark:border-gray-800 dark:bg-gray-950" placeholder="Optional description..." />
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-900 p-6 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-sm">
            <h2 className="text-lg font-bold mb-4">Unit Economics Inputs</h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">Unit Weight (KG)</label>
                <input type="number" step="any" value={product.weightKg ?? ''} onChange={(e) => handleChange('weightKg', e.target.value)} className="w-full rounded-xl border border-gray-200 p-2.5 dark:border-gray-800 dark:bg-gray-950" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">Quantity in Case</label>
                <input type="number" step="any" value={product.qty ?? ''} onChange={(e) => handleChange('qty', e.target.value)} className="w-full rounded-xl border border-gray-200 p-2.5 dark:border-gray-800 dark:bg-gray-950" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300 flex items-center gap-1">
                  Prod Cost/KG Override
                  <span className="text-xs text-gray-400 font-normal">(Optional)</span>
                </label>
                <input type="number" step="any" value={product.prodCostPerKg ?? ''} onChange={(e) => handleChange('prodCostPerKg', e.target.value)} placeholder="Uses global cost if empty" className="w-full rounded-xl border border-gray-200 p-2.5 dark:border-gray-800 dark:bg-gray-950" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">Selling Price (₹)</label>
                <input type="number" step="any" value={product.sellingPrice ?? ''} onChange={(e) => handleChange('sellingPrice', e.target.value)} className="w-full rounded-xl border border-gray-200 p-2.5 dark:border-gray-800 dark:bg-gray-950" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">MRP (₹)</label>
                <input type="number" step="any" value={product.mrp ?? ''} onChange={(e) => handleChange('mrp', e.target.value)} className="w-full rounded-xl border border-gray-200 p-2.5 dark:border-gray-800 dark:bg-gray-950" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">Regional Price (Calicut) (₹)</label>
                <input type="number" step="any" value={product.regionalPrice ?? ''} onChange={(e) => handleChange('regionalPrice', e.target.value)} className="w-full rounded-xl border border-gray-200 p-2.5 dark:border-gray-800 dark:bg-gray-950" />
              </div>
            </div>
          </div>
        </div>

        {/* Live Calculation Output Widget */}
        <div className="md:col-span-1 space-y-6">
          <div className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-gray-900 dark:to-indigo-950/20 p-6 rounded-2xl border border-blue-100 dark:border-indigo-900 shadow-sm sticky top-6">
            <h2 className="text-lg font-bold mb-6 flex items-center gap-2 text-indigo-900 dark:text-indigo-100">
              <TrendingUp className="h-5 w-5" />
              Profitability Analysis
            </h2>

            <div className="space-y-5">
              <div className="flex justify-between items-center bg-white/50 dark:bg-black/20 p-3 rounded-xl">
                <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Weight</span>
                <span className="font-bold text-gray-900 dark:text-white">{(Number(product.weightKg) * Number(product.qty)).toFixed(3)} KG</span>
              </div>
              
              <div className="flex justify-between items-center bg-white/50 dark:bg-black/20 p-3 rounded-xl">
                <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Production Cost</span>
                <span className="font-bold text-gray-900 dark:text-white">₹{product.totalProdCost.toFixed(2)}</span>
              </div>

              <div className="h-px bg-blue-200 dark:bg-indigo-800/50 my-2"></div>

              <div className="flex justify-between items-center bg-white/50 dark:bg-black/20 p-3 rounded-xl">
                <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Selling Price</span>
                <span className="font-bold text-gray-900 dark:text-white">₹{Number(product.sellingPrice).toFixed(2)}</span>
              </div>

              <div className={`p-4 rounded-xl border ${isProfitable ? 'bg-emerald-50 border-emerald-200 dark:bg-emerald-950/30 dark:border-emerald-900/50' : 'bg-rose-50 border-rose-200 dark:bg-rose-950/30 dark:border-rose-900/50'}`}>
                <div className="flex justify-between items-center mb-1">
                  <span className={`text-sm font-bold ${isProfitable ? 'text-emerald-700 dark:text-emerald-400' : 'text-rose-700 dark:text-rose-400'}`}>
                    Net Profit (₹)
                  </span>
                  <span className={`text-xl font-black ${isProfitable ? 'text-emerald-700 dark:text-emerald-400' : 'text-rose-700 dark:text-rose-400'}`}>
                    {product.marginAmt >= 0 ? '+' : ''}₹{product.marginAmt.toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between items-center mt-2 pt-2 border-t border-black/5 dark:border-white/5">
                  <span className={`text-xs font-semibold ${isProfitable ? 'text-emerald-600 dark:text-emerald-500' : 'text-rose-600 dark:text-rose-500'}`}>
                    Profit Margin
                  </span>
                  <span className={`text-sm font-bold ${isProfitable ? 'text-emerald-600 dark:text-emerald-500' : 'text-rose-600 dark:text-rose-500'}`}>
                    {product.marginPct.toFixed(2)}%
                  </span>
                </div>
              </div>

              {!isProfitable && (
                <div className="flex items-start gap-2 p-3 bg-orange-50 dark:bg-orange-950/30 text-orange-700 dark:text-orange-400 text-xs font-medium rounded-xl border border-orange-200 dark:border-orange-900/50">
                  <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                  <p>This product is being sold at a loss based on current unit economics.</p>
                </div>
              )}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
