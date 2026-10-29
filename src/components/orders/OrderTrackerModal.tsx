import React, { useState } from 'react';
import { Order, OrderStatus } from '../../types';
import { StorageService } from '../../lib/storage';
import { useNotifications } from '../../context/NotificationContext';
import {
  X,
  CheckCircle2,
  Clock,
  ChefHat,
  BellRing,
  PackageCheck,
  Ban,
  Star,
  MapPin,
  AlertCircle,
  QrCode,
} from 'lucide-react';

interface OrderTrackerModalProps {
  order: Order | null;
  onClose: () => void;
  onOrderUpdated?: () => void;
}

export const OrderTrackerModal: React.FC<OrderTrackerModalProps> = ({
  order,
  onClose,
  onOrderUpdated,
}) => {
  const { addToast } = useNotifications();
  const [rating, setRating] = useState<number>(order?.rating || 5);
  const [feedbackText, setFeedbackText] = useState(order?.feedback || '');
  const [feedbackSubmitted, setFeedbackSubmitted] = useState(false);
  const [showCancelPrompt, setShowCancelPrompt] = useState(false);
  const [cancelReason, setCancelReason] = useState('Change of schedule / class started');

  if (!order) return null;

  const STATUS_STEPS: { status: OrderStatus; label: string; icon: any }[] = [
    { status: 'placed', label: 'Placed', icon: Clock },
    { status: 'accepted', label: 'Accepted', icon: CheckCircle2 },
    { status: 'preparing', label: 'Preparing', icon: ChefHat },
    { status: 'ready', label: 'Ready at Counter', icon: BellRing },
    { status: 'collected', label: 'Collected', icon: PackageCheck },
  ];

  const getStepIndex = (status: OrderStatus) => {
    switch (status) {
      case 'placed':
        return 0;
      case 'accepted':
        return 1;
      case 'preparing':
        return 2;
      case 'ready':
        return 3;
      case 'collected':
        return 4;
      default:
        return -1;
    }
  };

  const currentStepIdx = getStepIndex(order.orderStatus);
  const isCancelled = order.orderStatus === 'cancelled';
  const isRejected = order.orderStatus === 'rejected';
  const canCancel = order.orderStatus === 'placed';

  const handleCancelOrder = () => {
    StorageService.updateOrderStatus(order.id, 'cancelled', {
      cancellationReason: cancelReason,
    });
    addToast({
      title: 'Order Cancelled',
      message: `Order ${order.orderNumber} has been cancelled and slot released.`,
      type: 'info',
    });
    setShowCancelPrompt(false);
    onOrderUpdated?.();
    onClose();
  };

  const handleSaveFeedback = () => {
    StorageService.updateOrderStatus(order.id, 'collected', {
      rating,
      feedback: feedbackText.trim() || undefined,
    });
    setFeedbackSubmitted(true);
    addToast({
      title: 'Feedback Received',
      message: 'Thank you for helping the canteen improve service!',
      type: 'success',
    });
    onOrderUpdated?.();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/65 backdrop-blur-xs overflow-y-auto animate-in fade-in duration-200">
      <div
        className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-stone-200 overflow-hidden flex flex-col my-8 max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-stone-200 bg-stone-50/90 flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-stone-500 uppercase tracking-wider">
                Order Status
              </span>
              <span
                className={`text-[11px] font-bold px-2 py-0.5 rounded uppercase tracking-wider ${
                  order.orderStatus === 'ready'
                    ? 'bg-amber-100 text-amber-900 animate-pulse'
                    : order.orderStatus === 'collected'
                    ? 'bg-emerald-100 text-emerald-900'
                    : isCancelled || isRejected
                    ? 'bg-red-100 text-red-900'
                    : 'bg-stone-200 text-stone-800'
                }`}
              >
                {order.orderStatus.replace('_', ' ')}
              </span>
            </div>
            <h2 className="text-xl font-extrabold text-stone-900 mt-0.5">{order.orderNumber}</h2>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-stone-400 hover:text-stone-800 rounded-md transition-colors"
            aria-label="Close tracker modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 space-y-5 overflow-y-auto">
          {/* Pickup code highlight box */}
          {!isCancelled && !isRejected && (
            <div className="p-4 bg-stone-900 text-white rounded-xl flex items-center justify-between shadow-xs">
              <div>
                <span className="text-[11px] text-stone-400 uppercase tracking-wider block">
                  Pickup Verification Code
                </span>
                <span className="text-3xl font-mono font-black text-emerald-400 tracking-wider tabular-nums">
                  {order.pickupCode}
                </span>
              </div>
              <div className="text-right">
                <span className="text-[11px] text-stone-400 uppercase tracking-wider block">
                  Collect At
                </span>
                <span className="text-sm font-bold text-white flex items-center gap-1 justify-end">
                  <MapPin className="w-3.5 h-3.5 text-emerald-400" />
                  <span>{order.pickupCounter || 'Counter 1'}</span>
                </span>
              </div>
            </div>
          )}

          {/* Cancelled / Rejected Banner */}
          {(isCancelled || isRejected) && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-900 flex items-start gap-2">
              <Ban className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
              <div>
                <strong className="font-semibold block mb-0.5">
                  {isCancelled ? 'Order Cancelled' : 'Order Rejected by Kitchen'}
                </strong>
                <span>{order.cancellationReason || order.rejectionReason || 'Order is no longer active.'}</span>
              </div>
            </div>
          )}

          {/* Visual Progress Stepper */}
          {!isCancelled && !isRejected && (
            <div className="py-2">
              <div className="relative flex items-center justify-between">
                {/* Horizontal progress track line */}
                <div className="absolute left-4 right-4 top-1/2 -translate-y-1/2 h-1 bg-stone-200 -z-0" />
                <div
                  className="absolute left-4 top-1/2 -translate-y-1/2 h-1 bg-emerald-600 transition-all duration-500 -z-0"
                  style={{
                    width: `${Math.max(0, Math.min(100, (currentStepIdx / (STATUS_STEPS.length - 1)) * 100))}%`,
                  }}
                />

                {STATUS_STEPS.map((stepItem, idx) => {
                  const isDone = idx <= currentStepIdx;
                  const isCurrent = idx === currentStepIdx;
                  const StepIcon = stepItem.icon;

                  return (
                    <div key={stepItem.status} className="relative z-10 flex flex-col items-center">
                      <div
                        className={`w-8 h-8 rounded-full flex items-center justify-center transition-all ${
                          isDone
                            ? 'bg-emerald-600 text-white shadow-xs'
                            : 'bg-white border-2 border-stone-300 text-stone-400'
                        } ${isCurrent ? 'ring-4 ring-emerald-100 scale-110' : ''}`}
                      >
                        <StepIcon className="w-4 h-4" />
                      </div>
                      <span
                        className={`text-[10px] mt-1.5 font-semibold text-center whitespace-nowrap ${
                          isDone ? 'text-stone-900' : 'text-stone-400'
                        }`}
                      >
                        {stepItem.label}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Ready for Pickup callout */}
          {order.orderStatus === 'ready' && (
            <div className="p-4 bg-amber-50 border border-amber-300 rounded-xl text-xs text-amber-950 flex items-center gap-3 animate-bounce">
              <BellRing className="w-5 h-5 text-amber-700 shrink-0" />
              <div>
                <strong className="font-bold text-sm block">Your meal is ready for collection!</strong>
                <span>Please proceed to {order.pickupCounter || 'Counter 1'} and present code {order.pickupCode}.</span>
              </div>
            </div>
          )}

          {/* Details breakdown */}
          <div className="bg-stone-50 p-4 rounded-xl border border-stone-200 space-y-2 text-xs">
            <div className="flex justify-between text-stone-600 pb-2 border-b border-stone-200">
              <span>Scheduled Pickup Slot</span>
              <span className="font-bold text-stone-900">{order.pickupSlotDisplay}</span>
            </div>
            <div className="flex justify-between text-stone-600 pb-2 border-b border-stone-200">
              <span>Payment Status</span>
              <span className="font-bold text-stone-900 capitalize">
                {order.paymentStatus === 'completed'
                  ? 'Paid Online (Razorpay)'
                  : order.paymentStatus === 'due_on_pickup'
                  ? 'Due at Counter (Cash/UPI)'
                  : order.paymentStatus}
              </span>
            </div>

            {/* Items */}
            <div className="pt-2">
              <span className="font-semibold text-stone-700 block mb-1.5">Ordered Items:</span>
              <div className="space-y-1.5">
                {order.items.map((oi) => (
                  <div key={oi.id} className="flex justify-between text-stone-700">
                    <span>
                      {oi.quantity}x {oi.itemName}
                      {oi.specialInstructions && (
                        <span className="block text-[11px] text-stone-400 italic">
                          "{oi.specialInstructions}"
                        </span>
                      )}
                    </span>
                    <span className="tabular-nums font-semibold">₹{oi.lineTotal}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="pt-2 border-t border-stone-200 flex justify-between font-bold text-stone-900 text-sm">
              <span>Total Paid/Due:</span>
              <span className="text-emerald-800 tabular-nums">₹{order.totalAmount.toFixed(2)}</span>
            </div>
          </div>

          {/* Rating and feedback form for collected orders */}
          {order.orderStatus === 'collected' && (
            <div className="p-4 bg-emerald-50/60 border border-emerald-200 rounded-xl space-y-2.5">
              <h4 className="font-bold text-xs text-stone-900">Rate your food experience:</h4>
              <div className="flex items-center gap-1.5">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setRating(star)}
                    aria-label={`Rate ${star} star`}
                    className="p-1 hover:scale-110 transition-transform"
                  >
                    <Star
                      className={`w-5 h-5 ${
                        star <= rating
                          ? 'fill-amber-400 text-amber-500'
                          : 'text-stone-300'
                      }`}
                    />
                  </button>
                ))}
              </div>

              {!feedbackSubmitted ? (
                <div className="space-y-2">
                  <textarea
                    rows={2}
                    placeholder="Was the food fresh? Quick pickup? Let the canteen staff know..."
                    value={feedbackText}
                    onChange={(e) => setFeedbackText(e.target.value)}
                    className="w-full text-xs p-2.5 border border-stone-200 rounded-lg text-stone-800 bg-white"
                  />
                  <button
                    onClick={handleSaveFeedback}
                    className="px-4 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg text-xs font-semibold"
                  >
                    Submit Feedback
                  </button>
                </div>
              ) : (
                <p className="text-xs text-emerald-800 font-medium">
                  ✓ Your feedback was recorded!
                </p>
              )}
            </div>
          )}

          {/* Cancellation section */}
          {canCancel && !showCancelPrompt && (
            <div className="pt-2 text-center">
              <button
                onClick={() => setShowCancelPrompt(true)}
                className="text-xs text-red-600 hover:text-red-700 underline font-medium"
              >
                Need to cancel this order? (Available before kitchen acceptance)
              </button>
            </div>
          )}

          {showCancelPrompt && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-xl space-y-3">
              <div className="flex items-center gap-2 text-xs font-bold text-red-900">
                <AlertCircle className="w-4 h-4 text-red-600" />
                <span>Confirm Order Cancellation</span>
              </div>
              <p className="text-xs text-red-800 leading-relaxed">
                Cancelling will release your pickup slot reservation and restock items immediately.
              </p>
              <div>
                <label htmlFor="cancelReasonSelect" className="block text-[11px] font-semibold text-stone-700 mb-1">
                  Reason for cancellation:
                </label>
                <select
                  id="cancelReasonSelect"
                  value={cancelReason}
                  onChange={(e) => setCancelReason(e.target.value)}
                  className="w-full text-xs p-2 border border-stone-300 rounded-lg bg-white"
                >
                  <option value="Class timetable changed">Class timetable changed</option>
                  <option value="Ordered by mistake">Ordered by mistake</option>
                  <option value="Friend already brought food">Friend already brought food</option>
                  <option value="Other">Other</option>
                </select>
              </div>
              <div className="flex items-center gap-2 pt-1">
                <button
                  onClick={handleCancelOrder}
                  className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded-lg transition-colors"
                >
                  Yes, Cancel Order
                </button>
                <button
                  onClick={() => setShowCancelPrompt(false)}
                  className="px-3 py-2 bg-white border border-stone-300 text-stone-700 text-xs font-medium rounded-lg hover:bg-stone-50"
                >
                  Keep Order
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
