import prisma from '../config/database';

export class DashboardService {
  /**
   * Get all KPI data for the dashboard
   */
  async getKPIs() {
    const now = new Date();
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    // Execute all queries in parallel for performance
    const [
      todaySales,
      monthlySales,
      monthlyExpenses,
      totalCustomers,
      activeCustomers,
      totalOutstanding,
      inventoryStats,
      rawMaterialStock,
      pendingOrders,
      deliveredOrders,
      productionToday,
      productionMonth,
      attendanceStats,
    ] = await Promise.all([
      // Today's sales
      prisma.salesOrder.aggregate({
        where: { orderDate: { gte: startOfDay }, status: { not: 'CANCELLED' } },
        _sum: { totalAmount: true, outstanding: true },
        _count: true,
      }),
      // Monthly sales
      prisma.salesOrder.aggregate({
        where: { orderDate: { gte: startOfMonth }, status: { not: 'CANCELLED' } },
        _sum: { totalAmount: true, outstanding: true },
        _count: true,
      }),
      // Monthly expenses
      prisma.expense.aggregate({
        where: { date: { gte: startOfMonth }, status: 'APPROVED' },
        _sum: { amount: true },
      }),
      // Total customers
      prisma.customer.count(),
      // Active customers
      prisma.customer.count({ where: { status: 'ACTIVE' } }),
      // Total outstanding
      prisma.customer.aggregate({ _sum: { outstanding: true } }),
      // Inventory value
      prisma.inventory.aggregate({ _sum: { currentStock: true, value: true } }),
      // Wax stock (main raw material)
      prisma.rawMaterial.findFirst({ where: { category: 'WAX' } }),
      // Pending orders
      prisma.salesOrder.count({ where: { status: 'PENDING' } }),
      // Delivered orders this month
      prisma.salesOrder.count({
        where: { status: 'DELIVERED', orderDate: { gte: startOfMonth } },
      }),
      // Production today
      prisma.production.aggregate({
        where: { date: { gte: startOfDay } },
        _sum: { quantityProduced: true, profit: true },
      }),
      // Production this month
      prisma.production.aggregate({
        where: { date: { gte: startOfMonth } },
        _sum: { quantityProduced: true, profit: true, totalCost: true },
      }),
      // Today's attendance
      prisma.attendance.count({
        where: {
          date: { gte: startOfDay },
          status: 'PRESENT',
        },
      }),
    ]);

    const todaysSalesAmount = todaySales._sum.totalAmount || 0;
    const monthlySalesAmount = monthlySales._sum.totalAmount || 0;
    const monthlyExpenseAmount = monthlyExpenses._sum.amount || 0;
    const monthlyProductionCost = productionMonth._sum.totalCost || 0;
    const monthlyProfit = monthlySalesAmount - monthlyExpenseAmount - monthlyProductionCost;
    const grossMargin = monthlySalesAmount > 0
      ? ((monthlySalesAmount - monthlyProductionCost) / monthlySalesAmount * 100)
      : 0;

    return {
      todaysSales: todaysSalesAmount,
      todaysProfit: todaysSalesAmount - (productionToday._sum.profit || 0),
      monthlySales: monthlySalesAmount,
      monthlyProfit,
      monthlyExpenses: monthlyExpenseAmount,
      grossMargin: parseFloat(grossMargin.toFixed(1)),
      currentWaxStock: rawMaterialStock?.currentStock || 0,
      finishedGoodsStock: inventoryStats._sum.currentStock || 0,
      ordersPending: pendingOrders,
      ordersDelivered: deliveredOrders,
      totalCustomers,
      activeCustomers,
      outstandingCredit: totalOutstanding._sum.outstanding || 0,
      inventoryValue: inventoryStats._sum.value || 0,
      productionToday: productionToday._sum.quantityProduced || 0,
      productionThisMonth: productionMonth._sum.quantityProduced || 0,
      totalExpenses: monthlyExpenseAmount,
      employeeAttendance: attendanceStats,
    };
  }

  /**
   * Get chart data for the dashboard
   */
  async getChartData() {
    const now = new Date();
    const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 5, 1);

    // Sales trend (last 6 months)
    const salesOrders = await prisma.salesOrder.findMany({
      where: { orderDate: { gte: sixMonthsAgo }, status: { not: 'CANCELLED' } },
      select: { orderDate: true, totalAmount: true, outstanding: true },
      orderBy: { orderDate: 'asc' },
    });

    // Group by month
    const salesTrend: Record<string, { sales: number; profit: number }> = {};
    salesOrders.forEach((order: any) => {
      const key = `${order.orderDate.getFullYear()}-${String(order.orderDate.getMonth() + 1).padStart(2, '0')}`;
      if (!salesTrend[key]) salesTrend[key] = { sales: 0, profit: 0 };
      salesTrend[key].sales += order.totalAmount;
    });

    // Production data (last 6 months)
    const productions = await prisma.production.findMany({
      where: { date: { gte: sixMonthsAgo } },
      select: { date: true, quantityProduced: true, profit: true },
      orderBy: { date: 'asc' },
    });

    const productionTrend: Record<string, { quantity: number; profit: number }> = {};
    productions.forEach((prod: any) => {
      const key = `${prod.date.getFullYear()}-${String(prod.date.getMonth() + 1).padStart(2, '0')}`;
      if (!productionTrend[key]) productionTrend[key] = { quantity: 0, profit: 0 };
      productionTrend[key].quantity += prod.quantityProduced;
      productionTrend[key].profit += prod.profit;
    });

    // Top customers by revenue
    const topCustomers = await prisma.salesOrder.groupBy({
      by: ['customerId'],
      where: { status: { not: 'CANCELLED' } },
      _sum: { totalAmount: true },
      orderBy: { _sum: { totalAmount: 'desc' } },
      take: 5,
    });

    const customerDetails = await Promise.all(
      topCustomers.map(async (tc: any) => {
        const customer = await prisma.customer.findUnique({
          where: { id: tc.customerId },
          select: { name: true },
        });
        return { name: customer?.name || 'Unknown', revenue: tc._sum.totalAmount || 0 };
      })
    );

    // Expense breakdown by category
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const expensesByCategory = await prisma.expense.findMany({
      where: { date: { gte: startOfMonth }, status: 'APPROVED' },
      include: { category: true },
    });

    const expenseBreakdown: Record<string, number> = {};
    expensesByCategory.forEach((e: any) => {
      expenseBreakdown[e.category.name] = (expenseBreakdown[e.category.name] || 0) + e.amount;
    });

    return {
      salesTrend: Object.entries(salesTrend).map(([month, data]) => ({ month, ...data })),
      productionTrend: Object.entries(productionTrend).map(([month, data]) => ({ month, ...data })),
      topCustomers: customerDetails,
      expenseBreakdown: Object.entries(expenseBreakdown).map(([category, amount]) => ({ category, amount })),
    };
  }
}

export const dashboardService = new DashboardService();
