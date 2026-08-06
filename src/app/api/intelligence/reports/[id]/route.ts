import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const company = await prisma.company.findUnique({
      where: { id },
      include: {
        locations: true,
        products: {
          include: { category: true, priceHistory: { orderBy: { date: 'desc' } } }
        },
        competitors: {
          include: { products: true }
        },
        contactInfo: true,
        socialLinks: true,
        websiteAnalysis: true,
        seoAnalysis: true,
        techStack: true,
        swot: true,
        recommendations: true,
        marketing: true,
        customer: true,
        socialMedia: { orderBy: { date: 'desc' } },
        changes: { orderBy: { detectedAt: 'desc' } },
        alerts: { orderBy: { createdAt: 'desc' } },
        strategies: true,
        gapAnalysis: true
      }
    });

    if (!company) {
      return NextResponse.json({ error: "Company not found" }, { status: 404 });
    }

    return NextResponse.json(company);
  } catch (error) {
    console.error("Error fetching company details:", error);
    return NextResponse.json({ error: "Failed to fetch company details" }, { status: 500 });
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    await prisma.company.delete({
      where: { id }
    });
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: "Failed to delete company" }, { status: 500 });
  }
}
