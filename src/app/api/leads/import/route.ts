import { NextResponse } from 'next/server';
import {
  processAndImportLeads,
  CSVLeadInput,
  parseCSVToLeadInputs,
  fetchCSVFromUrl,
} from '@/lib/lead-service';
import { getSessionUser } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function POST(request: Request) {
  try {
    const session = await getSessionUser(request);
    if (!session) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    let targetProfileId = session.companyProfileId;
    if (!targetProfileId) {
      const profile = await prisma.companyProfile.findUnique({
        where: { userId: session.id },
      });
      targetProfileId = profile?.id;
    }

    if (!targetProfileId) {
      return NextResponse.json(
        { success: false, error: 'No company profile exists for authenticated user.' },
        { status: 400 }
      );
    }

    const contentType = request.headers.get('content-type') || '';
    let leads: CSVLeadInput[] = [];
    let detectedSource = 'CSV Import (File)';

    if (contentType.includes('application/json')) {
      const body = await request.json();

      if (body.url && typeof body.url === 'string') {
        // Fetch from remote URL or Google Sheets link
        detectedSource = body.url.includes('docs.google.com')
          ? 'CSV Import (Google Sheets)'
          : 'CSV Import (Remote URL)';
        const fetchedCSV = await fetchCSVFromUrl(body.url);
        leads = parseCSVToLeadInputs(fetchedCSV, detectedSource);
      } else if (body.csvText && typeof body.csvText === 'string') {
        detectedSource = body.sourceName || 'CSV Import (Pasted Text)';
        leads = parseCSVToLeadInputs(body.csvText, detectedSource);
      } else if (Array.isArray(body.leads)) {
        leads = body.leads;
      } else if (Array.isArray(body)) {
        leads = body;
      } else {
        return NextResponse.json(
          {
            success: false,
            error:
              'Invalid JSON payload. Provide "url", "csvText", or an array of "leads".',
          },
          { status: 400 }
        );
      }
    } else {
      const text = await request.text();
      leads = parseCSVToLeadInputs(text, detectedSource);
    }

    if (!leads || leads.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error:
            'No valid lead rows could be extracted. Please ensure the CSV contains a header row with an email column.',
        },
        { status: 400 }
      );
    }

    const result = await processAndImportLeads(leads, targetProfileId);

    return NextResponse.json({
      success: true,
      message: `Import processed: ${result.importedCount} leads added, ${result.duplicatesSkipped} duplicates skipped, ${result.invalidEmailsCount} invalid emails rejected.`,
      result,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to import CSV leads' },
      { status: 500 }
    );
  }
}

