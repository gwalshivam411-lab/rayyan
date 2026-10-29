import {
  Category,
  MenuItem,
  PickupSlot,
  Order,
  OrderStatus,
  CanteenConfig,
  AppNotification,
  UserProfile,
} from '../types';
import {
  INITIAL_CATEGORIES,
  INITIAL_MENU_ITEMS,
  INITIAL_CANTEEN_CONFIG,
  generateDailyPickupSlots,
} from '../data/initialData';
import { syncOrderToSupabase } from './supabase';

const STORAGE_KEYS = {
  CATEGORIES: 'cb_categories_v1',
  MENU: 'cb_menu_v1',
  SLOTS: 'cb_slots_v1',
  ORDERS: 'cb_orders_v1',
  CONFIG: 'cb_config_v1',
  NOTIFICATIONS: 'cb_notifications_v1',
  USERS: 'cb_users_v1',
  ACTIVE_USER: 'cb_active_user_v1',
};

// Initial Seed Orders for realistic dashboard demonstration
const INITIAL_ORDERS: Order[] = [
  {
    id: 'ord-101',
    orderNumber: '#CB-7421',
    studentId: 'std-1',
    studentName: 'Rahul Sharma',
    studentPhone: '+91 98231 44552',
    studentEmail: 'rahul.sharma@campus.edu',
    pickupSlotId: 'slot-1230',
    pickupSlotDisplay: '12:30 PM - 12:45 PM',
    items: [
      {
        id: 'oi-1',
        orderId: 'ord-101',
        menuItemId: 'item-1',
        itemName: 'Mysore Masala Dosa',
        unitPrice: 65,
        quantity: 1,
        lineTotal: 65,
        dietaryType: 'veg',
        specialInstructions: 'Extra crispy if possible please',
      },
      {
        id: 'oi-2',
        orderId: 'ord-101',
        menuItemId: 'item-12',
        itemName: 'Thick Cold Coffee with Chocolate',
        unitPrice: 55,
        quantity: 1,
        lineTotal: 55,
        dietaryType: 'veg',
      },
    ],
    subtotal: 120,
    taxAmount: 6,
    fees: 0,
    discountAmount: 0,
    totalAmount: 126,
    paymentMethod: 'razorpay',
    paymentStatus: 'completed',
    paymentId: 'pay_rzp_demo_7421',
    orderStatus: 'ready',
    pickupCode: '4892',
    pickupCounter: 'Counter 1',
    createdAt: new Date(Date.now() - 25 * 60 * 1000).toISOString(),
    acceptedAt: new Date(Date.now() - 22 * 60 * 1000).toISOString(),
    preparingAt: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
    readyAt: new Date(Date.now() - 3 * 60 * 1000).toISOString(),
  },
  {
    id: 'ord-102',
    orderNumber: '#CB-7422',
    studentId: 'std-2',
    studentName: 'Priya Patel',
    studentPhone: '+91 97123 88990',
    studentEmail: 'priya.patel@campus.edu',
    pickupSlotId: 'slot-1230',
    pickupSlotDisplay: '12:30 PM - 12:45 PM',
    items: [
      {
        id: 'oi-3',
        orderId: 'ord-102',
        menuItemId: 'item-4',
        itemName: 'Deluxe Paneer Butter Masala Thali',
        unitPrice: 130,
        quantity: 1,
        lineTotal: 130,
        dietaryType: 'veg',
      },
    ],
    subtotal: 130,
    taxAmount: 6.5,
    fees: 0,
    discountAmount: 0,
    totalAmount: 136.5,
    paymentMethod: 'cash_on_pickup',
    paymentStatus: 'due_on_pickup',
    orderStatus: 'preparing',
    pickupCode: '1738',
    pickupCounter: 'Counter 2',
    createdAt: new Date(Date.now() - 18 * 60 * 1000).toISOString(),
    acceptedAt: new Date(Date.now() - 14 * 60 * 1000).toISOString(),
    preparingAt: new Date(Date.now() - 8 * 60 * 1000).toISOString(),
  },
  {
    id: 'ord-103',
    orderNumber: '#CB-7423',
    studentId: 'std-3',
    studentName: 'Ananya Verma',
    studentPhone: '+91 98451 22334',
    studentEmail: 'ananya.v@campus.edu',
    pickupSlotId: 'slot-1245',
    pickupSlotDisplay: '12:45 PM - 01:00 PM',
    items: [
      {
        id: 'oi-4',
        orderId: 'ord-103',
        menuItemId: 'item-7',
        itemName: 'Crispy Veg Cheese Burger',
        unitPrice: 75,
        quantity: 2,
        lineTotal: 150,
        dietaryType: 'veg',
      },
      {
        id: 'oi-5',
        orderId: 'ord-103',
        menuItemId: 'item-14',
        itemName: 'Fresh Nimbu Shikanji (Mint Soda)',
        unitPrice: 30,
        quantity: 2,
        lineTotal: 60,
        dietaryType: 'vegan',
      },
    ],
    subtotal: 210,
    taxAmount: 10.5,
    fees: 0,
    discountAmount: 0,
    totalAmount: 220.5,
    paymentMethod: 'razorpay',
    paymentStatus: 'completed',
    paymentId: 'pay_rzp_demo_7423',
    orderStatus: 'accepted',
    pickupCode: '6201',
    createdAt: new Date(Date.now() - 9 * 60 * 1000).toISOString(),
    acceptedAt: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
  },
  {
    id: 'ord-104',
    orderNumber: '#CB-7420',
    studentId: 'std-1',
    studentName: 'Rahul Sharma',
    studentPhone: '+91 98231 44552',
    studentEmail: 'rahul.sharma@campus.edu',
    pickupSlotId: 'slot-1015',
    pickupSlotDisplay: '10:15 AM - 10:30 AM',
    items: [
      {
        id: 'oi-6',
        orderId: 'ord-104',
        menuItemId: 'item-10',
        itemName: 'Mumbai Vada Pav (Pair)',
        unitPrice: 40,
        quantity: 1,
        lineTotal: 40,
        dietaryType: 'vegan',
      },
      {
        id: 'oi-7',
        orderId: 'ord-104',
        menuItemId: 'item-13',
        itemName: 'Kullad Masala Chai',
        unitPrice: 20,
        quantity: 1,
        lineTotal: 20,
        dietaryType: 'veg',
      },
    ],
    subtotal: 60,
    taxAmount: 3,
    fees: 0,
    discountAmount: 0,
    totalAmount: 63,
    paymentMethod: 'razorpay',
    paymentStatus: 'completed',
    paymentId: 'pay_rzp_demo_7420',
    orderStatus: 'collected',
    pickupCode: '9034',
    pickupCounter: 'Counter 3',
    createdAt: new Date(Date.now() - 90 * 60 * 1000).toISOString(),
    acceptedAt: new Date(Date.now() - 85 * 60 * 1000).toISOString(),
    preparingAt: new Date(Date.now() - 75 * 60 * 1000).toISOString(),
    readyAt: new Date(Date.now() - 60 * 60 * 1000).toISOString(),
    collectedAt: new Date(Date.now() - 50 * 60 * 1000).toISOString(),
    rating: 5,
    feedback: 'Food was piping hot and ready exactly on time! Very seamless.',
  },
];

