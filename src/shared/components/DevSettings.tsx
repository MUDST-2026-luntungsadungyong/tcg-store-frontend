import { useEffect, useState } from 'react';
import { Settings, Bug } from 'lucide-react';

export function DevSettings() {
  const [isOpen, setIsOpen] = useState(false);
  const [simulateApiError, setSimulateApiError] = useState(
    localStorage.getItem('DEV_SIMULATE_API_ERROR') === 'true'
  );
  const [simulateStockError, setSimulateStockError] = useState(
    localStorage.getItem('DEV_SIMULATE_STOCK_ERROR') === 'true'
  );

  if (import.meta.env.PROD) return null;

  const toggleApiError = () => {
    const next = !simulateApiError;
    setSimulateApiError(next);
    localStorage.setItem('DEV_SIMULATE_API_ERROR', next.toString());
  };

  const toggleStockError = () => {
    const next = !simulateStockError;
    setSimulateStockError(next);
    localStorage.setItem('DEV_SIMULATE_STOCK_ERROR', next.toString());
  };

  return (
    <div className="fixed bottom-4 left-4 z-[9999]">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-800 text-gray-300 shadow-lg hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-brand-blue"
        title="QA Settings"
      >
        <Bug size={20} />
      </button>

      {isOpen && (
        <div className="absolute bottom-12 left-0 w-64 rounded-xl border border-white/10 bg-gray-900 p-4 shadow-xl">
          <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-white">
            <Settings size={16} /> QA Test Settings
          </h3>
          <div className="space-y-3">
            <label className="flex items-center gap-3 text-sm text-gray-300">
              <input
                type="checkbox"
                checked={simulateApiError}
                onChange={toggleApiError}
                className="h-4 w-4 rounded border-gray-600 bg-gray-800 text-brand-blue focus:ring-brand-blue"
              />
              Force API Save Error (Case 9)
            </label>
            <label className="flex items-center gap-3 text-sm text-gray-300">
              <input
                type="checkbox"
                checked={simulateStockError}
                onChange={toggleStockError}
                className="h-4 w-4 rounded border-gray-600 bg-gray-800 text-brand-blue focus:ring-brand-blue"
              />
              Force Stock Error (Case 8)
            </label>
          </div>
        </div>
      )}
    </div>
  );
}
