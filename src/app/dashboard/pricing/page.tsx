"use client";

import React, { useState, useEffect } from 'react';
import api from '@/lib/api';
import { toast } from 'sonner';
import { IndianRupee, Save, TrendingUp, Package, Scale, Battery, FileSpreadsheet } from 'lucide-react';

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
    setProfile({ ...profile, [field]: value });
  };

  const handleVariantChange = (index: number, field: string, value: string) => {
    const updatedVariants = [...profile.caseVariants];
    updatedVariants[index] = {
      ...updatedVariants[index],
      [field]: value
    };
    setProfile({ ...profile, caseVariants: updatedVariants });
  };

  // Live Stock Data Extraction
  const waxStock = stats?.overview?.waxStock || 0; 
  const finishedGoods = stats?.overview?.finishedGoods || 0;
  const monthlySales = stats?.overview?.monthlySales || 0;
  
  const totalCostPerKg = profile ? 
    (Number(profile.waxCost) || 0) + 
    (Number(profile.otherMaterials) || 0) + 
    (Number(profile.labourCost) || 0) + 
    (Number(profile.electricityCost) || 0) + 
    (Number(profile.energyCost) || 0) + 
    (Number(profile.transportCost) || 0) : 0;

  const totalVariantCostPerKg = totalCostPerKg + (Number(profile?.packagingOverhead) || 0);
  const sellingPricePerKg = Number(profile?.sellingPrice) || 0;
  const profitMarginPerKg = sellingPricePerKg - totalCostPerKg;
  const profitMarginPercent = sellingPricePerKg > 0 ? (profitMarginPerKg / sellingPricePerKg) * 100 : 0;

  const handleExportCSV = () => {
    if (!profile || !profile.caseVariants) {
      toast.error('No data to export');
      return;
    }

    const headers = [
      'Variant Name', 
      'Weight (KG)', 
      'Base Prod Cost (₹)', 
      'Packaging Overhead (₹)',
      'Total Prod Cost/KG (₹)', 
      'Total Case Cost (₹)', 
      'Selling Price (₹)', 
      'Profit Margin (₹)', 
      'Profit Margin (%)',
      'Selling Cost per KG (₹)'
    ];

    const rows = profile.caseVariants.map((v: any) => {
      const weight = Number(v.weightKg) || 0;
      const selling = Number(v.sellingPrice) || 0;
      const effectiveProdCostPerKg = v.prodCostPerKg !== null && v.prodCostPerKg !== undefined && v.prodCostPerKg !== '' ? Number(v.prodCostPerKg) : totalVariantCostPerKg;
      const caseCost = weight * effectiveProdCostPerKg;
      const margin = selling - caseCost;
      const marginPct = selling > 0 ? (margin / selling) * 100 : 0;
      const sellingCostPerKg = weight > 0 ? selling / weight : 0;

      return [
        v.name,
        weight,
        totalCostPerKg,
        profile.packagingOverhead,
        effectiveProdCostPerKg.toFixed(2),
        caseCost.toFixed(2),
        selling,
        margin.toFixed(2),
        marginPct.toFixed(2) + '%',
        sellingCostPerKg.toFixed(2)
      ].join(',');
    });

    const csvContent = [headers.join(','), ...rows].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `unit_economics_${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    toast.success('Pricing matrix exported as CSV!');
  };

  if (isLoading || !profile) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-gray-200 border-t-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 lg:p-8 max-w-7xl mx-auto space-y-8 pb-20">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Unit Economics & Pricing Engine</h1>
          <p className="text-sm text-gray-500 mt-1">Manage 1 KG base costs and SKU profitability</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={handleExportCSV}
            className="flex items-center gap-2 rounded-xl bg-white border border-gray-200 px-4 py-2.5 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 dark:bg-gray-900 dark:border-gray-800 dark:text-gray-300 dark:hover:bg-gray-800 transition-colors"
          >
            <FileSpreadsheet className="h-4 w-4" />
            Export CSV
          </button>
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-medium text-white shadow-sm hover:bg-blue-700 disabled:opacity-50 transition-colors"
          >
            <Save className="h-4 w-4" />
            {isSaving ? 'Saving...' : 'Save Profile'}
          </button>
        </div>
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
                    type="number" step="any"
                    value={profile.waxCost}
                    onChange={(e) => handleBaseCostChange('waxCost', e.target.value)}
                    className="mt-1 w-full rounded-xl border border-gray-200 p-2.5 text-sm dark:border-gray-800 dark:bg-gray-950 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300">Other Materials (₹)</label>
                  <input
                    type="number" step="any"
                    value={profile.otherMaterials}
                    onChange={(e) => handleBaseCostChange('otherMaterials', e.target.value)}
                    className="mt-1 w-full rounded-xl border border-gray-200 p-2.5 text-sm dark:border-gray-800 dark:bg-gray-950 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300">Labour Cost (₹)</label>
                  <input
                    type="number" step="any"
                    value={profile.labourCost}
                    onChange={(e) => handleBaseCostChange('labourCost', e.target.value)}
                    className="mt-1 w-full rounded-xl border border-gray-200 p-2.5 text-sm dark:border-gray-800 dark:bg-gray-950 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300">Electricity Cost (₹)</label>
                  <input
                    type="number" step="any"
                    value={profile.electricityCost}
                    onChange={(e) => handleBaseCostChange('electricityCost', e.target.value)}
                    className="mt-1 w-full rounded-xl border border-gray-200 p-2.5 text-sm dark:border-gray-800 dark:bg-gray-950 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300">Energy (Gas/Wood) (₹)</label>
                  <input
                    type="number" step="any"
                    value={profile.energyCost}
                    onChange={(e) => handleBaseCostChange('energyCost', e.target.value)}
                    className="mt-1 w-full rounded-xl border border-gray-200 p-2.5 text-sm dark:border-gray-800 dark:bg-gray-950 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300">Transport Cost (₹)</label>
                  <input
                    type="number" step="any"
                    value={profile.transportCost}
                    onChange={(e) => handleBaseCostChange('transportCost', e.target.value)}
                    className="mt-1 w-full rounded-xl border border-gray-200 p-2.5 text-sm dark:border-gray-800 dark:bg-gray-950 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300">Packaging Overhead (₹/KG)</label>
                  <input
                    type="number" step="any"
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
                      type="number" step="any"
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
                        type="number" step="any" 
                        value={variant.weightKg} 
                        onChange={(e) => handleVariantChange(idx, 'weightKg', e.target.value)}
                        className="w-full text-center rounded border border-gray-200 p-1 text-sm dark:border-gray-800 dark:bg-gray-950 dark:text-white"
                      />
                    </td>
                  ))}
                </tr>
                <tr>
                  <td className="px-4 py-3 font-medium text-gray-900 dark:text-white">Quantity</td>
                  {profile.caseVariants?.map((variant: any, idx: number) => (
                    <td key={idx} className="px-4 py-3">
                      <input 
                        type="number" step="any" 
                        value={variant.qty ?? 1} 
                        onChange={(e) => handleVariantChange(idx, 'qty', e.target.value)}
                        className="w-full text-center rounded border border-gray-200 p-1 text-sm dark:border-gray-800 dark:bg-gray-950 dark:text-white"
                      />
                    </td>
                  ))}
                </tr>
                <tr className="bg-blue-50/50 dark:bg-blue-900/20">
                  <td className="px-4 py-3 font-semibold text-blue-900 dark:text-blue-100">Total Weight (KG)</td>
                  {profile.caseVariants?.map((variant: any, idx: number) => {
                    const totalWeight = Number(variant.weightKg) * Number(variant.qty ?? 1);
                    return (
                      <td key={idx} className="px-4 py-3 text-center font-semibold text-blue-900 dark:text-blue-100">
                        {totalWeight.toFixed(3)}
                      </td>
                    );
                  })}
                </tr>
                <tr>
                  <td className="px-4 py-3 font-medium text-gray-900 dark:text-white">Prod Cost/KG</td>
                  {profile.caseVariants?.map((variant: any, idx: number) => (
                    <td key={idx} className="px-4 py-3">
                      <input 
                        type="number" step="any" 
                        value={variant.prodCostPerKg !== null && variant.prodCostPerKg !== undefined ? variant.prodCostPerKg : ''} 
                        onChange={(e) => handleVariantChange(idx, 'prodCostPerKg', e.target.value)}
                        placeholder={totalVariantCostPerKg.toFixed(2)}
                        className="w-full text-center rounded border border-gray-200 p-1 text-sm dark:border-gray-800 dark:bg-gray-950 dark:text-white"
                      />
                    </td>
                  ))}
                </tr>
                <tr className="bg-gray-50/50 dark:bg-gray-800/20">
                  <td className="px-4 py-3 font-semibold text-gray-900 dark:text-white">Total Prod Cost</td>
                  {profile.caseVariants?.map((variant: any, idx: number) => {
                    const effectiveProdCostPerKg = variant.prodCostPerKg !== null && variant.prodCostPerKg !== undefined && variant.prodCostPerKg !== '' ? Number(variant.prodCostPerKg) : totalVariantCostPerKg;
                    const totalWeight = Number(variant.weightKg) * Number(variant.qty ?? 1);
                    return (
                      <td key={idx} className="px-4 py-3 text-center font-semibold text-gray-900 dark:text-white">
                        ₹{(totalWeight * effectiveProdCostPerKg).toFixed(2)}
                      </td>
                    );
                  })}
                </tr>
                <tr>
                  <td className="px-4 py-3 font-medium text-gray-900 dark:text-white">Selling Price</td>
                  {profile.caseVariants?.map((variant: any, idx: number) => (
                    <td key={idx} className="px-4 py-3">
                       <input 
                        type="number" step="any" 
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
                    const totalWeight = Number(variant.weightKg) * Number(variant.qty ?? 1);
                    const totalProdCost = totalWeight * totalVariantCostPerKg;
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
                    const effectiveProdCostPerKg = variant.prodCostPerKg !== null && variant.prodCostPerKg !== undefined && variant.prodCostPerKg !== '' ? Number(variant.prodCostPerKg) : totalVariantCostPerKg;
                    const totalWeight = Number(variant.weightKg) * Number(variant.qty ?? 1);
                    const totalProdCost = totalWeight * effectiveProdCostPerKg;
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
                    const totalWeight = Number(variant.weightKg) * Number(variant.qty ?? 1);
                    const sellingCostKg = totalWeight > 0 ? Number(variant.sellingPrice) / totalWeight : 0;
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

        {/* COMPONENT 3: Regional Pricing Engine (Modern UI) */}
        <div className="lg:col-span-3 mt-8">
          <div className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-gray-900 shadow-sm overflow-x-auto relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 via-teal-400 to-emerald-500"></div>
            <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-blue-500" />
              Regional Pricing Engine
            </h2>
            
            <div className="rounded-xl border border-gray-100 dark:border-gray-800 overflow-hidden">
              <table className="w-full text-left text-sm text-gray-500 dark:text-gray-400">
                <thead className="bg-gray-50 text-xs uppercase text-gray-700 dark:bg-gray-800/50 dark:text-gray-300">
                  <tr>
                    <th className="px-4 py-4 font-semibold">Metric</th>
                    {profile.caseVariants?.map((variant: any, idx: number) => (
                      <th key={idx} className="px-4 py-4 font-semibold text-center">
                        {variant.name}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-800 bg-white dark:bg-gray-900">
                  <tr>
                    <td className="px-4 py-3 font-medium text-gray-900 dark:text-white">Weight (KG)</td>
                    {profile.caseVariants?.map((variant: any, idx: number) => (
                      <td key={idx} className="px-4 py-3">
                        <input 
                          type="number" step="any" 
                          value={variant.weightKg} 
                          onChange={(e) => handleVariantChange(idx, 'weightKg', e.target.value)}
                          className="w-full text-center rounded border border-gray-200 p-1 text-sm dark:border-gray-800 dark:bg-gray-950 dark:text-white"
                        />
                      </td>
                    ))}
                  </tr>
                  <tr>
                    <td className="px-4 py-3 font-medium text-gray-900 dark:text-white">Quantity</td>
                    {profile.caseVariants?.map((variant: any, idx: number) => (
                      <td key={idx} className="px-4 py-3">
                        <input 
                          type="number" step="any" 
                          value={variant.qty ?? 1} 
                          onChange={(e) => handleVariantChange(idx, 'qty', e.target.value)}
                          className="w-full text-center rounded border border-gray-200 p-1 text-sm dark:border-gray-800 dark:bg-gray-950 dark:text-white"
                        />
                      </td>
                    ))}
                  </tr>
                  <tr className="bg-blue-50/50 dark:bg-blue-900/10">
                    <td className="px-4 py-3 font-semibold text-blue-900 dark:text-blue-100">Total Weight (KG)</td>
                    {profile.caseVariants?.map((variant: any, idx: number) => {
                      const totalWeight = Number(variant.weightKg) * Number(variant.qty ?? 1);
                      return (
                        <td key={idx} className="px-4 py-3 text-center font-semibold text-blue-900 dark:text-blue-100">
                          {totalWeight.toFixed(3)}
                        </td>
                      );
                    })}
                  </tr>
                  <tr>
                    <td className="px-4 py-3 font-medium text-gray-900 dark:text-white">Prod Cost/KG</td>
                    {profile.caseVariants?.map((variant: any, idx: number) => (
                      <td key={idx} className="px-4 py-3">
                        <input 
                          type="number" step="any" 
                          value={variant.prodCostPerKg !== null && variant.prodCostPerKg !== undefined ? variant.prodCostPerKg : ''} 
                          onChange={(e) => handleVariantChange(idx, 'prodCostPerKg', e.target.value)}
                          placeholder={totalVariantCostPerKg.toFixed(2)}
                          className="w-full text-center rounded border border-gray-200 p-1 text-sm dark:border-gray-800 dark:bg-gray-950 dark:text-white"
                        />
                      </td>
                    ))}
                  </tr>
                  <tr className="bg-gray-50/50 dark:bg-gray-800/20">
                    <td className="px-4 py-3 font-semibold text-gray-900 dark:text-white">Total Prod Cost</td>
                    {profile.caseVariants?.map((variant: any, idx: number) => {
                      const effectiveProdCostPerKg = variant.prodCostPerKg !== null && variant.prodCostPerKg !== undefined && variant.prodCostPerKg !== '' ? Number(variant.prodCostPerKg) : totalVariantCostPerKg;
                      const totalWeight = Number(variant.weightKg) * Number(variant.qty ?? 1);
                      return (
                        <td key={idx} className="px-4 py-3 text-center font-semibold text-gray-900 dark:text-white">
                          ₹{(totalWeight * effectiveProdCostPerKg).toFixed(2)}
                        </td>
                      );
                    })}
                  </tr>
                  <tr>
                    <td className="px-4 py-3 font-medium text-gray-900 dark:text-white">Selling Price</td>
                    {profile.caseVariants?.map((variant: any, idx: number) => (
                      <td key={idx} className="px-4 py-3 text-center font-bold text-gray-900 dark:text-white">
                        ₹{variant.sellingPrice}
                      </td>
                    ))}
                  </tr>
                  <tr>
                    <td className="px-4 py-3 font-medium text-gray-900 dark:text-white">Profit Margin (₹)</td>
                    {profile.caseVariants?.map((variant: any, idx: number) => {
                      const totalWeight = Number(variant.weightKg) * Number(variant.qty ?? 1);
                      const totalProdCost = totalWeight * totalVariantCostPerKg;
                      const marginAmt = Number(variant.sellingPrice) - totalProdCost;
                      return (
                        <td key={idx} className={`px-4 py-3 text-center font-bold ${marginAmt >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
                          ₹{marginAmt.toFixed(2)}
                        </td>
                      );
                    })}
                  </tr>
                  <tr>
                    <td className="px-4 py-3 font-medium text-gray-900 dark:text-white">Profit Margin (%)</td>
                    {profile.caseVariants?.map((variant: any, idx: number) => {
                      const effectiveProdCostPerKg = variant.prodCostPerKg !== null && variant.prodCostPerKg !== undefined && variant.prodCostPerKg !== '' ? Number(variant.prodCostPerKg) : totalVariantCostPerKg;
                      const totalWeight = Number(variant.weightKg) * Number(variant.qty ?? 1);
                      const totalProdCost = totalWeight * effectiveProdCostPerKg;
                      const marginAmt = Number(variant.sellingPrice) - totalProdCost;
                      const marginPct = Number(variant.sellingPrice) > 0 ? (marginAmt / Number(variant.sellingPrice)) * 100 : 0;
                      return (
                        <td key={idx} className={`px-4 py-3 text-center font-bold ${marginPct >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
                          {marginPct.toFixed(2)}%
                        </td>
                      );
                    })}
                  </tr>
                  <tr className="bg-rose-50/50 dark:bg-rose-900/10">
                    <td className="px-4 py-3 font-medium text-rose-600 dark:text-rose-400">Selling Cost per KG</td>
                    {profile.caseVariants?.map((variant: any, idx: number) => {
                      const totalWeight = Number(variant.weightKg) * Number(variant.qty ?? 1);
                      const sellingCostKg = totalWeight > 0 ? Number(variant.sellingPrice) / totalWeight : 0;
                      return (
                        <td key={idx} className="px-4 py-3 text-center font-bold text-rose-600 dark:text-rose-400">
                          ₹{sellingCostKg.toFixed(2)}
                        </td>
                      );
                    })}
                  </tr>
                  <tr className="bg-blue-50/50 dark:bg-blue-900/10 border-t-2 border-blue-100 dark:border-blue-900">
                    <td className="px-4 py-3 font-semibold text-blue-700 dark:text-blue-400">MRP</td>
                    {profile.caseVariants?.map((variant: any, idx: number) => (
                      <td key={idx} className="px-4 py-3">
                        <input 
                          type="number" step="any" 
                          value={variant.mrp || ''} 
                          onChange={(e) => handleVariantChange(idx, 'mrp', e.target.value)}
                          className="w-full text-center font-bold text-blue-700 dark:text-blue-400 rounded-lg border border-blue-200 dark:border-blue-800 bg-white dark:bg-gray-950 px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all shadow-sm"
                          placeholder="0"
                        />
                      </td>
                    ))}
                  </tr>
                  <tr className="bg-teal-50/50 dark:bg-teal-900/10 border-t border-teal-100 dark:border-teal-900/50">
                    <td className="px-4 py-3 font-semibold text-teal-700 dark:text-teal-400">CALICUT RATE</td>
                    {profile.caseVariants?.map((variant: any, idx: number) => (
                      <td key={idx} className="px-4 py-3">
                        <input 
                          type="number" step="any" 
                          value={variant.calicutRate || ''} 
                          onChange={(e) => handleVariantChange(idx, 'calicutRate', e.target.value)}
                          className="w-full text-center font-bold text-teal-700 dark:text-teal-400 rounded-lg border border-teal-200 dark:border-teal-800 bg-white dark:bg-gray-950 px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-teal-500/50 transition-all shadow-sm"
                          placeholder="0"
                        />
                      </td>
                    ))}
                  </tr>
                  <tr>
                    <td className="px-4 py-3 font-medium text-gray-900 dark:text-white">Margin Amount</td>
                    {profile.caseVariants?.map((variant: any, idx: number) => {
                      const effectiveProdCostPerKg = variant.prodCostPerKg !== null && variant.prodCostPerKg !== undefined && variant.prodCostPerKg !== '' ? Number(variant.prodCostPerKg) : totalVariantCostPerKg;
                      const totalWeight = Number(variant.weightKg) * Number(variant.qty ?? 1);
                      const totalProdCost = totalWeight * effectiveProdCostPerKg;
                      const calicutRate = Number(variant.calicutRate) || 0;
                      const marginAmt = calicutRate > 0 ? calicutRate - totalProdCost : 0;
                      return (
                        <td key={idx} className={`px-4 py-3 text-center font-bold ${marginAmt >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
                          ₹{marginAmt.toFixed(2)}
                        </td>
                      );
                    })}
                  </tr>
                  <tr>
                    <td className="px-4 py-3 font-medium text-gray-900 dark:text-white">Margin %</td>
                    {profile.caseVariants?.map((variant: any, idx: number) => {
                      const effectiveProdCostPerKg = variant.prodCostPerKg !== null && variant.prodCostPerKg !== undefined && variant.prodCostPerKg !== '' ? Number(variant.prodCostPerKg) : totalVariantCostPerKg;
                      const totalWeight = Number(variant.weightKg) * Number(variant.qty ?? 1);
                      const totalProdCost = totalWeight * effectiveProdCostPerKg;
                      const calicutRate = Number(variant.calicutRate) || 0;
                      const marginAmt = calicutRate > 0 ? calicutRate - totalProdCost : 0;
                      const marginPct = calicutRate > 0 ? (marginAmt / calicutRate) * 100 : 0;
                      return (
                        <td key={idx} className={`px-4 py-3 text-center font-bold ${marginPct >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
                          {marginPct.toFixed(2)}%
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
    </div>
  );
}
