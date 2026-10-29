import React, { useState } from 'react';
import {
  getSupabaseConfig,
  getPaymentConfig,
  testSupabaseConnection,
  syncOrderToSupabase,
  SUPABASE_PROJECT_ID,
  DEFAULT_SUPABASE_ANON_KEY,
} from '../../lib/supabase';
import { StorageService } from '../../lib/storage';
import {
  X,
  Check,
  Copy,
  Database,
  CreditCard,
  ShieldCheck,
  ExternalLink,
  RefreshCw,
  AlertCircle,
  UploadCloud,
} from 'lucide-react';

interface SetupGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SetupGuideModal: React.FC<SetupGuideModalProps> = ({ isOpen, onClose }) => {
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [testingConnection, setTestingConnection] = useState(false);
  const [connectionResult, setConnectionResult] = useState<{
    connected: boolean;
    tableExists: boolean;
    message: string;
    count?: number;
  } | null>(null);

  const [syncingOrders, setSyncingOrders] = useState(false);
  const [syncResult, setSyncResult] = useState<string | null>(null);

  if (!isOpen) return null;

  const supabaseConfig = getSupabaseConfig();
  const paymentConfig = getPaymentConfig();

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(id);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const handleTestConnection = async () => {
    setTestingConnection(true);
    setConnectionResult(null);
    try {
      const res = await testSupabaseConnection();
      setConnectionResult(res);
    } catch (e: any) {
      setConnectionResult({
        connected: false,
        tableExists: false,
        message: e.message || 'Connection test failed',
      });
    } finally {
      setTestingConnection(false);
    }
  };

  const handleSyncAllOrders = async () => {
    setSyncingOrders(true);
    setSyncResult(null);
    try {
      const orders = StorageService.getOrders();
      let successCount = 0;
      let failureReason = '';

      for (const order of orders) {
        const res = await syncOrderToSupabase(order);
        if (res.success) {
          successCount++;
        } else if (res.error) {
          failureReason = res.error;
        }
      }

      if (successCount === orders.length) {
        setSyncResult(`All ${orders.length} orders synced successfully to Supabase!`);
      } else if (successCount > 0) {
        setSyncResult(`Synced ${successCount}/${orders.length} orders. Note: ${failureReason}`);
      } else {
        setSyncResult(`Sync pending: ${failureReason || 'Make sure the orders table is created in Supabase'}`);
      }
    } catch (err: any) {
      setSyncResult(`Sync error: ${err.message || String(err)}`);
    } finally {
      setSyncingOrders(false);
    }
  };

