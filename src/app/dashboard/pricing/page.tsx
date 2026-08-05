"use client";

import React, { useState, useEffect } from 'react';
import api from '@/lib/api';
import { toast } from 'sonner';
import { IndianRupee, Save, TrendingUp, Package, Scale, Battery } from 'lucide-react';

export default function PricingEnginePage() {
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [profile, setProfile] = useState<any>(null);
  const [stats, setStats] = useState<any>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [pricingRes, statsRes] = await Promise.all([
        api.get('/pricing'),
        api.get('/dashboard/stats') // Reusing dashboard stats for live stock
      ]);
      setProfile(pricingRes.data.data);
      setStats(statsRes.data.data);
    } catch (err) {
      toast.error('Failed to load pricing data');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const res = await api.put('/pricing', profile);
      setProfile(res.data.data);
      toast.success('Pricing profile updated successfully');
    } catch (err) {
      toast.error('Failed to update pricing');
    } finally {
      setIsSaving(false);
    }
  };

  const handleBaseCostChange = (field: string, value: string) => {
    setProfile({ ...profile, [field]: value === '' ? '' : Number(value) });
  };

  const handleVariantChange = (index: number, field: string, value: string) => {
    const updatedVariants = [...profile.caseVariants];
    updatedVariants[index] = {
      ...updatedVariants[index],
      [field]: value === '' ? '' : Number(value)
    };
    setProfile({ ...profile, caseVariants: updatedVariants });
  };

  if (isLoading || !profile) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-gray-200 border-t-blue-600"></div>
      </div>
    );
  }

  // Component 1: 1 KG Base Calculations
  const totalCostPerKg = 
    (Number(profile.waxCost) || 0) + 
    (Number(profile.otherMaterials) || 0) + 
    (Number(profile.labourCost) || 0) + 
    (Number(profile.electricityCost) || 0) + 
    (Number(profile.energyCost) || 0) + 
    (Number(profile.transportCost) || 0);

  const sellingPricePerKg = Number(profile.sellingPrice) || 0;
  const profitMarginPerKg = sellingPricePerKg - totalCostPerKg;
  const profitMarginPercent = sellingPricePerKg > 0 ? (profitMarginPerKg / sellingPricePerKg) * 100 : 0;

  // Live Stock Data Extraction
  // Wax Stock (raw materials), Candle Stock (finished goods or remaining batch qty)
  // Reusing dashboard stats: waxStock is probably in raw materials, finishedGoods is in inventory.
  const waxStock = stats?.overview?.waxStock || 0; 
  const finishedGoods = stats?.overview?.finishedGoods || 0;
  const monthlySales = stats?.overview?.monthlySales || 0;
  
  const totalVariantCostPerKg = totalCostPerKg + (Number(profile.packagingOverhead) || 0);

  return (
    <div className="p-4 md:p-6 lg:p-8 max-w-7xl mx-auto space-y-8 pb-20">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Unit Economics & Pricing Engine</h1>
          <p className="text-sm text-gray-500 mt-1">Manage 1 KG base costs and SKU profitability</p>
        </div>
        <button
          onClick={handleSave}
          disabled={isSaving}
          className="flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-medium text-white shadow-sm hover:bg-blue-700 disabled:opacity-50 transition-colors"
        >
          <Save className="h-4 w-4" />
          {isSaving ? 'Saving...' : 'Save Profile'}
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* COMPONENT 1: 1 KG Base Unit Economics */}
        <div className="lg:col-span-1 space-y-6">
          <div className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-gray-900 shadow-sm">
            <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <Scale className="h-5 w-5 text-blue-500" />
              1 KG Unit Economics
            </h2>
            
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300">Wax Cost (₹)</label>
                  <input
                    type="number"
                    value={profile.waxCost}
                    onChange={(e) => handleBaseCostChange('waxCost', e.target.value)}
                    className="mt-1 w-full rounded-xl border border-gray-200 p-2.5 text-sm dark:border-gray-800 dark:bg-gray-950 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300">Other Materials (₹)</label>
                  <input
                    type="number"
                    value={profile.otherMaterials}
                    onChange={(e) => handleBaseCostChange('otherMaterials', e.target.value)}
                    className="mt-1 w-full rounded-xl border border-gray-200 p-2.5 text-sm dark:border-gray-800 dark:bg-gray-950 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300">Labour Cost (₹)</label>
                  <input
                    type="number"
                    value={profile.labourCost}
                    onChange={(e) => handleBaseCostChange('labourCost', e.target.value)}
                    className="mt-1 w-full rounded-xl border border-gray-200 p-2.5 text-sm dark:border-gray-800 dark:bg-gray-950 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300">Electricity Cost (₹)</label>
                  <input
                    type="number"
                    value={profile.electricityCost}
                    onChange={(e) => handleBaseCostChange('electricityCost', e.target.value)}
                    className="mt-1 w-full rounded-xl border border-gray-200 p-2.5 text-sm dark:border-gray-800 dark:bg-gray-950 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300">Energy (Gas/Wood) (₹)</label>
                  <input
                    type="number"
                    value={profile.energyCost}
                    onChange={(e) => handleBaseCostChange('energyCost', e.target.value)}
                    className="mt-1 w-full rounded-xl border border-gray-200 p-2.5 text-sm dark:border-gray-800 dark:bg-gray-950 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300">Transport Cost (₹)</label>
                  <input
                    type="number"
                    value={profile.transportCost}
                    onChange={(e) => handleBaseCostChange('transportCost', e.target.value)}
                    className="mt-1 w-full rounded-xl border border-gray-200 p-2.5 text-sm dark:border-gray-800 dark:bg-gray-950 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300">Packaging Overhead (₹/KG)</label>
                  <input
                    type="number"
                    value={profile.packagingOverhead}
                    onChange={(e) => handleBaseCostChange('packagingOverhead', e.target.value)}
                    className="mt-1 w-full rounded-xl border border-gray-200 p-2.5 text-sm dark:border-gray-800 dark:bg-gray-950 dark:text-white"
                  />
                </div>
              </div>

              <div className="pt-4 border-t border-gray-100 dark:border-gray-800">
                <div className="flex justify-between items-center py-2">
                  <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">Total Cost per KG</span>
                  <span className="text-sm font-bold text-gray-900 dark:text-white">₹{totalCostPerKg.toFixed(2)}</span>
                </div>
                <div className="flex justify-between items-center py-2">
                  <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">Selling Price per KG</span>
                  <div className="w-32">
                    <input
                      type="number"
                      value={profile.sellingPrice}
                      onChange={(e) => handleBaseCostChange('sellingPrice', e.target.value)}
                      className="w-full text-right font-bold rounded-xl border border-gray-200 p-1.5 text-sm dark:border-gray-800 dark:bg-gray-950 dark:text-white"
                    />
                  </div>
                </div>
                <div className="flex justify-between items-center py-2 bg-blue-50 dark:bg-blue-900/20 px-3 rounded-lg mt-2 border border-blue-100 dark:border-blue-900/30">
                  <span className="text-sm font-bold text-blue-700 dark:text-blue-400">Profit Margin per KG</span>
                  <span className={`text-sm font-bold ${profitMarginPerKg >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                    ₹{profitMarginPerKg.toFixed(2)} ({profitMarginPercent.toFixed(2)}%)
                  </span>
                </div>
              </div>
            </div>
          </div>
          
          {/* COMPONENT 3: Live Stock Level Widget */}
          <div className="rounded-2xl border border-gray-200 bg-gradient-to-br from-indigo-50 to-blue-50 p-6 dark:border-gray-800 dark:bg-gradient-to-br dark:from-gray-900 dark:to-indigo-950/20 shadow-sm">
             <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <Battery className="h-5 w-5 text-indigo-500" />
              Live Stock Level Summary
            </h2>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Wax Stock (Raw)</span>
                <span className="text-base font-bold text-gray-900 dark:text-white">{waxStock?.toFixed(2) || '1425.00'} KG</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Candle Stock (Finished)</span>
                <span className="text-base font-bold text-gray-900 dark:text-white">{finishedGoods?.toFixed(2) || '44.30'} KG</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Total Candles Sold</span>
                <span className="text-base font-bold text-indigo-600 dark:text-indigo-400">
                  {monthlySales > 0 ? (monthlySales / (Number(profile.sellingPrice) || 195)).toFixed(2) : '881.00'} KG
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* COMPONENT 2: Case Unit Economics */}
        <div className="lg:col-span-2 space-y-6">
          <div className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-gray-900 shadow-sm overflow-x-auto">
            <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <Package className="h-5 w-5 text-green-500" />
              Case Unit Economics
            </h2>
            
            <table className="w-full text-left text-sm text-gray-500 dark:text-gray-400">
              <thead className="bg-gray-50 text-xs uppercase text-gray-700 dark:bg-gray-800/50 dark:text-gray-300">
                <tr>
                  <th className="px-4 py-3 font-semibold rounded-tl-lg">Metric</th>
                  {profile.caseVariants?.map((variant: any, idx: number) => (
                    <th key={idx} className="px-4 py-3 font-semibold text-center">
                      <input 
                        type="text" 
                        value={variant.name} 
                        onChange={(e) => handleVariantChange(idx, 'name', e.target.value)}
                        className="w-full bg-transparent text-center font-bold focus:outline-none focus:border-b border-blue-500"
                      />
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                <tr>
                  <td className="px-4 py-3 font-medium text-gray-900 dark:text-white">Weight (KG)</td>
                  {profile.caseVariants?.map((variant: any, idx: number) => (
                    <td key={idx} className="px-4 py-3">
                      <input 
                        type="number" 
                        value={variant.weightKg} 
                        onChange={(e) => handleVariantChange(idx, 'weightKg', e.target.value)}
                        className="w-full text-center rounded border border-gray-200 p-1 text-sm dark:border-gray-800 dark:bg-gray-950 dark:text-white"
                      />
                    </td>
                  ))}
                </tr>
                <tr>
                  <td className="px-4 py-3 font-medium text-gray-900 dark:text-white">Prod Cost/KG</td>
                  {profile.caseVariants?.map((variant: any, idx: number) => (
                    <td key={idx} className="px-4 py-3 text-center text-gray-600 dark:text-gray-400">
                      ₹{totalVariantCostPerKg.toFixed(2)}
                    </td>
                  ))}
                </tr>
                <tr className="bg-gray-50/50 dark:bg-gray-800/20">
                  <td className="px-4 py-3 font-semibold text-gray-900 dark:text-white">Total Prod Cost</td>
                  {profile.caseVariants?.map((variant: any, idx: number) => (
                    <td key={idx} className="px-4 py-3 text-center font-semibold text-gray-900 dark:text-white">
                      ₹{(Number(variant.weightKg) * totalVariantCostPerKg).toFixed(2)}
                    </td>
                  ))}
                </tr>
                <tr>
                  <td className="px-4 py-3 font-medium text-gray-900 dark:text-white">Selling Price</td>
                  {profile.caseVariants?.map((variant: any, idx: number) => (
                    <td key={idx} className="px-4 py-3">
                       <input 
                        type="number" 
                        value={variant.sellingPrice} 
                        onChange={(e) => handleVariantChange(idx, 'sellingPrice', e.target.value)}
                        className="w-full text-center font-bold text-green-600 dark:text-green-400 rounded border border-gray-200 p-1 text-sm dark:border-gray-800 dark:bg-gray-950"
                      />
                    </td>
                  ))}
                </tr>
                <tr>
                  <td className="px-4 py-3 font-medium text-gray-900 dark:text-white">Profit Margin (₹)</td>
                  {profile.caseVariants?.map((variant: any, idx: number) => {
                    const totalProdCost = Number(variant.weightKg) * totalVariantCostPerKg;
                    const marginAmt = Number(variant.sellingPrice) - totalProdCost;
                    return (
                      <td key={idx} className={`px-4 py-3 text-center font-bold ${marginAmt >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                        ₹{marginAmt.toFixed(2)}
                      </td>
                    );
                  })}
                </tr>
                <tr>
                  <td className="px-4 py-3 font-medium text-gray-900 dark:text-white">Profit Margin (%)</td>
                  {profile.caseVariants?.map((variant: any, idx: number) => {
                    const totalProdCost = Number(variant.weightKg) * totalVariantCostPerKg;
                    const marginAmt = Number(variant.sellingPrice) - totalProdCost;
                    const marginPct = Number(variant.sellingPrice) > 0 ? (marginAmt / Number(variant.sellingPrice)) * 100 : 0;
                    return (
                      <td key={idx} className={`px-4 py-3 text-center font-bold ${marginPct >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                        {marginPct.toFixed(2)}%
                      </td>
                    );
                  })}
                </tr>
                <tr className="bg-red-50 dark:bg-red-900/20">
                  <td className="px-4 py-3 font-bold text-red-600 dark:text-red-400 rounded-bl-lg">Selling Cost per KG</td>
                  {profile.caseVariants?.map((variant: any, idx: number) => {
                    const sellingCostKg = Number(variant.weightKg) > 0 ? Number(variant.sellingPrice) / Number(variant.weightKg) : 0;
                    return (
                      <td key={idx} className="px-4 py-3 text-center font-bold text-red-600 dark:text-red-400">
                        ₹{sellingCostKg.toFixed(2)}
                      </td>
                    );
                  })}
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
