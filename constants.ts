import { InventoryItem, VendorType } from './types';

export const INITIAL_INVENTORY: InventoryItem[] = [
  // ZZ Items (Internal) - Prices set to 0 to indicate manual entry required in POS
  {
    id: 'zz-1',
    vendor: 'ZZ',
    name: 'Pisang Goreng',
    price: 0, 
    costPrice: 0,
    stock: 100,
    dateAdded: new Date().toISOString(),
    type: VendorType.INTERNAL,
    category: 'Gorengan'
  },
  {
    id: 'zz-2',
    vendor: 'ZZ',
    name: 'Keropok Lekor',
    price: 0,
    costPrice: 0,
    stock: 100,
    dateAdded: new Date().toISOString(),
    type: VendorType.INTERNAL,
    category: 'Gorengan'
  },
  {
    id: 'zz-3',
    vendor: 'ZZ',
    name: 'Keledek',
    price: 0,
    costPrice: 0,
    stock: 100,
    dateAdded: new Date().toISOString(),
    type: VendorType.INTERNAL,
    category: 'Gorengan'
  },
  {
    id: 'zz-4',
    vendor: 'ZZ',
    name: 'Air Balang',
    price: 0,
    costPrice: 0,
    stock: 100, // Estimate servings
    dateAdded: new Date().toISOString(),
    type: VendorType.INTERNAL,
    category: 'Minuman'
  },
  {
    id: 'zz-5',
    vendor: 'ZZ',
    name: 'Keropok Keping',
    price: 0,
    costPrice: 0,
    stock: 50,
    dateAdded: new Date().toISOString(),
    type: VendorType.INTERNAL,
    category: 'Gorengan'
  }
];