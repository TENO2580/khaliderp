import { NextRequest } from 'next/server';
import prisma from '@/lib/db';
import { authenticateRequest, jsonResponse, errorResponse } from '@/lib/middleware-server';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  const { user, error } = await authenticateRequest(req);
  if (error) return error;

  try {
    const { customers, duplicateStrategy = 'SKIP', duplicateCriteria = 'PHONE' } = await req.json();
    
    if (!Array.isArray(customers) || customers.length === 0) {
      return errorResponse('No customers provided', 400);
    }

    // Get current count to generate customerIds
    const currentCount = await prisma.customer.count();

    const createdCustomers: any[] = [];
    let countOffset = currentCount + 1;

    // Process all inside a transaction for efficiency
    const result = await prisma.$transaction(async (tx) => {
      for (const c of customers) {
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

        // Duplicate Check
        let existingCustomer = null;
        let searchConditions: any[] = [];
        if (duplicateCriteria === 'PHONE' || duplicateCriteria === 'BOTH') {
          if (c.phone) searchConditions.push({ phone: c.phone });
        }
        if (duplicateCriteria === 'NAME' || duplicateCriteria === 'BOTH') {
          if (c.name) searchConditions.push({ name: c.name });
        }

        if (searchConditions.length > 0) {
          existingCustomer = await tx.customer.findFirst({
            where: duplicateCriteria === 'BOTH' ? { AND: searchConditions } : { OR: searchConditions }
          });
        }

        if (existingCustomer) {
          if (duplicateStrategy === 'SKIP') {
            continue; // Skip this record
          } else if (duplicateStrategy === 'OVERWRITE') {
            // Overwrite existing record
            const updatedCustomer = await tx.customer.update({
              where: { id: existingCustomer.id },
              data: {
                name: c.name || existingCustomer.name,
                ownerName: c.ownerName || existingCustomer.ownerName,
                phone: c.phone || existingCustomer.phone,
                whatsapp: c.whatsapp || existingCustomer.whatsapp,
                email: c.email || existingCustomer.email,
                gstNumber: c.gstNumber || existingCustomer.gstNumber,
                address: c.address || existingCustomer.address,
                district: c.district || existingCustomer.district,
                state: c.state || existingCustomer.state,
                pincode: c.pincode || existingCustomer.pincode,
                route: c.route || existingCustomer.route,
                type: c.type || existingCustomer.type,
                creditLimit: c.creditLimit ? Number(c.creditLimit) : existingCustomer.creditLimit,
                status: c.status || existingCustomer.status,
                notes: c.notes || existingCustomer.notes,
                sellingPrice: c.sellingPrice ? Number(c.sellingPrice) : existingCustomer.sellingPrice,
                lastPurchaseDate: lastPurchaseDate || existingCustomer.lastPurchaseDate,
                nextFollowupDate: nextFollowupDate || existingCustomer.nextFollowupDate,
              }
            });
            createdCustomers.push(updatedCustomer);
            continue;
          }
        }

        // If no duplicate found or not handled, create new
        const customerId = `CUST-${String(countOffset).padStart(4, '0')}`;
        
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
