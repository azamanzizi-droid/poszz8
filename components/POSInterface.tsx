import React, { useState, useMemo, useEffect, useRef } from 'react';
import { InventoryItem, CartItem, PaymentMethod, VendorType } from '../types';
import { Button } from './Button';
import { Input } from './Input';
import { ReceiptModal } from './ReceiptModal';
import { Trash2, Plus, Minus, ShoppingCart, Banknote, Smartphone, Wallet, X, FileText } from 'lucide-react';

interface POSInterfaceProps {
  items: InventoryItem[];
  type: VendorType;
  cashInHand: number;
  onProcessSale: (items: CartItem[], total: number, payment: PaymentMethod, received: number, change: number) => void;
  onBack: () => void;
}

export const POSInterface: React.FC<POSInterfaceProps> = ({ items, type, cashInHand, onProcessSale, onBack }) => {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>(PaymentMethod.CASH);
  const [amountReceived, setAmountReceived] = useState<string>('');
  const [showReceipt, setShowReceipt] = useState(false);
  const [isPreview, setIsPreview] = useState(false);
  
  const [selectedItemForPrice, setSelectedItemForPrice] = useState<InventoryItem | null>(null);
  const [manualPrice, setManualPrice] = useState<string>('');
  
  const manualPriceInputRef = useRef<HTMLInputElement>(null);

  const groupedItems = useMemo(() => {
    const itemsToFilter = type === VendorType.INTERNAL
      ? items.filter(i => i.type === VendorType.INTERNAL)
      : items.filter(i => i.type === VendorType.EXTERNAL);
  
    return itemsToFilter.reduce((acc: Record<string, InventoryItem[]>, item) => {
      const category = item.category || 'Lain-lain';
      if (!acc[category]) acc[category] = [];
      acc[category].push(item);
      return acc;
    // FIX: Provide an explicit type for the initial value of the reduce function to prevent `groupedItems` from being inferred as `unknown`.
    }, {} as Record<string, InventoryItem[]>);
  }, [items, type]);

  useEffect(() => {
    if (selectedItemForPrice && manualPriceInputRef.current) {
        manualPriceInputRef.current.focus();
    }
  }, [selectedItemForPrice]);

  useEffect(() => {
    if (showReceipt && !isPreview) {
        const timer = setTimeout(() => window.print(), 500);
        return () => clearTimeout(timer);
    }
  }, [showReceipt, isPreview]);

  const handleItemClick = (item: InventoryItem) => {
      if (type === VendorType.INTERNAL) {
          setSelectedItemForPrice(item);
          setManualPrice('');
      } else {
          addToCart(item);
      }
  };

  const handleManualPriceSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      if (!selectedItemForPrice) return;
      
      const price = parseFloat(manualPrice);
      if (isNaN(price) || price <= 0) {
          alert("Sila masukkan harga yang sah.");
          return;
      }

      const customItem: InventoryItem = {
          ...selectedItemForPrice,
          price: price,
          id: `${selectedItemForPrice.id}-custom-${Date.now()}`
      };

      addToCart(customItem, true);
      setSelectedItemForPrice(null);
      setManualPrice('');
  };

  const addToCart = (item: InventoryItem, forceNew: boolean = false) => {
    setCart(prev => {
      const existing = !forceNew ? prev.find(i => i.id === item.id) : null;
      if (existing) {
        return prev.map(i => i.id === item.id ? { ...i, quantity: i.quantity + 1 } : i);
      }
      return [...prev, { ...item, quantity: 1 }];
    });
  };

  const updateQuantity = (id: string, delta: number) => {
    setCart(prev => prev.map(item => {
      if (item.id === id) {
        const newQty = item.quantity + delta;
        return newQty > 0 ? { ...item, quantity: newQty } : item;
      }
      return item;
    }).filter(item => item.quantity > 0)); // Also remove if quantity becomes 0
  };

  const removeFromCart = (id: string) => {
    setCart(prev => prev.filter(i => i.id !== id));
  };

  const total = useMemo(() => cart.reduce((sum, item) => sum + (item.price * item.quantity), 0), [cart]);
  
  const change = useMemo(() => {
    const received = parseFloat(amountReceived) || 0;
    return Math.max(0, received - total);
  }, [amountReceived, total]);

  const handlePreview = () => {
    if (cart.length === 0) return;
    setIsPreview(true);
    setShowReceipt(true);
  };

  const handleProcess = () => {
    if (cart.length === 0) return;
    const received = parseFloat(amountReceived) || 0;
    if (received < total && paymentMethod === PaymentMethod.CASH) {
      alert("Jumlah bayaran tidak mencukupi!");
      return;
    }
    
    setIsPreview(false);
    setShowReceipt(true);
  };

  const confirmSale = () => {
    const received = parseFloat(amountReceived) || 0;
    onProcessSale(cart, total, paymentMethod, received, change);
    setCart([]);
    setAmountReceived('');
    setShowReceipt(false);
    setIsPreview(false);
  };

  const receivedAmount = parseFloat(amountReceived) || 0;

  return (
    <div className="flex flex-col h-full relative">
      <ReceiptModal 
        isOpen={showReceipt}
        onClose={() => setShowReceipt(false)}
        saleData={{
          items: cart,
          total: total,
          amountReceived: receivedAmount,
          change: change,
          type: type,
        }}
        onConfirm={confirmSale}
        isPreview={isPreview}
      />

      {selectedItemForPrice && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in">
              <div className="bg-white dark:bg-zinc-800 p-6 rounded-xl w-full max-w-sm shadow-xl">
                  <h3 className="text-xl font-bold mb-4">Masukkan Harga: {selectedItemForPrice.name}</h3>
                  <form onSubmit={handleManualPriceSubmit}>
                      <Input 
                        ref={manualPriceInputRef}
                        label="Jumlah Jualan (RM)"
                        type="number"
                        step="0.01"
                        value={manualPrice}
                        onChange={e => setManualPrice(e.target.value)}
                        placeholder="Contoh: 2.00"
                        autoFocus
                        required
                        className="text-2xl font-mono text-center"
                      />
                      <div className="flex gap-2 mt-4">
                          <Button type="button" variant="secondary" fullWidth onClick={() => setSelectedItemForPrice(null)}>Batal</Button>
                          <Button type="submit" variant="primary" fullWidth>Tambah</Button>
                      </div>
                  </form>
              </div>
          </div>
      )}

      <div className="mb-4">
        <Button onClick={onBack} variant="secondary" className="mb-4">
            ← Kembali
        </Button>
        <h2 className="text-2xl font-bold mb-2">POS {type === VendorType.INTERNAL ? 'ZZ' : 'Vendor'}</h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pb-20">
        <div className="space-y-6 content-start">
          {Object.entries(groupedItems).map(([category, itemsInCategory]) => (
            <div key={category}>
              <h3 className="text-lg font-bold mb-3 text-gray-600 dark:text-gray-300 border-b-2 border-gray-200 dark:border-gray-700 pb-2">{category}</h3>
              <div className="grid grid-cols-2 gap-4">
                {itemsInCategory.map(item => (
                  <div 
                    key={item.id}
                    onClick={() => handleItemClick(item)}
                    className="bg-white dark:bg-zinc-800 p-4 rounded-xl shadow-sm border-2 border-transparent hover:border-primary cursor-pointer transition-all active:scale-95 flex flex-col items-center justify-center text-center h-32"
                  >
                    <h3 className="font-bold text-lg leading-tight mb-2">{item.name}</h3>
                    {type === VendorType.EXTERNAL ? (
                        <>
                          <p className="text-primary font-mono font-bold">RM {item.price.toFixed(2)}</p>
                          <div className="text-xs text-gray-500 mt-1">Stok: {item.stock}</div>
                        </>
                    ) : (
                        <p className="text-sm text-gray-400 bg-gray-100 dark:bg-zinc-700 px-2 py-1 rounded-full">
                            Harga Manual
                        </p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="bg-white dark:bg-zinc-800 p-6 rounded-xl shadow-md h-fit border border-gray-200 dark:border-gray-700 flex flex-col">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-xl font-bold flex items-center gap-2"><ShoppingCart /> Keranjang</h3>
            <div className="text-sm bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 px-3 py-1 rounded-full font-medium">
                Tunai: RM {cashInHand.toFixed(2)}
            </div>
          </div>
          
          <div className="flex-1 overflow-y-auto min-h-[200px] max-h-[400px] space-y-4 mb-4">
            {cart.length === 0 ? (
              <p className="text-gray-500 text-center py-10">Tiada item dalam keranjang</p>
            ) : (
              cart.map(item => (
                <div key={item.id} className="flex justify-between items-center bg-gray-50 dark:bg-zinc-700/50 p-3 rounded-lg">
                  <div className="flex-1">
                    <p className="font-bold">{item.name}</p>
                    <div className="flex gap-2 text-sm text-gray-500">
                        <span>RM {item.price.toFixed(2)}</span>
                        {type === VendorType.EXTERNAL && <span>x {item.quantity}</span>}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {type === VendorType.EXTERNAL ? (
                        <>
                            <button onClick={() => updateQuantity(item.id, -1)} className="p-1 rounded-full hover:bg-gray-200 dark:hover:bg-zinc-600"><Minus size={16} /></button>
                            <span className="font-bold w-6 text-center">{item.quantity}</span>
                            <button onClick={() => updateQuantity(item.id, 1)} className="p-1 rounded-full hover:bg-gray-200 dark:hover:bg-zinc-600"><Plus size={16} /></button>
                        </>
                    ) : (
                        <span className="text-sm font-mono font-bold mr-2">RM {(item.price * item.quantity).toFixed(2)}</span>
                    )}
                    <button onClick={() => removeFromCart(item.id)} className="text-red-500 ml-2"><Trash2 size={18} /></button>
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="border-t border-gray-200 dark:border-gray-700 pt-4 mt-auto">
            <div className="flex justify-between text-2xl font-bold mb-4">
              <span>Jumlah</span>
              <span>RM {total.toFixed(2)}</span>
            </div>

            <div className="grid grid-cols-2 gap-3 mb-4">
              <button 
                className={`p-3 rounded-lg border-2 flex items-center justify-center gap-2 transition-all ${paymentMethod === PaymentMethod.CASH ? 'border-primary bg-primary/10 text-primary font-bold' : 'border-gray-300 dark:border-gray-600'}`}
                onClick={() => setPaymentMethod(PaymentMethod.CASH)}
              >
                <Banknote size={20} /> Tunai
              </button>
              <button 
                className={`p-3 rounded-lg border-2 flex items-center justify-center gap-2 transition-all ${paymentMethod === PaymentMethod.EWALLET ? 'border-blue-500 bg-blue-500/10 text-blue-500 font-bold' : 'border-gray-300 dark:border-gray-600'}`}
                onClick={() => setPaymentMethod(PaymentMethod.EWALLET)}
              >
                <Smartphone size={20} /> E-Wallet
              </button>
            </div>

            <Input 
              label="Wang Diterima (RM)"
              type="number"
              step="0.01"
              value={amountReceived}
              onChange={e => setAmountReceived(e.target.value)}
              placeholder="0.00"
              className="mb-4"
            />
            
            {parseFloat(amountReceived) > 0 && (
              <div className="flex justify-between items-center mb-4 p-3 bg-gray-100 dark:bg-zinc-700 rounded-lg">
                <span className="font-semibold">Baki</span>
                <span className={`font-mono font-bold text-xl ${change < 0 ? 'text-red-500' : 'text-green-600'}`}>
                  RM {change.toFixed(2)}
                </span>
              </div>
            )}

            <div className="grid grid-cols-2 gap-3">
                 {type === VendorType.INTERNAL && (
                    <Button variant="secondary" onClick={handlePreview}>
                        <FileText className="w-4 h-4 mr-1" /> Pratonton
                    </Button>
                 )}
                 <Button onClick={handleProcess} variant="success" fullWidth className={type !== VendorType.INTERNAL ? 'col-span-2' : ''}>
                    Proses Jualan
                 </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};