import { NextRequest, NextResponse } from 'next/server';
import * as XLSX from 'xlsx';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const sampleData = [
      {
        'Name': 'NEW PILOT',
        'Batch Used': 'BATCH ONE',
        'Order Date': '04 Aug 2026',
        'Delivery Date': '06 Aug 2026',
        'Type': 'WHITE CANDLE',
        'Quantity (KG)': 30,
        'Production Cost': 4980,
        'Selling Cost': 6000,
        'Margin %': '17.00%',
        'Margin Amount': 1020,
        'Total Selling Cost': 6000,
        'Status': 'DELIVERED',
      },
      {
        'Name': 'ELLIKKAL TRADERS',
        'Batch Used': 'BATCH ZERO, BATCH ONE',
        'Order Date': '16 Aug 2026',
        'Delivery Date': '18 Aug 2026',
        'Type': 'WHITE CANDLE',
        'Quantity (KG)': 150,
        'Production Cost': 24900,
        'Selling Cost': 28050,
        'Margin %': '24.77%',
        'Margin Amount': 3150,
        'Total Selling Cost': 28050,
        'Status': 'DELIVERED',
      },
      {
        'Name': 'MAHESH AGENCIES',
        'Batch Used': 'BATCH TWO',
        'Order Date': '19 Aug 2026',
        'Delivery Date': '',
        'Type': 'COLOR CANDLE',
        'Quantity (KG)': 75,
        'Production Cost': 12500,
        'Selling Cost': 15000,
        'Margin %': '16.67%',
        'Margin Amount': 2500,
        'Total Selling Cost': 15000,
        'Status': 'PENDING',
      },
    ];

    const worksheet = XLSX.utils.json_to_sheet(sampleData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Orders Template');

    // Auto-size columns
    const colWidths = [
      { wch: 22 }, // Name
      { wch: 26 }, // Batch Used
      { wch: 15 }, // Order Date
      { wch: 15 }, // Delivery Date
      { wch: 18 }, // Type
      { wch: 15 }, // Quantity (KG)
      { wch: 18 }, // Production Cost
      { wch: 15 }, // Selling Cost
      { wch: 12 }, // Margin %
      { wch: 16 }, // Margin Amount
      { wch: 18 }, // Total Selling Cost
      { wch: 14 }, // Status
    ];
    worksheet['!cols'] = colWidths;

    const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });

    return new NextResponse(buffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': 'attachment; filename="orders_sample_template.xlsx"',
      },
    });
  } catch (err: any) {
    return new NextResponse(JSON.stringify({ error: err.message || 'Failed to generate template' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
