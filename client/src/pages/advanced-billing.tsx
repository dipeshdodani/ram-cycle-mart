import React, { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import Navbar from "@/components/layout/navbar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { 
  Plus, Minus, Download, FileText, Calendar, 
  DollarSign, ShoppingCart, Trash2, Edit2 
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { formatCurrency, parseCurrency, INDIA_GST_RATE } from "@/lib/currency";

interface BillItem {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

interface BillData {
  customerId: string;
  customerName: string;
  customerPhone: string;
  customerEmail: string;
  items: BillItem[];
  subtotal: number;
  discount: number;
  total: number;
  notes: string;
  paymentMethod: string;
}

export default function AdvancedBilling() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [bill, setBill] = useState<BillData>({
    customerId: "",
    customerName: "",
    customerPhone: "",
    customerEmail: "",
    items: [],
    subtotal: 0,
    discount: 0,
    total: 0,
    notes: "",
    paymentMethod: "cash"
  });
  
  const [currentItem, setCurrentItem] = useState({
    description: "",
    quantity: 1,
    unitPrice: 0
  });

  const [savedItems, setSavedItems] = useState<string[]>([]);

  // Load saved items from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('ramCycleMart_savedItems');
    if (saved) {
      setSavedItems(JSON.parse(saved));
    }
  }, []);

  const { data: customers } = useQuery({
    queryKey: ["/api/customers"],
  });

  const generateBillMutation = useMutation({
    mutationFn: async (billData: BillData) => {
      // First, create or find customer if manual entry
      let customerId = billData.customerId;
      
      if (!customerId && billData.customerName.trim()) {
        // Create new customer from manual entry
        const customerData = {
          firstName: billData.customerName.split(' ')[0] || billData.customerName,
          lastName: billData.customerName.split(' ').slice(1).join(' ') || '',
          phone: billData.customerPhone || '',
          email: billData.customerEmail || '',
          address: '',
          city: '',
          state: '',
          zipCode: '',
          notes: `Created from Advanced Billing on ${new Date().toLocaleDateString()}`
        };
        
        const customerRes = await apiRequest("POST", "/api/customers", customerData);
        const newCustomer = await customerRes.json();
        customerId = newCustomer.id;
      }
      
      const dueDate = new Date();
      dueDate.setDate(dueDate.getDate() + 30); // 30 days from now
      
      const invoiceData = {
        customerId: customerId,
        invoiceNumber: `BILL-${Date.now()}`,
        subtotal: billData.subtotal.toString(),
        taxRate: "0",
        taxAmount: "0",
        total: billData.total.toString(),
        paymentStatus: "paid" as const,
        dueDate: dueDate.toISOString(),
        notes: `Items: ${billData.items.map(item => `${item.description} (${item.quantity}x ${formatCurrency(item.unitPrice)})`).join(', ')}\n\n${billData.notes || ""}`
      };
      
      const res = await apiRequest("POST", "/api/invoices", invoiceData);
      return res.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Bill Generated",
        description: "Bill has been successfully generated and saved.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/invoices"] });
      queryClient.invalidateQueries({ queryKey: ["/api/customers"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard"] });
      
      // Save item descriptions for future use
      const itemDescriptions = bill.items.map((item: BillItem) => item.description).filter((desc: string) => desc.trim() !== '');
      const uniqueItems = Array.from(new Set([...savedItems, ...itemDescriptions]));
      setSavedItems(uniqueItems);
      localStorage.setItem('ramCycleMart_savedItems', JSON.stringify(uniqueItems));

      // Generate PDF
      generatePDF(data);
      
      // Reset form
      setBill({
        customerId: "",
        customerName: "",
        customerPhone: "",
        customerEmail: "",
        items: [],
        subtotal: 0,
        discount: 0,
        total: 0,
        notes: "",
        paymentMethod: "cash"
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const calculateTotals = (items: BillItem[], discount: number = 0) => {
    const subtotal = items.reduce((sum, item) => sum + item.total, 0);
    const discountAmount = (subtotal * discount) / 100;
    const total = subtotal - discountAmount;
    
    setBill(prev => ({
      ...prev,
      subtotal,
      total,
      discount
    }));
  };

  const addItem = () => {
    if (!currentItem.description.trim() || currentItem.unitPrice <= 0) {
      toast({
        title: "Invalid Item",
        description: "Please enter item description and valid price.",
        variant: "destructive",
      });
      return;
    }
    
    const newItem: BillItem = {
      id: `item-${Date.now()}`,
      description: currentItem.description,
      quantity: currentItem.quantity,
      unitPrice: currentItem.unitPrice,
      total: currentItem.quantity * currentItem.unitPrice
    };
    
    const updatedItems = [...bill.items, newItem];
    setBill(prev => ({ ...prev, items: updatedItems }));
    calculateTotals(updatedItems, bill.discount);
    
    setCurrentItem({ description: "", quantity: 1, unitPrice: 0 });
  };

  const removeItem = (itemId: string) => {
    const updatedItems = bill.items.filter(item => item.id !== itemId);
    setBill(prev => ({ ...prev, items: updatedItems }));
    calculateTotals(updatedItems, bill.discount);
  };

  const updateQuantity = (itemId: string, newQuantity: number) => {
    if (newQuantity <= 0) return;
    
    const updatedItems = bill.items.map(item => 
      item.id === itemId 
        ? { ...item, quantity: newQuantity, total: newQuantity * item.unitPrice }
        : item
    );
    setBill(prev => ({ ...prev, items: updatedItems }));
    calculateTotals(updatedItems, bill.discount);
  };

  const selectCustomer = (customerId: string) => {
    const customer = Array.isArray(customers) ? customers.find((c: any) => c.id === customerId) : null;
    if (customer) {
      setBill(prev => ({
        ...prev,
        customerId,
        customerName: `${customer.firstName} ${customer.lastName}`,
        customerPhone: customer.phone,
        customerEmail: customer.email
      }));
    }
  };

  const generatePDF = async (billData: any) => {
    try {
      console.log('Starting advanced bill PDF generation');
      
      // Dynamic import for PDF generation
      const jsPDF = (await import('jspdf')).default;
      console.log('jsPDF imported successfully');
      
      await import('jspdf-autotable');
      console.log('jsPDF AutoTable imported successfully');
      
      const pdf = new jsPDF();
      const pageWidth = pdf.internal.pageSize.width;
      
      // Header with company branding
      pdf.setFontSize(28);
      pdf.setFont("helvetica", "bold");
      pdf.text("Ram Cycle Mart", pageWidth / 2, 25, { align: "center" });
      
      pdf.setFontSize(14);
      pdf.setFont("helvetica", "normal");
      pdf.text("Professional Cycle Service & Repair", pageWidth / 2, 35, { align: "center" });
      pdf.text("Phone: +91 98765 43210 | Email: info@ramcyclemart.com", pageWidth / 2, 45, { align: "center" });
      
      // Decorative line
      pdf.setLineWidth(0.8);
      pdf.setDrawColor(66, 135, 245);
      pdf.line(20, 52, pageWidth - 20, 52);
      
      // Invoice title
      pdf.setFontSize(20);
      pdf.setFont("helvetica", "bold");
      pdf.setTextColor(66, 135, 245);
      pdf.text("ADVANCED BILL", 20, 70);
      
      // Reset text color
      pdf.setTextColor(0, 0, 0);
      
      // Bill information section
      pdf.setFontSize(11);
      pdf.setFont("helvetica", "normal");
      
      // Left column - Bill details
      pdf.setFont("helvetica", "bold");
      pdf.text("BILL INFORMATION", 20, 85);
      pdf.setFont("helvetica", "normal");
      pdf.text(`Bill Number: ${billData.invoiceNumber || 'BILL-' + Date.now()}`, 20, 95);
      pdf.text(`Date: ${new Date().toLocaleDateString('en-IN')}`, 20, 102);
      pdf.text(`Time: ${new Date().toLocaleTimeString('en-IN')}`, 20, 109);
      
      // Right column - Customer details
      pdf.setFont("helvetica", "bold");
      pdf.text("CUSTOMER DETAILS", pageWidth / 2 + 10, 85);
      pdf.setFont("helvetica", "normal");
      pdf.text(`Name: ${bill.customerName}`, pageWidth / 2 + 10, 95);
      if (bill.customerPhone) {
        pdf.text(`Phone: ${bill.customerPhone}`, pageWidth / 2 + 10, 102);
      }
      if (bill.customerEmail) {
        pdf.text(`Email: ${bill.customerEmail}`, pageWidth / 2 + 10, 109);
      }
      
      // Items table with professional styling
      const itemsTableData = bill.items.map((item: any) => [
        item.description,
        item.quantity.toString(),
        formatCurrency(item.unitPrice),
        formatCurrency(item.total)
      ]);
      
      let startY = 125;
      
      (pdf as any).autoTable({
        startY: startY,
        head: [['Description', 'Quantity', 'Unit Price', 'Amount']],
        body: itemsTableData,
        headStyles: {
          fillColor: [66, 135, 245],
          textColor: [255, 255, 255],
          fontSize: 12,
          fontStyle: 'bold',
          halign: 'center'
        },
        bodyStyles: {
          fontSize: 11,
          cellPadding: 6,
          lineColor: [200, 200, 200],
          lineWidth: 0.5
        },
        columnStyles: {
          0: { cellWidth: 80, halign: 'left' },
          1: { cellWidth: 25, halign: 'center' },
          2: { cellWidth: 35, halign: 'right' },
          3: { cellWidth: 40, halign: 'right' }
        },
        alternateRowStyles: {
          fillColor: [248, 249, 250]
        },
        margin: { left: 20, right: 20 }
      });
      
      // Summary table
      const summaryData = [
        ['Subtotal:', formatCurrency(bill.subtotal)]
      ];
      
      if (bill.discount > 0) {
        summaryData.push([`Discount (${bill.discount}%):`, `-${formatCurrency(bill.subtotal * bill.discount / 100)}`]);
      }
      
      // GST calculation
      const gstAmount = bill.total - (bill.subtotal - (bill.subtotal * bill.discount / 100));
      if (gstAmount > 0) {
        summaryData.push(['GST (18%):', formatCurrency(gstAmount)]);
      }
      
      const finalY = (pdf as any).lastAutoTable.finalY + 10;
      
      (pdf as any).autoTable({
        startY: finalY,
        body: summaryData,
        bodyStyles: {
          fontSize: 11,
          cellPadding: 4,
          lineColor: [200, 200, 200],
          lineWidth: 0.5
        },
        columnStyles: {
          0: { cellWidth: 140, halign: 'right', fontStyle: 'bold' },
          1: { cellWidth: 40, halign: 'right' }
        },
        margin: { left: 20, right: 20 },
        theme: 'plain'
      });
      
      // Total amount row with emphasis
      const totalY = (pdf as any).lastAutoTable.finalY + 5;
      (pdf as any).autoTable({
        startY: totalY,
        body: [['TOTAL AMOUNT:', formatCurrency(bill.total)]],
        bodyStyles: {
          fontSize: 14,
          cellPadding: 6,
          fontStyle: 'bold',
          fillColor: [66, 135, 245],
          textColor: [255, 255, 255]
        },
        columnStyles: {
          0: { cellWidth: 140, halign: 'right' },
          1: { cellWidth: 40, halign: 'right' }
        },
        margin: { left: 20, right: 20 },
        theme: 'plain'
      });
      
      // Notes section
      if (bill.notes) {
        const notesY = (pdf as any).lastAutoTable.finalY + 15;
        pdf.setFont("helvetica", "bold");
        pdf.setFontSize(11);
        pdf.text("NOTES:", 20, notesY);
        pdf.setFont("helvetica", "normal");
        pdf.setFontSize(10);
        
        // Split notes into multiple lines if needed
        const splitNotes = pdf.splitTextToSize(bill.notes, pageWidth - 40);
        pdf.text(splitNotes, 20, notesY + 8);
      }
      
      // Professional footer with thank you message
      const footerY = Math.max((pdf as any).lastAutoTable?.finalY + 40, 240);
      
      // Thank you message
      pdf.setFontSize(16);
      pdf.setFont("helvetica", "bold");
      pdf.setTextColor(66, 135, 245);
      pdf.text("Thank you for shopping with us!", pageWidth / 2, footerY, { align: "center" });
      
      pdf.setFontSize(12);
      pdf.setFont("helvetica", "normal");
      pdf.setTextColor(0, 0, 0);
      pdf.text("We appreciate your business and trust in our services.", pageWidth / 2, footerY + 10, { align: "center" });
      pdf.text("Visit us again for all your cycle service needs!", pageWidth / 2, footerY + 20, { align: "center" });
      
      // Bottom line with terms
      pdf.setFontSize(9);
      pdf.setTextColor(100, 100, 100);
      pdf.text("Terms: Payment due within 30 days. All services come with quality guarantee.", pageWidth / 2, footerY + 35, { align: "center" });
      
      // Download PDF
      pdf.save(`Advanced-Bill-${billData.invoiceNumber || Date.now()}.pdf`);
      
      toast({
        title: "Professional PDF Generated",
        description: "Advanced bill PDF with table format has been downloaded successfully.",
      });
      
    } catch (error) {
      console.error('PDF Generation Error:', error);
      toast({
        title: "PDF Generation Failed",
        description: "There was an error generating the PDF. Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Navbar />
      
      <div className="pt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Advanced Billing</h1>
              <p className="text-gray-600 dark:text-gray-400">Create detailed bills with custom items and descriptions</p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Bill Creation Form */}
            <div className="lg:col-span-2 space-y-6">
              {/* Customer Selection */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <ShoppingCart className="mr-2 h-5 w-5" />
                    Customer Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium mb-2 block">Customer Name</label>
                      <Input
                        placeholder="Enter customer name"
                        value={bill.customerName}
                        onChange={(e) => setBill(prev => ({ ...prev, customerName: e.target.value }))}
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium mb-2 block">Customer Phone</label>
                      <Input
                        placeholder="Enter phone number"
                        value={bill.customerPhone}
                        onChange={(e) => setBill(prev => ({ ...prev, customerPhone: e.target.value }))}
                      />
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium mb-2 block">Customer Email (Optional)</label>
                      <Input
                        type="email"
                        placeholder="Enter email address"
                        value={bill.customerEmail}
                        onChange={(e) => setBill(prev => ({ ...prev, customerEmail: e.target.value }))}
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium mb-2 block">Payment Method</label>
                      <Select value={bill.paymentMethod} onValueChange={(value) => setBill(prev => ({ ...prev, paymentMethod: value }))}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="cash">Cash</SelectItem>
                          <SelectItem value="card">Card</SelectItem>
                          <SelectItem value="upi">UPI</SelectItem>
                          <SelectItem value="netbanking">Net Banking</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  
                  <div>
                    <label className="text-sm font-medium mb-2 block">Or Select from Existing Customers</label>
                    <Select value={bill.customerId} onValueChange={selectCustomer}>
                      <SelectTrigger>
                        <SelectValue placeholder="Choose existing customer (optional)" />
                      </SelectTrigger>
                      <SelectContent>
                        {Array.isArray(customers) && customers?.map((customer: any) => (
                          <SelectItem key={customer.id} value={customer.id}>
                            {customer.firstName} {customer.lastName}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  {bill.customerName && (
                    <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                      <h4 className="font-medium text-blue-900 dark:text-blue-100">{bill.customerName}</h4>
                      {bill.customerPhone && <p className="text-sm text-blue-700 dark:text-blue-300">{bill.customerPhone}</p>}
                      {bill.customerEmail && <p className="text-sm text-blue-700 dark:text-blue-300">{bill.customerEmail}</p>}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Add Items */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Plus className="mr-2 h-5 w-5" />
                    Add Items
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="md:col-span-2">
                      <label className="text-sm font-medium mb-2 block">Item Description</label>
                      <div className="space-y-2">
                        <Input
                          placeholder="e.g., Bike chain replacement, Brake adjustment..."
                          value={currentItem.description}
                          onChange={(e) => setCurrentItem(prev => ({ ...prev, description: e.target.value }))}
                        />
                        {savedItems.length > 0 && (
                          <div className="flex flex-wrap gap-1">
                            <span className="text-xs text-gray-500">Quick add:</span>
                            {savedItems.slice(0, 6).map((item, index) => (
                              <Button
                                key={index}
                                variant="outline"
                                size="sm"
                                className="h-6 text-xs px-2"
                                onClick={() => setCurrentItem(prev => ({ ...prev, description: item }))}
                              >
                                {item}
                              </Button>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                    <div>
                      <label className="text-sm font-medium mb-2 block">Quantity</label>
                      <Input
                        type="number"
                        min="1"
                        value={currentItem.quantity}
                        onChange={(e) => setCurrentItem(prev => ({ ...prev, quantity: parseInt(e.target.value) || 1 }))}
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium mb-2 block">Unit Price (₹)</label>
                      <Input
                        type="number"
                        step="0.01"
                        min="0"
                        value={currentItem.unitPrice}
                        onChange={(e) => setCurrentItem(prev => ({ ...prev, unitPrice: parseFloat(e.target.value) || 0 }))}
                      />
                    </div>
                  </div>
                  
                  <Button onClick={addItem} className="w-full bg-primary hover:bg-primary/90">
                    <Plus className="mr-2 h-4 w-4" />
                    Add Item
                  </Button>
                </CardContent>
              </Card>

              {/* Items List */}
              {bill.items.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle>Bill Items</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {bill.items.map((item) => (
                        <div key={item.id} className="flex items-center justify-between p-4 border rounded-lg">
                          <div className="flex-1">
                            <h4 className="font-medium">{item.description}</h4>
                            <p className="text-sm text-gray-500">
                              {formatCurrency(item.unitPrice)} × {item.quantity} = {formatCurrency(item.total)}
                            </p>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => updateQuantity(item.id, item.quantity - 1)}
                            >
                              <Minus className="h-3 w-3" />
                            </Button>
                            <span className="w-8 text-center">{item.quantity}</span>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => updateQuantity(item.id, item.quantity + 1)}
                            >
                              <Plus className="h-3 w-3" />
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => removeItem(item.id)}
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Notes */}
              <Card>
                <CardHeader>
                  <CardTitle>Additional Notes</CardTitle>
                </CardHeader>
                <CardContent>
                  <Textarea
                    placeholder="Add any special instructions or notes..."
                    value={bill.notes}
                    onChange={(e) => setBill(prev => ({ ...prev, notes: e.target.value }))}
                    rows={3}
                  />
                </CardContent>
              </Card>
            </div>

            {/* Bill Summary */}
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <DollarSign className="mr-2 h-5 w-5" />
                    Bill Summary
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span>Subtotal:</span>
                      <span>{formatCurrency(bill.subtotal)}</span>
                    </div>
                    
                    <div>
                      <div className="flex justify-between items-center mb-2">
                        <span>Discount (%):</span>
                        <div className="flex items-center space-x-2">
                          <Input
                            type="number"
                            min="0"
                            max="100"
                            step="0.1"
                            className="w-20 text-right"
                            value={bill.discount}
                            onChange={(e) => {
                              const discount = parseFloat(e.target.value) || 0;
                              setBill(prev => ({ ...prev, discount }));
                              calculateTotals(bill.items, discount);
                            }}
                          />
                          <span className="text-sm text-gray-500">%</span>
                        </div>
                      </div>
                      {bill.discount > 0 && (
                        <div className="flex justify-between text-green-600 dark:text-green-400">
                          <span>Discount Amount:</span>
                          <span>-{formatCurrency(bill.subtotal * bill.discount / 100)}</span>
                        </div>
                      )}
                    </div>

                    
                    <Separator />
                    
                    <div className="flex justify-between text-lg font-bold">
                      <span>Total:</span>
                      <span>{formatCurrency(bill.total)}</span>
                    </div>
                  </div>
                  
                  <Button 
                    onClick={() => generateBillMutation.mutate(bill)}
                    disabled={!bill.customerName.trim() || bill.items.length === 0 || generateBillMutation.isPending}
                    className="w-full bg-primary hover:bg-primary/90"
                  >
                    <FileText className="mr-2 h-4 w-4" />
                    Generate Bill & Download PDF
                  </Button>
                  
                  {bill.items.length === 0 && (
                    <p className="text-sm text-gray-500 text-center">Add items to generate bill</p>
                  )}
                  {!bill.customerName.trim() && bill.items.length > 0 && (
                    <p className="text-sm text-orange-500 text-center">Enter customer name to generate bill</p>
                  )}
                </CardContent>
              </Card>

              {/* Payment Method Badge */}
              {bill.paymentMethod && (
                <Card>
                  <CardContent className="pt-6">
                    <div className="text-center">
                      <Badge variant="secondary" className="text-lg px-4 py-2">
                        Payment: {bill.paymentMethod.toUpperCase()}
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}