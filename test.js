const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  try {
    const customers = await prisma.customer.findMany({
      include: {
        salesOrders: {
          where: { status: 'DELIVERED' },
          orderBy: { deliveryDate: 'asc' },
          include: { items: true }
        }
      }
    });

    const DEFAULT_CONSUMPTION_RATE = 5;

    const predictions = customers
      .filter((c) => c.salesOrders.length > 0)
      .map((c) => {
        const orders = c.salesOrders;
        const latestOrder = orders[orders.length - 1];
        
        // Sum quantity of the latest order
        const latestOrderQty = latestOrder.items.reduce((sum, item) => sum + item.quantity, 0);
        
        let dailyConsumptionRate = DEFAULT_CONSUMPTION_RATE;

        if (orders.length > 1) {
          const firstOrder = orders[0];
          const secondToLastOrder = orders[orders.length - 2];
          
          const msElapsed = new Date(secondToLastOrder.deliveryDate).getTime() - new Date(firstOrder.deliveryDate).getTime();
          const daysElapsed = Math.max(1, msElapsed / (1000 * 60 * 60 * 24));
          
          let totalHistoricalQty = 0;
          for (let i = 0; i < orders.length - 1; i++) {
            totalHistoricalQty += orders[i].items.reduce((sum, item) => sum + item.quantity, 0);
          }
          
          if (daysElapsed > 0 && totalHistoricalQty > 0) {
            dailyConsumptionRate = totalHistoricalQty / daysElapsed;
          }
        }

        const daysRemaining = latestOrderQty / dailyConsumptionRate;
        const latestDeliveryDate = new Date(latestOrder.deliveryDate);
        const estimatedRunOutDate = new Date(latestDeliveryDate.getTime() + daysRemaining * 24 * 60 * 60 * 1000);
        
        const now = new Date();
        const msUntilRunOut = estimatedRunOutDate.getTime() - now.getTime();
        const daysUntilRunOut = msUntilRunOut / (1000 * 60 * 60 * 24);

        let status = 'HEALTHY';
        if (daysUntilRunOut <= 3) status = 'CRITICAL';
        else if (daysUntilRunOut <= 7) status = 'WARNING';

        return {
          id: c.id,
          name: c.name,
          phone: c.phone,
          whatsapp: c.whatsapp,
          lastOrderDate: latestOrder.deliveryDate,
          lastOrderQty: latestOrderQty,
          dailyConsumptionRate: parseFloat(dailyConsumptionRate.toFixed(2)),
          estimatedRunOutDate,
          daysUntilRunOut: Math.floor(daysUntilRunOut),
          status,
        };
      })
      .sort((a, b) => a.daysUntilRunOut - b.daysUntilRunOut);
      
    console.log(predictions);
  } catch (err) {
    console.error(err);
  }
}
main().finally(() => prisma.$disconnect());
