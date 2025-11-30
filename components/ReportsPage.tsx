import React, { useState, useMemo } from 'react';
import { SaleRecord, VendorType } from '../types';
import { Button } from './Button';
import { Download, Calendar, ArrowLeft } from 'lucide-react';

interface ReportsPageProps {
  sales: SaleRecord[];
  onBack: () => void;
}

export const ReportsPage: React.FC<ReportsPageProps> = ({ sales, onBack }) => {
  const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7)); // YYYY-MM

  const reportData = useMemo(() => {
    const filteredSales = sales.filter(s => s.timestamp.startsWith(selectedMonth));
    const vendorStats: Record<string, { quantity: number, totalSales: number, totalCost: number }> = {};
    
    let grandTotalPayable = 0;
    let grandTotalRevenue = 0;

    filteredSales.forEach(sale => {
      sale.items.forEach(item => {
        if (item.type === VendorType.EXTERNAL) {
          const vendor = item.vendor || 'Unknown';
          if (!vendorStats[vendor]) {
            vendorStats[vendor] = { quantity: 0, totalSales: 0, totalCost: 0 };
          }
          
          const qty = item.quantity;
          const salesVal = item.price * qty;
          const costVal = item.costPrice * qty;

          vendorStats[vendor].quantity += qty;
          vendorStats[vendor].totalSales += salesVal;
          vendorStats[vendor].totalCost += costVal;

          grandTotalRevenue += salesVal;
          grandTotalPayable += costVal;
        }
      });
    });

    return {
      stats: Object.entries(vendorStats).map(([name, data]) => ({ name, ...data })),
      grandTotalPayable,
      grandTotalRevenue
    };
  }, [sales, selectedMonth]);

  const downloadCSV = () => {
    const headers = ["Vendor", "Item Terjual (Unit)", "Jumlah Jualan (RM)", "Bayaran Vendor (RM)"];
    const rows = reportData.stats.map(s => [
      s.name,
      s.quantity,
      s.totalSales.toFixed(2),
      s.totalCost.toFixed(2)
    ]);
    
    const csvContent = "data:text/csv;charset=utf-8," 
        + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `laporan_vendor_${selectedMonth}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <Button onClick={onBack} variant="secondary">
            <ArrowLeft className="w-4 h-4" /> Kembali
        </Button>
        <div className="flex items-center gap-2 bg-white dark:bg-zinc-800 p-2 rounded-lg border border-gray-200 dark:border-gray-700">
            <Calendar className="text-gray-500" size={20} />
            <input 
                type="month" 
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                className="bg-transparent outline-none text-gray-700 dark:text-gray-200"
            />
        </div>
      </div>

      <div className="bg-white dark:bg-zinc-800 p-6 rounded-xl shadow-md">
        <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold">Laporan Bayaran Vendor</h2>
            <Button onClick={downloadCSV} variant="warning" className="text-sm">
                <Download className="w-4 h-4" /> CSV
            </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-100 dark:border-green-800">
                <p className="text-sm text-green-600 dark:text-green-400">Jumlah Perlu Dibayar (Kos)</p>
                <p className="text-3xl font-bold text-green-700 dark:text-green-300">RM {reportData.grandTotalPayable.toFixed(2)}</p>
            </div>
            <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-100 dark:border-blue-800">
                <p className="text-sm text-blue-600 dark:text-blue-400">Jumlah Jualan Kasar</p>
                <p className="text-3xl font-bold text-blue-700 dark:text-blue-300">RM {reportData.grandTotalRevenue.toFixed(2)}</p>
            </div>
        </div>

        <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
                <thead>
                    <tr className="border-b dark:border-zinc-700 text-sm text-gray-500 bg-gray-50 dark:bg-zinc-700/50">
                        <th className="p-3">Nama Vendor</th>
                        <th className="p-3 text-center">Unit Terjual</th>
                        <th className="p-3 text-right">Jualan (RM)</th>
                        <th className="p-3 text-right">Bayaran (RM)</th>
                    </tr>
                </thead>
                <tbody className="divide-y dark:divide-zinc-700">
                    {reportData.stats.length === 0 ? (
                        <tr><td colSpan={4} className="p-4 text-center text-gray-500">Tiada data untuk bulan ini.</td></tr>
                    ) : (
                        reportData.stats.map((vendor) => (
                            <tr key={vendor.name} className="hover:bg-gray-50 dark:hover:bg-zinc-700/50 transition-colors">
                                <td className="p-3 font-medium">{vendor.name}</td>
                                <td className="p-3 text-center">{vendor.quantity}</td>
                                <td className="p-3 text-right font-mono text-gray-600 dark:text-gray-400">{vendor.totalSales.toFixed(2)}</td>
                                <td className="p-3 text-right font-mono font-bold text-green-600 dark:text-green-400">{vendor.totalCost.toFixed(2)}</td>
                            </tr>
                        ))
                    )}
                </tbody>
            </table>
        </div>
      </div>
    </div>
  );
};