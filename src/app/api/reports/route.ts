import { NextRequest } from 'next/server';
import prisma from '@/lib/db';
import { authenticateRequest, jsonResponse, errorResponse } from '@/lib/middleware-server';

export async function GET(req: NextRequest) {
  const { user, error } = await authenticateRequest(req);
  if (error) return error;

  const url = new URL(req.url);
  const type = url.searchParams.get('type') || 'sales';

  try {
    switch (type) {
      case 'sales': {
        const orders = await prisma.salesOrder.findMany({
          orderBy: { orderDate: 'desc' },
          select: { id: true, orderNumber: true, orderDate: true, totalAmount: true, paidAmount: true, outstanding: true, status: true, paymentStatus: true, customer: { select: { name: true } } },
          take: 100,
        });
        const totalRevenue = orders.reduce((s, o) => s + o.totalAmount, 0);
        const totalPaid = orders.reduce((s, o) => s + o.paidAmount, 0);
        const totalOutstanding = orders.reduce((s, o) => s + o.outstanding, 0);
        const orderCount = orders.length;
        return jsonResponse({
          summary: { totalRevenue, totalPaid, totalOutstanding, orderCount },
          rows: orders.map((o) => ({
            id: o.id,
            orderNumber: o.orderNumber,
            customer: o.customer?.name || 'N/A',
            date: o.orderDate,
            amount: o.totalAmount,
            paid: o.paidAmount,
            outstanding: o.outstanding,
            status: o.status,
            paymentStatus: o.paymentStatus,
          })),
        });
      }

      case 'customer': {
        const customers = await prisma.customer.findMany({
          select: { id: true, customerId: true, name: true, phone: true, type: true, status: true, outstanding: true, salesOrders: { select: { totalAmount: true } } },
          orderBy: { name: 'asc' },
        });
        const activeCount = customers.filter((c) => c.status === 'ACTIVE').length;
        const leadCount = customers.filter((c) => c.status === 'LEAD').length;
        const inactiveCount = customers.filter((c) => c.status === 'INACTIVE' || c.status === 'LOST').length;
        const totalOutstanding = customers.reduce((s, c) => s + c.outstanding, 0);
        return jsonResponse({
          summary: { total: customers.length, active: activeCount, leads: leadCount, inactive: inactiveCount, totalOutstanding },
          rows: customers.map((c) => ({
            id: c.id,
            customerId: c.customerId,
            name: c.name,
            phone: c.phone,
            type: c.type,
            status: c.status,
            outstanding: c.outstanding,
            totalOrders: c.salesOrders.length,
            totalRevenue: c.salesOrders.reduce((s, o) => s + o.totalAmount, 0),
          })),
        });
      }

      case 'profit': {
        const [salesAgg, prodAgg, expenseAgg] = await Promise.all([
          prisma.salesOrder.aggregate({ _sum: { totalAmount: true, paidAmount: true } }),
          prisma.production.aggregate({ _sum: { totalCost: true, quantityProduced: true } }),
          prisma.expense.aggregate({ _sum: { amount: true } }),
        ]);
        const revenue = salesAgg._sum.totalAmount || 0;
        const productionCost = prodAgg._sum.totalCost || 0;
        const expenses = expenseAgg._sum.amount || 0;
        const grossProfit = revenue - productionCost;
        const netProfit = grossProfit - expenses;
        const grossMargin = revenue > 0 ? (grossProfit / revenue) * 100 : 0;
        const netMargin = revenue > 0 ? (netProfit / revenue) * 100 : 0;
        return jsonResponse({
          summary: { revenue, productionCost, expenses, grossProfit, netProfit, grossMargin, netMargin },
          rows: [
            { metric: 'Total Revenue', value: revenue },
            { metric: 'Production Cost', value: productionCost },
            { metric: 'Gross Profit', value: grossProfit },
            { metric: 'Operating Expenses', value: expenses },
            { metric: 'Net Profit', value: netProfit },
            { metric: 'Gross Margin %', value: grossMargin },
            { metric: 'Net Margin %', value: netMargin },
          ],
        });
      }

      case 'expense': {
        const expensesByCategory = await prisma.expense.groupBy({
          by: ['categoryId'],
          _sum: { amount: true },
          _count: true,
        });
        const categories = await prisma.expenseCategory.findMany();
        const catMap = Object.fromEntries(categories.map((c) => [c.id, c.name]));
        const totalExpenses = expensesByCategory.reduce((s, e) => s + (e._sum.amount || 0), 0);
        return jsonResponse({
          summary: { totalExpenses, categoryCount: expensesByCategory.length },
          rows: expensesByCategory.map((e) => ({
            category: catMap[e.categoryId] || 'Unknown',
            amount: e._sum.amount || 0,
            count: e._count,
            percentage: totalExpenses > 0 ? ((e._sum.amount || 0) / totalExpenses) * 100 : 0,
          })),
        });
      }

      case 'inventory': {
        const [products, rawMaterials] = await Promise.all([
          prisma.inventory.findMany({ select: { currentStock: true, unitCost: true, value: true, reorderLevel: true, product: { select: { name: true, unit: true } } } }),
          prisma.rawMaterial.findMany({ select: { name: true, currentStock: true, unit: true, unitCost: true, reorderLevel: true } }),
        ]);
        const finishedValue = products.reduce((s, p) => s + p.value, 0);
        const rawValue = rawMaterials.reduce((s, r) => s + r.currentStock * r.unitCost, 0);
        return jsonResponse({
          summary: { finishedGoodsValue: finishedValue, rawMaterialValue: rawValue, totalValue: finishedValue + rawValue },
          rows: [
            ...products.map((p) => ({
              type: 'Finished Good',
              name: p.product?.name || 'Unknown',
              stock: p.currentStock,
              unit: p.product?.unit || 'KG',
              unitCost: p.unitCost,
              totalValue: p.value,
              reorderLevel: p.reorderLevel,
              lowStock: p.currentStock <= p.reorderLevel,
            })),
            ...rawMaterials.map((r) => ({
              type: 'Raw Material',
              name: r.name,
              stock: r.currentStock,
              unit: r.unit,
              unitCost: r.unitCost,
              totalValue: r.currentStock * r.unitCost,
              reorderLevel: r.reorderLevel,
              lowStock: r.currentStock <= r.reorderLevel,
            })),
          ],
        });
      }

      case 'production': {
        const productions = await prisma.production.findMany({
          orderBy: { date: 'desc' },
          select: { id: true, productionNumber: true, date: true, shift: true, waxUsed: true, quantityProduced: true, totalCost: true, costPerKg: true, margin: true, batch: { select: { batchNumber: true } }, operator: { select: { name: true } } },
          take: 100,
        });
        const totalQty = productions.reduce((s, p) => s + p.quantityProduced, 0);
        const totalCost = productions.reduce((s, p) => s + p.totalCost, 0);
        const avgCostPerKg = totalQty > 0 ? totalCost / totalQty : 0;
        return jsonResponse({
          summary: { totalProductions: productions.length, totalQty, totalCost, avgCostPerKg },
          rows: productions.map((p) => ({
            id: p.id,
            productionNumber: p.productionNumber,
            batchNumber: p.batch?.batchNumber || 'N/A',
            date: p.date,
            shift: p.shift,
            waxUsed: p.waxUsed,
            quantityProduced: p.quantityProduced,
            totalCost: p.totalCost,
            costPerKg: p.costPerKg,
            margin: p.margin,
            operator: p.operator?.name || 'N/A',
          })),
        });
      }

      case 'gst': {
        const invoices = await prisma.invoice.findMany({
          orderBy: { invoiceDate: 'desc' },
          select: { id: true, invoiceNumber: true, invoiceDate: true, totalAmount: true, totalGst: true, cgst: true, sgst: true, igst: true, customer: { select: { name: true } } },
          take: 100,
        });
        const totalTaxable = invoices.reduce((s, i) => s + (i.totalAmount - i.totalGst), 0);
        const totalCgst = invoices.reduce((s, i) => s + i.cgst, 0);
        const totalSgst = invoices.reduce((s, i) => s + i.sgst, 0);
        const totalIgst = invoices.reduce((s, i) => s + i.igst, 0);
        const totalGst = invoices.reduce((s, i) => s + i.totalGst, 0);
        return jsonResponse({
          summary: { invoiceCount: invoices.length, totalTaxable, totalCgst, totalSgst, totalIgst, totalGst },
          rows: invoices.map((i) => ({
            id: i.id,
            invoiceNumber: i.invoiceNumber,
            customer: i.customer?.name || 'N/A',
            date: i.invoiceDate,
            taxableAmount: i.totalAmount - i.totalGst,
            cgst: i.cgst,
            sgst: i.sgst,
            igst: i.igst,
            totalGst: i.totalGst,
            totalAmount: i.totalAmount,
          })),
        });
      }

      case 'outstanding': {
        const customers = await prisma.customer.findMany({
          where: { outstanding: { gt: 0 } },
          orderBy: { outstanding: 'desc' },
          select: { id: true, customerId: true, name: true, phone: true, outstanding: true, creditLimit: true, invoices: { where: { outstanding: { gt: 0 } }, orderBy: { dueDate: 'asc' }, select: { dueDate: true } } },
        });
        const totalOutstanding = customers.reduce((s, c) => s + c.outstanding, 0);
        return jsonResponse({
          summary: { totalOutstanding, customersWithDues: customers.length },
          rows: customers.map((c) => ({
            id: c.id,
            customerId: c.customerId,
            name: c.name,
            phone: c.phone,
            outstanding: c.outstanding,
            creditLimit: c.creditLimit,
            invoiceCount: c.invoices.length,
            oldestDue: c.invoices.length > 0 ? c.invoices[0].dueDate : null,
          })),
        });
      }

      default:
        return errorResponse('Unknown report type', 400);
    }
  } catch (err: any) {
    return errorResponse(err.message || 'Failed to generate report', 500);
  }
}
