-- ==============================================================================
-- CampusBite — Digital College Canteen Database Schema
-- Connected Project: epkaobwkhfauwfdiklwl
-- ==============================================================================

-- ==============================================================================
-- SECTION A: QUICK START ORDERS TABLE (Run this to collect order data in 1 click)
-- ==============================================================================
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
FOR UPDATE USING (true);

-- ==============================================================================
-- SECTION B: EXTENDED RELATIONAL SCHEMA (Optional full multi-table setup)
-- ==============================================================================

-- 1. EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. ENUMS
CREATE TYPE user_role AS ENUM ('student', 'staff', 'admin');
CREATE TYPE order_status AS ENUM ('pending_payment', 'placed', 'accepted', 'preparing', 'ready', 'collected', 'cancelled', 'rejected');
CREATE TYPE payment_status AS ENUM ('pending', 'completed', 'failed', 'refunded', 'due_on_pickup');
CREATE TYPE dietary_type AS ENUM ('veg', 'non-veg', 'vegan', 'egg');

-- 3. PROFILES TABLE (Linked to auth.users)
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    phone TEXT,
    student_id TEXT,
    role user_role DEFAULT 'student'::user_role NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- 4. CATEGORIES TABLE
CREATE TABLE IF NOT EXISTS public.categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL UNIQUE,
    slug TEXT NOT NULL UNIQUE,
    description TEXT,
    sort_order INT DEFAULT 0 NOT NULL,
    is_active BOOLEAN DEFAULT TRUE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- 5. MENU ITEMS TABLE
CREATE TABLE IF NOT EXISTS public.menu_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    category_id UUID NOT NULL REFERENCES public.categories(id) ON DELETE RESTRICT,
    name TEXT NOT NULL,
    description TEXT NOT NULL,
    price INT NOT NULL CHECK (price >= 0), -- Stored in INR (or paise)
    image_url TEXT,
    image_type TEXT DEFAULT 'dosa',
    dietary_type dietary_type DEFAULT 'veg'::dietary_type NOT NULL,
    is_spicy BOOLEAN DEFAULT FALSE NOT NULL,
    is_special_today BOOLEAN DEFAULT FALSE NOT NULL,
    preparation_time_minutes INT DEFAULT 10 NOT NULL CHECK (preparation_time_minutes > 0),
    stock_quantity INT DEFAULT 0 NOT NULL CHECK (stock_quantity >= 0),
    is_available BOOLEAN DEFAULT TRUE NOT NULL,
    is_active BOOLEAN DEFAULT TRUE NOT NULL,
    allergen_information TEXT,
    total_sold INT DEFAULT 0 NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- 6. PICKUP SLOTS TABLE
CREATE TABLE IF NOT EXISTS public.pickup_slots (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    slot_date DATE NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    capacity INT DEFAULT 15 NOT NULL CHECK (capacity > 0),
    reserved_count INT DEFAULT 0 NOT NULL CHECK (reserved_count >= 0 AND reserved_count <= capacity),
    is_open BOOLEAN DEFAULT TRUE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    CONSTRAINT unique_slot_time UNIQUE (slot_date, start_time, end_time)
);

-- 7. ORDERS TABLE
CREATE TABLE IF NOT EXISTS public.orders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_number TEXT NOT NULL UNIQUE,
    student_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    pickup_slot_id UUID NOT NULL REFERENCES public.pickup_slots(id) ON DELETE RESTRICT,
    subtotal INT NOT NULL CHECK (subtotal >= 0),
    tax_amount INT DEFAULT 0 NOT NULL CHECK (tax_amount >= 0),
    fees INT DEFAULT 0 NOT NULL CHECK (fees >= 0),
    discount_amount INT DEFAULT 0 NOT NULL CHECK (discount_amount >= 0),
    total_amount INT NOT NULL CHECK (total_amount >= 0),
    payment_method TEXT NOT NULL CHECK (payment_method IN ('razorpay', 'cash_on_pickup')),
    payment_status payment_status DEFAULT 'pending'::payment_status NOT NULL,
    order_status order_status DEFAULT 'placed'::order_status NOT NULL,
    pickup_code_hash TEXT NOT NULL, -- Or raw 4-digit verification code
    pickup_counter TEXT DEFAULT 'Counter 1',
    special_instructions TEXT,
    rejection_reason TEXT,
    cancellation_reason TEXT,
    rating INT CHECK (rating >= 1 AND rating <= 5),
    feedback TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    accepted_at TIMESTAMPTZ,
    preparing_at TIMESTAMPTZ,
    ready_at TIMESTAMPTZ,
    collected_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- 8. ORDER ITEMS (Immutable historical snapshot)
CREATE TABLE IF NOT EXISTS public.order_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
    menu_item_id UUID NOT NULL REFERENCES public.menu_items(id) ON DELETE RESTRICT,
    item_name_snapshot TEXT NOT NULL,
    unit_price_snapshot INT NOT NULL CHECK (unit_price_snapshot >= 0),
    quantity INT NOT NULL CHECK (quantity > 0),
    line_total INT NOT NULL CHECK (line_total >= 0),
    special_instructions TEXT,
    dietary_type dietary_type NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- 9. PAYMENTS TABLE
