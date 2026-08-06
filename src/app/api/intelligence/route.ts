import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import axios from 'axios';

const FASTAPI_URL = process.env.FASTAPI_URL || 'http://localhost:8000';

export async function GET() {
  try {
    const companies = await prisma.company.findMany({
      orderBy: { updatedAt: 'desc' },
      include: {
        _count: {
          select: {
            products: true,
            competitors: true
          }
        }
      }
    });
    return NextResponse.json(companies);
  } catch (error) {
    console.error("Error fetching companies:", error);
    return NextResponse.json({ error: "Failed to fetch companies" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { name, website, industry, country } = body;

    // Create record in Prisma with PENDING status
    const company = await prisma.company.create({
      data: {
        name,
        website,
        industry,
        country,
        status: 'PENDING'
      }
    });

    // Trigger FastAPI backend to start crawling
    try {
      await axios.post(`${FASTAPI_URL}/api/analyze`, {
        company_id: company.id,
        company_name: name,
        website,
        industry,
        country
      });
    } catch (e) {
      console.error("Failed to trigger FastAPI, is it running?", e);
      // We don't fail the request, but update status to failed
      await prisma.company.update({
        where: { id: company.id },
        data: { status: 'FAILED' }
      });
      return NextResponse.json({ error: "Crawler backend is offline." }, { status: 503 });
    }

    return NextResponse.json(company);
  } catch (error) {
    console.error("Error creating company analysis:", error);
    return NextResponse.json({ error: "Failed to create request" }, { status: 500 });
  }
}
