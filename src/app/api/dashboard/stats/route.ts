import { NextRequest } from 'next/server';
import prisma from '@/lib/db';
import { authenticateRequest, jsonResponse, errorResponse } from '@/lib/middleware-server';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const { user, error } = await authenticateRequest(req);
  if (error) return error;

  try {
    const url = new URL(req.url);
    const period = url.searchParams.get('period') || 'this_month';
    const customStart = url.searchParams.get('startDate');
    const customEnd = url.searchParams.get('endDate');

    const now = new Date();
    let rangeStart: Date;
    let rangeEnd: Date;
    let prevRangeStart: Date;
    let prevRangeEnd: Date;
    let periodLabel = 'This Month';

    // ── Calculate Date Range based on Period ──
    if (period === 'today') {
      periodLabel = 'Today';
      rangeStart = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
      rangeEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);

      prevRangeStart = new Date(rangeStart);
      prevRangeStart.setDate(prevRangeStart.getDate() - 1);
      prevRangeEnd = new Date(rangeEnd);
      prevRangeEnd.setDate(prevRangeEnd.getDate() - 1);
    } else if (period === 'yesterday') {
      periodLabel = 'Yesterday';
      rangeStart = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1, 0, 0, 0, 0);
      rangeEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1, 23, 59, 59, 999);

      prevRangeStart = new Date(rangeStart);
      prevRangeStart.setDate(prevRangeStart.getDate() - 1);
      prevRangeEnd = new Date(rangeEnd);
      prevRangeEnd.setDate(prevRangeEnd.getDate() - 1);
    } else if (period === 'this_week') {
      periodLabel = 'This Week';
      const dayOfWeek = now.getDay(); // 0 is Sunday
      const diff = now.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1); // Monday
      rangeStart = new Date(now.getFullYear(), now.getMonth(), diff, 0, 0, 0, 0);
      rangeEnd = new Date(now.getFullYear(), now.getMonth(), diff + 6, 23, 59, 59, 999);

      prevRangeStart = new Date(rangeStart);
      prevRangeStart.setDate(prevRangeStart.getDate() - 7);
      prevRangeEnd = new Date(rangeEnd);
      prevRangeEnd.setDate(prevRangeEnd.getDate() - 7);
    } else if (period === 'last_month') {
      periodLabel = 'Last Month';
      rangeStart = new Date(now.getFullYear(), now.getMonth() - 1, 1, 0, 0, 0, 0);
      rangeEnd = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999);

      prevRangeStart = new Date(now.getFullYear(), now.getMonth() - 2, 1, 0, 0, 0, 0);
      prevRangeEnd = new Date(now.getFullYear(), now.getMonth() - 1, 0, 23, 59, 59, 999);
    } else if (period === 'this_quarter') {
      periodLabel = 'This Quarter';
      const currentQuarter = Math.floor(now.getMonth() / 3);
      rangeStart = new Date(now.getFullYear(), currentQuarter * 3, 1, 0, 0, 0, 0);
      rangeEnd = new Date(now.getFullYear(), (currentQuarter + 1) * 3, 0, 23, 59, 59, 999);

      prevRangeStart = new Date(now.getFullYear(), (currentQuarter - 1) * 3, 1, 0, 0, 0, 0);
      prevRangeEnd = new Date(now.getFullYear(), currentQuarter * 3, 0, 23, 59, 59, 999);
    } else if (period === 'this_year') {
      periodLabel = 'This Year';
      rangeStart = new Date(now.getFullYear(), 0, 1, 0, 0, 0, 0);
      rangeEnd = new Date(now.getFullYear(), 11, 31, 23, 59, 59, 999);

      prevRangeStart = new Date(now.getFullYear() - 1, 0, 1, 0, 0, 0, 0);
      prevRangeEnd = new Date(now.getFullYear() - 1, 11, 31, 23, 59, 59, 999);
    } else if (period === 'all_time') {
      periodLabel = 'All Time';
      rangeStart = new Date(2020, 0, 1, 0, 0, 0, 0);
      rangeEnd = new Date(now.getFullYear() + 1, 11, 31, 23, 59, 59, 999);

      prevRangeStart = new Date(2019, 0, 1, 0, 0, 0, 0);
      prevRangeEnd = new Date(2019, 11, 31, 23, 59, 59, 999);
    } else if (customStart || customEnd) {
      periodLabel = 'Custom Range';
      rangeStart = customStart ? new Date(new Date(customStart).setHours(0, 0, 0, 0)) : new Date(now.getFullYear(), now.getMonth(), 1);
      rangeEnd = customEnd ? new Date(new Date(customEnd).setHours(23, 59, 59, 999)) : new Date(now);

      const duration = rangeEnd.getTime() - rangeStart.getTime();
      prevRangeEnd = new Date(rangeStart.getTime() - 1);
      prevRangeStart = new Date(prevRangeEnd.getTime() - duration);
    } else {
      // Default: this_month
      periodLabel = 'This Month';
      rangeStart = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);
      rangeEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);

      prevRangeStart = new Date(now.getFullYear(), now.getMonth() - 1, 1, 0, 0, 0, 0);
      prevRangeEnd = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999);
    }

    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
    const todayEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
    const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 5, 1);

    // Using Raw SQL for instant single-roundtrip performance
    const rawData: any = await prisma.$queryRaw`
      SELECT 
        (SELECT COALESCE(SUM("totalAmount"), 0) FROM "sales_orders" WHERE "orderDate" >= ${todayStart} AND "orderDate" <= ${todayEnd}) as "todaysSales",
        (SELECT COALESCE(SUM("totalAmount"), 0) FROM "sales_orders" WHERE "orderDate" >= ${rangeStart} AND "orderDate" <= ${rangeEnd}) as "periodSales",
        (SELECT COALESCE(SUM("amount"), 0) FROM "expenses" WHERE "date" >= ${rangeStart} AND "date" <= ${rangeEnd}) as "periodExpenses",
        (SELECT COALESCE(SUM("totalCost"), 0) FROM "productions" WHERE "date" >= ${rangeStart} AND "date" <= ${rangeEnd}) as "periodProductionCost",
        (SELECT COUNT(*) FROM "sales_orders" WHERE "status" IN ('PENDING', 'CONFIRMED', 'IN_PRODUCTION', 'READY')) as "ordersPending",
        (SELECT COUNT(*) FROM "sales_orders" WHERE "status" = 'DELIVERED' AND "orderDate" >= ${rangeStart} AND "orderDate" <= ${rangeEnd}) as "ordersDelivered",
        (SELECT COUNT(*) FROM "customers") as "totalCustomers",
        (SELECT COUNT(*) FROM "customers" WHERE "status" = 'ACTIVE') as "activeCustomers",
        (SELECT COALESCE(SUM("outstanding"), 0) FROM "sales_orders" WHERE "outstanding" > 0) as "outstandingCredit",
        (SELECT COALESCE(SUM("waxInitialQty" - "producedQty"), 0) FROM "batches") as "waxStock",
        (SELECT COALESCE(SUM("currentStock"), 0) FROM "inventory") as "finishedGoodsStock",
        (SELECT COALESCE(SUM("value"), 0) FROM "inventory") as "inventoryValue",
        (SELECT COALESCE(SUM("quantityProduced"), 0) FROM "productions" WHERE "date" >= ${todayStart} AND "date" <= ${todayEnd}) as "productionToday",
        (SELECT COALESCE(SUM("quantityProduced"), 0) FROM "productions" WHERE "date" >= ${rangeStart} AND "date" <= ${rangeEnd}) as "productionPeriod",
        (SELECT COUNT(*) FROM "attendance" WHERE "date" >= ${todayStart} AND "date" <= ${todayEnd} AND "status" IN ('PRESENT', 'LATE')) as "employeeAttendanceToday",
        (SELECT COALESCE(SUM("totalAmount"), 0) FROM "sales_orders" WHERE "orderDate" >= ${prevRangeStart} AND "orderDate" <= ${prevRangeEnd}) as "prevPeriodSales",
        (SELECT COALESCE(SUM("amount"), 0) FROM "expenses" WHERE "date" >= ${prevRangeStart} AND "date" <= ${prevRangeEnd}) as "prevPeriodExpenses"
    `;

    const row = rawData[0];
    const todaysSales = Number(row.todaysSales || 0);
    const periodSales = Number(row.periodSales || 0);
    const periodExpenses = Number(row.periodExpenses || 0);
    const periodProductionCost = Number(row.periodProductionCost || 0);
    const waxStock = Number(row.waxStock || 0);
    const finishedGoodsStock = Number(row.finishedGoodsStock || 0);
    const inventoryValue = Number(row.inventoryValue || 0);
    const outstandingCredit = Number(row.outstandingCredit || 0);
    const productionToday = Number(row.productionToday || 0);
    const productionPeriod = Number(row.productionPeriod || 0);
    const prevPeriodSales = Number(row.prevPeriodSales || 0);
    const prevPeriodExpenses = Number(row.prevPeriodExpenses || 0);
    const ordersPending = Number(row.ordersPending || 0);
    const ordersDelivered = Number(row.ordersDelivered || 0);
    const totalCustomers = Number(row.totalCustomers || 0);
    const activeCustomers = Number(row.activeCustomers || 0);
    const employeeAttendanceToday = Number(row.employeeAttendanceToday || 0);

    const periodProfit = periodSales - (periodProductionCost + periodExpenses);
    const grossMargin = periodSales > 0 ? Math.round((periodProfit / periodSales) * 100 * 10) / 10 : 0;
    const todaysProfit = periodSales > 0 ? Math.round(todaysSales * (periodProfit / periodSales)) : 0;

    const salesChange = prevPeriodSales > 0 ? Math.round(((periodSales - prevPeriodSales) / prevPeriodSales) * 100 * 10) / 10 : 0;
    const expenseChange = prevPeriodExpenses > 0 ? Math.round(((periodExpenses - prevPeriodExpenses) / prevPeriodExpenses) * 100 * 10) / 10 : 0;

    // Charts queries filtered by selected period
    const [salesTrendRows, topSales, expenseByCat, recentBatches, recentSales] = await Promise.all([
      prisma.$queryRaw`
        SELECT date_trunc('month', "orderDate") as "monthDate", SUM("totalAmount") as "totalAmount"
        FROM "sales_orders"
        WHERE "orderDate" >= ${sixMonthsAgo}
        GROUP BY date_trunc('month', "orderDate")
        ORDER BY "monthDate" ASC
      `,
      prisma.salesOrder.groupBy({
        by: ['customerId'],
        _sum: { totalAmount: true },
        where: { orderDate: { gte: rangeStart, lte: rangeEnd } },
        orderBy: { _sum: { totalAmount: 'desc' } },
        take: 10,
      }),
      prisma.expense.groupBy({
        by: ['categoryId'],
        _sum: { amount: true },
        where: { date: { gte: rangeStart, lte: rangeEnd } },
        orderBy: { _sum: { amount: 'desc' } },
      }),
      prisma.batch.findMany({
        take: 5,
        orderBy: { purchaseDate: 'desc' },
        select: { batchNumber: true, producedQty: true, soldQty: true },
      }),
      prisma.salesOrder.groupBy({
        by: ['orderDate'],
        _sum: { totalAmount: true },
        where: { orderDate: { gte: rangeStart, lte: rangeEnd } },
        orderBy: { orderDate: 'asc' },
      })
    ]);

    // 1) 6-month sales trend
    const salesTrendMap = new Map((salesTrendRows as any[]).map(r => [
      new Date(r.monthDate).toLocaleString('en-IN', { month: 'short' }),
      Number(r.totalAmount || 0)
    ]));
    
    const salesTrend = [];
    for (let i = 5; i >= 0; i--) {
      const monthStart = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const mLabel = monthStart.toLocaleString('en-IN', { month: 'short' });
      salesTrend.push({
        month: mLabel,
        sales: salesTrendMap.get(mLabel) || 0,
      });
    }

    // 2) Top Customers mapping
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
    const catIds = expenseByCat.map(e => e.categoryId);
    const categories = catIds.length > 0
      ? await prisma.expenseCategory.findMany({ where: { id: { in: catIds } } })
      : [];
    const catMap = new Map(categories.map(c => [c.id, c.name]));
    const expenseBreakdown = expenseByCat.map(e => ({
      category: catMap.get(e.categoryId) || 'Other',
      amount: e._sum.amount || 0,
    }));

    // 4) Period Daily Sales Trend
    const salesDayMap = new Map<string, number>();
    recentSales.forEach(s => {
      salesDayMap.set(s.orderDate.toISOString().split('T')[0], s._sum.totalAmount || 0);
    });

    const daysDiff = Math.min(31, Math.max(1, Math.ceil((rangeEnd.getTime() - rangeStart.getTime()) / (1000 * 60 * 60 * 24))));
    const dailySalesTrend = [];
    for (let i = 0; i < daysDiff; i++) {
      const d = new Date(rangeStart);
      d.setDate(rangeStart.getDate() + i);
      const dateStr = d.toISOString().split('T')[0];
      dailySalesTrend.push({ date: dateStr, TotalSales: salesDayMap.get(dateStr) || 0 });
    }

    // 5) Production vs Sales by batch
    const productionVsSales = recentBatches
      .map(b => ({
        batchName: b.batchNumber,
        Produced: b.producedQty,
        Sold: b.soldQty,
      }))
      .reverse();

    // 6) Inventory health
    const inventoryHealth = [
      { name: 'Wax Stock', amount: Math.round(waxStock) },
      { name: 'Finished Goods', amount: Math.round(finishedGoodsStock) },
    ];

    // 7) Period financials
    const monthlyFinancials = [
      { name: 'Sales', amount: Math.round(periodSales) },
      { name: 'Profit', amount: Math.round(periodProfit > 0 ? periodProfit : 0) },
      { name: 'Expenses', amount: Math.round(periodExpenses) },
    ];

    return jsonResponse({
      periodInfo: {
        period,
        label: periodLabel,
        startDate: rangeStart.toISOString().split('T')[0],
        endDate: rangeEnd.toISOString().split('T')[0],
      },
      kpis: {
        todaysSales: Math.round(todaysSales),
        todaysProfit: Math.round(todaysProfit),
        monthlySales: Math.round(periodSales), // Matches period
        monthlyProfit: Math.round(periodProfit),
        monthlyExpenses: Math.round(periodExpenses),
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
        productionThisMonth: Math.round(productionPeriod),
        employeeAttendance: employeeAttendanceToday,
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
