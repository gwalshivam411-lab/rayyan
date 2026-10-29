export type UserRole = 'student' | 'staff' | 'admin';

export interface UserProfile {
  id: string;
  fullName: string;
  email: string;
  phone?: string;
  studentId?: string;
  role: UserRole;
  createdAt: string;
}

export type DietaryType = 'veg' | 'non-veg' | 'vegan' | 'egg';

export interface Category {
  id: string;
  name: string;
  slug: string;
  description?: string;
  sortOrder: number;
  isActive: boolean;
}

export interface MenuItem {
  id: string;
  categoryId: string;
  name: string;
  description: string;
  price: number; // in INR
  imageType: 'dosa' | 'thali' | 'burger' | 'coffee' | 'snack' | 'noodle' | 'beverage' | 'dessert' | 'custom';
  imageUrl?: string;
  dietaryType: DietaryType;
  isSpicy?: boolean;
  isSpecialToday?: boolean;
  preparationTimeMinutes: number;
  stockQuantity: number;
  isAvailable: boolean;
  isActive: boolean;
  allergenInformation?: string;
  tags?: string[];
  totalSold?: number;
}

export interface PickupSlot {
  id: string;
  slotDate: string; // YYYY-MM-DD
  startTime: string; // HH:MM
  endTime: string; // HH:MM
  capacity: number;
  reservedCount: number;
  isOpen: boolean;
  isRecommended?: boolean;
}

export type OrderStatus =
  | 'pending_payment'
  | 'placed'
  | 'accepted'
  | 'preparing'
  | 'ready'
  | 'collected'
  | 'cancelled'
  | 'rejected';

export type PaymentStatus = 'pending' | 'completed' | 'failed' | 'refunded' | 'due_on_pickup';

export type PaymentMethod = 'razorpay' | 'cash_on_pickup';

export interface OrderItem {
  id: string;
  orderId: string;
  menuItemId: string;
  itemName: string;
  unitPrice: number;
  quantity: number;
  lineTotal: number;
  specialInstructions?: string;
  dietaryType: DietaryType;
}

export interface Order {
  id: string;
  orderNumber: string; // e.g. #CB-4829
  studentId: string;
  studentName: string;
  studentPhone?: string;
  studentEmail?: string;
  pickupSlotId: string;
  pickupSlotDisplay: string; // e.g. "12:30 PM - 12:45 PM"
  items: OrderItem[];
  subtotal: number;
  taxAmount: number;
  fees: number;
  discountAmount: number;
  totalAmount: number;
  paymentMethod: PaymentMethod;
  paymentStatus: PaymentStatus;
  paymentId?: string;
  orderStatus: OrderStatus;
  pickupCode: string; // 4-digit code e.g. "8392"
  pickupCounter?: string; // e.g. "Counter 2"
  rejectionReason?: string;
  cancellationReason?: string;
  specialInstructions?: string;
  rating?: number;
  feedback?: string;
  createdAt: string;
  acceptedAt?: string;
  preparingAt?: string;
  readyAt?: string;
  collectedAt?: string;
}

export interface AppNotification {
  id: string;
  userId: string;
  orderId?: string;
  title: string;
  message: string;
  type: 'order' | 'system' | 'ready';
  read: boolean;
  createdAt: string;
}

export interface CanteenConfig {
  canteenName: string;
  isOpen: boolean;
  isRushHourPaused: boolean;
  openingTime: string; // "08:30"
  closingTime: string; // "18:00"
  slotDurationMinutes: number;
  maxOrdersPerSlot: number;
  minAdvanceOrderMinutes: number;
  announcement?: string;
  contactPhone: string;
  location: string;
  counterCount: number;
  gstRate: number; // e.g. 0.05 (5%)
}
