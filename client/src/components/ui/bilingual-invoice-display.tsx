import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './card';
import { Separator } from './separator';
import { transliterateToGujarati } from '@/lib/transliteration';

interface BilingualInvoiceDisplayProps {
  invoice: any;
  customer: any;
  workOrder?: any;
}

export function BilingualInvoiceDisplay({ 
  invoice, 
  customer, 
  workOrder 
}: BilingualInvoiceDisplayProps) {
  
  const formatCurrency = (amount: string) => {
    const num = parseFloat(amount);
    return num.toLocaleString('en-IN', { style: 'currency', currency: 'INR' });
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN');
  };

  return (
    <div className="max-w-4xl mx-auto bg-white p-8">
      {/* Header */}
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          SewCraft Pro
        </h1>
        <h2 className="text-xl font-semibold text-gray-700 mb-4">
          સ્યૂક્રાફ્ટ પ્રો
        </h2>
        <div className="flex justify-between items-start">
          <div>
            <h3 className="text-lg font-semibold mb-2">Invoice / ભરતિયું</h3>
            <p className="text-sm text-gray-600">#{invoice.invoiceNumber}</p>
          </div>
          <div className="text-right">
            <p className="text-sm text-gray-600">Date / તારીખ:</p>
            <p className="font-semibold">{formatDate(invoice.createdAt)}</p>
          </div>
        </div>
      </div>

      <Separator className="my-6" />

      {/* Customer Information */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Bill To / બિલ:</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <p className="font-semibold">
                {customer.firstName} {customer.lastName}
              </p>
              <p className="text-sm text-gray-600 font-gujarati">
                {transliterateToGujarati(`${customer.firstName} ${customer.lastName}`)}
              </p>
              
              {customer.address && (
                <>
                  <p className="text-sm">{customer.address}</p>
                  <p className="text-sm text-gray-600 font-gujarati">
                    {transliterateToGujarati(customer.address)}
                  </p>
                </>
              )}
              
              {customer.city && customer.state && (
                <>
                  <p className="text-sm">{customer.city}, {customer.state} {customer.zipCode}</p>
                  <p className="text-sm text-gray-600 font-gujarati">
                    {transliterateToGujarati(`${customer.city}, ${customer.state}`)} {customer.zipCode}
                  </p>
                </>
              )}
              
              <p className="text-sm">Phone: {customer.phone}</p>
              {customer.email && <p className="text-sm">Email: {customer.email}</p>}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Service Details / સેવા વિગતો:</CardTitle>
          </CardHeader>
          <CardContent>
            {workOrder && (
              <div className="space-y-2">
                <p className="font-semibold">Work Order: {workOrder.orderNumber}</p>
                <p className="text-sm text-gray-600">કાર્ય ઓર્ડર: {workOrder.orderNumber}</p>
                
                <p className="text-sm">Problem: {workOrder.problemDescription}</p>
                <p className="text-sm text-gray-600 font-gujarati">
                  સમસ્યા: {transliterateToGujarati(workOrder.problemDescription)}
                </p>
                
                <p className="text-sm">Status: {workOrder.status}</p>
                <p className="text-sm">Due Date: {workOrder.dueDate ? formatDate(workOrder.dueDate) : 'N/A'}</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Invoice Details */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="text-lg">Invoice Summary / ભરતિયું સારાંશ</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex justify-between py-2">
              <span>Subtotal / પેટાયોગ:</span>
              <span className="font-semibold">{formatCurrency(invoice.subtotal)}</span>
            </div>
            
            <div className="flex justify-between py-2">
              <span>Tax ({(parseFloat(invoice.taxRate) * 100).toFixed(2)}%) / કર:</span>
              <span className="font-semibold">{formatCurrency(invoice.taxAmount)}</span>
            </div>
            
            <Separator />
            
            <div className="flex justify-between py-2 text-lg font-bold">
              <span>Total / કુલ:</span>
              <span>{formatCurrency(invoice.total)}</span>
            </div>
            
            <div className="mt-4 p-4 bg-gray-50 rounded">
              <p className="text-sm font-semibold mb-2">Payment Status / ચુકવણીની સ્થિતિ:</p>
              <span className={`px-3 py-1 rounded text-sm font-medium ${
                invoice.paymentStatus === 'paid' 
                  ? 'bg-green-100 text-green-800' 
                  : invoice.paymentStatus === 'overdue'
                  ? 'bg-red-100 text-red-800'
                  : 'bg-yellow-100 text-yellow-800'
              }`}>
                {invoice.paymentStatus === 'paid' ? 'Paid / ચૂકવ્યું' : 
                 invoice.paymentStatus === 'overdue' ? 'Overdue / મુદત વીતેલ' : 
                 'Pending / બાકી'}
              </span>
              
              {invoice.dueDate && (
                <p className="text-sm mt-2">
                  Due Date / મુદત: {formatDate(invoice.dueDate)}
                </p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Footer */}
      <div className="text-center text-sm text-gray-600 mt-8">
        <p>Thank you for your business! / આપના વ્યવસાય માટે આભાર!</p>
        <p className="mt-2">SewCraft Pro - Professional Sewing Machine Service</p>
      </div>
    </div>
  );
}