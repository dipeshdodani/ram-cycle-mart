import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ShoppingCart, Wrench, Search, Plus, Trash2, FileText, Calendar, Shield } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { formatCurrency } from "@/lib/currency";

interface BillItem {
  id: string;
  type: 'product' | 'service' | 'part';
  name: string;
  description?: string;
  quantity: number;
  price: number;
  total: number;
  warrantyMonths?: number;
  hsnCode?: string;
  inventoryItemId?: string;
}

interface CustomerInfo {
  id?: string;
  name: string;
  phone: string;
  address?: string;
  gstNumber?: string;
}

interface BillData {
  customer: CustomerInfo;
  items: BillItem[];
  subtotal: number;
  taxRate: number;
  taxAmount: number;
  total: number;
  paymentMode: string;
  billType: 'gst' | 'non-gst';
  warrantyNote?: string;
}

export default function Billing() {
  const [activeTab, setActiveTab] = useState("new-sale");
  const [bill, setBill] = useState<BillData>({
    customer: { name: "", phone: "", address: "", gstNumber: "" },
    items: [],
    subtotal: 0,
    taxRate: 18,
    taxAmount: 0,
    total: 0,
    paymentMode: "cash",
    billType: "gst"
  });
  
  const [currentItem, setCurrentItem] = useState<Partial<BillItem>>({
    type: 'product',
    name: '',
    description: '',
    quantity: 1,
    price: 0,
    warrantyMonths: 12,
    hsnCode: ''
  });

  const [customerSearch, setCustomerSearch] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);

  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch customers for search
  const { data: customers = [] } = useQuery({
    queryKey: ["/api/customers"],
    queryFn: () => apiRequest("GET", "/api/customers").then(res => res.json()),
  });

  // Fetch inventory items
  const { data: inventory = [], isLoading: inventoryLoading } = useQuery({
    queryKey: ["/api/inventory"],
    queryFn: () => apiRequest("GET", "/api/inventory").then(res => res.json()),
    retry: 3,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  // Debug inventory data
  console.log("Inventory data:", inventory);
  console.log("Inventory loading:", inventoryLoading);

  // Search customers
  useEffect(() => {
    if (customerSearch.length > 0) {
      const filtered = customers.filter((customer: any) =>
        customer.firstName.toLowerCase().includes(customerSearch.toLowerCase()) ||
        customer.lastName.toLowerCase().includes(customerSearch.toLowerCase()) ||
        customer.phone.includes(customerSearch)
      );
      setSearchResults(filtered);
    } else {
      setSearchResults([]);
    }
  }, [customerSearch, customers]);

  // Calculate totals
  useEffect(() => {
    const subtotal = bill.items.reduce((sum, item) => sum + item.total, 0);
    const taxAmount = bill.billType === 'gst' ? (subtotal * bill.taxRate) / 100 : 0;
    const total = subtotal + taxAmount;

    setBill(prev => ({ ...prev, subtotal, taxAmount, total }));
  }, [bill.items, bill.taxRate, bill.billType]);

  const selectCustomer = (customer: any) => {
    setBill(prev => ({
      ...prev,
      customer: {
        id: customer.id,
        name: `${customer.firstName} ${customer.lastName}`,
        phone: customer.phone,
        address: customer.address,
        gstNumber: customer.gstNumber
      }
    }));
    setCustomerSearch("");
    setSearchResults([]);
  };

  const selectInventoryItem = (item: any) => {
    setCurrentItem(prev => ({
      ...prev,
      inventoryItemId: item.id,
      name: item.name,
      price: parseFloat(item.sellingPrice || item.price || 0),
      hsnCode: item.hsnCode,
      type: (item.type === 'machine' || item.type === 'cycle' || item.type === 'machines' || item.category === 'machine' || item.category === 'machines') ? 'product' : 'part'
    }));
  };

  const addItemToBill = () => {
    if (!currentItem.name || !currentItem.price || currentItem.quantity! <= 0) {
      toast({
        title: "Invalid Item",
        description: "Please fill all required fields",
        variant: "destructive"
      });
      return;
    }

    const total = currentItem.price! * currentItem.quantity!;
    const newItem: BillItem = {
      id: Date.now().toString(),
      type: currentItem.type as any,
      name: currentItem.name,
      description: currentItem.description,
      quantity: currentItem.quantity!,
      price: currentItem.price!,
      total,
      warrantyMonths: currentItem.type === 'product' ? currentItem.warrantyMonths : undefined,
      hsnCode: currentItem.hsnCode,
      inventoryItemId: currentItem.inventoryItemId
    };

    setBill(prev => ({
      ...prev,
      items: [...prev.items, newItem]
    }));

    // Reset current item
    setCurrentItem({
      type: 'product',
      name: '',
      description: '',
      quantity: 1,
      price: 0,
      warrantyMonths: 12,
      hsnCode: ''
    });

    toast({
      title: "Item Added",
      description: `${newItem.name} added to bill`
    });
  };

  const removeItem = (itemId: string) => {
    setBill(prev => ({
      ...prev,
      items: prev.items.filter(item => item.id !== itemId)
    }));
  };

  const generateBill = useMutation({
    mutationFn: async () => {
      return apiRequest("POST", "/api/advanced-billing", {
        customerName: bill.customer.name,
        customerPhone: bill.customer.phone,
        customerAddress: bill.customer.address,
        gstNumber: bill.customer.gstNumber,
        items: JSON.stringify(bill.items.map(item => ({
          name: item.name,
          description: item.description || "",
          quantity: item.quantity,
          price: item.price,
          total: item.total,
          warrantyMonths: item.warrantyMonths,
          hsnCode: item.hsnCode
        }))),
        subtotal: bill.subtotal.toString(),
        taxRate: bill.taxRate.toString(),
        taxAmount: bill.taxAmount.toString(),
        total: bill.total.toString(),
        paymentMode: bill.paymentMode,
        billType: bill.billType,
        warrantyNote: generateWarrantyNote()
      }).then(res => res.json());
    },
    onSuccess: () => {
      toast({
        title: "Bill Generated",
        description: "Bill has been created successfully"
      });
      
      // Reset form
      setBill({
        customer: { name: "", phone: "", address: "", gstNumber: "" },
        items: [],
        subtotal: 0,
        taxRate: 18,
        taxAmount: 0,
        total: 0,
        paymentMode: "cash",
        billType: "gst"
      });
      
      queryClient.invalidateQueries({ queryKey: ["/api/advanced-billing"] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to generate bill",
        variant: "destructive"
      });
    }
  });

  const generateWarrantyNote = () => {
    const warrantyItems = bill.items.filter(item => item.warrantyMonths);
    if (warrantyItems.length === 0) return "";

    const warrantyTexts = warrantyItems.map(item => {
      const years = Math.floor(item.warrantyMonths! / 12);
      const months = item.warrantyMonths! % 12;
      const warrantyPeriod = years > 0 
        ? `${years} ${years === 1 ? 'Year' : 'Years'}${months > 0 ? ` ${months} ${months === 1 ? 'Month' : 'Months'}` : ''}`
        : `${months} ${months === 1 ? 'Month' : 'Months'}`;
      
      const endDate = new Date();
      endDate.setMonth(endDate.getMonth() + item.warrantyMonths!);
      
      return `${item.name}: ${warrantyPeriod} (till ${endDate.toLocaleDateString('en-IN')})`;
    });

    return `Warranty: ${warrantyTexts.join(', ')}`;
  };

  const checkWarranty = async (customerId: string) => {
    // This would check customer's purchase history for warranty information
    try {
      const response = await apiRequest("GET", `/api/customers/${customerId}/warranty-status`);
      const warrantyInfo = await response.json();
      
      if (warrantyInfo.activeWarranties?.length > 0) {
        toast({
          title: "Active Warranties Found",
          description: `Customer has ${warrantyInfo.activeWarranties.length} items under warranty`,
        });
      }
    } catch (error) {
      // Silently handle - warranty check is optional
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-6 mt-16">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold dark:text-white">Sewing Machine Shop Billing</h1>
        <div className="flex items-center gap-2">
          <Shield className="h-5 w-5 text-green-600" />
          <span className="text-sm text-gray-600 dark:text-gray-400">Warranty Tracking & Customer Memory</span>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="new-sale" className="flex items-center gap-2">
            <ShoppingCart className="h-4 w-4" />
            New Sewing Machine Sale
          </TabsTrigger>
          <TabsTrigger value="service-repair" className="flex items-center gap-2">
            <Wrench className="h-4 w-4" />
            Sewing Machine Service / Repairs
          </TabsTrigger>
        </TabsList>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
          {/* Left Column - Customer & Items */}
          <div className="space-y-6">
            {/* Customer Selection */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Search className="h-5 w-5" />
                  Customer Details
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="customer-search">Search Customer</Label>
                  <Input
                    id="customer-search"
                    placeholder="Search by name or phone"
                    value={customerSearch}
                    onChange={(e) => setCustomerSearch(e.target.value)}
                  />
                  {searchResults.length > 0 && (
                    <div className="mt-2 max-h-40 overflow-y-auto border rounded-md">
                      {searchResults.map((customer) => (
                        <div
                          key={customer.id}
                          className="p-2 hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer border-b last:border-b-0"
                          onClick={() => selectCustomer(customer)}
                        >
                          <div className="font-medium">{customer.firstName} {customer.lastName}</div>
                          <div className="text-sm text-gray-600 dark:text-gray-400">{customer.phone}</div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="customer-name">Name</Label>
                    <Input
                      id="customer-name"
                      value={bill.customer.name}
                      onChange={(e) => setBill(prev => ({
                        ...prev,
                        customer: { ...prev.customer, name: e.target.value }
                      }))}
                      placeholder="Customer name"
                    />
                  </div>
                  <div>
                    <Label htmlFor="customer-phone">Phone</Label>
                    <Input
                      id="customer-phone"
                      value={bill.customer.phone}
                      onChange={(e) => setBill(prev => ({
                        ...prev,
                        customer: { ...prev.customer, phone: e.target.value }
                      }))}
                      placeholder="Phone number"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="customer-address">Address</Label>
                  <Textarea
                    id="customer-address"
                    value={bill.customer.address}
                    onChange={(e) => setBill(prev => ({
                      ...prev,
                      customer: { ...prev.customer, address: e.target.value }
                    }))}
                    placeholder="Customer address"
                    rows={2}
                  />
                </div>

                {bill.billType === 'gst' && (
                  <div>
                    <Label htmlFor="gst-number">GST Number (Optional)</Label>
                    <Input
                      id="gst-number"
                      value={bill.customer.gstNumber}
                      onChange={(e) => setBill(prev => ({
                        ...prev,
                        customer: { ...prev.customer, gstNumber: e.target.value }
                      }))}
                      placeholder="GSTIN"
                    />
                  </div>
                )}

                {bill.customer.id && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => checkWarranty(bill.customer.id!)}
                  >
                    <Shield className="h-4 w-4 mr-2" />
                    Check Warranty Status
                  </Button>
                )}
              </CardContent>
            </Card>

            {/* Item Entry */}
            <TabsContent value="new-sale">
              <Card>
                <CardHeader>
                  <CardTitle>Add Sewing Machine/Product</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="product-select">Select from Inventory ({inventory.length} items available)</Label>
                    <Select onValueChange={(value) => {
                      const item = inventory.find((i: any) => i.id === value);
                      if (item) selectInventoryItem(item);
                    }}>
                      <SelectTrigger>
                        <SelectValue placeholder="Choose a sewing machine/product" />
                      </SelectTrigger>
                      <SelectContent>
                        {inventoryLoading ? (
                          <SelectItem value="loading" disabled>
                            Loading inventory...
                          </SelectItem>
                        ) : inventory.length === 0 ? (
                          <SelectItem value="no-items" disabled>
                            No inventory items found
                          </SelectItem>
                        ) : (
                          <>
                            {/* Show all inventory items for now */}
                            {inventory.map((item: any) => (
                              <SelectItem key={item.id} value={item.id}>
                                {item.name} - {item.type || item.category || 'Unknown'} - {formatCurrency(item.sellingPrice || item.price)}
                              </SelectItem>
                            ))}
                            {inventory.length === 0 && (
                              <SelectItem value="no-items" disabled>
                                No items available
                              </SelectItem>
                            )}
                          </>
                        )}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="item-name">Sewing Machine/Product Name</Label>
                      <Input
                        id="item-name"
                        value={currentItem.name || ''}
                        onChange={(e) => setCurrentItem(prev => ({ ...prev, name: e.target.value }))}
                        placeholder="Singer, Brother, Janome brand and model"
                      />
                    </div>
                    <div>
                      <Label htmlFor="item-price">Price</Label>
                      <Input
                        id="item-price"
                        type="number"
                        value={currentItem.price || 0}
                        onChange={(e) => setCurrentItem(prev => ({ ...prev, price: parseFloat(e.target.value) || 0 }))}
                        placeholder="0"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <Label htmlFor="quantity">Quantity</Label>
                      <Input
                        id="quantity"
                        type="number"
                        min="1"
                        value={currentItem.quantity || 1}
                        onChange={(e) => setCurrentItem(prev => ({ ...prev, quantity: parseInt(e.target.value) || 1 }))}
                      />
                    </div>
                    <div>
                      <Label htmlFor="warranty">Warranty (Months)</Label>
                      <Input
                        id="warranty"
                        type="number"
                        min="0"
                        value={currentItem.warrantyMonths || 0}
                        onChange={(e) => setCurrentItem(prev => ({ ...prev, warrantyMonths: parseInt(e.target.value) || 0 }))}
                      />
                    </div>
                    <div>
                      <Label htmlFor="hsn">HSN Code</Label>
                      <Input
                        id="hsn"
                        value={currentItem.hsnCode || ''}
                        onChange={(e) => setCurrentItem(prev => ({ ...prev, hsnCode: e.target.value }))}
                        placeholder="HSN Code"
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="description">Description</Label>
                    <Input
                      id="description"
                      value={currentItem.description || ''}
                      onChange={(e) => setCurrentItem(prev => ({ ...prev, description: e.target.value }))}
                      placeholder="Sewing machine model, serial number, additional details"
                    />
                  </div>

                  <Button onClick={addItemToBill} className="w-full">
                    <Plus className="h-4 w-4 mr-2" />
                    Add to Bill
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="service-repair">
              <Card>
                <CardHeader>
                  <CardTitle>Add Sewing Machine Service/Repair</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="service-type">Service Type</Label>
                    <Select
                      value={currentItem.type}
                      onValueChange={(value) => setCurrentItem(prev => ({ ...prev, type: value as any }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="service">Service Only (Cleaning, Oiling, Tuning)</SelectItem>
                        <SelectItem value="part">Repair Parts (Motor, Pedal, Belt, etc.)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="service-name">Service/Part Name</Label>
                    <Input
                      id="service-name"
                      value={currentItem.name}
                      onChange={(e) => setCurrentItem(prev => ({ ...prev, name: e.target.value }))}
                      placeholder="e.g., Motor repair, Pedal replacement, Belt adjustment"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="service-price">Price</Label>
                      <Input
                        id="service-price"
                        type="number"
                        value={currentItem.price}
                        onChange={(e) => setCurrentItem(prev => ({ ...prev, price: parseFloat(e.target.value) || 0 }))}
                        placeholder="0"
                      />
                    </div>
                    <div>
                      <Label htmlFor="service-quantity">Quantity</Label>
                      <Input
                        id="service-quantity"
                        type="number"
                        min="1"
                        value={currentItem.quantity}
                        onChange={(e) => setCurrentItem(prev => ({ ...prev, quantity: parseInt(e.target.value) || 1 }))}
                      />
                    </div>
                  </div>

                  <Button onClick={addItemToBill} className="w-full">
                    <Plus className="h-4 w-4 mr-2" />
                    Add to Bill
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>
          </div>

          {/* Right Column - Bill Preview */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>Bill Preview</span>
                  <div className="flex items-center gap-2">
                    <Label htmlFor="bill-type">Bill Type:</Label>
                    <Select
                      value={bill.billType}
                      onValueChange={(value: 'gst' | 'non-gst') => setBill(prev => ({ ...prev, billType: value }))}
                    >
                      <SelectTrigger className="w-32">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="gst">GST Bill</SelectItem>
                        <SelectItem value="non-gst">Non-GST</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Shop Details */}
                <div className="text-center border-b pb-4">
                  <h3 className="font-bold text-lg">Ram Cycle Mart</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Complete Sewing Machine Shop Management Solution<br />
                    Expert sewing machine service and repair center<br />
                    Phone: +91 XXXXXXXXXX
                    {bill.billType === 'gst' && <><br />GSTIN: 24XXXXXXXXXXXXX</>}
                  </p>
                </div>

                {/* Customer Details */}
                {bill.customer.name && (
                  <div className="border-b pb-4">
                    <h4 className="font-semibold">Customer Details:</h4>
                    <p className="text-sm">
                      Name: {bill.customer.name}<br />
                      Phone: {bill.customer.phone}
                      {bill.customer.address && <><br />Address: {bill.customer.address}</>}
                      {bill.customer.gstNumber && <><br />GSTIN: {bill.customer.gstNumber}</>}
                    </p>
                  </div>
                )}

                {/* Items */}
                <div className="space-y-2">
                  {bill.items.length === 0 ? (
                    <p className="text-gray-500 dark:text-gray-400 text-center py-4">No items added</p>
                  ) : (
                    bill.items.map((item) => (
                      <div key={item.id} className="flex items-center justify-between p-2 border rounded">
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <span className="font-medium">{item.name}</span>
                            <Badge variant={
                              item.type === 'product' ? 'default' :
                              item.type === 'service' ? 'secondary' : 'outline'
                            }>
                              {item.type}
                            </Badge>
                            {item.warrantyMonths && (
                              <Badge variant="outline" className="text-green-600">
                                <Shield className="h-3 w-3 mr-1" />
                                {item.warrantyMonths}M
                              </Badge>
                            )}
                          </div>
                          {item.description && (
                            <p className="text-xs text-gray-600 dark:text-gray-400">{item.description}</p>
                          )}
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            {item.quantity} × {formatCurrency(item.price)} = {formatCurrency(item.total)}
                          </p>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeItem(item.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    ))
                  )}
                </div>

                {bill.items.length > 0 && (
                  <>
                    <Separator />
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span>Subtotal:</span>
                        <span>{formatCurrency(bill.subtotal)}</span>
                      </div>
                      {bill.billType === 'gst' && (
                        <div className="flex justify-between">
                          <span>GST ({bill.taxRate}%):</span>
                          <span>{formatCurrency(bill.taxAmount)}</span>
                        </div>
                      )}
                      <div className="flex justify-between font-bold text-lg">
                        <span>Total:</span>
                        <span>{formatCurrency(bill.total)}</span>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="payment-mode">Payment Mode</Label>
                        <Select
                          value={bill.paymentMode}
                          onValueChange={(value) => setBill(prev => ({ ...prev, paymentMode: value }))}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="cash">Cash</SelectItem>
                            <SelectItem value="upi">UPI</SelectItem>
                            <SelectItem value="card">Card</SelectItem>
                            <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      {generateWarrantyNote() && (
                        <div className="p-3 bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800 rounded">
                          <div className="flex items-center gap-2 text-green-700 dark:text-green-300">
                            <Calendar className="h-4 w-4" />
                            <span className="font-medium">Warranty Information</span>
                          </div>
                          <p className="text-sm text-green-600 dark:text-green-400 mt-1">
                            {generateWarrantyNote()}
                          </p>
                        </div>
                      )}

                      <Button
                        onClick={() => generateBill.mutate()}
                        disabled={!bill.customer.name || !bill.customer.phone || bill.items.length === 0 || generateBill.isPending}
                        className="w-full"
                        size="lg"
                      >
                        <FileText className="h-4 w-4 mr-2" />
                        {generateBill.isPending ? "Generating..." : "Generate Bill"}
                      </Button>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </Tabs>
    </div>
  );
}