const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const rawData = `PILOT STORE	BATCH ZERO	2026-07-25	2026-07-28	5(25) 10(25)	50.00	₹186.00	₹205.00	9.27% (950)	₹10,250.00	DELIVERED	₹8,250.00
MUKKAM SUPERMARKET	BATCH ZERO	2026-07-25	2026-07-28	CASE 5*1 AND 10*1	7.00	₹195.00	₹251.00	22.31% (392)	₹1,757.00	DELIVERED	
ZAM ZAM MUKKAM	BATCH ZERO	2026-07-25	2026-07-28	5	30.00	₹186.00	₹206.00	9.71% (600)	₹6,180.00	DELIVERED	6180(friday)
CAPITAL SUPERMARKET	BATCH ZERO	2026-07-25	2026-07-28	5(5) 10(5)	10.00	₹186.00	₹205.00	9.27% (190)	₹2,050.00	DELIVERED	
VKM HYPERMARKET	BATCH ZERO	2026-07-26	2026-07-27	2,3,5,10 (2) KG	9.00	₹186.00	₹205.00	9.27% (171)	₹1,845.00	DELIVERED	₹1,845.00
CK STORE	BATCH ZERO	2026-07-26	2026-07-27	500 g 1 CHACK	30.00	₹186.00	₹205.00	9.27% (570)	₹6,150.00	DELIVERED	₹5,000.00
NATIONAL 	BATCH ZERO	2026-07-26	2026-07-28		55.00	₹186.00	₹205.00	9.27% (1045)	₹11,275.00	DELIVERED	
CK STORE	BATCH ZERO	2026-07-27	2026-07-27	 CASE (2*2)	1.44	₹196.00	₹316.66	38.10% (173.7504)	₹455.99	DELIVERED	
CK STORE	BATCH ZERO	2026-07-27	2026-07-27	CASE(5*2)	4.32	₹196.00	₹270.83	27.63% (323.27856)	₹1,170.00	DELIVERED	
MUSSAFIR	BATCH ZERO	2026-07-27	2026-07-28	CASE 10	4.32	₹196.00	₹270.83	27.63% (323.27856)	₹1,170.00	DELIVERED	
NEW PILOT	BATCH ZERO	2026-07-28	2026-08-04	5,10 (30KG)	60.00	₹186.00	₹205.00	9.27% (1140)	₹12,300.00	PENDING	
ELLIKKAL TRADERS	BATCH ONE	2026-07-31	2026-08-03		150.00	₹171.00	₹187.00	8.56% (2400)	₹28,050.00	PENDING	
ELLIKKAL 2	BATCH ONE	2026-07-31	2026-08-03		120.00	₹171.00	₹188.00	9.04% (2040)	₹22,560.00	PENDING	
ELLIKKAL TRADERS	BATCH ONE	2026-07-31	2026-08-03	CASE 5*20	43.20	₹181.00	₹270.83	33.17% (3880.656)	₹11,699.86	PENDING	
ELLIKKAL TRADERS	BATCH ONE	2026-08-01	2026-08-03	CASE 10*15	64.80	₹181.00	₹270.83	33.17% (5820.984)	₹17,549.78	PENDING	`;

function parseDate(dateStr) {
  if (!dateStr) return null;
  return new Date(`${dateStr}T10:00:00.000Z`);
}

function parseCost(costStr) {
  if (!costStr) return 0;
  const num = parseFloat(costStr.replace('₹', '').replace(',', ''));
  return isNaN(num) ? 0 : num;
}

async function seed() {
  const lines = rawData.split('\n');

  // Need a generic product for these sales
  let product = await prisma.product.findFirst();
  if (!product) {
    product = await prisma.product.create({
      data: {
        name: 'Candles Batch Default',
        sku: 'CAND-001',
        category: 'Candle',
        sellingPrice: 200,
      }
    });
  }

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (!line.trim()) continue;
    const parts = line.split('\t');
    while (parts.length < 12) parts.push('');

    const [nameRaw, batchUsed, orderDate, deliveryDate, type, qty, prodCost, sellCost, margin, totalSell, statusStr, creditStr] = parts;
    const name = nameRaw.trim();
    if (!name) continue;

    // Find customer
    let customer = await prisma.customer.findFirst({
      where: { name: { equals: name, mode: 'insensitive' } }
    });

    if (!customer) {
      console.log('Customer not found, creating dummy:', name);
      const count = await prisma.customer.count();
      customer = await prisma.customer.create({
        data: {
          customerId: `CUST-TMP-${count + 1}`,
          name,
        }
      });
    }

    const orderNumber = `SO-2026-${String(i + 100).padStart(4, '0')}`;

    const notesObj = {
      batchUsed: batchUsed.trim(),
      type: type.trim(),
      productionCost: prodCost.trim(),
      sellingCost: sellCost.trim(),
      margin: margin.trim(),
      creditNotes: creditStr.trim(),
    };

    const status = statusStr.trim().toUpperCase() === 'DELIVERED' ? 'DELIVERED' : 'PENDING';
    const totalAmount = parseCost(totalSell.trim());
    let outstanding = parseCost(creditStr.trim());
    // if there is text in creditStr like "6180(friday)", parseCost might return 6180.

    await prisma.salesOrder.upsert({
      where: { orderNumber },
      update: {},
      create: {
        orderNumber,
        customerId: customer.id,
        orderDate: parseDate(orderDate.trim()) || new Date(),
        deliveryDate: parseDate(deliveryDate.trim()),
        totalAmount,
        outstanding,
        status,
        notes: JSON.stringify(notesObj),
        items: {
          create: [
            {
              productId: product.id,
              quantity: parseFloat(qty.trim()) || 0,
              unitPrice: parseCost(sellCost.trim()) || 0,
              amount: totalAmount
            }
          ]
        }
      }
    });
    console.log(`Created sales order for ${name}`);
  }
}

seed()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
