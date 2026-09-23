import { NextRequest } from 'next/server';
import prisma from '@/lib/db';
import { jsonResponse, errorResponse } from '@/lib/middleware-server';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const type = searchParams.get('type');

    if (!type) {
      return errorResponse('Report type is required', 400);
    }

    switch (type) {
      case 'sales': {
        const [salesAgg, topCustomersRaw] = await Promise.all([
          prisma.salesOrder.aggregate({
            _sum: { totalAmount: true, paidAmount: true, outstanding: true },
            _count: true
          }),
          prisma.salesOrder.groupBy({
            by: ['customerId'],
            _sum: { totalAmount: true },
            _count: true,
            orderBy: { _sum: { totalAmount: 'desc' } },
            take: 5
          })
        ]);

        const customerIds = topCustomersRaw.map(t => t.customerId);
        const customers = await prisma.customer.findMany({
          where: { id: { in: customerIds } },
          select: { id: true, name: true }
        });
        const customerMap = Object.fromEntries(customers.map(c => [c.id, c.name]));

        const totalRevenue = salesAgg._sum.totalAmount || 0;
        const totalPaid = salesAgg._sum.paidAmount || 0;
        const totalOutstanding = salesAgg._sum.outstanding || 0;
        const orderCount = salesAgg._count || 0;

        return jsonResponse({
          summary: { totalRevenue, totalPaid, totalOutstanding, orderCount },
          rows: topCustomersRaw.map((t, idx) => ({
            rank: idx + 1,
            customer: customerMap[t.customerId] || 'Unknown',
            orders: t._count,
            revenue: t._sum.totalAmount || 0,
            contribution: totalRevenue > 0 ? (((t._sum.totalAmount || 0) / totalRevenue) * 100).toFixed(1) + '%' : '0%',
          }))
        });
      }

      case 'customer': {
        const [activeCount, leadCount, totalCount, outAgg, topCustomers] = await Promise.all([
          prisma.customer.count({ where: { status: 'ACTIVE' } }),
          prisma.customer.count({ where: { status: 'LEAD' } }),
          prisma.customer.count(),
          prisma.customer.aggregate({ _sum: { outstanding: true } }),
          prisma.customer.findMany({
            orderBy: { outstanding: 'desc' },
            take: 5,
            select: { name: true, phone: true, type: true, outstanding: true }
          })
        ]);
        
        const inactiveCount = totalCount - activeCount - leadCount;
        const totalOutstanding = outAgg._sum.outstanding || 0;
        
        return jsonResponse({
          summary: { total: totalCount, active: activeCount, leads: leadCount, inactive: inactiveCount, totalOutstanding },
          rows: topCustomers.map((c, idx) => ({
            rank: idx + 1,
            customer: c.name,
            phone: c.phone || 'N/A',
            type: c.type,
            outstanding: c.outstanding,
            riskShare: totalOutstanding > 0 ? ((c.outstanding / totalOutstanding) * 100).toFixed(1) + '%' : '0%'
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
          orderBy: { _sum: { amount: 'desc' } },
          take: 5
        });
        const catIds = expensesByCategory.map((e) => e.categoryId);
        const categories = catIds.length > 0 ? await prisma.expenseCategory.findMany({ where: { id: { in: catIds } } }) : [];
        const catMap = Object.fromEntries(categories.map((c) => [c.id, c.name]));
        
        const totalAgg = await prisma.expense.aggregate({ _sum: { amount: true }, _count: true });
        const totalExpenses = totalAgg._sum.amount || 0;
        
        return jsonResponse({
          summary: { totalExpenses, categoryCount: totalAgg._count },
          rows: expensesByCategory.map((e, idx) => ({
            rank: idx + 1,
            category: catMap[e.categoryId] || 'Unknown',
            amount: e._sum.amount || 0,
            expenseCount: e._count,
            contribution: totalExpenses > 0 ? (((e._sum.amount || 0) / totalExpenses) * 100).toFixed(1) + '%' : '0%',
          })),
        });
      }

      case 'inventory': {
        const [products, rawMaterials] = await Promise.all([
          prisma.inventory.findMany({ orderBy: { value: 'desc' }, take: 5, select: { currentStock: true, unitCost: true, value: true, product: { select: { name: true, unit: true } } } }),
          prisma.rawMaterial.findMany({ orderBy: { currentStock: 'desc' }, take: 5, select: { name: true, currentStock: true, unit: true, unitCost: true } }),
        ]);
        const batchStats = await prisma.$queryRaw<any[]>`
          SELECT COALESCE(SUM(("waxStock" * "waxRate")), 0) as rawValue,
                 COALESCE(SUM(COALESCE("remainingQty" * (("waxInitialQty" - "waxStock") * "waxRate") / NULLIF("producedQty", 0), 0)), 0) as finishedValue
          FROM "batches"
        `;
        const stats = batchStats[0] || { rawvalue: 0, finishedvalue: 0 };
        const rawValue = Number(stats.rawvalue || 0);
        const finishedValue = Number(stats.finishedvalue || 0);

        return jsonResponse({
          summary: { finishedGoodsValue: finishedValue, rawMaterialValue: rawValue, totalValue: finishedValue + rawValue },
          rows: [
            ...products.map((p, idx) => ({
              rank: idx + 1,
              type: 'Top Finished Good',
              item: p.product?.name || 'Unknown',
              stock: p.currentStock,
              unitCost: p.unitCost,
              totalValue: p.value,
            })),
            ...rawMaterials.map((r, idx) => ({
              rank: idx + 1,
              type: 'Top Raw Material',
              item: r.name,
              stock: r.currentStock,
              unitCost: r.unitCost,
              totalValue: r.currentStock * r.unitCost,
            })),
          ],
        });
      }

      case 'production': {
        const [prodAgg, topOperators] = await Promise.all([
          prisma.production.aggregate({ _sum: { quantityProduced: true, totalCost: true }, _count: true }),
          prisma.production.groupBy({
            by: ['operatorId'],
            _sum: { quantityProduced: true },
            _count: true,
            orderBy: { _sum: { quantityProduced: 'desc' } },
            take: 5
          })
        ]);
        
        const operatorIds = topOperators.filter(t => t.operatorId).map(t => t.operatorId as string);
        const operators = await prisma.user.findMany({ where: { id: { in: operatorIds } }, select: { id: true, name: true } });
        const operatorMap = Object.fromEntries(operators.map(o => [o.id, o.name]));
        
        const totalQty = prodAgg._sum.quantityProduced || 0;
        const totalCost = prodAgg._sum.totalCost || 0;
        const avgCostPerKg = totalQty > 0 ? totalCost / totalQty : 0;
        
        return jsonResponse({
          summary: { totalProductions: prodAgg._count, totalQty, totalCost, avgCostPerKg },
          rows: topOperators.map((t, idx) => ({
            rank: idx + 1,
            operator: t.operatorId ? (operatorMap[t.operatorId] || 'Unknown') : 'N/A',
            productionsCount: t._count,
            quantityProduced: t._sum.quantityProduced || 0,
            contribution: totalQty > 0 ? (((t._sum.quantityProduced || 0) / totalQty) * 100).toFixed(1) + '%' : '0%',
          })),
        });
      }

      case 'gst': {
        const [gstAgg, topInvoices] = await Promise.all([
          prisma.invoice.aggregate({
            _sum: { totalAmount: true, totalGst: true, cgst: true, sgst: true, igst: true },
            _count: true
          }),
          prisma.invoice.findMany({
            orderBy: { totalGst: 'desc' },
            select: { invoiceNumber: true, invoiceDate: true, totalAmount: true, totalGst: true, customer: { select: { name: true } } },
            take: 5,
          })
        ]);
        
        const totalTaxable = (gstAgg._sum.totalAmount || 0) - (gstAgg._sum.totalGst || 0);
        const totalCgst = gstAgg._sum.cgst || 0;
        const totalSgst = gstAgg._sum.sgst || 0;
        const totalIgst = gstAgg._sum.igst || 0;
        const totalGst = gstAgg._sum.totalGst || 0;
        
        return jsonResponse({
          summary: { invoiceCount: gstAgg._count, totalTaxable, totalCgst, totalSgst, totalIgst, totalGst },
          rows: topInvoices.map((i, idx) => ({
            rank: idx + 1,
            invoiceNumber: i.invoiceNumber,
            customer: i.customer?.name || 'N/A',
            date: i.invoiceDate,
            taxableAmount: i.totalAmount - i.totalGst,
            totalGst: i.totalGst,
            gstContribution: totalGst > 0 ? ((i.totalGst / totalGst) * 100).toFixed(1) + '%' : '0%',
            totalAmount: i.totalAmount,
          })),
        });
      }

      case 'outstanding': {
        const [outAgg, topCustomers] = await Promise.all([
          prisma.customer.aggregate({ _sum: { outstanding: true } }),
          prisma.customer.findMany({
            where: { outstanding: { gt: 0 } },
            orderBy: { outstanding: 'desc' },
            select: { name: true, outstanding: true },
            take: 5
          })
        ]);
        const totalOutstanding = outAgg._sum.outstanding || 0;
        return jsonResponse({
          summary: { totalOutstanding },
          rows: topCustomers.map((c, idx) => ({
            rank: idx + 1,
            customer: c.name,
            outstanding: c.outstanding,
            shareOfDebt: totalOutstanding > 0 ? ((c.outstanding / totalOutstanding) * 100).toFixed(1) + '%' : '0%'
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
