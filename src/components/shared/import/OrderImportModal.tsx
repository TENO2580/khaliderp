'use client';

import React, { useState, useRef, useEffect } from 'react';
import * as XLSX from 'xlsx';
import api from '@/lib/api';
import { toast } from 'sonner';
import {
  Upload,
  FileSpreadsheet,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  ArrowRight,
  ArrowLeft,
  Download,
  Settings2,
  RefreshCw,
  Copy,
  Layers,
  HelpCircle,
  Sparkles,
  Save,
  Check,
  X,
  FileText,
  Clock,
  ChevronRight,
  Database,
  Filter,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { SystemFieldDefinition } from '@/lib/services/import/ColumnMappingService';
import { ValidatedRow } from '@/lib/services/import/DataValidationService';

interface OrderImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

type ImportStep = 'upload' | 'mapping' | 'batch_duplicate' | 'preview' | 'importing' | 'result';

export default function OrderImportModal({ isOpen, onClose, onSuccess }: OrderImportModalProps) {
  // Navigation & State
  const [currentStep, setCurrentStep] = useState<ImportStep>('upload');
  const [isLoading, setIsLoading] = useState(false);
  const [progress, setProgress] = useState(0);

  // Step 1: Upload File
  const [file, setFile] = useState<File | null>(null);
  const [fileName, setFileName] = useState('');
  const [fileSize, setFileSize] = useState(0);
  const [rawRows, setRawRows] = useState<Record<string, any>[]>([]);
  const [detectedHeaders, setDetectedHeaders] = useState<string[]>([]);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Step 2: Mapping & Calculations
  const [systemFields, setSystemFields] = useState<SystemFieldDefinition[]>([]);
  const [mappings, setMappings] = useState<Record<string, string>>({});
  const [confidences, setConfidences] = useState<Record<string, { score: number; level: 'high' | 'medium' | 'low'; matchReason: string }>>({});
  const [unmappedHeaders, setUnmappedHeaders] = useState<string[]>([]);
  const [calculationMode, setCalculationMode] = useState<'calculate_auto' | 'use_imported'>('calculate_auto');
  
  // Presets
  const [presets, setPresets] = useState<any[]>([]);
  const [selectedPresetId, setSelectedPresetId] = useState<string>('');
  const [savePresetName, setSavePresetName] = useState('');
  const [showSavePreset, setShowSavePreset] = useState(false);

  // Step 3: Batch & Duplicates
  const [unknownBatches, setUnknownBatches] = useState<{ name: string; occurrenceCount: number; sampleRows: number[] }[]>([]);
  const [existingBatches, setExistingBatches] = useState<{ id: string; batchNumber: string }[]>([]);
  const [batchResolutions, setBatchResolutions] = useState<Record<string, { action: 'create' | 'map' | 'preserve_notes' | 'skip'; targetBatchId?: string }>>({});
  const [importMode, setImportMode] = useState<'ADD_NEW' | 'UPDATE_EXISTING' | 'ADD_AND_UPDATE'>('ADD_NEW');

  // Step 4: Preview & Validation
  const [validatedRows, setValidatedRows] = useState<ValidatedRow[]>([]);
  const [summary, setSummary] = useState({
    totalRows: 0,
    validCount: 0,
    warningCount: 0,
    errorCount: 0,
    duplicateCount: 0,
  });
  const [previewFilter, setPreviewFilter] = useState<'all' | 'valid' | 'warning' | 'error' | 'duplicate'>('all');
  const [previewSearch, setPreviewSearch] = useState('');

  // Step 5: Execution Result
  const [executionResult, setExecutionResult] = useState<any>(null);

  // Load Presets on Mount
  useEffect(() => {
    if (isOpen) {
      loadPresets();
    }
  }, [isOpen]);

  const loadPresets = async () => {
    try {
      const res = await api.get('/sales/import/presets');
      const list = Array.isArray(res.data?.data) ? res.data.data : (Array.isArray(res.data) ? res.data : []);
      setPresets(list);
      const def = list.find((p: any) => p.isDefault);
      if (def) {
        setSelectedPresetId(def.id);
      }
    } catch (err) {
      console.error('Failed to load presets:', err);
    }
  };

  const handleFileParse = async (selectedFile: File) => {
    if (!selectedFile) return;
    const ext = selectedFile.name.split('.').pop()?.toLowerCase();
    if (!['xlsx', 'xls', 'csv'].includes(ext || '')) {
      toast.error('Please upload a valid Excel (.xlsx, .xls) or CSV (.csv) file.');
      return;
    }

    setFile(selectedFile);
    setFileName(selectedFile.name);
    setFileSize(selectedFile.size);
    setIsLoading(true);

    try {
      const buffer = await selectedFile.arrayBuffer();
      const workbook = XLSX.read(buffer, { type: 'array', cellDates: true });
      const firstSheetName = workbook.SheetNames[0];
      const sheet = workbook.Sheets[firstSheetName];

      const jsonData = XLSX.utils.sheet_to_json(sheet, { raw: false, defval: '' }) as Record<string, any>[];

      if (jsonData.length === 0) {
        toast.error('The uploaded file contains no data rows.');
        setIsLoading(false);
        return;
      }

      const headers = Object.keys(jsonData[0] || {});
      setRawRows(jsonData);
      setDetectedHeaders(headers);

      // Call validation endpoint to trigger initial auto-mapping
      const validateRes = await api.post('/sales/import/validate', {
        rows: jsonData.slice(0, 100), // Quick sample for mapping
        presetId: selectedPresetId || undefined,
        options: { calculationMode },
      });

      const resData = validateRes.data?.data?.columnMapping
        ? validateRes.data.data
        : (validateRes.data?.data || validateRes.data || {});
      const colMapping = resData.columnMapping || {};

      setSystemFields(resData.systemFields || []);
      setMappings(colMapping.mappings || {});
      setConfidences(colMapping.confidences || {});
      setUnmappedHeaders(colMapping.unmappedHeaders || []);

      toast.success(`Loaded ${jsonData.length} rows and detected ${headers.length} columns.`);
      setCurrentStep('mapping');
    } catch (err: any) {
      console.error('File parsing error:', err);
      toast.error(err.response?.data?.message || err.message || 'Failed to read file contents.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileParse(e.dataTransfer.files[0]);
    }
  };

  const handleMappingChange = (sysKey: string, uploadedHeader: string) => {
    setMappings((prev) => ({ ...prev, [sysKey]: uploadedHeader }));
    // Update confidences manually
    setConfidences((prev) => ({
      ...prev,
      [sysKey]: {
        score: uploadedHeader ? 100 : 0,
        level: uploadedHeader ? 'high' : 'low',
        matchReason: uploadedHeader ? 'Manually Assigned' : 'Unmapped',
      },
    }));

    // Update unmapped headers list
    const currentlyMapped = new Set(Object.values({ ...mappings, [sysKey]: uploadedHeader }).filter(Boolean));
    setUnmappedHeaders(detectedHeaders.filter((h) => !currentlyMapped.has(h)));
  };

  const handleSavePreset = async () => {
    if (!savePresetName.trim()) {
      toast.error('Please enter a name for the mapping preset.');
      return;
    }

    try {
      const res = await api.post('/sales/import/presets', {
        name: savePresetName.trim(),
        module: 'ORDERS',
        mappings,
        options: { calculationMode },
        isDefault: false,
      });
      toast.success('Mapping preset saved successfully!');
      setShowSavePreset(false);
      setSavePresetName('');
      loadPresets();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to save preset.');
    }
  };

  const handleRunValidation = async () => {
    setIsLoading(true);
    try {
      const validateRes = await api.post('/sales/import/validate', {
        rows: rawRows,
        mappings,
        options: { calculationMode },
      });

      const resData = validateRes.data?.data?.validatedRows
        ? validateRes.data.data
        : (validateRes.data?.data || validateRes.data || {});
      const batchRes = resData.batchResolution || {};

      setValidatedRows(resData.validatedRows || []);
      setSummary(resData.summary || { totalRows: 0, validRows: 0, errorRows: 0, warningRows: 0, duplicateCount: 0 });
      setExistingBatches(batchRes.existingBatches || []);
      setUnknownBatches(batchRes.unknownBatches || []);

      // Prepopulate default batch resolutions
      const defaultBatchRes: Record<string, any> = {};
      (batchRes.unknownBatches || []).forEach((ub: any) => {
        defaultBatchRes[ub.name] = { action: 'create' };
      });
      setBatchResolutions(defaultBatchRes);

      if ((batchRes.unknownBatches || []).length > 0 || (resData.summary?.duplicateCount || 0) > 0) {
        setCurrentStep('batch_duplicate');
      } else {
        setCurrentStep('preview');
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Data validation failed.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleExecuteImport = async () => {
    setCurrentStep('importing');
    setProgress(15);
    setIsLoading(true);

    try {
      const interval = setInterval(() => {
        setProgress((prev) => (prev < 90 ? prev + 15 : prev));
      }, 350);

      const res = await api.post('/sales/import/execute', {
        validatedRows,
        mode: importMode,
        batchResolutions,
        fileName,
        fileSize,
        mappingUsed: mappings,
        options: { calculationMode },
      });

      clearInterval(interval);
      setProgress(100);
      const resultData = res.data?.data?.createdCount !== undefined ? res.data.data : (res.data?.data || res.data || {});
      setExecutionResult(resultData);
      setCurrentStep('result');
      toast.success('Orders imported successfully!');
      onSuccess();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Import execution failed.');
      setCurrentStep('preview');
    } finally {
      setIsLoading(false);
    }
  };

  const downloadSampleTemplate = () => {
    try {
      const sampleData = [
        {
          'Name': 'NEW PILOT',
          'Batch Used': 'BATCH ONE',
          'Order Date': '04 Aug 2026',
          'Delivery Date': '06 Aug 2026',
          'Type': 'WHITE CANDLE',
          'Quantity (KG)': 30,
          'Production Cost': 4980,
          'Selling Cost': 6000,
          'Margin %': '17.00%',
          'Margin Amount': 1020,
          'Total Selling Cost': 6000,
          'Status': 'DELIVERED',
        },
        {
          'Name': 'ELLIKKAL TRADERS',
          'Batch Used': 'BATCH ZERO, BATCH ONE',
          'Order Date': '16 Aug 2026',
          'Delivery Date': '18 Aug 2026',
          'Type': 'WHITE CANDLE',
          'Quantity (KG)': 150,
          'Production Cost': 24900,
          'Selling Cost': 28050,
          'Margin %': '24.77%',
          'Margin Amount': 3150,
          'Total Selling Cost': 28050,
          'Status': 'DELIVERED',
        },
        {
          'Name': 'MAHESH AGENCIES',
          'Batch Used': 'BATCH TWO',
          'Order Date': '19 Aug 2026',
          'Delivery Date': '',
          'Type': 'COLOR CANDLE',
          'Quantity (KG)': 75,
          'Production Cost': 12500,
          'Selling Cost': 15000,
          'Margin %': '16.67%',
          'Margin Amount': 2500,
          'Total Selling Cost': 15000,
          'Status': 'PENDING',
        },
      ];

      const ws = XLSX.utils.json_to_sheet(sampleData);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Orders Template');

      ws['!cols'] = [
        { wch: 22 },
        { wch: 26 },
        { wch: 15 },
        { wch: 15 },
        { wch: 18 },
        { wch: 15 },
        { wch: 18 },
        { wch: 15 },
        { wch: 12 },
        { wch: 16 },
        { wch: 18 },
        { wch: 14 },
      ];

      XLSX.writeFile(wb, 'orders_sample_template.xlsx');
      toast.success('Sample template downloaded successfully!');
    } catch (err: any) {
      console.error('Failed to generate sample template:', err);
      toast.error('Failed to download template.');
    }
  };

  const downloadErrorReport = () => {
    const errorRows = validatedRows.filter((r) => !r.isValid || r.isDuplicate);
    if (errorRows.length === 0) {
      toast.info('No errors to export.');
      return;
    }

    const exportData = errorRows.map((r) => ({
      'Row Number': r.rowIndex,
      'Customer Name': r.normalizedData.customerName,
      'Order Date': r.normalizedData.orderDate,
      'Status': r.isValid ? (r.isDuplicate ? 'Duplicate' : 'Valid') : 'Error',
      'Errors': r.errors.map((e) => `${e.field}: ${e.message}`).join(' | '),
      'Warnings': r.warnings.map((w) => `${w.field}: ${w.message}`).join(' | '),
      'Suggested Fixes': r.errors.map((e) => e.suggestedFix).filter(Boolean).join(' | '),
      'Raw Row Data': JSON.stringify(r.rawRow),
    }));

    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Import Errors');
    XLSX.writeFile(wb, `import_errors_${fileName || 'orders'}.xlsx`);
  };

  if (!isOpen) return null;

  const filteredPreviewRows = validatedRows.filter((r) => {
    if (previewFilter === 'valid' && (!r.isValid || r.isDuplicate)) return false;
    if (previewFilter === 'warning' && r.warnings.length === 0) return false;
    if (previewFilter === 'error' && r.isValid) return false;
    if (previewFilter === 'duplicate' && !r.isDuplicate) return false;

    if (previewSearch.trim()) {
      const q = previewSearch.toLowerCase();
      const matchName = r.normalizedData.customerName.toLowerCase().includes(q);
      const matchBatch = r.normalizedData.batchUsed.toLowerCase().includes(q);
      const matchType = r.normalizedData.type.toLowerCase().includes(q);
      return matchName || matchBatch || matchType;
    }

    return true;
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative flex max-h-[92vh] w-full max-w-5xl flex-col rounded-3xl border border-gray-200 bg-white shadow-2xl dark:border-gray-800 dark:bg-gray-950 overflow-hidden">
        
        {/* Modal Header & Progress Indicator */}
        <div className="flex-none border-b border-gray-200 bg-gray-50/80 px-6 py-4 dark:border-gray-800 dark:bg-gray-900/60">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600/10 text-blue-600 dark:bg-blue-500/20 dark:text-blue-400">
                <FileSpreadsheet className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-gray-900 dark:text-white">Import Orders & Production Data</h2>
                <p className="text-xs text-gray-500">Excel / CSV automated column mapping and data pipeline</p>
              </div>
            </div>
            <button
              onClick={onClose}
              disabled={isLoading && currentStep === 'importing'}
              className="rounded-xl p-2 text-gray-400 hover:bg-gray-200 hover:text-gray-700 dark:hover:bg-gray-800 dark:hover:text-gray-200 transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Stepper Bar */}
          <div className="mt-4 flex items-center justify-between border-t border-gray-200/60 pt-3 dark:border-gray-800/60">
            {[
              { id: 'upload', label: '1. Upload File' },
              { id: 'mapping', label: '2. Column Mapping' },
              { id: 'batch_duplicate', label: '3. Batches & Rules' },
              { id: 'preview', label: '4. Validate & Preview' },
              { id: 'result', label: '5. Complete' },
            ].map((step, idx) => {
              const stepKeys: ImportStep[] = ['upload', 'mapping', 'batch_duplicate', 'preview', 'result'];
              const currentIdx = stepKeys.indexOf(currentStep === 'importing' ? 'preview' : currentStep);
              const isActive = currentIdx >= idx;
              const isCurrent = currentIdx === idx;

              return (
                <div key={step.id} className="flex items-center gap-2">
                  <div
                    className={cn(
                      'flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold transition-all',
                      isCurrent
                        ? 'bg-blue-600 text-white ring-4 ring-blue-100 dark:ring-blue-900/40'
                        : isActive
                        ? 'bg-emerald-600 text-white'
                        : 'bg-gray-200 text-gray-600 dark:bg-gray-800 dark:text-gray-400'
                    )}
                  >
                    {isActive && !isCurrent ? <Check className="h-3.5 w-3.5" /> : idx + 1}
                  </div>
                  <span
                    className={cn(
                      'text-xs font-semibold hidden sm:inline-block',
                      isCurrent ? 'text-blue-600 dark:text-blue-400 font-bold' : isActive ? 'text-gray-900 dark:text-gray-200' : 'text-gray-400'
                    )}
                  >
                    {step.label}
                  </span>
                  {idx < 4 && <div className="h-0.5 w-6 sm:w-12 bg-gray-200 dark:bg-gray-800" />}
                </div>
              );
            })}
          </div>
        </div>

        {/* Modal Body Container */}
        <div className="flex-1 overflow-y-auto p-6 min-h-[380px] max-h-[60vh]">
          
          {/* STEP 1: UPLOAD */}
          {currentStep === 'upload' && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-blue-50/60 p-4 rounded-2xl border border-blue-100 dark:bg-blue-950/20 dark:border-blue-900/40">
                <div className="flex items-center gap-3">
                  <Sparkles className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                  <div>
                    <h4 className="text-sm font-semibold text-blue-950 dark:text-blue-100">Quick Start Template</h4>
                    <p className="text-xs text-blue-700/80 dark:text-blue-300/80">
                      Download our pre-formatted Excel template with example rows.
                    </p>
                  </div>
                </div>
                <button
                  onClick={downloadSampleTemplate}
                  className="flex items-center gap-2 rounded-xl bg-white px-4 py-2 text-xs font-semibold text-blue-700 shadow-sm border border-blue-200 hover:bg-blue-50 dark:bg-gray-900 dark:text-blue-300 dark:border-blue-800 transition-colors"
                >
                  <Download className="h-4 w-4" />
                  <span>Download Sample Template</span>
                </button>
              </div>

              {/* Preset Selection if Available */}
              {presets.length > 0 && (
                <div className="flex items-center gap-3">
                  <label className="text-xs font-semibold text-gray-700 dark:text-gray-300 whitespace-nowrap">
                    Saved Mapping Preset:
                  </label>
                  <select
                    value={selectedPresetId}
                    onChange={(e) => setSelectedPresetId(e.target.value)}
                    className="flex-1 rounded-xl border border-gray-200 bg-white px-3 py-2 text-xs font-semibold text-gray-700 dark:border-gray-800 dark:bg-gray-900 dark:text-gray-200"
                  >
                    <option value="">Auto-Detect Headers (Standard)</option>
                    {presets.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name} {p.isDefault ? '(Default)' : ''}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Dropzone */}
              <div
                onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                onDragLeave={() => setDragOver(false)}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={cn(
                  'flex flex-col items-center justify-center rounded-3xl border-2 border-dashed p-10 text-center cursor-pointer transition-all',
                  dragOver
                    ? 'border-blue-500 bg-blue-50/50 dark:border-blue-400 dark:bg-blue-950/30'
                    : 'border-gray-200 hover:border-blue-400 hover:bg-gray-50/50 dark:border-gray-800 dark:hover:border-gray-700 dark:hover:bg-gray-900/40'
                )}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".xlsx,.xls,.csv"
                  className="hidden"
                  onChange={(e) => {
                    if (e.target.files && e.target.files[0]) {
                      handleFileParse(e.target.files[0]);
                    }
                  }}
                />
                <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-50 text-blue-600 dark:bg-blue-950/60 dark:text-blue-400 shadow-inner">
                  <Upload className="h-8 w-8 animate-bounce" />
                </div>
                <h3 className="text-base font-bold text-gray-900 dark:text-white">
                  Drag & Drop Excel or CSV File Here
                </h3>
                <p className="mt-1 text-xs text-gray-500">Supports .xlsx, .xls, .csv up to 25MB</p>
                <div className="mt-4 inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-blue-700">
                  Browse File
                </div>
              </div>
            </div>
          )}

          {/* STEP 2: COLUMN MAPPING */}
          {currentStep === 'mapping' && (
            <div className="space-y-6">
              {/* File Info Bar */}
              <div className="flex flex-wrap items-center justify-between gap-3 bg-gray-50 p-4 rounded-2xl border border-gray-200 dark:bg-gray-900 dark:border-gray-800">
                <div className="flex items-center gap-3">
                  <div className="rounded-xl bg-blue-100 p-2 text-blue-600 dark:bg-blue-900/50 dark:text-blue-400">
                    <FileSpreadsheet className="h-5 w-5" />
                  </div>
                  <div>
                    <span className="text-sm font-bold text-gray-900 dark:text-white">{fileName}</span>
                    <div className="flex items-center gap-2 text-xs text-gray-500">
                      <span>{rawRows.length} Rows</span>
                      <span>•</span>
                      <span>{detectedHeaders.length} Columns Detected</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setShowSavePreset(!showSavePreset)}
                    className="flex items-center gap-1.5 rounded-xl border border-gray-200 bg-white px-3 py-1.5 text-xs font-semibold text-gray-700 shadow-sm hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200"
                  >
                    <Save className="h-3.5 w-3.5" />
                    <span>Save Mapping</span>
                  </button>
                </div>
              </div>

              {/* Save Preset Drawer */}
              {showSavePreset && (
                <div className="p-4 rounded-2xl bg-blue-50/50 border border-blue-200 dark:bg-blue-950/20 dark:border-blue-800 flex gap-2 items-center">
                  <input
                    type="text"
                    placeholder="Preset Name (e.g. Odell Excel Format)"
                    value={savePresetName}
                    onChange={(e) => setSavePresetName(e.target.value)}
                    className="flex-1 rounded-xl border border-gray-200 bg-white px-3 py-2 text-xs font-semibold text-gray-900 dark:border-gray-700 dark:bg-gray-900 dark:text-white"
                  />
                  <button
                    onClick={handleSavePreset}
                    className="rounded-xl bg-blue-600 px-4 py-2 text-xs font-semibold text-white hover:bg-blue-700"
                  >
                    Save
                  </button>
                </div>
              )}

              {/* Calculation Options */}
              <div className="rounded-2xl border border-gray-200 p-4 bg-white dark:border-gray-800 dark:bg-gray-900">
                <h4 className="text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-2">
                  Calculated Fields (Margin %, Margin Amount, Total)
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <label
                    onClick={() => setCalculationMode('calculate_auto')}
                    className={cn(
                      'flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition-all',
                      calculationMode === 'calculate_auto'
                        ? 'border-blue-500 bg-blue-50/50 dark:border-blue-600 dark:bg-blue-950/30'
                        : 'border-gray-200 dark:border-gray-800'
                    )}
                  >
                    <input
                      type="radio"
                      name="calcMode"
                      checked={calculationMode === 'calculate_auto'}
                      onChange={() => setCalculationMode('calculate_auto')}
                      className="mt-0.5 text-blue-600"
                    />
                    <div>
                      <span className="text-xs font-bold text-gray-900 dark:text-white">Calculate Automatically (Recommended)</span>
                      <p className="text-[11px] text-gray-500">
                        Computes Margin Amount = Selling - Production, Margin % = Profit / Selling.
                      </p>
                    </div>
                  </label>

                  <label
                    onClick={() => setCalculationMode('use_imported')}
                    className={cn(
                      'flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition-all',
                      calculationMode === 'use_imported'
                        ? 'border-blue-500 bg-blue-50/50 dark:border-blue-600 dark:bg-blue-950/30'
                        : 'border-gray-200 dark:border-gray-800'
                    )}
                  >
                    <input
                      type="radio"
                      name="calcMode"
                      checked={calculationMode === 'use_imported'}
                      onChange={() => setCalculationMode('use_imported')}
                      className="mt-0.5 text-blue-600"
                    />
                    <div>
                      <span className="text-xs font-bold text-gray-900 dark:text-white">Use Uploaded File Values</span>
                      <p className="text-[11px] text-gray-500">
                        Imports exact figures from your spreadsheet without recomputing.
                      </p>
                    </div>
                  </label>
                </div>
              </div>

              {/* Mapping Table */}
              <div className="rounded-2xl border border-gray-200 overflow-hidden dark:border-gray-800">
                <table className="w-full text-left text-xs">
                  <thead className="bg-gray-50 text-gray-500 uppercase font-semibold dark:bg-gray-900 dark:text-gray-400">
                    <tr>
                      <th className="p-3">System Field</th>
                      <th className="p-3">Uploaded Header</th>
                      <th className="p-3">Match Confidence</th>
                      <th className="p-3">Sample Preview</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                    {systemFields.map((field) => {
                      const selectedHeader = mappings[field.key] || '';
                      const conf = confidences[field.key] || { score: 0, level: 'low', matchReason: 'Unmapped' };
                      const sampleVal = selectedHeader && rawRows[0] ? rawRows[0][selectedHeader] : '-';

                      return (
                        <tr key={field.key} className="hover:bg-gray-50/60 dark:hover:bg-gray-900/40">
                          <td className="p-3">
                            <div className="flex items-center gap-1.5">
                              <span className="font-bold text-gray-900 dark:text-white">{field.label}</span>
                              {field.required && (
                                <span className="text-red-500 font-bold" title="Required field">*</span>
                              )}
                              {field.isCalculated && (
                                <span className="rounded bg-blue-100 px-1.5 py-0.5 text-[10px] font-semibold text-blue-700 dark:bg-blue-900/40 dark:text-blue-300">
                                  Calculated
                                </span>
                              )}
                            </div>
                            <span className="text-[11px] text-gray-400">{field.description}</span>
                          </td>

                          <td className="p-3">
                            <select
                              value={selectedHeader}
                              onChange={(e) => handleMappingChange(field.key, e.target.value)}
                              className={cn(
                                'w-full rounded-xl border px-3 py-1.5 text-xs font-semibold transition-colors',
                                selectedHeader
                                  ? 'border-blue-200 bg-blue-50/40 text-blue-900 dark:border-blue-800 dark:bg-blue-950/40 dark:text-blue-200'
                                  : 'border-gray-200 bg-white text-gray-500 dark:border-gray-800 dark:bg-gray-900'
                              )}
                            >
                              <option value="">-- Do Not Import / None --</option>
                              {detectedHeaders.map((h) => (
                                <option key={h} value={h}>
                                  {h}
                                </option>
                              ))}
                            </select>
                          </td>

                          <td className="p-3">
                            {selectedHeader ? (
                              <div className="flex items-center gap-2">
                                <span
                                  className={cn(
                                    'inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-bold',
                                    conf.level === 'high'
                                      ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300'
                                      : conf.level === 'medium'
                                      ? 'bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300'
                                      : 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400'
                                  )}
                                >
                                  {conf.score}% {conf.level.toUpperCase()}
                                </span>
                                <span className="text-[10px] text-gray-400 hidden sm:inline-block">
                                  {conf.matchReason}
                                </span>
                              </div>
                            ) : (
                              <span className="text-gray-400 italic">None</span>
                            )}
                          </td>

                          <td className="p-3 font-mono text-gray-600 dark:text-gray-300 truncate max-w-[120px]">
                            {sampleVal !== undefined && sampleVal !== '' ? String(sampleVal) : '-'}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Unmapped Headers Section */}
              {unmappedHeaders.length > 0 && (
                <div className="rounded-2xl border border-dashed border-gray-300 p-4 bg-gray-50/50 dark:border-gray-800 dark:bg-gray-900/30">
                  <h4 className="text-xs font-bold text-gray-600 dark:text-gray-300 mb-1">
                    Unmapped Extra Columns ({unmappedHeaders.length})
                  </h4>
                  <p className="text-[11px] text-gray-500 mb-3">
                    These uploaded columns will be safely preserved in order metadata notes.
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {unmappedHeaders.map((uh) => (
                      <span
                        key={uh}
                        className="rounded-lg bg-gray-200 px-2.5 py-1 text-xs font-medium text-gray-700 dark:bg-gray-800 dark:text-gray-300"
                      >
                        {uh}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* STEP 3: BATCH RESOLUTION & DUPLICATE RULES */}
          {currentStep === 'batch_duplicate' && (
            <div className="space-y-6">
              {/* Unknown Batches Section */}
              {unknownBatches.length > 0 && (
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <Database className="h-5 w-5 text-amber-500" />
                    <div>
                      <h3 className="text-sm font-bold text-gray-900 dark:text-white">
                        Unknown Batch Numbers Detected ({unknownBatches.length})
                      </h3>
                      <p className="text-xs text-gray-500">
                        The following batch names are not present in your existing production inventory. Choose how to handle each:
                      </p>
                    </div>
                  </div>

                  <div className="rounded-2xl border border-gray-200 overflow-hidden dark:border-gray-800">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-gray-50 text-gray-500 uppercase font-semibold dark:bg-gray-900">
                        <tr>
                          <th className="p-3">Batch Name in File</th>
                          <th className="p-3">Occurrences</th>
                          <th className="p-3">Action to Take</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                        {unknownBatches.map((ub) => {
                          const currentRes = batchResolutions[ub.name] || { action: 'create' };

                          return (
                            <tr key={ub.name} className="hover:bg-gray-50/50 dark:hover:bg-gray-900/30">
                              <td className="p-3 font-bold text-gray-900 dark:text-white">
                                {ub.name}
                              </td>
                              <td className="p-3 text-gray-600 dark:text-gray-400">
                                {ub.occurrenceCount} row(s) (Rows: {ub.sampleRows.join(', ')})
                              </td>
                              <td className="p-3 flex items-center gap-3">
                                <select
                                  value={currentRes.action}
                                  onChange={(e) =>
                                    setBatchResolutions((prev) => ({
                                      ...prev,
                                      [ub.name]: { ...prev[ub.name], action: e.target.value as any },
                                    }))
                                  }
                                  className="rounded-xl border border-gray-200 bg-white px-3 py-1.5 text-xs font-semibold text-gray-700 dark:border-gray-800 dark:bg-gray-900 dark:text-gray-200"
                                >
                                  <option value="create">Auto-Create Batch Record</option>
                                  <option value="map">Map to Existing Batch</option>
                                  <option value="preserve_notes">Preserve Name in Order Notes</option>
                                </select>

                                {currentRes.action === 'map' && (
                                  <select
                                    value={currentRes.targetBatchId || ''}
                                    onChange={(e) =>
                                      setBatchResolutions((prev) => ({
                                        ...prev,
                                        [ub.name]: { ...prev[ub.name], targetBatchId: e.target.value },
                                      }))
                                    }
                                    className="rounded-xl border border-blue-200 bg-blue-50 px-3 py-1.5 text-xs font-semibold text-blue-900 dark:border-blue-800 dark:bg-blue-950 dark:text-blue-200"
                                  >
                                    <option value="">Select Existing Batch...</option>
                                    {existingBatches.map((eb) => (
                                      <option key={eb.id} value={eb.id}>
                                        {eb.batchNumber}
                                      </option>
                                    ))}
                                  </select>
                                )}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Import Mode Selector */}
              <div className="rounded-2xl border border-gray-200 p-4 bg-white dark:border-gray-800 dark:bg-gray-900 space-y-3">
                <div>
                  <h4 className="text-sm font-bold text-gray-900 dark:text-white">Import Mode & Duplicate Strategy</h4>
                  <p className="text-xs text-gray-500">
                    Choose how records matching existing database orders should be processed.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {[
                    {
                      id: 'ADD_NEW',
                      title: 'Add New Only',
                      desc: 'Creates new records; skips any matching duplicates.',
                    },
                    {
                      id: 'UPDATE_EXISTING',
                      title: 'Update Existing Only',
                      desc: 'Updates matched records only; ignores new ones.',
                    },
                    {
                      id: 'ADD_AND_UPDATE',
                      title: 'Add + Update',
                      desc: 'Creates new records and updates matching duplicates.',
                    },
                  ].map((m) => (
                    <label
                      key={m.id}
                      onClick={() => setImportMode(m.id as any)}
                      className={cn(
                        'flex flex-col p-3 rounded-2xl border cursor-pointer transition-all',
                        importMode === m.id
                          ? 'border-blue-600 bg-blue-50/60 dark:border-blue-500 dark:bg-blue-950/40 ring-2 ring-blue-500/20'
                          : 'border-gray-200 hover:bg-gray-50 dark:border-gray-800 dark:hover:bg-gray-800/40'
                      )}
                    >
                      <div className="flex items-center gap-2">
                        <input
                          type="radio"
                          name="importMode"
                          checked={importMode === m.id}
                          onChange={() => setImportMode(m.id as any)}
                          className="text-blue-600"
                        />
                        <span className="text-xs font-bold text-gray-900 dark:text-white">{m.title}</span>
                      </div>
                      <p className="mt-1 text-[11px] text-gray-500">{m.desc}</p>
                    </label>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* STEP 4: PREVIEW & VALIDATION */}
          {currentStep === 'preview' && (
            <div className="space-y-4">
              {/* Summary Metric Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                <div className="rounded-2xl border border-gray-200 bg-white p-3 dark:border-gray-800 dark:bg-gray-900">
                  <span className="text-xs text-gray-500">Total Rows</span>
                  <p className="text-xl font-bold text-gray-900 dark:text-white">{summary.totalRows}</p>
                </div>
                <div className="rounded-2xl border border-emerald-100 bg-emerald-50/50 p-3 dark:border-emerald-950 dark:bg-emerald-950/20">
                  <span className="text-xs text-emerald-600 dark:text-emerald-400 font-semibold">Valid</span>
                  <p className="text-xl font-bold text-emerald-700 dark:text-emerald-300">{summary.validCount}</p>
                </div>
                <div className="rounded-2xl border border-amber-100 bg-amber-50/50 p-3 dark:border-amber-950 dark:bg-amber-950/20">
                  <span className="text-xs text-amber-600 dark:text-amber-400 font-semibold">Warnings</span>
                  <p className="text-xl font-bold text-amber-700 dark:text-amber-300">{summary.warningCount}</p>
                </div>
                <div className="rounded-2xl border border-red-100 bg-red-50/50 p-3 dark:border-red-950 dark:bg-red-950/20">
                  <span className="text-xs text-red-600 dark:text-red-400 font-semibold">Errors</span>
                  <p className="text-xl font-bold text-red-700 dark:text-red-300">{summary.errorCount}</p>
                </div>
                <div className="rounded-2xl border border-purple-100 bg-purple-50/50 p-3 dark:border-purple-950 dark:bg-purple-950/20">
                  <span className="text-xs text-purple-600 dark:text-purple-400 font-semibold">Duplicates</span>
                  <p className="text-xl font-bold text-purple-700 dark:text-purple-300">{summary.duplicateCount}</p>
                </div>
              </div>

              {/* Filters & Actions Bar */}
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-1.5 bg-gray-100 p-1 rounded-xl dark:bg-gray-900">
                  {(['all', 'valid', 'warning', 'error', 'duplicate'] as const).map((f) => (
                    <button
                      key={f}
                      onClick={() => setPreviewFilter(f)}
                      className={cn(
                        'rounded-lg px-3 py-1 text-xs font-semibold capitalize transition-all',
                        previewFilter === f
                          ? 'bg-white text-gray-900 shadow-xs dark:bg-gray-800 dark:text-white'
                          : 'text-gray-500 hover:text-gray-900 dark:text-gray-400'
                      )}
                    >
                      {f}
                    </button>
                  ))}
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    placeholder="Search preview rows..."
                    value={previewSearch}
                    onChange={(e) => setPreviewSearch(e.target.value)}
                    className="rounded-xl border border-gray-200 bg-white px-3 py-1.5 text-xs text-gray-900 dark:border-gray-800 dark:bg-gray-900 dark:text-white"
                  />
                  {summary.errorCount > 0 && (
                    <button
                      onClick={downloadErrorReport}
                      className="flex items-center gap-1.5 rounded-xl border border-red-200 bg-red-50 px-3 py-1.5 text-xs font-semibold text-red-700 hover:bg-red-100 dark:border-red-900 dark:bg-red-950/50 dark:text-red-300"
                    >
                      <Download className="h-3.5 w-3.5" />
                      <span>Download Error Report</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Preview Table with Horizontal Scroll */}
              <div className="rounded-2xl border border-gray-200 overflow-x-auto max-h-[300px] dark:border-gray-800">
                <table className="w-full text-left text-xs whitespace-nowrap">
                  <thead className="bg-gray-50 text-gray-500 uppercase font-semibold sticky top-0 z-10 dark:bg-gray-900 dark:text-gray-400">
                    <tr>
                      <th className="p-2.5">Row</th>
                      <th className="p-2.5">Status</th>
                      <th className="p-2.5">Customer Name</th>
                      <th className="p-2.5">Batch</th>
                      <th className="p-2.5">Order Date</th>
                      <th className="p-2.5">Type</th>
                      <th className="p-2.5 text-right">Qty (KG)</th>
                      <th className="p-2.5 text-right">Prod Cost</th>
                      <th className="p-2.5 text-right">Selling Cost</th>
                      <th className="p-2.5 text-right">Margin %</th>
                      <th className="p-2.5 text-right">Total</th>
                      <th className="p-2.5">Order Status</th>
                      <th className="p-2.5">Details / Issues</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                    {filteredPreviewRows.length === 0 ? (
                      <tr>
                        <td colSpan={13} className="p-8 text-center text-gray-400">
                          No rows match the selected filter.
                        </td>
                      </tr>
                    ) : (
                      filteredPreviewRows.map((r) => {
                        const d = r.normalizedData;
                        return (
                          <tr
                            key={r.rowIndex}
                            className={cn(
                              'hover:bg-gray-50/60 dark:hover:bg-gray-900/40',
                              !r.isValid && 'bg-red-50/30 dark:bg-red-950/20',
                              r.isDuplicate && 'bg-purple-50/30 dark:bg-purple-950/20'
                            )}
                          >
                            <td className="p-2.5 font-mono text-gray-500">{r.rowIndex}</td>
                            <td className="p-2.5">
                              {!r.isValid ? (
                                <span className="inline-flex items-center gap-1 text-red-600 font-bold">
                                  <XCircle className="h-3.5 w-3.5" /> Error
                                </span>
                              ) : r.isDuplicate ? (
                                <span className="inline-flex items-center gap-1 text-purple-600 font-bold">
                                  <Copy className="h-3.5 w-3.5" /> Duplicate
                                </span>
                              ) : r.warnings.length > 0 ? (
                                <span className="inline-flex items-center gap-1 text-amber-600 font-bold">
                                  <AlertTriangle className="h-3.5 w-3.5" /> Warning
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 text-emerald-600 font-bold">
                                  <CheckCircle2 className="h-3.5 w-3.5" /> Valid
                                </span>
                              )}
                            </td>
                            <td className="p-2.5 font-bold text-gray-900 dark:text-white">{d.customerName}</td>
                            <td className="p-2.5 text-blue-600 dark:text-blue-400 font-semibold">{d.batchUsed || '-'}</td>
                            <td className="p-2.5">{d.orderDate}</td>
                            <td className="p-2.5">{d.type}</td>
                            <td className="p-2.5 text-right font-mono font-semibold">{d.quantity} KG</td>
                            <td className="p-2.5 text-right font-mono">₹{d.productionCost.toLocaleString()}</td>
                            <td className="p-2.5 text-right font-mono">₹{d.sellingCost.toLocaleString()}</td>
                            <td className="p-2.5 text-right font-mono font-bold text-emerald-600 dark:text-emerald-400">{d.marginPct}%</td>
                            <td className="p-2.5 text-right font-mono font-bold text-gray-900 dark:text-white">₹{d.totalSellingCost.toLocaleString()}</td>
                            <td className="p-2.5">
                              <span className="rounded-md bg-gray-100 px-2 py-0.5 font-semibold text-gray-700 dark:bg-gray-800 dark:text-gray-300">
                                {d.status}
                              </span>
                            </td>
                            <td className="p-2.5 text-xs">
                              {r.errors.length > 0 ? (
                                <span className="text-red-600 font-medium">
                                  {r.errors.map((e) => `${e.field}: ${e.message}`).join('; ')}
                                </span>
                              ) : r.warnings.length > 0 ? (
                                <span className="text-amber-600">
                                  {r.warnings.map((w) => w.message).join('; ')}
                                </span>
                              ) : r.isDuplicate ? (
                                <span className="text-purple-600">{r.duplicateDetails}</span>
                              ) : (
                                <span className="text-emerald-600">Ready for Import</span>
                              )}
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* STEP 5: IMPORTING PROGRESS */}
          {currentStep === 'importing' && (
            <div className="flex flex-col items-center justify-center py-12 space-y-6 text-center">
              <div className="relative flex h-20 w-20 items-center justify-center">
                <div className="absolute inset-0 rounded-full border-4 border-blue-100 border-t-blue-600 animate-spin dark:border-blue-950 dark:border-t-blue-400" />
                <FileSpreadsheet className="h-8 w-8 text-blue-600 dark:text-blue-400 animate-pulse" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-900 dark:text-white">Processing Transactional Import...</h3>
                <p className="text-xs text-gray-500">Creating customer records, resolving batches, and inserting orders</p>
              </div>
              <div className="w-full max-w-md bg-gray-100 rounded-full h-3 overflow-hidden dark:bg-gray-800">
                <div
                  className="bg-blue-600 h-full rounded-full transition-all duration-300"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <span className="text-xs font-bold text-gray-700 dark:text-gray-300 font-mono">{progress}% Complete</span>
            </div>
          )}

          {/* STEP 6: RESULT SUMMARY */}
          {currentStep === 'result' && executionResult && (
            <div className="space-y-6 py-4">
              <div className="text-center space-y-2">
                <div className="inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-400 shadow-inner">
                  <CheckCircle2 className="h-8 w-8" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white">Import Processed Successfully</h3>
                <p className="text-xs text-gray-500">
                  Import ID: <span className="font-mono font-bold text-blue-600 dark:text-blue-400">{executionResult.importId}</span>
                </p>
              </div>

              {/* Metric Breakdown */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="rounded-2xl border border-emerald-100 bg-emerald-50/50 p-4 text-center dark:border-emerald-900 dark:bg-emerald-950/30">
                  <span className="text-xs text-emerald-600 font-semibold">Created</span>
                  <p className="text-2xl font-bold text-emerald-700 dark:text-emerald-300">{executionResult.createdCount}</p>
                </div>
                <div className="rounded-2xl border border-blue-100 bg-blue-50/50 p-4 text-center dark:border-blue-900 dark:bg-blue-950/30">
                  <span className="text-xs text-blue-600 font-semibold">Updated</span>
                  <p className="text-2xl font-bold text-blue-700 dark:text-blue-300">{executionResult.updatedCount}</p>
                </div>
                <div className="rounded-2xl border border-gray-200 bg-gray-50/50 p-4 text-center dark:border-gray-800 dark:bg-gray-900/30">
                  <span className="text-xs text-gray-500 font-semibold">Skipped</span>
                  <p className="text-2xl font-bold text-gray-700 dark:text-gray-300">{executionResult.skippedCount}</p>
                </div>
                <div className="rounded-2xl border border-red-100 bg-red-50/50 p-4 text-center dark:border-red-900 dark:bg-red-950/30">
                  <span className="text-xs text-red-600 font-semibold">Failed</span>
                  <p className="text-2xl font-bold text-red-700 dark:text-red-300">{executionResult.failedCount}</p>
                </div>
              </div>

              {executionResult.failedCount > 0 && (
                <div className="flex justify-center">
                  <button
                    onClick={downloadErrorReport}
                    className="flex items-center gap-2 rounded-xl bg-red-600 px-4 py-2 text-xs font-semibold text-white hover:bg-red-700 shadow-sm"
                  >
                    <Download className="h-4 w-4" />
                    <span>Download Failed Records Error Report</span>
                  </button>
                </div>
              )}
            </div>
          )}

        </div>

        {/* Modal Footer Controls */}
        <div className="flex-none border-t border-gray-200 bg-gray-50/80 px-6 py-4 dark:border-gray-800 dark:bg-gray-900/60 flex items-center justify-between">
          <div>
            {currentStep !== 'upload' && currentStep !== 'result' && currentStep !== 'importing' && (
              <button
                onClick={() => {
                  if (currentStep === 'mapping') setCurrentStep('upload');
                  else if (currentStep === 'batch_duplicate') setCurrentStep('mapping');
                  else if (currentStep === 'preview') setCurrentStep(unknownBatches.length > 0 ? 'batch_duplicate' : 'mapping');
                }}
                className="flex items-center gap-1.5 rounded-xl border border-gray-200 bg-white px-4 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-100 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200"
              >
                <ArrowLeft className="h-4 w-4" />
                <span>Back</span>
              </button>
            )}
          </div>

          <div className="flex items-center gap-3">
            {currentStep === 'result' ? (
              <button
                onClick={onClose}
                className="rounded-xl bg-blue-600 px-6 py-2.5 text-xs font-semibold text-white shadow-sm hover:bg-blue-700"
              >
                Done & View Orders
              </button>
            ) : (
              <>
                <button
                  onClick={onClose}
                  disabled={isLoading && currentStep === 'importing'}
                  className="rounded-xl border border-gray-200 bg-white px-4 py-2 text-xs font-semibold text-gray-600 hover:bg-gray-100 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300"
                >
                  Cancel
                </button>

                {currentStep === 'mapping' && (
                  <button
                    onClick={handleRunValidation}
                    disabled={isLoading || !mappings.customerName || !mappings.quantity}
                    className="flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-2 text-xs font-semibold text-white shadow-sm hover:bg-blue-700 disabled:opacity-50"
                  >
                    <span>Validate Data</span>
                    <ArrowRight className="h-4 w-4" />
                  </button>
                )}

                {currentStep === 'batch_duplicate' && (
                  <button
                    onClick={() => setCurrentStep('preview')}
                    className="flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-2 text-xs font-semibold text-white shadow-sm hover:bg-blue-700"
                  >
                    <span>Continue to Preview</span>
                    <ArrowRight className="h-4 w-4" />
                  </button>
                )}

                {currentStep === 'preview' && (
                  <button
                    onClick={handleExecuteImport}
                    disabled={isLoading || summary.validCount === 0}
                    className="flex items-center gap-2 rounded-xl bg-blue-600 px-6 py-2.5 text-xs font-semibold text-white shadow-sm hover:bg-blue-700 disabled:opacity-50"
                  >
                    <Check className="h-4 w-4" />
                    <span>Confirm & Import ({summary.validCount} Orders)</span>
                  </button>
                )}
              </>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
