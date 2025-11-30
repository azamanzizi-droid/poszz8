import React, { useState, useRef } from 'react';
import { InventoryItem, VendorType } from '../types';
import { Button } from './Button';
import { Input } from './Input';
import { Trash2, Upload, FileText } from 'lucide-react';

interface InventoryPageProps {
  items: InventoryItem[];
  onAddItem: (item: Omit<InventoryItem, 'id' | 'dateAdded'>) => void;
  onImportItems: (items: Omit<InventoryItem, 'id' | 'dateAdded'>[]) => void;
  onDeleteItem: (id: string) => void;
  onBack: () => void;
}

export const InventoryPage: React.FC<InventoryPageProps> = ({ items, onAddItem, onImportItems, onDeleteItem, onBack }) => {
  const [formData, setFormData] = useState({
    vendorName: '',
    itemName: '',
    price: '',
    costPrice: '',
    stock: '',
    category: '',
    type: VendorType.EXTERNAL
  });

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.itemName || !formData.price || !formData.stock) return;

    onAddItem({
      vendor: formData.type === VendorType.INTERNAL ? 'ZZ' : formData.vendorName,
      name: formData.itemName,
      price: parseFloat(formData.price),
      costPrice: parseFloat(formData.costPrice) || 0,
      stock: parseInt(formData.stock),
      category: formData.category,
      type: formData.type
    });

    setFormData({ ...formData, itemName: '', price: '', costPrice: '', stock: '', vendorName: '', category: '' });
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const text = e.target?.result as string;
        const rows = text.split('\n');
        const newItems: Omit<InventoryItem, 'id' | 'dateAdded'>[] = [];

        // Skip header row (index 0)
        for (let i = 1; i < rows.length; i++) {
          const row = rows[i].trim();
          if (!row) continue;

          // Simple CSV split by comma (doesn't handle commas inside quotes)
          const cols = row.split(',').map(c => c.trim());
          
          // Expected format: Vendor, Name, Price, Cost, Stock, Category
          if (cols.length >= 5) { // Category is optional
            const vendor = cols[0];
            const name = cols[1];
            const price = parseFloat(cols[2]);
            const costPrice = parseFloat(cols[3]);
            const stock = parseInt(cols[4]);
            const category = cols[5] || ''; // Optional category

            if (vendor && name && !isNaN(price) && !isNaN(stock)) {
              newItems.push({
                vendor,
                name,
                price,
                costPrice: isNaN(costPrice) ? 0 : costPrice,
                stock,
                category,
                type: vendor.toUpperCase() === 'ZZ' ? VendorType.INTERNAL : VendorType.EXTERNAL
              });
            }
          }
        }

        if (newItems.length > 0) {
          onImportItems(newItems);
        } else {
          alert('Tiada item sah dijumpai dalam fail CSV. Sila pastikan format betul: Vendor,Nama,Harga,Kos,Stok,Kategori');
        }
      } catch (error) {
        console.error('Error parsing CSV:', error);
        alert('Ralat memproses fail. Sila cuba lagi.');
      }
      
      // Reset input
      if (fileInputRef.current) fileInputRef.current.value = '';
    };
    reader.readAsText(file);
  };

  const downloadTemplate = () => {
    const header = "Vendor,Nama Item,Harga Jual,Harga Modal,Stok,Kategori\n";
    const example = "Mee Tarik,Mee Sup,8.00,4.50,20,Makanan\nZZ,Pisang Goreng,2.00,0.50,50,Gorengan";
    const blob = new Blob([header + example], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'template_inventori.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <Button onClick={onBack} variant="secondary">← Kembali</Button>
        <div className="flex gap-2">
            <Button onClick={downloadTemplate} variant="outline" className="text-sm">
                <FileText className="w-4 h-4" /> Template
            </Button>
            <Button onClick={() => fileInputRef.current?.click()} variant="warning" className="text-sm">
                <Upload className="w-4 h-4" /> Import CSV
            </Button>
            <input 
                type="file" 
                ref={fileInputRef} 
                onChange={handleFileUpload} 
                accept=".csv" 
                className="hidden" 
            />
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="bg-white dark:bg-zinc-800 p-6 rounded-xl shadow-md border border-gray-200 dark:border-gray-700">
          <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">📦 Tambah Inventori</h2>
          
          <form onSubmit={handleSubmit}>
            <div className="mb-4">
               <label className="block text-sm font-medium mb-1">Jenis Item</label>
               <div className="flex gap-4">
                   <label className="flex items-center gap-2 cursor-pointer">
                       <input 
                        type="radio" 
                        name="type" 
                        checked={formData.type === VendorType.EXTERNAL} 
                        onChange={() => setFormData({...formData, type: VendorType.EXTERNAL})}
                       /> Vendor
                   </label>
                   <label className="flex items-center gap-2 cursor-pointer">
                       <input 
                        type="radio" 
                        name="type" 
                        checked={formData.type === VendorType.INTERNAL} 
                        onChange={() => setFormData({...formData, type: VendorType.INTERNAL})}
                       /> ZZ (Dalaman)
                   </label>
               </div>
            </div>

            {formData.type === VendorType.EXTERNAL && (
                <Input 
                    label="Nama Vendor" 
                    value={formData.vendorName}
                    onChange={e => setFormData({...formData, vendorName: e.target.value})}
                    required
                />
            )}
            
            <Input 
                label="Nama Menu" 
                value={formData.itemName}
                onChange={e => setFormData({...formData, itemName: e.target.value})}
                required
            />

            <Input 
                label="Kategori (cth: Makanan, Minuman)"
                value={formData.category}
                onChange={e => setFormData({...formData, category: e.target.value})}
                placeholder="Gorengan"
            />
            
            <div className="grid grid-cols-2 gap-4">
                <Input 
                    label="Harga Modal (RM)" 
                    type="number" 
                    step="0.01"
                    value={formData.costPrice}
                    onChange={e => setFormData({...formData, costPrice: e.target.value})}
                    placeholder="0.00"
                />
                <Input 
                    label="Harga Jual (RM)" 
                    type="number" 
                    step="0.01"
                    value={formData.price}
                    onChange={e => setFormData({...formData, price: e.target.value})}
                    required
                />
            </div>

            <div className="mt-4">
                <Input 
                    label="Stok Masuk" 
                    type="number"
                    value={formData.stock}
                    onChange={e => setFormData({...formData, stock: e.target.value})}
                    required
                />
            </div>

            <Button type="submit" fullWidth className="mt-6">Tambah Item</Button>
          </form>
        </div>

        <div className="bg-white dark:bg-zinc-800 p-6 rounded-xl shadow-md border border-gray-200 dark:border-gray-700">
            <h3 className="text-xl font-bold mb-4">Senarai Item Semasa</h3>
            <div className="overflow-y-auto max-h-[500px]">
                {items.length === 0 ? (
                    <p className="text-gray-500">Tiada item.</p>
                ) : (
                    <div className="space-y-3">
                        {items.map(item => (
                            <div key={item.id} className="flex justify-between items-center p-3 bg-gray-50 dark:bg-zinc-700/30 rounded-lg">
                                <div>
                                    <p className="font-bold">{item.name}</p>
                                    <div className="text-sm text-gray-500 flex flex-col">
                                        <span>{item.vendor} | Stok: {item.stock}</span>
                                        <span className="text-xs">Modal: RM {(item.costPrice || 0).toFixed(2)}</span>
                                        {item.category && <span className="text-xs bg-gray-200 dark:bg-zinc-600 px-1.5 py-0.5 rounded-full w-fit mt-1">{item.category}</span>}
                                    </div>
                                </div>
                                <div className="flex items-center gap-3">
                                    <div className="text-right">
                                        <span className="block font-mono font-bold text-primary">RM {item.price.toFixed(2)}</span>
                                    </div>
                                    <button onClick={() => onDeleteItem(item.id)} className="text-red-500 hover:text-red-700 p-2">
                                        <Trash2 size={18} />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
      </div>
    </div>
  );
};