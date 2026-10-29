import React, { useState, useEffect } from 'react';
import { useCart } from '../../context/CartContext';
import { useAuth } from '../../context/AuthContext';
import { useNotifications } from '../../context/NotificationContext';
import { StorageService } from '../../lib/storage';
import { PickupSlot, Order, PaymentMethod } from '../../types';
import {
  X,
  CheckCircle2,
  Clock,
  CreditCard,
  Banknote,
  AlertTriangle,
  ArrowRight,
  ArrowLeft,
  ShieldCheck,
  Sparkles,
  QrCode,
} from 'lucide-react';

interface CheckoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOrderSuccess: (order: Order) => void;
}

export const CheckoutModal: React.FC<CheckoutModalProps> = ({ isOpen, onClose, onOrderSuccess }) => {
  const { items, subtotal, taxAmount, totalAmount, clearCart, orderNote } = useCart();
  const { user } = useAuth();
  const { addToast } = useNotifications();

  const [step, setStep] = useState<1 | 2 | 3 | 4 | 5>(1);
  const [slots, setSlots] = useState<PickupSlot[]>([]);
  const [chosenSlot, setChosenSlot] = useState<PickupSlot | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('razorpay');
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [confirmedOrder, setConfirmedOrder] = useState<Order | null>(null);

  // Razorpay simulation state
  const [simulatedUpiId, setSimulatedUpiId] = useState(`${user.email.split('@')[0]}@okaxis`);
  const [showRzpModal, setShowRzpModal] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setSlots(StorageService.getPickupSlots());
      setStep(1);
      setErrorMessage('');
      setConfirmedOrder(null);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  // Step 2 validation
  const handleProceedToSlot = () => {
    if (items.length === 0) {
      setErrorMessage('Your tray is empty!');
      return;
    }
    setErrorMessage('');
    setStep(2);
  };

  const handleProceedToPayment = () => {
    if (!chosenSlot) {
      setErrorMessage('Please select a pickup time slot to skip counter queue.');
      return;
    }
    setErrorMessage('');
    setStep(3);
  };

  const handleProceedToReview = () => {
    setErrorMessage('');
    setStep(4);
  };

  // Place Order execution
  const handleConfirmOrder = () => {
    if (!chosenSlot) return;

    if (paymentMethod === 'razorpay') {
      // Open Razorpay test gateway
      setShowRzpModal(true);
    } else {
      executeOrderCreation('due_on_pickup');
    }
  };

  const executeOrderCreation = (paymentStatus: 'completed' | 'due_on_pickup', paymentId?: string) => {
    if (!chosenSlot) return;
    setIsProcessing(true);
    setErrorMessage('');

    setTimeout(() => {
      // Generate 4-digit human-readable pickup code
      const pickupCode = Math.floor(1000 + Math.random() * 9000).toString();
      // Generate readable order number
      const orderNumber = `#CB-${Math.floor(1000 + Math.random() * 9000)}`;

      const newOrder: Order = {
        id: `ord-${Date.now()}`,
        orderNumber,
        studentId: user.id,
        studentName: user.fullName,
        studentEmail: user.email,
        studentPhone: user.phone || '+91 98765 00000',
        pickupSlotId: chosenSlot.id,
        pickupSlotDisplay: `${chosenSlot.startTime} - ${chosenSlot.endTime}`,
        items: items.map((ci, idx) => ({
          id: `oi-${Date.now()}-${idx}`,
          orderId: `ord-${Date.now()}`,
          menuItemId: ci.menuItem.id,
          itemName: ci.menuItem.name,
          unitPrice: ci.menuItem.price,
          quantity: ci.quantity,
          lineTotal: ci.menuItem.price * ci.quantity,
          specialInstructions: ci.specialInstructions,
          dietaryType: ci.menuItem.dietaryType,
        })),
        subtotal,
        taxAmount,
        fees: 0,
        discountAmount: 0,
        totalAmount,
        paymentMethod,
        paymentStatus,
        paymentId: paymentId || (paymentMethod === 'razorpay' ? `pay_rzp_test_${Date.now()}` : undefined),
        orderStatus: 'placed',
        pickupCode,
        pickupCounter: 'Counter 1',
        specialInstructions: orderNote || undefined,
        createdAt: new Date().toISOString(),
      };

      const success = StorageService.createOrder(newOrder);
      setIsProcessing(false);
      setShowRzpModal(false);

      if (success) {
        setConfirmedOrder(newOrder);
        setStep(5);
        clearCart();
        addToast({
          title: 'Order Placed!',
          message: `${orderNumber} registered for ${chosenSlot.startTime}. Code: ${pickupCode}`,
          type: 'success',
        });
        onOrderSuccess(newOrder);
      } else {
        setErrorMessage('This pickup slot just reached max capacity. Please select another slot.');
        setStep(2);
      }
    }, 800);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/65 backdrop-blur-xs overflow-y-auto animate-in fade-in duration-200">
      <div
        className="relative w-full max-w-xl bg-white rounded-2xl shadow-2xl border border-stone-200 overflow-hidden flex flex-col my-8"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header with Steps */}
        <div className="p-4 sm:p-5 border-b border-stone-200 bg-stone-50/80">
          <div className="flex items-center justify-between mb-3">
            <div>
              <span className="text-xs font-semibold text-emerald-800 tracking-wider uppercase block">
                CampusBite Express Checkout
              </span>
              <h2 className="text-lg font-bold text-stone-900">
                {step === 1 && '1. Review Tray'}
                {step === 2 && '2. Choose Pickup Slot'}
                {step === 3 && '3. Payment Method'}
                {step === 4 && '4. Final Confirmation'}
                {step === 5 && '5. Order Confirmed!'}
              </h2>
            </div>
            {step !== 5 && (
              <button
                onClick={onClose}
                className="p-1.5 text-stone-400 hover:text-stone-800 rounded-md transition-colors"
                aria-label="Close checkout"
              >
                <X className="w-5 h-5" />
              </button>
            )}
          </div>

          {/* Stepper progress indicator */}
          <div className="grid grid-cols-5 gap-1.5 pt-1">
            {[1, 2, 3, 4, 5].map((s) => (
              <div
                key={s}
                className={`h-1.5 rounded-full transition-all duration-300 ${
                  s <= step ? 'bg-emerald-600' : 'bg-stone-200'
                }`}
              />
            ))}
          </div>
        </div>

        {/* Error message */}
        {errorMessage && (
          <div className="mx-5 mt-4 p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-800 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-red-600 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* STEP 1: REVIEW CART */}
        {step === 1 && (
          <div className="p-5 space-y-4 max-h-[60vh] overflow-y-auto">
            <div className="divide-y divide-stone-100">
              {items.map((ci) => (
                <div key={ci.menuItem.id} className="py-2.5 flex items-center justify-between text-xs">
                  <div>
                    <span className="font-semibold text-stone-900">
                      {ci.quantity}x {ci.menuItem.name}
                    </span>
                    {ci.specialInstructions && (
                      <span className="block text-[11px] text-stone-500 italic">
                        Note: {ci.specialInstructions}
                      </span>
                    )}
                  </div>
                  <span className="font-bold text-stone-800 tabular-nums">
                    ₹{ci.menuItem.price * ci.quantity}
                  </span>
                </div>
              ))}
            </div>

            <div className="pt-3 border-t border-stone-200 space-y-1.5 text-xs text-stone-600">
              <div className="flex justify-between">
                <span>Items Subtotal</span>
                <span className="tabular-nums font-medium">₹{subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span>GST (5%)</span>
                <span className="tabular-nums font-medium">₹{taxAmount.toFixed(2)}</span>
              </div>
              <div className="flex justify-between font-bold text-sm text-stone-900 pt-2 border-t border-stone-100">
                <span>Grand Total</span>
                <span className="text-emerald-800 tabular-nums">₹{totalAmount.toFixed(2)}</span>
              </div>
            </div>
          </div>
        )}

        {/* STEP 2: SELECT PICKUP SLOT */}
        {step === 2 && (
          <div className="p-5 space-y-4 max-h-[60vh] overflow-y-auto">
            <div className="p-3 bg-emerald-50 border border-emerald-200/80 rounded-xl text-xs text-emerald-950 flex items-start gap-2.5">
              <Clock className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5" />
              <div>
                <strong className="font-semibold block mb-0.5">Queue Elimination System</strong>
                <span>
                  Pick a 15-minute slot. Your food will be freshly cooked and waiting at the counter.
                </span>
              </div>
            </div>

            <div className="space-y-2">
              <h4 className="text-xs font-bold text-stone-700 uppercase tracking-wider">
                Available Slots Today
              </h4>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {slots.map((slot) => {
                  const remaining = Math.max(0, slot.capacity - slot.reservedCount);
                  const isFull = remaining <= 0 || !slot.isOpen;
                  const isSelected = chosenSlot?.id === slot.id;

                  return (
                    <button
                      key={slot.id}
                      disabled={isFull}
                      onClick={() => setChosenSlot(slot)}
                      className={`p-3 rounded-xl border text-left transition-all relative ${
                        isSelected
                          ? 'border-emerald-600 bg-emerald-50/70 ring-1 ring-emerald-600'
                          : isFull
                          ? 'border-stone-200 bg-stone-100/70 opacity-60 cursor-not-allowed'
                          : 'border-stone-200 bg-white hover:border-emerald-400 hover:bg-stone-50'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-stone-900">
                          {slot.startTime} - {slot.endTime}
                        </span>
                        {slot.isRecommended && !isFull && (
                          <span className="text-[10px] font-semibold text-emerald-700 flex items-center gap-0.5">
                            <Sparkles className="w-3 h-3" />
                            <span>Fast</span>
                          </span>
                        )}
                      </div>

                      <div className="mt-2 flex items-center justify-between text-[11px]">
                        <span
                          className={`font-medium ${
                            isFull
                              ? 'text-red-600'
                              : remaining <= 3
                              ? 'text-amber-700 font-semibold'
                              : 'text-stone-500'
                          }`}
                        >
                          {isFull ? 'Fully Booked' : `${remaining} slots left`}
                        </span>

                        <div className="w-16 h-1.5 bg-stone-200 rounded-full overflow-hidden">
                          <div
                            className={`h-full ${
                              isFull ? 'bg-red-500' : remaining <= 3 ? 'bg-amber-500' : 'bg-emerald-600'
                            }`}
                            style={{ width: `${(slot.reservedCount / slot.capacity) * 100}%` }}
                          />
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* STEP 3: PAYMENT METHOD */}
        {step === 3 && (
          <div className="p-5 space-y-4 max-h-[60vh] overflow-y-auto">
            <div className="space-y-3">
              {/* Razorpay Test Mode option */}
              <label
                onClick={() => setPaymentMethod('razorpay')}
                className={`p-4 rounded-xl border flex items-start gap-3.5 cursor-pointer transition-all ${
                  paymentMethod === 'razorpay'
                    ? 'border-emerald-600 bg-emerald-50/60 ring-1 ring-emerald-600'
                    : 'border-stone-200 bg-white hover:bg-stone-50'
                }`}
              >
                <div className="p-2 rounded-lg bg-blue-50 text-blue-700 mt-0.5">
                  <CreditCard className="w-5 h-5" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-stone-900 text-xs sm:text-sm">
                      Razorpay Online Payment (UPI / Cards / NetBanking)
                    </span>
                    <span className="text-[10px] font-semibold text-blue-700 bg-blue-100/60 px-2 py-0.5 rounded">
                      Test Mode
                    </span>
                  </div>
                  <p className="text-stone-500 text-xs mt-1 leading-relaxed">
                    Instant UPI verification (GPay, PhonePe, Paytm) or debit/credit card. Recommended for express pickup.
                  </p>
                </div>
              </label>

              {/* Cash on Pickup option */}
              <label
                onClick={() => setPaymentMethod('cash_on_pickup')}
                className={`p-4 rounded-xl border flex items-start gap-3.5 cursor-pointer transition-all ${
                  paymentMethod === 'cash_on_pickup'
                    ? 'border-emerald-600 bg-emerald-50/60 ring-1 ring-emerald-600'
                    : 'border-stone-200 bg-white hover:bg-stone-50'
                }`}
              >
                <div className="p-2 rounded-lg bg-emerald-50 text-emerald-700 mt-0.5">
                  <Banknote className="w-5 h-5" />
                </div>
                <div className="flex-1">
                  <span className="font-bold text-stone-900 text-xs sm:text-sm block">
                    Cash on Pickup (Pay at Counter)
                  </span>
                  <p className="text-stone-500 text-xs mt-1 leading-relaxed">
                    Pay in cash or UPI QR at Counter 1 when collecting food. Exact change appreciated.
                  </p>
                </div>
              </label>
            </div>
          </div>
        )}

        {/* STEP 4: FINAL CONFIRMATION */}
        {step === 4 && chosenSlot && (
          <div className="p-5 space-y-4 max-h-[60vh] overflow-y-auto">
            <div className="bg-stone-50 p-4 rounded-xl border border-stone-200 space-y-2.5 text-xs text-stone-700">
              <div className="flex justify-between pb-2 border-b border-stone-200">
                <span className="text-stone-500">Student Name:</span>
                <span className="font-semibold text-stone-900">{user.fullName} ({user.studentId || 'Student'})</span>
              </div>
              <div className="flex justify-between pb-2 border-b border-stone-200">
                <span className="text-stone-500">Scheduled Pickup Slot:</span>
                <span className="font-bold text-emerald-800">{chosenSlot.startTime} - {chosenSlot.endTime}</span>
              </div>
              <div className="flex justify-between pb-2 border-b border-stone-200">
                <span className="text-stone-500">Payment Selected:</span>
                <span className="font-semibold capitalize text-stone-900">
                  {paymentMethod === 'razorpay' ? 'Razorpay Online (Test Mode)' : 'Cash at Pickup Counter'}
                </span>
              </div>
              <div className="flex justify-between pt-1 font-bold text-sm text-stone-900">
                <span>Total Payable:</span>
                <span className="text-emerald-800 tabular-nums">₹{totalAmount.toFixed(2)}</span>
              </div>
            </div>

            <div className="p-3 bg-stone-100 rounded-xl text-[11px] text-stone-600 flex items-start gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5" />
              <span>
                By confirming, your order will be sent to the kitchen. You will receive a unique 4-digit pickup code to show at the counter.
              </span>
            </div>
          </div>
        )}

        {/* STEP 5: ORDER CONFIRMED */}
        {step === 5 && confirmedOrder && (
          <div className="p-6 text-center space-y-5">
            <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto shadow-xs">
              <CheckCircle2 className="w-10 h-10" />
            </div>

            <div>
              <span className="text-xs font-semibold text-emerald-700 uppercase tracking-widest block mb-1">
                Kitchen Has Received Your Order
              </span>
              <h3 className="text-2xl font-black text-stone-900 tracking-tight">
                {confirmedOrder.orderNumber}
              </h3>
            </div>

            {/* Secret 4-digit Pickup Code card */}
            <div className="p-5 bg-stone-900 text-white rounded-2xl max-w-sm mx-auto shadow-md">
              <span className="text-[11px] uppercase tracking-wider text-stone-400 block mb-1">
                Your Secret Pickup Verification Code
              </span>
              <div className="text-4xl font-mono font-black tracking-widest text-emerald-400 my-1 tabular-nums">
                {confirmedOrder.pickupCode}
              </div>
              <span className="text-xs text-stone-300 block">
                Show this code or order number at {confirmedOrder.pickupCounter || 'Counter 1'}
              </span>
            </div>

            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl max-w-sm mx-auto text-xs text-emerald-950 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-emerald-700" />
                <span className="font-semibold">Pickup Slot:</span>
              </div>
              <span className="font-bold text-emerald-800">{confirmedOrder.pickupSlotDisplay}</span>
            </div>

            <div className="pt-2">
              <button
                onClick={onClose}
                className="w-full max-w-sm py-3 px-6 bg-emerald-700 hover:bg-emerald-800 text-white font-semibold rounded-xl text-sm transition-all shadow-sm"
              >
                Track Live Preparation
              </button>
            </div>
          </div>
        )}

        {/* Modal Footer Controls */}
        {step !== 5 && (
          <div className="p-4 border-t border-stone-200 bg-stone-50 flex items-center justify-between gap-3">
            {step > 1 ? (
              <button
                onClick={() => setStep((s) => (s - 1) as any)}
                className="px-4 py-2 text-xs font-semibold text-stone-700 hover:bg-stone-200/70 rounded-lg transition-colors flex items-center gap-1.5"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Back</span>
              </button>
            ) : (
              <div />
            )}

            <div>
              {step === 1 && (
                <button
                  onClick={handleProceedToSlot}
                  className="px-5 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5 shadow-xs"
                >
                  <span>Select Slot</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              )}
              {step === 2 && (
                <button
                  onClick={handleProceedToPayment}
                  disabled={!chosenSlot}
                  className="px-5 py-2.5 bg-emerald-700 hover:bg-emerald-800 disabled:opacity-40 text-white rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5 shadow-xs"
                >
                  <span>Continue to Pay</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              )}
              {step === 3 && (
                <button
                  onClick={handleProceedToReview}
                  className="px-5 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5 shadow-xs"
                >
                  <span>Review Order</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              )}
              {step === 4 && (
                <button
                  onClick={handleConfirmOrder}
                  disabled={isProcessing}
                  className="px-6 py-2.5 bg-emerald-700 hover:bg-emerald-800 active:scale-98 disabled:opacity-50 text-white rounded-xl text-xs font-semibold transition-all shadow-sm flex items-center gap-2"
                >
                  {isProcessing ? (
                    <span>Securing Slot...</span>
                  ) : paymentMethod === 'razorpay' ? (
                    <span>Pay ₹{totalAmount.toFixed(2)} Online</span>
                  ) : (
                    <span>Confirm Order (Pay at Counter)</span>
                  )}
                </button>
              )}
            </div>
          </div>
        )}

        {/* Razorpay Test Mode Simulator Overlay */}
        {showRzpModal && (
          <div className="absolute inset-0 z-50 bg-stone-900/80 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="w-full max-w-sm bg-white rounded-2xl shadow-2xl border border-stone-200 overflow-hidden animate-in zoom-in-95 duration-200">
              <div className="bg-[#0c2340] text-white p-4 flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-sm font-extrabold tracking-wide">Razorpay</span>
                    <span className="text-[10px] bg-blue-600/80 px-1.5 py-0.5 rounded text-blue-100 uppercase font-semibold">
                      Test Mode
                    </span>
                  </div>
                  <span className="text-xs text-blue-200 block mt-0.5">CampusBite Food Order</span>
                </div>
                <div className="text-right">
                  <span className="text-xs text-blue-200 block">Amount</span>
                  <span className="text-base font-bold text-white tabular-nums">₹{totalAmount.toFixed(2)}</span>
                </div>
              </div>

              <div className="p-4 space-y-3 text-xs">
                <div>
                  <label htmlFor="rzpUpiInput" className="block text-stone-600 font-medium mb-1">
                    Simulate UPI ID (GPay / PhonePe / Paytm)
                  </label>
                  <input
                    id="rzpUpiInput"
                    type="text"
                    value={simulatedUpiId}
                    onChange={(e) => setSimulatedUpiId(e.target.value)}
                    className="w-full px-3 py-2 border border-stone-300 rounded-lg text-stone-800"
                  />
                </div>

                <div className="p-2.5 bg-amber-50 border border-amber-200 rounded-lg text-[11px] text-amber-900">
                  ⚡ Razorpay Sandbox Test Mode. No real money is charged.
                </div>

                <div className="pt-2 space-y-2">
                  <button
                    onClick={() => executeOrderCreation('completed', `pay_rzp_test_${Date.now()}`)}
                    className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl transition-colors shadow-xs flex items-center justify-center gap-1.5"
                  >
                    <span>Simulate Payment Success</span>
                  </button>

                  <button
                    onClick={() => setShowRzpModal(false)}
                    className="w-full py-2 bg-stone-100 hover:bg-stone-200 text-stone-700 font-medium rounded-xl transition-colors"
                  >
                    Cancel Payment
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
