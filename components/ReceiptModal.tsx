import React, { useRef, useState } from 'react';
import { SaleRecord, CartItem, VendorType } from '../types';
import { Button } from './Button';
import { X, FileDown, Loader2, Receipt } from 'lucide-react';
import { jsPDF } from "jspdf";
import html2canvas from "html2canvas";

interface ReceiptModalProps {
  isOpen: boolean;
  onClose: () => void;
  // Can accept a full SaleRecord (from history) or data for a new transaction
  saleData: Partial<SaleRecord> & { items: CartItem[], total: number };
  onConfirm?: () => void; // For new sales
  isPreview?: boolean;
}

export const ReceiptModal: React.FC<ReceiptModalProps> = ({ isOpen, onClose, saleData, onConfirm, isPreview = false }) => {
  const receiptRef = useRef<HTMLDivElement>(null);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);

  if (!isOpen || !saleData) return null;

  const handleDownloadPDF = async () => {
    if (!receiptRef.current) return;
    setIsGeneratingPdf(true);

    const scrollableList = receiptRef.current.querySelector('#receipt-items-list');
    let originalMaxHeight = '';
    let originalOverflow = '';

    if (scrollableList instanceof HTMLElement) {
        originalMaxHeight = scrollableList.style.maxHeight;
        originalOverflow = scrollableList.style.overflow;
        scrollableList.style.maxHeight = 'none';
        scrollableList.style.overflow = 'visible';
    }

    try {
      const canvas = await html2canvas(receiptRef.current, { scale: 3, backgroundColor: '#ffffff', scrollY: -window.scrollY });
      const imgData = canvas.toDataURL('image/png');
      const pdfWidth = 80;
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
      const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: [pdfWidth, pdfHeight] });
      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
      pdf.save(`resit-pisang-goreng-zz-${Date.now()}.pdf`);
    } catch (error) {
      console.error("Error generating PDF:", error);
      alert("Gagal menjana PDF.");
    } finally {
      if (scrollableList instanceof HTMLElement) {
          scrollableList.style.maxHeight = originalMaxHeight;
          scrollableList.style.overflow = originalOverflow;
      }
      setIsGeneratingPdf(false);
    }
  };

  const { items, total, amountReceived, change, timestamp } = saleData;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="flex flex-col gap-4 w-full max-w-sm">
        <div ref={receiptRef} className="bg-white p-6 rounded-xl w-full shadow-2xl relative">
          {isPreview && (
            <div className="absolute top-0 left-0 right-0 bg-yellow-400 text-yellow-900 text-center text-xs font-bold py-1 rounded-t-xl uppercase tracking-wider print:hidden">
              Mod Pratonton
            </div>
          )}
          <div className="text-center border-b-2 border-dashed border-gray-300 pb-4 mb-4 mt-2">
            <h2 className="text-xl font-bold text-gray-800">Pisang Goreng ZZ</h2>
            <p className="text-gray-500 text-sm">Resit Rasmi</p>
            <p className="text-xs text-gray-400 mt-1">{new Date(timestamp || Date.now()).toLocaleString()}</p>
          </div>

          <div id="receipt-items-list" className="space-y-2 mb-4 max-h-60 overflow-y-auto print:max-h-none">
            {items.map((item) => (
              <div key={item.id} className="flex justify-between text-sm text-gray-700">
                <span>{item.name} {item.type === VendorType.EXTERNAL ? `x${item.quantity}` : ''}</span>
                <span className="font-mono">RM {(item.price * item.quantity).toFixed(2)}</span>
              </div>
            ))}
          </div>

          <div className="border-t-2 border-dashed border-gray-300 pt-4 space-y-1 font-mono text-sm">
            <div className="flex justify-between font-bold text-lg">
              <span>Jumlah</span>
              <span>RM {total.toFixed(2)}</span>
            </div>
            {amountReceived !== undefined && change !== undefined &&
              <>
                <div className="flex justify-between text-gray-600">
                  <span>Tunai</span>
                  <span>RM {amountReceived.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-gray-600">
                  <span>Baki</span>
                  <span>RM {change.toFixed(2)}</span>
                </div>
              </>
            }
          </div>
          <div className="mt-8 text-center text-xs text-gray-400">
            <p>Terima Kasih!</p>
            <p>Sila Datang Lagi.</p>
          </div>
        </div>

        <div className="flex flex-col gap-2 print:hidden">
          <div className="grid grid-cols-3 gap-2">
            <Button onClick={onClose} variant="secondary" fullWidth className="text-sm px-2">
              <X className="w-4 h-4" /> Tutup
            </Button>
            <Button onClick={handleDownloadPDF} variant="warning" fullWidth className="text-sm px-2" disabled={isGeneratingPdf}>
              {isGeneratingPdf ? <Loader2 className="w-4 h-4 animate-spin" /> : <><FileDown className="w-4 h-4" /> Simpan PDF</>}
            </Button>
            <Button onClick={() => window.print()} variant="outline" fullWidth className="text-sm px-2">
              <Receipt className="w-4 h-4" /> Cetak
            </Button>
          </div>
          {onConfirm && (
            <Button onClick={onConfirm} variant="success" fullWidth>
              {isPreview ? "Sahkan & Selesai" : "Selesai Transaksi"}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};
