import React, { useState, useMemo } from 'react';
import { SaleRecord, VendorType, PayoutRecord } from '../types';
import { Button } from './Button';
import { Input } from './Input';
import { ReceiptModal } from './ReceiptModal';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { Download, TrendingUp, DollarSign, Package, Users, Wallet, CheckCircle, History, Eye } from 'lucide-react';

interface DashboardProps {
  sales: SaleRecord[];
  payouts?: PayoutRecord[];
  onAddPayout?: (vendorName: string, amount: number, note: string) => void;
  onBack: () => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ sales, payouts = [], onAddPayout, onBack }) => {
  const [view, setView] = React.useState<'overview' | 'vendor' | 'zz'>('overview');
  const [selectedVendor, setSelectedVendor] = useState<{name: string, balance: number} | null>(null);
  const [payoutAmount, setPayoutAmount] = useState('');
  const [payoutNote, setPayoutNote] = useState('');
  const [viewingReceipt, setViewingReceipt] = useState<SaleRecord | null>(null);

  const stats = React.useMemo(() => {
    const filteredSales = view === 'overview' ? sales : sales.filter(s => 
      view === 'zz' ? s.type === VendorType.INTERNAL : s.type === VendorType.EXTERNAL
    );

    const totalSales = filteredSales.length;
    const totalRevenue = filteredSales.reduce((acc, curr) => acc + curr.total, 0);
    
    const itemsSold: Record<string, number> = {};
    filteredSales.forEach(sale => {
      sale.items.forEach(item => {
        itemsSold[item.name] = (itemsSold[item.name] || 0) + item.quantity;
      });
    });

    const topItem = Object.entries(itemsSold).sort((a, b) => b[1] - a[1])[0];
    
    const chartData = Object.entries(itemsSold).map(([name, qty]) => ({ name, qty }));

    return { totalSales, totalRevenue, topItem: topItem ? topItem[0] : '-', chartData, filteredSales };
  }, [sales, view]);

  const vendorLedger = useMemo(() => {
      const ledger: Record<string, { owed: number, paid: number }> = {};
      
      sales.forEach(sale => {
          sale.items.forEach(item => {
              if (item.type === VendorType.EXTERNAL) {
                  const vendorName = item.vendor || 'Unknown';
                  if (!ledger[vendorName]) ledger[vendorName] = { owed: 0, paid: 0 };
                  ledger[vendorName].owed += (item.costPrice * item.quantity);
              }
          });
      });

      payouts.forEach(payout => {
          if (!ledger[payout.vendorName]) {
             ledger[payout.vendorName] = { owed: 0, paid: 0 };
          }
          ledger[payout.vendorName].paid += payout.amount;
      });

      return Object.entries(ledger).map(([name, data]) => ({
          name,
          owed: data.owed,
          paid: data.paid,
          balance: data.owed - data.paid
      }));
  }, [sales, payouts]);

  const handlePayoutSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      if (!selectedVendor || !onAddPayout) return;
      
      const amount = parseFloat(payoutAmount);
      if (isNaN(amount) || amount <= 0) {
          alert("Sila masukkan jumlah yang sah.");
          return;
      }

      onAddPayout(selectedVendor.name, amount, payoutNote);
      setSelectedVendor(null);
      setPayoutAmount('');
      setPayoutNote('');
  };

  const exportCSV = () => {
    const headers = ["ID", "Type", "Items", "Total (RM)", "Method", "Date"];
    const rows = sales.map(s => [
        s.id,
        s.type,
        s.items.map(i => `${i.name} (${i.quantity})`).join('; '),
        s.total.toFixed(2),
        s.paymentMethod,
        new Date(s.timestamp).toLocaleDateString()
    ]);

    const csvContent = "data:text/csv;charset=utf-8," 
        + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `dashboard_export_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const COLORS = ['#ff6b35', '#f7931e', '#22c55e', '#3b82f6', '#a855f7'];
  const sortedSales = useMemo(() => [...stats.filteredSales].reverse(), [stats.filteredSales]);

  return (
    <div className="space-y-6">
      <ReceiptModal 
        isOpen={!!viewingReceipt}
        onClose={() => setViewingReceipt(null)}
        saleData={viewingReceipt!}
      />

      {selectedVendor && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in">
              <div className="bg-white dark:bg-zinc-800 p-6 rounded-xl w-full max-w-sm shadow-2xl">
                  <h3 className="text-xl font-bold mb-4">Bayar Vendor: {selectedVendor.name}</h3>
                  <div className="mb-4 p-3 bg-gray-50 dark:bg-zinc-700/50 rounded-lg">
                      <p className="text-sm text-gray-500">Baki Tertunggak</p>
                      <p className="text-xl font-bold font-mono">RM {selectedVendor.balance.toFixed(2)}</p>
                  </div>
                  <form onSubmit={handlePayoutSubmit}>
                      <Input 
                        label="Jumlah Bayaran (RM)"
                        type="number"
                        step="0.01"
                        value={payoutAmount}
                        onChange={e => setPayoutAmount(e.target.value)}
                        placeholder="0.00"
                        autoFocus
                        required
                      />
                      <Input 
                        label="Nota / Rujukan"
                        value={payoutNote}
                        onChange={e => setPayoutNote(e.target.value)}
                        placeholder="Contoh: Tunai / Resit #123"
                      />
                      <div className="flex gap-2 mt-6">
                          <Button type="button" variant="secondary" fullWidth onClick={() => setSelectedVendor(null)}>Batal</Button>
                          <Button type="submit" variant="success" fullWidth>Sahkan Bayaran</Button>
                      </div>
                  </form>
              </div>
          </div>
      )}

      <div className="flex justify-between items-center">
        <Button onClick={onBack} variant="secondary">← Kembali</Button>
        <div className="flex gap-2">
            <Button onClick={() => setView('overview')} variant={view === 'overview' ? 'primary' : 'outline'} className="text-sm">Semua</Button>
            <Button onClick={() => setView('zz')} variant={view === 'zz' ? 'primary' : 'outline'} className="text-sm">ZZ</Button>
            <Button onClick={() => setView('vendor')} variant={view === 'vendor' ? 'primary' : 'outline'} className="text-sm">Vendor</Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-gradient-to-br from-orange-500 to-red-500 text-white p-6 rounded-xl shadow-lg">
            <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-white/20 rounded-lg"><TrendingUp size={24} /></div>
                <h3 className="font-medium text-white/80">Jumlah Transaksi</h3>
            </div>
            <p className="text-3xl font-bold">{stats.totalSales}</p>
        </div>
        
        <div className="bg-gradient-to-br from-green-500 to-emerald-600 text-white p-6 rounded-xl shadow-lg">
            <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-white/20 rounded-lg"><DollarSign size={24} /></div>
                <h3 className="font-medium text-white/80">Jumlah Jualan</h3>
            </div>
            <p className="text-3xl font-bold">RM {stats.totalRevenue.toFixed(2)}</p>
        </div>

        <div className="bg-gradient-to-br from-blue-500 to-indigo-600 text-white p-6 rounded-xl shadow-lg">
            <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-white/20 rounded-lg"><Package size={24} /></div>
                <h3 className="font-medium text-white/80">Item Terlaris</h3>
            </div>
            <p className="text-2xl font-bold truncate">{stats.topItem}</p>
        </div>
      </div>

      {view !== 'zz' && (
          <div className="bg-white dark:bg-zinc-800 p-6 rounded-xl shadow-md border-l-4 border-indigo-500">
              <h2 className="text-xl font-bold flex items-center gap-2 mb-6"><Users className="text-indigo-500" /> Akaun Vendor</h2>
              {vendorLedger.length === 0 ? <p className="text-gray-500 italic">Tiada data vendor.</p> : (
                  <div className="overflow-x-auto">
                      <table className="w-full text-left border-collapse">
                          <thead>
                              <tr className="border-b dark:border-zinc-700 text-sm text-gray-500">
                                  <th className="p-3">Nama Vendor</th>
                                  <th className="p-3 text-right">Jualan (Modal)</th>
                                  <th className="p-3 text-right">Dibayar</th>
                                  <th className="p-3 text-right">Baki</th>
                                  <th className="p-3 text-center">Tindakan</th>
                              </tr>
                          </thead>
                          <tbody className="divide-y dark:divide-zinc-700">
                              {vendorLedger.map((vendor) => (
                                  <tr key={vendor.name} className="hover:bg-gray-50 dark:hover:bg-zinc-700/50">
                                      <td className="p-3 font-medium">{vendor.name}</td>
                                      <td className="p-3 text-right font-mono">RM {vendor.owed.toFixed(2)}</td>
                                      <td className="p-3 text-right font-mono text-green-600">RM {vendor.paid.toFixed(2)}</td>
                                      <td className={`p-3 text-right font-mono font-bold ${vendor.balance > 0 ? 'text-red-500' : 'text-gray-400'}`}>RM {vendor.balance.toFixed(2)}</td>
                                      <td className="p-3 text-center">
                                          {vendor.balance > 0.01 ? (
                                              <button onClick={() => { setPayoutAmount(vendor.balance.toFixed(2)); setSelectedVendor(vendor); }} className="px-3 py-1 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-400 rounded-lg text-sm hover:bg-indigo-200 transition-colors flex items-center gap-1 mx-auto"><Wallet size={14} /> Bayar</button>
                                          ) : (
                                              <span className="flex items-center justify-center text-green-500 gap-1 text-sm"><CheckCircle size={14} /> Selesai</span>
                                          )}
                                      </td>
                                  </tr>
                              ))}
                          </tbody>
                      </table>
                  </div>
              )}
          </div>
      )}
      
      <div className="bg-white dark:bg-zinc-800 p-6 rounded-xl shadow-md border-l-4 border-teal-500">
        <h2 className="text-xl font-bold flex items-center gap-2 mb-4"><History className="text-teal-500" /> Sejarah Transaksi ({view})</h2>
        <div className="overflow-y-auto max-h-[400px]">
          {sortedSales.length === 0 ? <p className="text-gray-500 italic">Tiada transaksi.</p> : (
            <table className="w-full text-left">
              <thead className="sticky top-0 bg-white dark:bg-zinc-800">
                <tr className="border-b dark:border-zinc-700 text-sm text-gray-500">
                  <th className="p-3">Masa</th>
                  <th className="p-3">Jenis</th>
                  <th className="p-3 text-right">Jumlah</th>
                  <th className="p-3 text-center">Resit</th>
                </tr>
              </thead>
              <tbody className="divide-y dark:divide-zinc-700">
                {sortedSales.map(sale => (
                  <tr key={sale.id} className="hover:bg-gray-50 dark:hover:bg-zinc-700/50">
                    <td className="p-3 text-sm text-gray-500">{new Date(sale.timestamp).toLocaleTimeString()}</td>
                    <td className="p-3 font-medium">{sale.type}</td>
                    <td className="p-3 text-right font-mono font-bold">RM {sale.total.toFixed(2)}</td>
                    <td className="p-3 text-center">
                      <Button onClick={() => setViewingReceipt(sale)} variant="outline" className="text-xs px-2 py-1">
                          <Eye size={14} />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-zinc-800 p-6 rounded-xl shadow-md h-[400px]">
            <h3 className="text-lg font-bold mb-4">Jualan Mengikut Item</h3>
            <ResponsiveContainer width="100%" height="100%"><BarChart data={stats.chartData}><CartesianGrid strokeDasharray="3 3" opacity={0.3} /><XAxis dataKey="name" fontSize={12} tick={{fill: '#888'}} /><YAxis /><Tooltip contentStyle={{ backgroundColor: '#333', border: 'none', borderRadius: '8px', color: '#fff' }} itemStyle={{ color: '#fff' }} /><Bar dataKey="qty" fill="#ff6b35" radius={[4, 4, 0, 0]} /></BarChart></ResponsiveContainer>
        </div>
        <div className="bg-white dark:bg-zinc-800 p-6 rounded-xl shadow-md h-[400px]">
             <h3 className="text-lg font-bold mb-4">Taburan Jualan (Unit)</h3>
             <ResponsiveContainer width="100%" height="100%"><PieChart><Pie data={stats.chartData} cx="50%" cy="50%" innerRadius={60} outerRadius={100} paddingAngle={5} dataKey="qty">{stats.chartData.map((entry, index) => (<Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />))}</Pie><Tooltip /></PieChart></ResponsiveContainer>
        </div>
      </div>
      
      <Button onClick={exportCSV} variant="warning" className="w-full md:w-auto">
          <Download className="w-4 h-4" /> Eksport Data Lengkap (CSV)
      </Button>
    </div>
  );
};
