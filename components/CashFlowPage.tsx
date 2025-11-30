

import React, { useState, useMemo } from 'react';
import { SaleRecord, PaymentMethod, VendorType } from '../types';
import { Button } from './Button';
import { Input } from './Input';
import { Banknote, CreditCard, Wallet, AlertTriangle, CheckCircle, Calendar } from 'lucide-react';

interface CashFlowPageProps {
  sales: SaleRecord[];
  onBack: () => void;
}

// Helper to get local date string in YYYY-MM-DD format
const getLocalDateString = (date: Date): string => {
    const yyyy = date.getFullYear();
    const mm = String(date.getMonth() + 1).padStart(2, '0');
    const dd = String(date.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
};


export const CashFlowPage: React.FC<CashFlowPageProps> = ({ sales, onBack }) => {
  const [selectedDate, setSelectedDate] = useState(getLocalDateString(new Date()));
  const [physicalCash, setPhysicalCash] = useState<string>('');

  const stats = useMemo(() => {
    // Filter by date (YYYY-MM-DD)
    const daySales = sales.filter(s => {
        const saleDate = new Date(s.timestamp);
        return getLocalDateString(saleDate) === selectedDate;
    });

    let data = {
      totalRevenue: 0,
      totalCash: 0,
      totalEwallet: 0,
      count: daySales.length,
      zz: { cash: 0, ewallet: 0, total: 0 },
      vendor: { cash: 0, ewallet: 0, total: 0 }
    };

    daySales.forEach(sale => {
      data.totalRevenue += sale.total;
      
      const isCash = sale.paymentMethod === PaymentMethod.CASH;
      const amount = sale.total;

      if (isCash) data.totalCash += amount;
      else data.totalEwallet += amount;

      if (sale.type === VendorType.INTERNAL) {
        data.zz.total += amount;
        if (isCash) data.zz.cash += amount;
        else data.zz.ewallet += amount;
      } else {
        data.vendor.total += amount;
        if (isCash) data.vendor.cash += amount;
        else data.vendor.ewallet += amount;
      }
    });

    return data;
  }, [sales, selectedDate]);

  const variance = useMemo(() => {
    if (physicalCash === '') return null;
    return parseFloat(physicalCash) - stats.totalCash;
  }, [physicalCash, stats.totalCash]);

  return (
    <div className="space-y-6 pb-10">
      <div className="flex justify-between items-center flex-wrap gap-4">
        <Button onClick={onBack} variant="secondary">← Kembali</Button>
        <div className="flex items-center gap-2 bg-white dark:bg-zinc-800 p-2 rounded-lg border border-gray-200 dark:border-gray-700">
            <Calendar className="text-gray-500" size={20} />
            <input 
                type="date" 
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="bg-transparent outline-none text-gray-700 dark:text-gray-200"
            />
        </div>
      </div>

      <div className="bg-white dark:bg-zinc-800 p-6 rounded-xl shadow-md border-l-4 border-primary">
        <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
            <Wallet className="text-primary" /> Pengurusan Tunai
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div>
                <p className="text-gray-500 mb-1">Jangkaan Tunai (System)</p>
                <p className="text-4xl font-bold font-mono text-gray-800 dark:text-white">RM {stats.totalCash.toFixed(2)}</p>
                <p className="text-xs text-gray-400 mt-2">Sepatutnya ada dalam laci wang</p>
            </div>
            
            <div className="bg-gray-50 dark:bg-zinc-700/30 p-4 rounded-lg">
                <Input 
                    label="Kira Tunai Fizikal (RM)"
                    type="number"
                    step="0.01"
                    placeholder="Masukkan jumlah dikira..."
                    value={physicalCash}
                    onChange={(e) => setPhysicalCash(e.target.value)}
                    className="text-lg font-mono font-bold"
                />
                {variance !== null && (
                    <div className={`mt-3 p-3 rounded-lg flex items-center gap-3 ${variance === 0 ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300' : variance < 0 ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300' : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300'}`}>
                        {variance === 0 ? <CheckCircle size={24} /> : <AlertTriangle size={24} />}
                        <div>
                            <p className="font-bold uppercase text-sm">
                                {variance === 0 ? 'Seimbang' : variance < 0 ? 'Kekurangan (Shortage)' : 'Lebihan (Surplus)'}
                            </p>
                            <p className="font-mono text-xl font-bold">
                                {variance > 0 ? '+' : ''}{variance.toFixed(2)}
                            </p>
                        </div>
                    </div>
                )}
            </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-zinc-800 p-5 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-2 mb-2 text-gray-500">
                <Banknote size={18} />
                <span>Jumlah Keseluruhan</span>
            </div>
            <p className="text-2xl font-bold">RM {stats.totalRevenue.toFixed(2)}</p>
            <p className="text-sm text-gray-400">{stats.count} Transaksi</p>
        </div>
        <div className="bg-white dark:bg-zinc-800 p-5 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-2 mb-2 text-green-600">
                <Banknote size={18} />
                <span>Tunai (Cash)</span>
            </div>
            <p className="text-2xl font-bold text-green-600">RM {stats.totalCash.toFixed(2)}</p>
        </div>
        <div className="bg-white dark:bg-zinc-800 p-5 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-2 mb-2 text-blue-600">
                <CreditCard size={18} />
                <span>E-Wallet</span>
            </div>
            <p className="text-2xl font-bold text-blue-600">RM {stats.totalEwallet.toFixed(2)}</p>
        </div>
      </div>

      <div className="bg-white dark:bg-zinc-800 rounded-xl shadow-md overflow-hidden">
        <div className="p-4 bg-gray-50 dark:bg-zinc-700/50 border-b dark:border-zinc-700">
            <h3 className="font-bold">Perincian Sumber</h3>
        </div>
        <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
                <thead>
                    <tr className="border-b dark:border-zinc-700 text-sm text-gray-500">
                        <th className="p-4">Sumber</th>
                        <th className="p-4 text-right">Tunai</th>
                        <th className="p-4 text-right">E-Wallet</th>
                        <th className="p-4 text-right">Jumlah</th>
                    </tr>
                </thead>
                <tbody className="divide-y dark:divide-zinc-700">
                    <tr>
                        <td className="p-4 font-medium">🍌 Jualan ZZ</td>
                        <td className="p-4 text-right font-mono text-green-600">{stats.zz.cash.toFixed(2)}</td>
                        <td className="p-4 text-right font-mono text-blue-600">{stats.zz.ewallet.toFixed(2)}</td>
                        <td className="p-4 text-right font-mono font-bold">{stats.zz.total.toFixed(2)}</td>
                    </tr>
                    <tr>
                        <td className="p-4 font-medium">🏪 Jualan Vendor</td>
                        <td className="p-4 text-right font-mono text-green-600">{stats.vendor.cash.toFixed(2)}</td>
                        <td className="p-4 text-right font-mono text-blue-600">{stats.vendor.ewallet.toFixed(2)}</td>
                        <td className="p-4 text-right font-mono font-bold">{stats.vendor.total.toFixed(2)}</td>
                    </tr>
                    <tr className="bg-gray-50 dark:bg-zinc-700/30 font-bold">
                        <td className="p-4">TOTAL</td>
                        <td className="p-4 text-right font-mono text-green-700 dark:text-green-300">{stats.totalCash.toFixed(2)}</td>
                        <td className="p-4 text-right font-mono text-blue-700 dark:text-blue-300">{stats.totalEwallet.toFixed(2)}</td>
                        <td className="p-4 text-right font-mono text-gray-900 dark:text-white">{stats.totalRevenue.toFixed(2)}</td>
                    </tr>
                </tbody>
            </table>
        </div>
      </div>
    </div>
  );
};