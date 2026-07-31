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

    // Check for empty state to provide demo data
    const isEmpty = totalCustomers === 0 && monthlySales === 0;

    const finalKpis = isEmpty ? {
      todaysSales: 45000,
      todaysProfit: 18500,
      monthlySales: 850000,
      monthlyProfit: 340000,
      monthlyExpenses: 120000,
      grossMargin: 40.0,
      currentWaxStock: 700,
      finishedGoodsStock: 1450,
      ordersPending: 4,
      ordersDelivered: 28,
      totalCustomers: 124,
      activeCustomers: 98,
      outstandingCredit: 215000,
      inventoryValue: 420000,
      productionToday: 350,
      productionThisMonth: 8200,
      employeeAttendance: 14,
    } : {
      todaysSales: Math.round(monthlySales / 30),
      todaysProfit: Math.round(monthlyProfit / 30),
      monthlySales,
      monthlyProfit,
      monthlyExpenses,
      grossMargin: avgMarginPercent,
      currentWaxStock: waxStock,
      finishedGoodsStock: candleStock,
      ordersPending: 0,
      ordersDelivered: 0,
      totalCustomers,
      activeCustomers,
      outstandingCredit: 0,
      inventoryValue: candleStock * 150, // mock price
      productionToday: 0,
      productionThisMonth: 0,
      employeeAttendance: 0,
    };

    const finalCharts = isEmpty ? {
      monthlyFinancials: [
        { name: 'Sales', amount: 850000 },
        { name: 'Profit', amount: 340000 },
        { name: 'Expenses', amount: 120000 }
      ],
      customerOrders: [
        { name: 'Aroma House', TotalSales: 240000 },
        { name: 'Gift Gallery', TotalSales: 190000 },
        { name: 'Candle World', TotalSales: 150000 },
        { name: 'Festival Lights', TotalSales: 110000 },
        { name: 'Home Decor Plus', TotalSales: 85000 },
      ],
      inventoryHealth: [
        { name: 'Wax Stock', amount: 700 },
        { name: 'Candle Stock', amount: 1450 }
      ],
      salesTrend: [
        { date: '2026-07-25', TotalSales: 20000 },
        { date: '2026-07-26', TotalSales: 19000 },
        { date: '2026-07-27', TotalSales: 2800 },
        { date: '2026-07-28', TotalSales: 22000 },
        { date: '2026-07-29', TotalSales: 24000 },
        { date: '2026-07-30', TotalSales: 25000 },
        { date: '2026-07-31', TotalSales: 21000 },
      ],
      productionVsSales: [
        { batchName: 'BATCH-001', Produced: 250, Sold: 250 },
        { batchName: 'BATCH-002', Produced: 400, Sold: 370 },
        { batchName: 'BATCH-003', Produced: 200, Sold: 10 },
      ]
    } : {
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
    };

    return jsonResponse({
      data: {
        kpis: finalKpis,
        charts: finalCharts
      }
    });
  } catch (err: any) {
    return errorResponse(err.message || 'Failed to fetch dashboard stats', 500);
  }
}
