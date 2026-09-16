import { NextRequest } from 'next/server';
import prisma from '@/lib/db';
import { authenticateRequest, jsonResponse, errorResponse } from '@/lib/middleware-server';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  const { user, error } = await authenticateRequest(req);
  if (error) return error;

  try {
    const { customers } = await req.json();
    
    if (!Array.isArray(customers) || customers.length === 0) {
      return errorResponse('No customers provided', 400);
    }

    // Get current count to generate customerIds
    const currentCount = await prisma.customer.count();

    const createdCustomers = [];
    let countOffset = currentCount + 1;

    // Process all inside a transaction for efficiency
    const result = await prisma.$transaction(async (tx) => {
      for (const c of customers) {
        const customerId = `CUST-${String(countOffset).padStart(4, '0')}`;
        
        let lastPurchaseDate = null;
        if (c.lastPurchaseDate) {
          const d = new Date(c.lastPurchaseDate);
          if (!isNaN(d.getTime())) lastPurchaseDate = d.toISOString();
        }
        
        let nextFollowupDate = null;
        if (c.nextFollowupDate) {
          const d = new Date(c.nextFollowupDate);
          if (!isNaN(d.getTime())) nextFollowupDate = d.toISOString();
        }

        const newCustomer = await tx.customer.create({
          data: {
            customerId,
            name: c.name || 'Unknown',
            ownerName: c.ownerName || '',
            phone: c.phone || '',
            whatsapp: c.whatsapp || '',
            email: c.email || '',
            gstNumber: c.gstNumber || '',
            address: c.address || '',
            district: c.district || '',
            state: c.state || '',
            pincode: c.pincode || '',
            route: c.route || '',
            type: c.type || 'RETAILER',
            creditLimit: Number(c.creditLimit) || 50000,
            status: c.status || 'ACTIVE',
            notes: c.notes || '',
            sellingPrice: Number(c.sellingPrice) || 0,
            lastPurchaseDate,
            nextFollowupDate,
          }
        });
        
        createdCustomers.push(newCustomer);
        countOffset++;
      }
      return createdCustomers;
    });

    return jsonResponse({ count: result.length }, 201, 'Customers imported successfully');
  } catch (err: any) {
    return errorResponse(err.message || 'Failed to import customers', 400);
  }
}
