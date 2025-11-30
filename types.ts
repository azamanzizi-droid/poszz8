export enum PaymentMethod {
  CASH = 'Tunai',
  EWALLET = 'E-Wallet'
}

export enum VendorType {
  INTERNAL = 'ZZ',
  EXTERNAL = 'Vendor'
}

export interface InventoryItem {
  id: string;
  vendor: string; // "ZZ" or vendor name
  name: string;
  price: number; // Selling Price
  costPrice: number; // Cost Price
  stock: number;
  dateAdded: string;
  type: VendorType;
  category?: string;
}

export interface CartItem extends InventoryItem {
  quantity: number;
}

export interface SaleRecord {
  id: string;
  items: CartItem[];
  total: number;
  amountReceived: number;
  change: number;
  paymentMethod: PaymentMethod;
  timestamp: string;
  type: VendorType;
}

export interface PayoutRecord {
  id: string;
  vendorName: string;
  amount: number;
  timestamp: string;
  note?: string;
}

export interface DashboardStats {
  totalSales: number;
  totalRevenue: number;
  topSellingItem: string;
}