  const ordersTableSql = `-- Run this in your Supabase SQL Editor (supabase.com/dashboard/project/${SUPABASE_PROJECT_ID}/sql)
CREATE TABLE IF NOT EXISTS public.orders (
    id TEXT PRIMARY KEY,
    order_number TEXT NOT NULL,
    student_name TEXT,
    student_email TEXT,
    student_phone TEXT,
    pickup_slot TEXT,
    items JSONB,
    subtotal NUMERIC,
    tax_amount NUMERIC,
    total_amount NUMERIC,
    payment_method TEXT,
    payment_status TEXT,
    order_status TEXT,
    pickup_code TEXT,
    pickup_counter TEXT DEFAULT 'Counter 1',
    special_instructions TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable Row Level Security and allow public read/write with anon key
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public insert to orders" ON public.orders 
FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow public select on orders" ON public.orders 
FOR SELECT USING (true);

CREATE POLICY "Allow public update on orders" ON public.orders 
FOR UPDATE USING (true);`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/65 backdrop-blur-xs overflow-y-auto animate-in fade-in duration-200">
      <div
        className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl border border-stone-200 overflow-hidden flex flex-col my-8 max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-5 border-b border-stone-200 bg-stone-50/90 flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-emerald-800 uppercase tracking-wider block">
              Supabase Project Integration
            </span>
            <h2 className="text-lg font-bold text-stone-900 mt-0.5">
              Connected Supabase Database
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-stone-400 hover:text-stone-800 rounded-md transition-colors"
            aria-label="Close setup guide"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-6 overflow-y-auto text-xs text-stone-700">
          {/* Active Connection Card */}
          <div className="p-4 rounded-xl border border-emerald-300 bg-emerald-50/60 space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="flex items-center gap-2.5">
                <Database className="w-5 h-5 text-emerald-700 shrink-0" />
                <div>
                  <span className="font-extrabold text-stone-900 text-sm block">
                    Supabase Project: {SUPABASE_PROJECT_ID}
                  </span>
                  <span className="text-emerald-800 font-mono text-[11px] block">
                    {supabaseConfig.supabaseUrl}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={handleTestConnection}
                  disabled={testingConnection}
                  className="px-3 py-1.5 bg-emerald-700 hover:bg-emerald-800 disabled:opacity-50 text-white rounded-lg font-bold text-xs flex items-center gap-1.5 transition-colors shadow-2xs"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${testingConnection ? 'animate-spin' : ''}`} />
                  <span>{testingConnection ? 'Testing...' : 'Test Connection'}</span>
                </button>
                <button
                  onClick={handleSyncAllOrders}
                  disabled={syncingOrders}
                  className="px-3 py-1.5 bg-stone-900 hover:bg-stone-800 disabled:opacity-50 text-white rounded-lg font-bold text-xs flex items-center gap-1.5 transition-colors shadow-2xs"
                >
                  <UploadCloud className="w-3.5 h-3.5 text-emerald-400" />
                  <span>{syncingOrders ? 'Syncing...' : 'Sync All Orders'}</span>
                </button>
              </div>
            </div>

            {/* Test result display */}
            {connectionResult && (
              <div
                className={`p-3 rounded-lg text-xs flex items-start gap-2 ${
                  connectionResult.tableExists
                    ? 'bg-emerald-100/80 text-emerald-900 border border-emerald-300'
                    : 'bg-amber-100/80 text-amber-950 border border-amber-300'
                }`}
              >
                {connectionResult.tableExists ? (
                  <Check className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5" />
                ) : (
                  <AlertCircle className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
                )}
                <div>
                  <span className="font-bold block">
                    {connectionResult.tableExists
                      ? 'Connection & Table Verified!'
                      : 'Connected to Supabase Project!'}
                  </span>
                  <p className="mt-0.5 leading-relaxed">{connectionResult.message}</p>
                </div>
              </div>
            )}

            {syncResult && (
              <div className="p-2.5 rounded-lg bg-blue-50 text-blue-900 border border-blue-200 text-xs flex items-center gap-2">
                <UploadCloud className="w-4 h-4 text-blue-600 shrink-0" />
                <span>{syncResult}</span>
              </div>
            )}
          </div>

          {/* Quick 1-Click SQL Setup Script */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-bold text-stone-900 text-sm">
                  1-Click Supabase Table Setup Script
                </h3>
                <span className="text-[11px] text-stone-500">
                  Run this in your Supabase SQL Editor once to collect all order records.
                </span>
              </div>
              <button
                onClick={() => handleCopy(ordersTableSql, 'sql')}
                className="px-3 py-1.5 bg-stone-100 hover:bg-stone-200 text-stone-800 font-bold rounded-lg text-xs flex items-center gap-1.5 transition-colors border border-stone-200"
              >
                {copiedKey === 'sql' ? (
                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                ) : (
                  <Copy className="w-3.5 h-3.5" />
                )}
                <span>{copiedKey === 'sql' ? 'Copied SQL!' : 'Copy SQL Script'}</span>
              </button>
            </div>

            <pre className="p-3.5 bg-stone-900 text-emerald-300 rounded-xl font-mono text-[11px] overflow-x-auto leading-relaxed border border-stone-800 max-h-48">
              {ordersTableSql}
            </pre>
          </div>

          {/* Instructions */}
          <div className="space-y-2">
            <h4 className="font-bold text-stone-900 text-xs">Steps to View Orders in Supabase:</h4>
            <ol className="list-decimal pl-4 space-y-1.5 text-stone-600 leading-relaxed">
              <li>
                Visit{' '}
                <a
                  href={`https://supabase.com/dashboard/project/${SUPABASE_PROJECT_ID}/sql`}
                  target="_blank"
                  rel="noreferrer"
                  className="font-semibold text-emerald-800 underline inline-flex items-center gap-0.5"
                >
                  <span>Supabase SQL Editor ({SUPABASE_PROJECT_ID})</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </li>
              <li>Click <strong>New Query</strong>, paste the copied SQL script above, and click <strong>Run</strong>.</li>
              <li>
                Go to the{' '}
                <a
                  href={`https://supabase.com/dashboard/project/${SUPABASE_PROJECT_ID}/editor`}
                  target="_blank"
                  rel="noreferrer"
                  className="font-semibold text-emerald-800 underline inline-flex items-center gap-0.5"
                >
                  <span>Table Editor &gt; orders</span>
                  <ExternalLink className="w-3 h-3" />
                </a>{' '}
                to see live incoming orders from students in real-time!
              </li>
            </ol>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-stone-50 border-t border-stone-200 flex items-center justify-between">
          <span className="text-[11px] text-stone-500">
            Every placed order automatically syncs to Supabase.
          </span>
          <button
            onClick={onClose}
            className="px-5 py-2 bg-stone-900 hover:bg-stone-800 text-white rounded-lg text-xs font-bold transition-colors"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
