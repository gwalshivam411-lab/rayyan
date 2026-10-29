import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { CartProvider, useCart } from './context/CartContext';
import { NotificationProvider } from './context/NotificationContext';
import { Header } from './components/common/Header';
import { Footer } from './components/common/Footer';
import { HomeView } from './components/home/HomeView';
import { MenuSection } from './components/menu/MenuSection';
import { PickupSlotsView } from './components/slots/PickupSlotsView';
import { StudentOrdersView } from './components/student/StudentOrdersView';
import { StaffDashboard } from './components/staff/StaffDashboard';
import { AdminDashboard } from './components/admin/AdminDashboard';
import { FoodModal } from './components/common/FoodModal';
import { CartDrawer } from './components/common/CartDrawer';
import { CheckoutModal } from './components/checkout/CheckoutModal';
import { OrderTrackerModal } from './components/orders/OrderTrackerModal';
import { PickupBoardModal } from './components/common/PickupBoardModal';
import { SetupGuideModal } from './components/admin/SetupGuideModal';
import { NotificationDrawer } from './components/common/NotificationDrawer';
import { ToastContainer } from './components/common/ToastContainer';
import { MenuItem, Order } from './types';

function MainApp() {
  const { role, isStaff, isAdmin } = useAuth();
  const [activeView, setActiveView] = useState<'home' | 'menu' | 'slots' | 'orders' | 'staff' | 'admin'>('home');
  const [selectedCategorySlug, setSelectedCategorySlug] = useState<string | undefined>(undefined);

  // Modals state
  const [selectedFoodItem, setSelectedFoodItem] = useState<MenuItem | null>(null);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [trackedOrder, setTrackedOrder] = useState<Order | null>(null);
  const [isPickupBoardOpen, setIsPickupBoardOpen] = useState(false);
  const [isSetupGuideOpen, setIsSetupGuideOpen] = useState(false);

  const handleNavigateToMenu = (categorySlug?: string) => {
    setSelectedCategorySlug(categorySlug);
    setActiveView('menu');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleNavigateToSlots = () => {
    setActiveView('slots');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleOrderSuccess = (order: Order) => {
    setTrackedOrder(order);
  };

  return (
    <div className="min-h-screen flex flex-col bg-stone-50 text-stone-900">
      {/* Header with Top Bar Contract */}
      <Header
        activeView={activeView}
        setActiveView={(view) => {
          setActiveView(view);
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
        onOpenPickupBoard={() => setIsPickupBoardOpen(true)}
      />

      {/* Main Content Area */}
      <main className="flex-1">
        {activeView === 'home' && (
          <HomeView
            onNavigateToMenu={handleNavigateToMenu}
            onNavigateToSlots={handleNavigateToSlots}
            onOpenOrderTracker={(order) => setTrackedOrder(order)}
            onOpenDetails={(item) => setSelectedFoodItem(item)}
            onOpenPickupBoard={() => setIsPickupBoardOpen(true)}
          />
        )}

        {activeView === 'menu' && (
          <MenuSection
            selectedCategorySlug={selectedCategorySlug}
            onOpenDetails={(item) => setSelectedFoodItem(item)}
          />
        )}

        {activeView === 'slots' && (
          <PickupSlotsView onProceedToMenu={() => handleNavigateToMenu()} />
        )}

        {activeView === 'orders' && <StudentOrdersView />}

        {activeView === 'staff' && <StaffDashboard />}

        {activeView === 'admin' && (
          <AdminDashboard onOpenSetupGuide={() => setIsSetupGuideOpen(true)} />
        )}
      </main>

      {/* Footer */}
      <Footer
        onOpenSetupGuide={() => setIsSetupGuideOpen(true)}
        onOpenPickupBoard={() => setIsPickupBoardOpen(true)}
      />

      {/* Item Details Modal */}
      <FoodModal
        item={selectedFoodItem}
        onClose={() => setSelectedFoodItem(null)}
      />

      {/* Cart Tray Drawer */}
      <CartDrawer
        onProceedToCheckout={() => setIsCheckoutOpen(true)}
      />

      {/* Checkout Modal */}
      <CheckoutModal
        isOpen={isCheckoutOpen}
        onClose={() => setIsCheckoutOpen(false)}
        onOrderSuccess={handleOrderSuccess}
      />

      {/* Live Order Tracker Modal */}
      <OrderTrackerModal
        order={trackedOrder}
        onClose={() => setTrackedOrder(null)}
      />

      {/* Digital Pickup Counter Board */}
      <PickupBoardModal
        isOpen={isPickupBoardOpen}
        onClose={() => setIsPickupBoardOpen(false)}
      />

      {/* Supabase & Razorpay Configuration Guide */}
      <SetupGuideModal
        isOpen={isSetupGuideOpen}
        onClose={() => setIsSetupGuideOpen(false)}
      />

      {/* Notification Drawer & Toasts */}
      <NotificationDrawer />
      <ToastContainer />
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <CartProvider>
        <NotificationProvider>
          <MainApp />
        </NotificationProvider>
      </CartProvider>
    </AuthProvider>
  );
}
