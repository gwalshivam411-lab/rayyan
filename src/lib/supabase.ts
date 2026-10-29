import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { Order } from '../types';

export const SUPABASE_PROJECT_ID = 'epkaobwkhfauwfdiklwl';
export const DEFAULT_SUPABASE_URL = `https://${SUPABASE_PROJECT_ID}.supabase.co`;
export const DEFAULT_SUPABASE_ANON_KEY = 'sb_publishable_yHUSUmhSTuZ9NACY2kPG3A_ERV21Kfq';

export interface SupabaseConfigStatus {
  isConfigured: boolean;
  projectId: string;
  supabaseUrl: string;
  hasAnonKey: boolean;
}

export function getSupabaseConfig(): SupabaseConfigStatus {
  const envUrl = import.meta.env.VITE_SUPABASE_URL;
  const envKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

  const supabaseUrl = envUrl || DEFAULT_SUPABASE_URL;
  const anonKey = envKey || DEFAULT_SUPABASE_ANON_KEY;

  const isConfigured = Boolean(
    supabaseUrl &&
    anonKey &&
    supabaseUrl !== 'https://your-project.supabase.co' &&
    anonKey !== 'your-anon-public-key'
  );

  return {
    isConfigured,
    projectId: SUPABASE_PROJECT_ID,
    supabaseUrl,
    hasAnonKey: Boolean(anonKey),
  };
}

let supabaseInstance: SupabaseClient | null = null;

export function getSupabaseClient(): SupabaseClient | null {
  if (supabaseInstance) return supabaseInstance;

  const config = getSupabaseConfig();
  if (!config.isConfigured) return null;

  try {
    const key = import.meta.env.VITE_SUPABASE_ANON_KEY || DEFAULT_SUPABASE_ANON_KEY;
    supabaseInstance = createClient(config.supabaseUrl, key);
    return supabaseInstance;
  } catch (err) {
    console.error('Failed to initialize Supabase client:', err);
    return null;
  }
}

export const supabase = getSupabaseClient();

/**
 * Test connectivity with user's Supabase project
 */
export async function testSupabaseConnection(): Promise<{
  connected: boolean;
  tableExists: boolean;
  message: string;
  count?: number;
}> {
  const client = getSupabaseClient();
  if (!client) {
    return {
      connected: false,
      tableExists: false,
      message: 'Supabase client is not initialized.',
    };
  }

  try {
    // Attempt querying the 'orders' table
    const { data, error, count } = await client
      .from('orders')
      .select('id', { count: 'exact', head: true });

    if (error) {
      if (error.code === '42P01' || error.message.includes('relation "orders" does not exist') || error.message.includes('not found')) {
        return {
          connected: true,
          tableExists: false,
          message: 'Connected to Supabase project epkaobwkhfauwfdiklwl! Please run the SQL schema script to create the orders table.',
        };
      }
      return {
        connected: true,
        tableExists: false,
        message: `Connected to Supabase. Table query notice: ${error.message}`,
      };
    }

    return {
      connected: true,
      tableExists: true,
      count: count ?? 0,
      message: `Successfully connected to Supabase! 'orders' table is active with ${count ?? 0} existing records.`,
    };
  } catch (err: any) {
    return {
      connected: false,
      tableExists: false,
      message: `Connection error: ${err.message || String(err)}`,
    };
  }
}

/**
 * Send an order to Supabase to collect data in the cloud
 */
export async function syncOrderToSupabase(order: Order): Promise<{ success: boolean; error?: string }> {
  const client = getSupabaseClient();
  if (!client) {
    return { success: false, error: 'Supabase client not initialized' };
  }

  try {
    const payload = {
      id: order.id,
      order_number: order.orderNumber,
      student_name: order.studentName,
      student_email: order.studentEmail || null,
      student_phone: order.studentPhone || null,
      pickup_slot: order.pickupSlotDisplay,
      items: order.items,
      subtotal: order.subtotal,
      tax_amount: order.taxAmount,
      total_amount: order.totalAmount,
      payment_method: order.paymentMethod,
      payment_status: order.paymentStatus,
      order_status: order.orderStatus,
      pickup_code: order.pickupCode,
      pickup_counter: order.pickupCounter || 'Counter 1',
      special_instructions: order.specialInstructions || null,
      created_at: order.createdAt,
    };

    const { error } = await client.from('orders').upsert(payload);

    if (error) {
      console.warn('Could not sync order to Supabase (table may not be created yet):', error.message);
      return { success: false, error: error.message };
    }

    console.log('Order successfully synced to Supabase project epkaobwkhfauwfdiklwl:', order.orderNumber);
    return { success: true };
  } catch (err: any) {
    console.error('Error syncing order to Supabase:', err);
    return { success: false, error: err.message || String(err) };
  }
}

/**
 * Fetch orders from Supabase if table is populated
 */
export async function fetchOrdersFromSupabase(): Promise<Order[] | null> {
  const client = getSupabaseClient();
  if (!client) return null;

  try {
    const { data, error } = await client
      .from('orders')
      .select('*')
      .order('created_at', { ascending: false });

    if (error || !data) return null;

    return data.map((row: any) => ({
      id: row.id,
      orderNumber: row.order_number || row.orderNumber,
      studentId: row.student_id || 'std-cloud',
      studentName: row.student_name || 'Campus Student',
      studentEmail: row.student_email || '',
      studentPhone: row.student_phone || '',
      pickupSlotId: row.pickup_slot_id || 'slot-cloud',
      pickupSlotDisplay: row.pickup_slot || row.pickupSlotDisplay || 'Break Slot',
      items: Array.isArray(row.items) ? row.items : [],
      subtotal: Number(row.subtotal) || 0,
      taxAmount: Number(row.tax_amount) || 0,
      fees: Number(row.fees) || 0,
      discountAmount: Number(row.discount_amount) || 0,
      totalAmount: Number(row.total_amount) || 0,
      paymentMethod: row.payment_method || 'cash_on_pickup',
      paymentStatus: row.payment_status || 'completed',
      orderStatus: row.order_status || 'placed',
      pickupCode: row.pickup_code || '0000',
      pickupCounter: row.pickup_counter || 'Counter 1',
      specialInstructions: row.special_instructions || '',
      createdAt: row.created_at || new Date().toISOString(),
    }));
  } catch (err) {
    console.warn('Could not fetch from Supabase:', err);
    return null;
  }
}

// Payment provider configuration
export function getPaymentConfig() {
  const rzpKey = import.meta.env.VITE_RAZORPAY_KEY_ID || null;
  const isRealRazorpay = Boolean(
    rzpKey &&
    rzpKey !== 'rzp_test_YourTestKeyIdHere'
  );

  return {
    isRealRazorpay,
    razorpayKeyId: rzpKey || 'rzp_test_campusbite_demo',
    isTestMode: true,
  };
}