// Helper to safely read and write JSON
function getFromStorage<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw);
  } catch {
    return fallback;
  }
}

function setToStorage<T>(key: string, value: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
    // Trigger custom window event for instant in-tab & cross-component sync
    window.dispatchEvent(new CustomEvent('campusbite_storage_sync', { detail: { key } }));
  } catch (err) {
    console.error('Storage write error:', err);
  }
}

export const StorageService = {
  // Config
  getConfig(): CanteenConfig {
    return getFromStorage<CanteenConfig>(STORAGE_KEYS.CONFIG, INITIAL_CANTEEN_CONFIG);
  },
  saveConfig(config: CanteenConfig): void {
    setToStorage(STORAGE_KEYS.CONFIG, config);
  },

  // Categories
  getCategories(): Category[] {
    return getFromStorage<Category[]>(STORAGE_KEYS.CATEGORIES, INITIAL_CATEGORIES);
  },
  saveCategories(categories: Category[]): void {
    setToStorage(STORAGE_KEYS.CATEGORIES, categories);
  },

  // Menu items
  getMenuItems(): MenuItem[] {
    return getFromStorage<MenuItem[]>(STORAGE_KEYS.MENU, INITIAL_MENU_ITEMS);
  },
  saveMenuItems(items: MenuItem[]): void {
    setToStorage(STORAGE_KEYS.MENU, items);
  },
  updateMenuItem(updated: MenuItem): void {
    const items = this.getMenuItems();
    const idx = items.findIndex((i) => i.id === updated.id);
    if (idx >= 0) {
      items[idx] = updated;
    } else {
      items.push(updated);
    }
    this.saveMenuItems(items);
  },
  deleteMenuItem(id: string): void {
    const items = this.getMenuItems().filter((i) => i.id !== id);
    this.saveMenuItems(items);
  },

  // Pickup Slots
  getPickupSlots(): PickupSlot[] {
    return getFromStorage<PickupSlot[]>(STORAGE_KEYS.SLOTS, generateDailyPickupSlots());
  },
  savePickupSlots(slots: PickupSlot[]): void {
    setToStorage(STORAGE_KEYS.SLOTS, slots);
  },
  reserveSlotCapacity(slotId: string): boolean {
    const slots = this.getPickupSlots();
    const slot = slots.find((s) => s.id === slotId);
    if (!slot) return false;
    if (slot.reservedCount >= slot.capacity || !slot.isOpen) {
      return false;
    }
    slot.reservedCount += 1;
    if (slot.reservedCount >= slot.capacity) {
      slot.isOpen = false;
    }
    this.savePickupSlots(slots);
    return true;
  },
  releaseSlotCapacity(slotId: string): void {
    const slots = this.getPickupSlots();
    const slot = slots.find((s) => s.id === slotId);
    if (!slot) return;
    slot.reservedCount = Math.max(0, slot.reservedCount - 1);
    if (slot.reservedCount < slot.capacity) {
      slot.isOpen = true;
    }
    this.savePickupSlots(slots);
  },

  // Orders
  getOrders(): Order[] {
    return getFromStorage<Order[]>(STORAGE_KEYS.ORDERS, INITIAL_ORDERS);
  },
  saveOrders(orders: Order[]): void {
    setToStorage(STORAGE_KEYS.ORDERS, orders);
  },
  getOrderById(id: string): Order | undefined {
    return this.getOrders().find((o) => o.id === id);
  },
  createOrder(order: Order): boolean {
    // 1. Check & reserve slot capacity
    const reserved = this.reserveSlotCapacity(order.pickupSlotId);
    if (!reserved) {
      return false;
    }

    // 2. Deduct inventory & increment sold counts
    const menuItems = this.getMenuItems();
    for (const item of order.items) {
      const match = menuItems.find((m) => m.id === item.menuItemId);
      if (match) {
        match.stockQuantity = Math.max(0, match.stockQuantity - item.quantity);
        match.totalSold = (match.totalSold || 0) + item.quantity;
        if (match.stockQuantity === 0) {
          match.isAvailable = false;
        }
      }
    }
    this.saveMenuItems(menuItems);

    // 3. Save order
    const orders = this.getOrders();
    orders.unshift(order);
    this.saveOrders(orders);

    // Sync to Supabase project epkaobwkhfauwfdiklwl
    syncOrderToSupabase(order).catch((err) => {
      console.warn('Background Supabase sync notice:', err);
    });

    // 4. Create in-app notification
    this.addNotification({
      id: `notif-${Date.now()}`,
      userId: order.studentId,
      orderId: order.id,
      title: 'Order Placed Successfully!',
      message: `Your order ${order.orderNumber} is scheduled for pickup at ${order.pickupSlotDisplay}. Pickup Code: ${order.pickupCode}`,
      type: 'order',
      read: false,
      createdAt: new Date().toISOString(),
    });

    return true;
  },
  updateOrderStatus(
    orderId: string,
    status: OrderStatus,
    extra: Partial<Order> = {}
  ): void {
    const orders = this.getOrders();
    const order = orders.find((o) => o.id === orderId);
    if (!order) return;

    const prevStatus = order.orderStatus;
    order.orderStatus = status;

    const now = new Date().toISOString();
    if (status === 'accepted') order.acceptedAt = now;
    if (status === 'preparing') order.preparingAt = now;
    if (status === 'ready') {
      order.readyAt = now;
      if (!order.pickupCounter) order.pickupCounter = 'Counter 1';
    }
    if (status === 'collected') {
      order.collectedAt = now;
      if (order.paymentStatus === 'due_on_pickup') {
        order.paymentStatus = 'completed';
      }
    }

    if (extra.rejectionReason) order.rejectionReason = extra.rejectionReason;
    if (extra.cancellationReason) order.cancellationReason = extra.cancellationReason;
    if (extra.pickupCounter) order.pickupCounter = extra.pickupCounter;
    if (extra.rating) order.rating = extra.rating;
    if (extra.feedback) order.feedback = extra.feedback;

    // If cancelled or rejected, release slot capacity & restock items
    if (['cancelled', 'rejected'].includes(status) && !['cancelled', 'rejected'].includes(prevStatus)) {
      this.releaseSlotCapacity(order.pickupSlotId);
      const menuItems = this.getMenuItems();
      for (const item of order.items) {
        const match = menuItems.find((m) => m.id === item.menuItemId);
        if (match) {
          match.stockQuantity += item.quantity;
          match.isAvailable = true;
        }
      }
      this.saveMenuItems(menuItems);
    }

    this.saveOrders(orders);

    // Sync updated status to Supabase
    syncOrderToSupabase(order).catch((err) => {
      console.warn('Background Supabase status sync notice:', err);
    });

    // Create notifications for key milestones
    let notifTitle = '';
    let notifMsg = '';
    let notifType: 'order' | 'ready' | 'system' = 'order';

    if (status === 'accepted') {
      notifTitle = `Order ${order.orderNumber} Accepted`;
      notifMsg = `The kitchen has accepted your order and added it to the preparation queue.`;
    } else if (status === 'preparing') {
      notifTitle = `Cooking in Progress`;
      notifMsg = `Chef is preparing your fresh meal now for ${order.pickupSlotDisplay}.`;
    } else if (status === 'ready') {
      notifTitle = `🔔 Order ${order.orderNumber} is READY!`;
      notifMsg = `Please collect from ${order.pickupCounter || 'Counter 1'}. Show pickup code: ${order.pickupCode}`;
      notifType = 'ready';
    } else if (status === 'collected') {
      notifTitle = `Order Collected`;
      notifMsg = `Thank you! Hope you enjoyed your meal. Please rate your experience!`;
    } else if (status === 'cancelled') {
      notifTitle = `Order Cancelled`;
      notifMsg = `Order ${order.orderNumber} has been cancelled.`;
    } else if (status === 'rejected') {
      notifTitle = `Order Rejected by Kitchen`;
      notifMsg = extra.rejectionReason || 'The kitchen could not fulfill this order.';
    }

    if (notifTitle) {
      this.addNotification({
        id: `notif-${Date.now()}`,
        userId: order.studentId,
        orderId: order.id,
        title: notifTitle,
        message: notifMsg,
        type: notifType,
        read: false,
        createdAt: now,
      });
    }
  },

  // Notifications
  getNotifications(): AppNotification[] {
    return getFromStorage<AppNotification[]>(STORAGE_KEYS.NOTIFICATIONS, [
      {
        id: 'notif-welcome',
        userId: 'std-1',
        title: 'Welcome to CampusBite!',
        message: 'Order ahead to skip queue during class break. Choose a pickup slot at checkout.',
        type: 'system',
        read: false,
        createdAt: new Date().toISOString(),
      },
    ]);
  },
  saveNotifications(notifs: AppNotification[]): void {
    setToStorage(STORAGE_KEYS.NOTIFICATIONS, notifs);
  },
  addNotification(notif: AppNotification): void {
    const list = this.getNotifications();
    list.unshift(notif);
    this.saveNotifications(list);
  },
  markNotificationRead(id: string): void {
    const list = this.getNotifications();
    const item = list.find((n) => n.id === id);
    if (item) {
      item.read = true;
      this.saveNotifications(list);
    }
  },
  markAllNotificationsRead(userId?: string): void {
    const list = this.getNotifications();
    list.forEach((n) => {
      if (!userId || n.userId === userId) {
        n.read = true;
      }
    });
    this.saveNotifications(list);
  },

  // Users
  getUsers(): UserProfile[] {
    return getFromStorage<UserProfile[]>(STORAGE_KEYS.USERS, [
      {
        id: 'std-1',
        fullName: 'Rahul Sharma',
        email: 'rahul.sharma@campus.edu',
        phone: '+91 98231 44552',
        studentId: 'CS-2024-042',
        role: 'student',
        createdAt: new Date().toISOString(),
      },
      {
        id: 'stf-1',
        fullName: 'Chef Murugan (Staff)',
        email: 'canteen.staff@campus.edu',
        phone: '+91 98765 11223',
        role: 'staff',
        createdAt: new Date().toISOString(),
      },
      {
        id: 'adm-1',
        fullName: 'Prof. Animesh Sen (Admin)',
        email: 'canteen.admin@campus.edu',
        phone: '+91 98765 99887',
        role: 'admin',
        createdAt: new Date().toISOString(),
      },
    ]);
  },
  getActiveUser(): UserProfile {
    const users = this.getUsers();
    return getFromStorage<UserProfile>(STORAGE_KEYS.ACTIVE_USER, users[0]);
  },
  setActiveUser(user: UserProfile): void {
    setToStorage(STORAGE_KEYS.ACTIVE_USER, user);
  },
  registerUser(user: UserProfile): void {
    const users = this.getUsers();
    users.push(user);
    setToStorage(STORAGE_KEYS.USERS, users);
    this.setActiveUser(user);
  },
};
