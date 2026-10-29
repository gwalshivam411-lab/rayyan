import React from 'react';
import { useNotifications } from '../../context/NotificationContext';
import { CheckCircle2, Info, BellRing, AlertCircle, X } from 'lucide-react';

export const ToastContainer: React.FC = () => {
  const { toasts, removeToast } = useNotifications();

  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 max-w-sm w-full pointer-events-none px-4 sm:px-0">
      {toasts.map((toast) => {
        const isReady = toast.type === 'ready';
        const isError = toast.type === 'error';
        const isSuccess = toast.type === 'success';

        return (
          <div
            key={toast.id}
            className={`pointer-events-auto p-3.5 rounded-xl border shadow-xl flex items-start gap-3 transition-all animate-in slide-in-from-bottom-3 duration-300 ${
              isReady
                ? 'bg-amber-900 text-white border-amber-700'
                : isError
                ? 'bg-red-900 text-white border-red-700'
                : isSuccess
                ? 'bg-stone-900 text-white border-stone-800'
                : 'bg-stone-900 text-white border-stone-800'
            }`}
          >
            <div className="mt-0.5 shrink-0">
              {isReady && <BellRing className="w-4 h-4 text-amber-300 animate-bounce" />}
              {isError && <AlertCircle className="w-4 h-4 text-red-300" />}
              {isSuccess && <CheckCircle2 className="w-4 h-4 text-emerald-400" />}
              {!isReady && !isError && !isSuccess && <Info className="w-4 h-4 text-blue-300" />}
            </div>

            <div className="flex-1 min-w-0">
              <h4 className="font-bold text-xs">{toast.title}</h4>
              <p className="text-[11px] text-stone-300 mt-0.5 leading-relaxed">{toast.message}</p>
            </div>

            <button
              onClick={() => removeToast(toast.id)}
              className="text-stone-400 hover:text-white p-0.5 rounded transition-colors shrink-0"
              aria-label="Dismiss toast"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        );
      })}
    </div>
  );
};
