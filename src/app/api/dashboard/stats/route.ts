import { NextRequest } from 'next/server';
import prisma from '@/lib/db';
import { authenticateRequest, jsonResponse, errorResponse } from '@/lib/middleware-server';

export const dynamic = 'force-dynamic';
export const revalidate = 300;

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
    
    const firstDayPrevMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const sevenDaysAgo = new Date(todayStart);
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);
    const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 5, 1);

    // Using Raw SQL to execute all 15 KPI queries in a single database roundtrip
    // This resolves the massive Supabase connection pool latency (from 48s to 1s)
    const rawData: any = await prisma.$queryRaw`
      SELECT 
        (SELECT COALESCE(SUM("totalAmount"), 0) FROM "sales_orders" WHERE "orderDate" >= ${todayStart} AND "orderDate" < ${todayEnd}) as "todaysSales",
        (SELECT COALESCE(SUM("totalAmount"), 0) FROM "sales_orders" WHERE "orderDate" >= ${firstDayOfMonth} AND "orderDate" < ${firstDayOfNextMonth}) as "monthlySales",
        (SELECT COALESCE(SUM("amount"), 0) FROM "expenses" WHERE "date" >= ${firstDayOfMonth} AND "date" < ${firstDayOfNextMonth}) as "monthlyExpenses",
        (SELECT COALESCE(SUM("totalCost"), 0) FROM "productions" WHERE "date" >= ${firstDayOfMonth} AND "date" < ${firstDayOfNextMonth}) as "monthlyProductionCost",
        (SELECT COUNT(*) FROM "sales_orders" WHERE "status" IN ('PENDING', 'CONFIRMED', 'IN_PRODUCTION', 'READY')) as "ordersPending",
        (SELECT COUNT(*) FROM "sales_orders" WHERE "status" = 'DELIVERED' AND "orderDate" >= ${firstDayOfMonth} AND "orderDate" < ${firstDayOfNextMonth}) as "ordersDelivered",
        (SELECT COUNT(*) FROM "customers") as "totalCustomers",
        (SELECT COUNT(*) FROM "customers" WHERE "status" = 'ACTIVE') as "activeCustomers",
        (SELECT COALESCE(SUM("outstanding"), 0) FROM "sales_orders" WHERE "outstanding" > 0) as "outstandingCredit",
        (SELECT COALESCE(SUM("waxInitialQty" - "producedQty"), 0) FROM "batches") as "waxStock",
        (SELECT COALESCE(SUM("currentStock"), 0) FROM "inventory") as "finishedGoodsStock",
        (SELECT COALESCE(SUM("value"), 0) FROM "inventory") as "inventoryValue",
        (SELECT COALESCE(SUM("quantityProduced"), 0) FROM "productions" WHERE "date" >= ${todayStart} AND "date" < ${todayEnd}) as "productionToday",
        (SELECT COALESCE(SUM("quantityProduced"), 0) FROM "productions" WHERE "date" >= ${firstDayOfMonth} AND "date" < ${firstDayOfNextMonth}) as "productionThisMonth",
        (SELECT COUNT(*) FROM "attendance" WHERE "date" >= ${todayStart} AND "date" < ${todayEnd} AND "status" IN ('PRESENT', 'LATE')) as "employeeAttendanceToday",
        (SELECT COALESCE(SUM("totalAmount"), 0) FROM "sales_orders" WHERE "orderDate" >= ${firstDayPrevMonth} AND "orderDate" < ${firstDayOfMonth}) as "prevMonthlySales",
        (SELECT COALESCE(SUM("amount"), 0) FROM "expenses" WHERE "date" >= ${firstDayPrevMonth} AND "date" < ${firstDayOfMonth}) as "prevMonthlyExpenses"
    `;

    const row = rawData[0];
    const todaysSales = Number(row.todaysSales || 0);
    const monthlySales = Number(row.monthlySales || 0);
    const monthlyExpenses = Number(row.monthlyExpenses || 0);
    const monthlyProductionCost = Number(row.monthlyProductionCost || 0);
    const waxStock = Number(row.waxStock || 0);
    const finishedGoodsStock = Number(row.finishedGoodsStock || 0);
    const inventoryValue = Number(row.inventoryValue || 0);
    const outstandingCredit = Number(row.outstandingCredit || 0);
    const productionToday = Number(row.productionToday || 0);
    const productionThisMonth = Number(row.productionThisMonth || 0);
    const prevMonthlySales = Number(row.prevMonthlySales || 0);
    const prevMonthlyExpenses = Number(row.prevMonthlyExpenses || 0);
    const ordersPending = Number(row.ordersPending || 0);
    const ordersDelivered = Number(row.ordersDelivered || 0);
    const totalCustomers = Number(row.totalCustomers || 0);
    const activeCustomers = Number(row.activeCustomers || 0);
    const employeeAttendanceToday = Number(row.employeeAttendanceToday || 0);

    const monthlyProfit = monthlySales - (monthlyProductionCost + monthlyExpenses);
    const grossMargin = monthlySales > 0 ? Math.round((monthlyProfit / monthlySales) * 100 * 10) / 10 : 0;
    const todaysProfit = monthlySales > 0 ? Math.round(todaysSales * (monthlyProfit / monthlySales)) : 0;

    const salesChange = prevMonthlySales > 0 ? Math.round(((monthlySales - prevMonthlySales) / prevMonthlySales) * 100 * 10) / 10 : 0;
    const expenseChange = prevMonthlyExpenses > 0 ? Math.round(((monthlyExpenses - prevMonthlyExpenses) / prevMonthlyExpenses) * 100 * 10) / 10 : 0;

    // Charts queries in parallel (only 4 queries total)
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
        orderBy: { _sum: { totalAmount: 'desc' } },
        take: 10,
      }),
      prisma.expense.groupBy({
        by: ['categoryId'],
        _sum: { amount: true },
        where: { date: { gte: firstDayOfMonth, lt: firstDayOfNextMonth } },
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
        where: { orderDate: { gte: sevenDaysAgo } },
        orderBy: { orderDate: 'asc' },
      })
    ]);

    // 1) 6-month sales trend formatting
    const salesTrendMap = new Map((salesTrendRows as any[]).map(row => [
      new Date(row.monthDate).toLocaleString('en-IN', { month: 'short' }),
      Number(row.totalAmount || 0)
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

    // 4) 7-day sales trend formatting
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