CREATE TABLE IF NOT EXISTS public.payments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
    provider TEXT NOT NULL DEFAULT 'razorpay',
    provider_payment_id TEXT,
    provider_order_id TEXT,
    provider_signature TEXT,
    amount INT NOT NULL CHECK (amount >= 0),
    status payment_status NOT NULL,
    verified_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- 10. ORDER STATUS AUDIT LOG
CREATE TABLE IF NOT EXISTS public.order_status_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
    previous_status order_status,
    new_status order_status NOT NULL,
    changed_by UUID REFERENCES public.profiles(id),
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- 11. NOTIFICATIONS TABLE
CREATE TABLE IF NOT EXISTS public.notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    order_id UUID REFERENCES public.orders(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    type TEXT DEFAULT 'order' NOT NULL,
    read BOOLEAN DEFAULT FALSE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- 12. CANTEEN CONFIGURATION TABLE
CREATE TABLE IF NOT EXISTS public.canteen_settings (
    id INT PRIMARY KEY DEFAULT 1,
    canteen_name TEXT NOT NULL,
    is_open BOOLEAN DEFAULT TRUE NOT NULL,
    is_rush_hour_paused BOOLEAN DEFAULT FALSE NOT NULL,
    opening_time TIME NOT NULL DEFAULT '08:30',
    closing_time TIME NOT NULL DEFAULT '18:30',
    slot_duration_minutes INT DEFAULT 15 NOT NULL,
    max_orders_per_slot INT DEFAULT 15 NOT NULL,
    min_advance_order_minutes INT DEFAULT 10 NOT NULL,
    announcement TEXT,
    contact_phone TEXT,
    location TEXT,
    counter_count INT DEFAULT 4 NOT NULL,
    gst_rate NUMERIC(4, 2) DEFAULT 0.05 NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    CONSTRAINT single_row CHECK (id = 1)
);

-- ==============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ==============================================================================

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.menu_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pickup_slots ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_status_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.canteen_settings ENABLE ROW LEVEL SECURITY;

-- Helper functions to check role
CREATE OR REPLACE FUNCTION public.current_user_role()
RETURNS user_role AS $$
    SELECT role FROM public.profiles WHERE id = auth.uid();
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- Profiles: Students read/update own profile; Admins read all
CREATE POLICY "Users can view own profile"
    ON public.profiles FOR SELECT
    USING (auth.uid() = id OR public.current_user_role() IN ('admin', 'staff'));

CREATE POLICY "Users can update own profile"
    ON public.profiles FOR UPDATE
    USING (auth.uid() = id);

-- Categories & Menu Items: Anyone can read active; Staff/Admin can modify
CREATE POLICY "Public can view active categories"
    ON public.categories FOR SELECT
    USING (is_active = TRUE OR public.current_user_role() IN ('admin', 'staff'));

CREATE POLICY "Admins can manage categories"
    ON public.categories FOR ALL
    USING (public.current_user_role() = 'admin');

CREATE POLICY "Public can view available menu items"
    ON public.menu_items FOR SELECT
    USING (is_active = TRUE OR public.current_user_role() IN ('admin', 'staff'));

CREATE POLICY "Staff and admin can manage menu items"
    ON public.menu_items FOR ALL
    USING (public.current_user_role() IN ('admin', 'staff'));

-- Pickup Slots: Anyone can view open slots; Staff/Admin can manage
CREATE POLICY "Public can view pickup slots"
    ON public.pickup_slots FOR SELECT
    USING (TRUE);

CREATE POLICY "Admin can manage pickup slots"
    ON public.pickup_slots FOR ALL
    USING (public.current_user_role() = 'admin');

-- Orders: Students view only their own orders; Staff/Admin view all
CREATE POLICY "Students can view own orders"
    ON public.orders FOR SELECT
    USING (student_id = auth.uid() OR public.current_user_role() IN ('admin', 'staff'));

CREATE POLICY "Students can place orders"
    ON public.orders FOR INSERT
    WITH CHECK (student_id = auth.uid());

CREATE POLICY "Staff and admin can update orders"
    ON public.orders FOR UPDATE
    USING (public.current_user_role() IN ('admin', 'staff') OR (student_id = auth.uid() AND order_status = 'placed'));

-- Order items
CREATE POLICY "Users can view relevant order items"
    ON public.order_items FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.orders o
            WHERE o.id = order_items.order_id
            AND (o.student_id = auth.uid() OR public.current_user_role() IN ('admin', 'staff'))
        )
    );

CREATE POLICY "Users can insert order items with order"
    ON public.order_items FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.orders o
            WHERE o.id = order_items.order_id AND o.student_id = auth.uid()
        )
    );

-- Notifications
CREATE POLICY "Users view own notifications"
    ON public.notifications FOR SELECT
    USING (user_id = auth.uid());

CREATE POLICY "Users update own notifications"
    ON public.notifications FOR UPDATE
    USING (user_id = auth.uid());

-- Settings
CREATE POLICY "Public can read canteen settings"
    ON public.canteen_settings FOR SELECT
    USING (TRUE);

CREATE POLICY "Admin can update canteen settings"
    ON public.canteen_settings FOR UPDATE
    USING (public.current_user_role() = 'admin');
