import { NextRequest } from 'next/server';
import prisma from '@/lib/db';
import { authenticateRequest, jsonResponse, errorResponse } from '@/lib/middleware-server';

export async function GET(req: NextRequest) {
  const { user, error } = await authenticateRequest(req);
  if (error) return error;

  try {
    const today = new Date();
    const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);

    // 1. Fetch KPI Data
    const [
      salesMonth,
      productionMonth,
      expensesMonth,
      totalCustomers,
      activeCustomers,
      waxStockAgg,
      candleStockAgg,
    ] = await Promise.all([
      prisma.salesOrder.aggregate({ where: { orderDate: { gte: firstDayOfMonth } }, _sum: { totalAmount: true } }),
      prisma.production.aggregate({ where: { date: { gte: firstDayOfMonth } }, _sum: { totalCost: true } }),
      prisma.expense.aggregate({ where: { date: { gte: firstDayOfMonth } }, _sum: { amount: true } }),
      prisma.customer.count(),
      prisma.customer.count({ where: { status: 'ACTIVE' } }),
      prisma.rawMaterial.aggregate({ where: { category: 'WAX' }, _sum: { currentStock: true } }),
      prisma.inventory.aggregate({ _sum: { currentStock: true } }),
    ]);

    const monthlySales = salesMonth._sum.totalAmount || 0;
    const monthlyProductionCost = productionMonth._sum.totalCost || 0;
    const monthlyExpenses = expensesMonth._sum.amount || 0;
    
    const monthlyProfit = monthlySales - (monthlyProductionCost + monthlyExpenses);
    const avgMarginPercent = monthlySales > 0 ? (monthlyProfit / monthlySales) * 100 : 0;
    const waxStock = waxStockAgg._sum.currentStock || 0;
    const candleStock = candleStockAgg._sum.currentStock || 0;

    // 2. Fetch Chart Data

    // Customer Order History
    const customersWithSales = await prisma.customer.findMany({
      include: { salesOrders: { select: { totalAmount: true } } },
    });
    const customerOrders = customersWithSales
      .map(c => ({
        name: c.name,
        TotalSales: c.salesOrders.reduce((sum, order) => sum + order.totalAmount, 0)
      }))
      .filter(c => c.TotalSales > 0)
      .sort((a, b) => b.TotalSales - a.TotalSales)
      .slice(0, 10);

    // Sales Trend
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(today.getDate() - 6);
    
    const recentSales = await prisma.salesOrder.groupBy({
      by: ['orderDate'],
      _sum: { totalAmount: true },
      where: { orderDate: { gte: sevenDaysAgo } },
      orderBy: { orderDate: 'asc' }
    });
    
    // Map existing dates
    const salesTrendMap = new Map();
    recentSales.forEach(s => {
      salesTrendMap.set(s.orderDate.toISOString().split('T')[0], s._sum.totalAmount || 0);
    });

    // Fill in blanks for 7 days
    const salesTrend = [];
    for(let i=0; i<7; i++) {
        const d = new Date(sevenDaysAgo);
        d.setDate(sevenDaysAgo.getDate() + i);
        const dateStr = d.toISOString().split('T')[0];
        salesTrend.push({
            date: dateStr,
            TotalSales: salesTrendMap.get(dateStr) || 0
        });
    }

    const recentBatches = await prisma.batch.findMany({
      take: 5,
      orderBy: { productionDate: 'desc' },
      include: {
        productions: { select: { quantityProduced: true } },
      }
    });

    const productionVsSales = recentBatches.map((batch) => {
      const produced = batch.productions.reduce((sum, p) => sum + p.quantityProduced, 0);
      return {
        batchName: batch.batchNumber,
        Produced: produced,
        Sold: Math.floor(produced * 0.8), // Mocked for comparison
      };
    });
    productionVsSales.reverse();

    return jsonResponse({
      data: {
        kpis: {
          monthlySales,
          monthlyProfit,
          avgMarginPercent,
          totalExpenses: monthlyExpenses,
          totalCustomers,
          activeCustomers,
          waxStock,
          candleStock,
        },
        charts: {
          monthlyFinancials: [
            { name: 'Sales', amount: monthlySales },
            { name: 'Profit', amount: monthlyProfit > 0 ? monthlyProfit : 0 },
            { name: 'Expenses', amount: monthlyExpenses }
          ],
          customerOrders,
          inventoryHealth: [
            { name: 'Wax Stock', amount: waxStock },
            { name: 'Candle Stock', amount: candleStock }
          ],
          salesTrend,
          productionVsSales
        }
      }
    });
  } catch (err: any) {
    return errorResponse(err.message || 'Failed to fetch dashboard stats', 500);
  }
}
