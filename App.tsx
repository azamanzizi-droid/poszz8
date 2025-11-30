import React, { useState, useEffect, useMemo } from 'react';
import { InventoryItem, SaleRecord, VendorType, CartItem, PaymentMethod, PayoutRecord } from './types';
import { INITIAL_INVENTORY } from './constants';
import { POSInterface } from './components/POSInterface';
import { InventoryPage } from './components/InventoryPage';
import { Dashboard } from './components/Dashboard';
import { CashFlowPage } from './components/CashFlowPage';
import { Button } from './components/Button';
import { ShoppingBag, BarChart2, Package, Settings, Moon, Sun, LayoutGrid, Banknote } from 'lucide-react';
import { ReportsPage } from './components/ReportsPage';

enum Page {
  HOME,
  POS_HOME,
  POS_VENDOR,
  POS_ZZ,
  DASHBOARD,
  INVENTORY,
  CASH_FLOW,
  REPORTS,
  SETTINGS
}

const App: React.FC = () => {
  const [currentPage, setCurrentPage] = useState<Page>(Page.HOME);
  
  // Theme State with Persistence
  const [isDark, setIsDark] = useState(() => {
    if (typeof window !== 'undefined') {
      const savedTheme = localStorage.getItem('theme');
      if (savedTheme) {
        return savedTheme === 'dark';
      }
      return window.matchMedia('(prefers-color-scheme: dark)').matches;
    }
    return false;
  });
  
  // App State
  const [inventory, setInventory] = useState<InventoryItem[]>(() => {
    const saved = localStorage.getItem('zz_inventory');
    return saved ? JSON.parse(saved) : INITIAL_INVENTORY;
  });
  
  const [sales, setSales] = useState<SaleRecord[]>(() => {
    const saved = localStorage.getItem('zz_sales');
    return saved ? JSON.parse(saved) : [];
  });

  const [payouts, setPayouts] = useState<PayoutRecord[]>(() => {
    const saved = localStorage.getItem('zz_payouts');
    return saved ? JSON.parse(saved) : [];
  });

  // Clock State
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Derived State
  const cashInHand = useMemo(() => {
    const totalCashSales = sales
      .filter(s => s.paymentMethod === PaymentMethod.CASH)
      .reduce((sum, sale) => sum + sale.total, 0);
    
    // Assuming payouts are taken from the cash drawer
    const totalPayouts = payouts.reduce((sum, p) => sum + p.amount, 0);

    return totalCashSales - totalPayouts;
  }, [sales, payouts]);

  // Effects
  useEffect(() => {
    localStorage.setItem('zz_inventory', JSON.stringify(inventory));
  }, [inventory]);

  useEffect(() => {
    localStorage.setItem('zz_sales', JSON.stringify(sales));
  }, [sales]);

  useEffect(() => {
    localStorage.setItem('zz_payouts', JSON.stringify(payouts));
  }, [payouts]);

  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [isDark]);

  // Handlers
  const handleSale = (cartItems: CartItem[], total: number, method: PaymentMethod, received: number, change: number) => {
    const newSale: SaleRecord = {
      id: Date.now().toString(),
      items: cartItems,
      total,
      amountReceived: received,
      change,
      paymentMethod: method,
      timestamp: new Date().toISOString(),
      type: currentPage === Page.POS_ZZ ? VendorType.INTERNAL : VendorType.EXTERNAL
    };

    setSales(prev => [...prev, newSale]);

    // Update Stock
    setInventory(prev => prev.map(item => {
      const soldItem = cartItems.find(c => c.id === item.id);
      if (soldItem && item.type === VendorType.EXTERNAL) { // Only decrement stock for vendor items
        return { ...item, stock: item.stock - soldItem.quantity };
      }
      return item;
    }));
  };

  const handleAddItem = (item: Omit<InventoryItem, 'id' | 'dateAdded'>) => {
    const newItem: InventoryItem = {
      ...item,
      id: Date.now().toString(),
      dateAdded: new Date().toISOString()
    };
    setInventory(prev => [...prev, newItem]);
  };

  const handleImportItems = (items: Omit<InventoryItem, 'id' | 'dateAdded'>[]) => {
      const newItems = items.map((item, index) => ({
          ...item,
          id: `import-${Date.now()}-${index}`,
          dateAdded: new Date().toISOString()
      }));
      setInventory(prev => [...prev, ...newItems]);
      alert(`${newItems.length} item berjaya diimport!`);
  };

  const handleDeleteItem = (id: string) => {
    if(confirm("Adakah anda pasti mahu memadam item ini?")) {
      setInventory(prev => prev.filter(i => i.id !== id));
    }
  };

  const handleAddPayout = (vendorName: string, amount: number, note: string) => {
    const newPayout: PayoutRecord = {
      id: Date.now().toString(),
      vendorName,
      amount,
      note,
      timestamp: new Date().toISOString()
    };
    setPayouts(prev => [...prev, newPayout]);
  };

  // Render Content
  const renderContent = () => {
    switch (currentPage) {
      case Page.HOME:
        return (
          <div className="flex flex-col min-h-[calc(100vh-140px)] max-w-lg mx-auto mt-6">
            <div className="grid grid-cols-2 gap-4">
              <Button 
                onClick={() => setCurrentPage(Page.POS_HOME)} 
                className="flex-col items-center justify-center h-40 gap-3 shadow-lg shadow-orange-500/20 text-center rounded-2xl"
              >
                <ShoppingBag size={40} strokeWidth={1.5} />
                <span className="text-xl font-bold leading-tight">Sistem POS</span>
              </Button>
              
              <Button 
                onClick={() => setCurrentPage(Page.CASH_FLOW)} 
                variant="success" 
                className="flex-col items-center justify-center h-40 gap-3 shadow-lg shadow-green-500/20 text-center rounded-2xl"
              >
                <Banknote size={40} strokeWidth={1.5} />
                <span className="text-xl font-bold leading-tight">Aliran Tunai</span>
              </Button>

              <Button 
                onClick={() => setCurrentPage(Page.DASHBOARD)} 
                variant="outline" 
                className="flex-col items-center justify-center h-40 gap-3 bg-white dark:bg-zinc-800 hover:bg-blue-50 dark:hover:bg-zinc-700 border-blue-200 dark:border-blue-900 text-blue-600 dark:text-blue-400 text-center rounded-2xl shadow-sm"
              >
                <BarChart2 size={40} strokeWidth={1.5} />
                <span className="text-lg font-bold leading-tight">Dashboard</span>
              </Button>

              <Button 
                onClick={() => setCurrentPage(Page.INVENTORY)} 
                variant="outline" 
                className="flex-col items-center justify-center h-40 gap-3 bg-white dark:bg-zinc-800 hover:bg-amber-50 dark:hover:bg-zinc-700 border-amber-200 dark:border-amber-900 text-amber-600 dark:text-amber-400 text-center rounded-2xl shadow-sm"
              >
                <Package size={40} strokeWidth={1.5} />
                <span className="text-lg font-bold leading-tight">Inventori</span>
              </Button>

              <Button 
                onClick={() => setCurrentPage(Page.REPORTS)} 
                variant="outline" 
                className="flex-col items-center justify-center h-40 gap-3 bg-white dark:bg-zinc-800 hover:bg-purple-50 dark:hover:bg-zinc-700 border-purple-200 dark:border-purple-900 text-purple-600 dark:text-purple-400 text-center rounded-2xl shadow-sm"
              >
                <LayoutGrid size={40} strokeWidth={1.5} />
                <span className="text-lg font-bold leading-tight">Laporan</span>
              </Button>

              <Button 
                onClick={() => setCurrentPage(Page.SETTINGS)} 
                variant="outline" 
                className="flex-col items-center justify-center h-40 gap-3 bg-white dark:bg-zinc-800 hover:bg-gray-50 dark:hover:bg-zinc-700 border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 text-center rounded-2xl shadow-sm"
              >
                <Settings size={40} strokeWidth={1.5} />
                <span className="text-lg font-bold leading-tight">Tetapan</span>
              </Button>
            </div>

            {/* Clock Section */}
            <div className="mt-auto py-10 flex flex-col items-center justify-center text-center opacity-80 select-none">
                <div className="text-6xl font-black text-gray-300 dark:text-zinc-700 tracking-tighter font-mono">
                    {currentTime.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false })}
                </div>
                <div className="text-lg font-bold text-gray-400 dark:text-zinc-600 uppercase tracking-widest mt-1">
                    {currentTime.toLocaleDateString('ms-MY', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
                </div>
            </div>
          </div>
        );

      case Page.POS_HOME:
        return (
          <div className="max-w-md mx-auto mt-10 space-y-4">
             <Button onClick={() => setCurrentPage(Page.HOME)} variant="secondary" className="mb-6">← Kembali</Button>
             <h2 className="text-2xl font-bold mb-4">Pilih Mod POS</h2>
             <Button onClick={() => setCurrentPage(Page.POS_ZZ)} fullWidth className="h-20 text-xl bg-orange-500 hover:bg-orange-600">
               🍌 POS ZZ
             </Button>
             <Button onClick={() => setCurrentPage(Page.POS_VENDOR)} fullWidth className="h-20 text-xl bg-indigo-500 hover:bg-indigo-600">
               🏪 POS Vendor
             </Button>
          </div>
        );

      case Page.POS_ZZ:
        return <POSInterface items={inventory} type={VendorType.INTERNAL} cashInHand={cashInHand} onProcessSale={handleSale} onBack={() => setCurrentPage(Page.POS_HOME)} />;

      case Page.POS_VENDOR:
        return <POSInterface items={inventory} type={VendorType.EXTERNAL} cashInHand={cashInHand} onProcessSale={handleSale} onBack={() => setCurrentPage(Page.POS_HOME)} />;

      case Page.INVENTORY:
        return <InventoryPage items={inventory} onAddItem={handleAddItem} onImportItems={handleImportItems} onDeleteItem={handleDeleteItem} onBack={() => setCurrentPage(Page.HOME)} />;

      case Page.DASHBOARD:
        return <Dashboard sales={sales} payouts={payouts} onAddPayout={handleAddPayout} onBack={() => setCurrentPage(Page.HOME)} />;
      
      case Page.CASH_FLOW:
        return <CashFlowPage sales={sales} onBack={() => setCurrentPage(Page.HOME)} />;
      
      case Page.REPORTS:
        return <ReportsPage sales={sales} onBack={() => setCurrentPage(Page.HOME)} />;

      case Page.SETTINGS:
          return (
              <div className="max-w-md mx-auto mt-10">
                  <Button onClick={() => setCurrentPage(Page.HOME)} variant="secondary" className="mb-6">← Kembali</Button>
                  <div className="bg-white dark:bg-zinc-800 p-6 rounded-xl shadow-md">
                      <h2 className="text-2xl font-bold mb-6">Tetapan</h2>
                      <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-zinc-700/50 rounded-lg">
                          <span className="flex items-center gap-2 font-medium">
                              {isDark ? <Moon size={20} /> : <Sun size={20} />}
                              Mod Gelap
                          </span>
                          <button 
                            onClick={() => setIsDark(!isDark)}
                            className={`w-12 h-6 rounded-full transition-colors relative ${isDark ? 'bg-primary' : 'bg-gray-300'}`}
                          >
                              <div className={`w-4 h-4 bg-white rounded-full absolute top-1 transition-transform ${isDark ? 'left-7' : 'left-1'}`} />
                          </button>
                      </div>
                      <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
                          <Button 
                            variant="danger" 
                            fullWidth 
                            onClick={() => {
                                if(confirm("Ini akan memadam SEMUA data jualan dan inventori. Anda pasti?")) {
                                    localStorage.clear();
                                    window.location.reload();
                                }
                            }}
                           >
                              Reset Semua Data
                          </Button>
                      </div>
                  </div>
              </div>
          )

      default:
        return <div>Page not found</div>;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-zinc-900 text-gray-900 dark:text-gray-100 font-sans selection:bg-primary selection:text-white">
      {/* Sticky Header */}
      <header className="sticky top-0 z-40 bg-gradient-to-r from-primary to-secondary shadow-lg text-white p-4">
        <div className="container mx-auto max-w-5xl flex justify-between items-center">
            <div 
                className="flex items-center gap-2 font-bold text-xl cursor-pointer"
                onClick={() => setCurrentPage(Page.HOME)}
            >
                <span className="text-2xl">🍌</span>
                <h1>Pisang Goreng ZZ</h1>
            </div>
            <button onClick={() => setIsDark(!isDark)} className="p-2 bg-white/20 hover:bg-white/30 rounded-full transition-colors">
                {isDark ? <Sun size={20} /> : <Moon size={20} />}
            </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto max-w-5xl p-4 md:p-6 animate-in fade-in duration-300">
        {renderContent()}
      </main>
    </div>
  );
};

export default App;