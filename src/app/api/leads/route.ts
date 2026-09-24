import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const leads = await prisma.lead.findMany({
      include: {
        voiceCalls: true,
        companyProfile: true,
      },
      orderBy: {
        relevanceScore: 'desc',
      },
    });

    return NextResponse.json({
      success: true,
      data: leads,
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to fetch leads',
      },
      { status: 500 }
    );
  }
}
