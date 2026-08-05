import { NextRequest } from 'next/server';
import prisma from '@/lib/db';
import { authenticateRequest, jsonResponse, errorResponse } from '@/lib/middleware-server';

export async function GET(req: NextRequest) {
  const { user, error } = await authenticateRequest(req);
  if (error) return error;

  try {
    const now = new Date();

    // ── Date boundaries ──
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const todayEnd = new Date(todayStart);
    todayEnd.setDate(todayEnd.getDate() + 1);

    const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const firstDayOfNextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);

    // ── KPIs: parallel queries ──
    const [
      todaySalesAgg,
      monthlySalesAgg,
      monthlyExpensesAgg,
      monthlyProductionCostAgg,
      ordersPending,
      ordersDelivered,
      totalCustomers,
      activeCustomers,
      outstandingCreditAgg,
      waxStockAgg,
      finishedGoodsAgg,
      inventoryValueAgg,
      productionTodayAgg,
      productionMonthAgg,
      employeeAttendanceToday,
    ] = await Promise.all([
      // Today's sales
      prisma.salesOrder.aggregate({
        where: { orderDate: { gte: todayStart, lt: todayEnd } },
        _sum: { totalAmount: true },
      }),
      // Monthly sales
      prisma.salesOrder.aggregate({
        where: { orderDate: { gte: firstDayOfMonth, lt: firstDayOfNextMonth } },
        _sum: { totalAmount: true },
      }),
      // Monthly expenses
      prisma.expense.aggregate({
        where: { date: { gte: firstDayOfMonth, lt: firstDayOfNextMonth } },
        _sum: { amount: true },
      }),
      // Monthly production cost
      prisma.production.aggregate({
        where: { date: { gte: firstDayOfMonth, lt: firstDayOfNextMonth } },
        _sum: { totalCost: true },
      }),
      // Orders pending
      prisma.salesOrder.count({
        where: { status: { in: ['PENDING', 'CONFIRMED', 'IN_PRODUCTION', 'READY'] } },
      }),
      // Orders delivered
      prisma.salesOrder.count({
        where: {
          status: 'DELIVERED',
          orderDate: { gte: firstDayOfMonth, lt: firstDayOfNextMonth },
        },
      }),
      // Total customers
      prisma.customer.count(),
      // Active customers
      prisma.customer.count({ where: { status: 'ACTIVE' } }),
      // Outstanding credit (sum of outstanding across all sales orders)
      prisma.salesOrder.aggregate({
        where: { outstanding: { gt: 0 } },
        _sum: { outstanding: true },
      }),
      // Current wax stock
      prisma.rawMaterial.aggregate({
        where: { category: 'WAX' },
        _sum: { currentStock: true },
      }),
      // Finished goods stock
      prisma.inventory.aggregate({ _sum: { currentStock: true } }),
      // Inventory value
      prisma.inventory.aggregate({ _sum: { value: true } }),
      // Production today (quantity)
      prisma.production.aggregate({
        where: { date: { gte: todayStart, lt: todayEnd } },
        _sum: { quantityProduced: true },
      }),
      // Production this month (quantity)
      prisma.production.aggregate({
        where: { date: { gte: firstDayOfMonth, lt: firstDayOfNextMonth } },
        _sum: { quantityProduced: true },
      }),
      // Employee attendance today
      prisma.attendance.count({
        where: {
          date: { gte: todayStart, lt: todayEnd },
          status: { in: ['PRESENT', 'LATE'] },
        },
      }),
    ]);

    const todaysSales = todaySalesAgg._sum.totalAmount || 0;
    const monthlySales = monthlySalesAgg._sum.totalAmount || 0;
    const monthlyExpenses = monthlyExpensesAgg._sum.amount || 0;
    const monthlyProductionCost = monthlyProductionCostAgg._sum.totalCost || 0;
    const monthlyProfit = monthlySales - (monthlyProductionCost + monthlyExpenses);
    const grossMargin = monthlySales > 0 ? Math.round((monthlyProfit / monthlySales) * 100 * 10) / 10 : 0;
    const waxStock = waxStockAgg._sum.currentStock || 0;
    const finishedGoodsStock = finishedGoodsAgg._sum.currentStock || 0;
    const inventoryValue = inventoryValueAgg._sum.value || 0;
    const outstandingCredit = outstandingCreditAgg._sum.outstanding || 0;
    const productionToday = productionTodayAgg._sum.quantityProduced || 0;
    const productionThisMonth = productionMonthAgg._sum.quantityProduced || 0;

    // Today's profit (proportional estimate from monthly margin)
    const todaysProfit = monthlySales > 0 ? Math.round(todaysSales * (monthlyProfit / monthlySales)) : 0;

    // ── Previous month for % change calculations ──
    const firstDayPrevMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const [prevMonthlySalesAgg, prevMonthlyExpensesAgg] = await Promise.all([
      prisma.salesOrder.aggregate({
        where: { orderDate: { gte: firstDayPrevMonth, lt: firstDayOfMonth } },
        _sum: { totalAmount: true },
      }),
      prisma.expense.aggregate({
        where: { date: { gte: firstDayPrevMonth, lt: firstDayOfMonth } },
        _sum: { amount: true },
      }),
    ]);
    const prevMonthlySales = prevMonthlySalesAgg._sum.totalAmount || 0;
    const prevMonthlyExpenses = prevMonthlyExpensesAgg._sum.amount || 0;

    const salesChange = prevMonthlySales > 0 ? Math.round(((monthlySales - prevMonthlySales) / prevMonthlySales) * 100 * 10) / 10 : 0;
    const expenseChange = prevMonthlyExpenses > 0 ? Math.round(((monthlyExpenses - prevMonthlyExpenses) / prevMonthlyExpenses) * 100 * 10) / 10 : 0;

    // ── Charts ──

    // 1) 6-month sales trend
    const salesTrend = [];
    for (let i = 5; i >= 0; i--) {
      const monthStart = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthEnd = new Date(now.getFullYear(), now.getMonth() - i + 1, 1);
      const agg = await prisma.salesOrder.aggregate({
        where: { orderDate: { gte: monthStart, lt: monthEnd } },
        _sum: { totalAmount: true },
      });
      salesTrend.push({
        month: monthStart.toLocaleString('en-IN', { month: 'short' }),
        sales: agg._sum.totalAmount || 0,
      });
    }

    const topSales = await prisma.salesOrder.groupBy({
      by: ['customerId'],
      _sum: { totalAmount: true },
      orderBy: { _sum: { totalAmount: 'desc' } },
      take: 10,
    });
    const topCustomerIds = topSales.map(s => s.customerId);
    const topCustomersData = await prisma.customer.findMany({
      where: { id: { in: topCustomerIds } },
      select: { id: true, name: true },
    });
    const topCustomersMap = new Map(topCustomersData.map(c => [c.id, c.name]));
    const topCustomers = topSales
      .map(s => ({
        name: topCustomersMap.get(s.customerId) || 'Unknown',
        TotalSales: s._sum.totalAmount || 0,
      }))
      .filter(c => c.TotalSales > 0);

    // 3) Expense breakdown by category
    const expenseByCat = await prisma.expense.groupBy({
      by: ['categoryId'],
      _sum: { amount: true },
      where: { date: { gte: firstDayOfMonth, lt: firstDayOfNextMonth } },
      orderBy: { _sum: { amount: 'desc' } },
    });
    const catIds = expenseByCat.map(e => e.categoryId);
    const categories = catIds.length > 0
      ? await prisma.expenseCategory.findMany({ where: { id: { in: catIds } } })
      : [];
    const catMap = new Map(categories.map(c => [c.id, c.name]));
    const expenseBreakdown = expenseByCat.map(e => ({
      category: catMap.get(e.categoryId) || 'Other',
      amount: e._sum.amount || 0,
    }));

    // 4) 7-day sales trend
    const sevenDaysAgo = new Date(todayStart);
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);
    const recentSales = await prisma.salesOrder.groupBy({
      by: ['orderDate'],
      _sum: { totalAmount: true },
      where: { orderDate: { gte: sevenDaysAgo } },
      orderBy: { orderDate: 'asc' },
    });
    const salesDayMap = new Map<string, number>();
    recentSales.forEach(s => {
      salesDayMap.set(s.orderDate.toISOString().split('T')[0], s._sum.totalAmount || 0);
    });
    const dailySalesTrend = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(sevenDaysAgo);
      d.setDate(sevenDaysAgo.getDate() + i);
      const dateStr = d.toISOString().split('T')[0];
      dailySalesTrend.push({ date: dateStr, TotalSales: salesDayMap.get(dateStr) || 0 });
    }

    // 5) Production vs Sales by batch
    const recentBatches = await prisma.batch.findMany({
      take: 5,
      orderBy: { purchaseDate: 'desc' },
      select: { batchNumber: true, producedQty: true, soldQty: true },
    });
    const productionVsSales = recentBatches
      .map(b => ({
        batchName: b.batchNumber,
        Produced: b.producedQty,
        Sold: b.soldQty,
      }))
      .reverse();

    // 6) Inventory health (raw materials + finished goods)
    const inventoryHealth = [
      { name: 'Wax Stock', amount: Math.round(waxStock) },
      { name: 'Finished Goods', amount: Math.round(finishedGoodsStock) },
    ];

    // 7) Monthly financials
    const monthlyFinancials = [
      { name: 'Sales', amount: Math.round(monthlySales) },
      { name: 'Profit', amount: Math.round(monthlyProfit > 0 ? monthlyProfit : 0) },
      { name: 'Expenses', amount: Math.round(monthlyExpenses) },
    ];

    return jsonResponse({
      kpis: {
        todaysSales: Math.round(todaysSales),
        todaysProfit: Math.round(todaysProfit),
        monthlySales: Math.round(monthlySales),
        monthlyProfit: Math.round(monthlyProfit),
        monthlyExpenses: Math.round(monthlyExpenses),
        grossMargin,
        currentWaxStock: Math.round(waxStock),
        finishedGoodsStock: Math.round(finishedGoodsStock),
        ordersPending,
        ordersDelivered,
        totalCustomers,
        activeCustomers,
        outstandingCredit: Math.round(outstandingCredit),
        inventoryValue: Math.round(inventoryValue),
        productionToday: Math.round(productionToday),
        productionThisMonth: Math.round(productionThisMonth),
        employeeAttendance: employeeAttendanceToday,
        // % changes
        salesChange,
        expenseChange,
      },
      charts: {
        monthlyFinancials,
        customerOrders: topCustomers,
        inventoryHealth,
        salesTrend: dailySalesTrend,
        productionVsSales,
        expenseBreakdown,
        monthlySalesTrend: salesTrend,
      },
    });
  } catch (err: any) {
    console.error('Dashboard stats error:', err);
    return errorResponse(err.message || 'Failed to fetch dashboard stats', 500);
  }
}
