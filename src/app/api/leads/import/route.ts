import { NextResponse } from 'next/server';
import { processAndImportLeads, CSVLeadInput } from '@/lib/lead-service';

export async function POST(request: Request) {
  try {
    const contentType = request.headers.get('content-type') || '';
    let leads: CSVLeadInput[] = [];

    if (contentType.includes('application/json')) {
      const body = await request.json();
      if (Array.isArray(body.leads)) {
        leads = body.leads;
      } else if (Array.isArray(body)) {
        leads = body;
      } else {
        return NextResponse.json({ success: false, error: 'JSON payload must contain a "leads" array or an array of leads.' }, { status: 400 });
      }
    } else if (contentType.includes('text/csv') || contentType.includes('multipart/form-data')) {
      const text = await request.text();
      leads = parseCSVToLeadInputs(text);
    } else {
      // Fallback text parsing
      const text = await request.text();
      leads = parseCSVToLeadInputs(text);
    }

    if (!leads || leads.length === 0) {
      return NextResponse.json({ success: false, error: 'No valid lead rows provided in import request.' }, { status: 400 });
    }

    const result = await processAndImportLeads(leads);

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

/**
 * Basic CSV text line parsing helper
 */
function parseCSVToLeadInputs(csvText: string): CSVLeadInput[] {
  const lines = csvText.split(/\r?\n/).filter((l) => l.trim().length > 0);
  if (lines.length < 2) return [];

  const headers = lines[0].split(',').map((h) => h.replace(/^["']|["']$/g, '').trim().toLowerCase());

  const getFieldIndex = (names: string[]) => {
    return headers.findIndex((h) => names.some((n) => h.includes(n)));
  };

  const nameIdx = getFieldIndex(['name', 'contact', 'full name']);
  const emailIdx = getFieldIndex(['email', 'business email', 'work email']);
  const phoneIdx = getFieldIndex(['phone', 'mobile', 'telephone']);
  const companyIdx = getFieldIndex(['company', 'organization']);
  const industryIdx = getFieldIndex(['industry', 'sector']);
  const sizeIdx = getFieldIndex(['size', 'employees', 'company size']);
  const platformIdx = getFieldIndex(['platform', 'source', 'source platform']);
  const urlIdx = getFieldIndex(['url', 'original post', 'post url', 'link']);
  const contentIdx = getFieldIndex(['content', 'post text', 'requirement', 'post content']);
  const scoreIdx = getFieldIndex(['score', 'relevance', 'rating']);
  const statusIdx = getFieldIndex(['status', 'state']);
  const locationIdx = getFieldIndex(['location', 'city', 'headquarters']);

  const parsedLeads: CSVLeadInput[] = [];

  for (let i = 1; i < lines.length; i++) {
    // Basic CSV splitting handling quotes
    const rawLine = lines[i];
    const cells: string[] = [];
    let insideQuote = false;
    let currentCell = '';

    for (let c = 0; c < rawLine.length; c++) {
      const char = rawLine[c];
      if (char === '"') {
        insideQuote = !insideQuote;
      } else if (char === ',' && !insideQuote) {
        cells.push(currentCell.replace(/^["']|["']$/g, '').trim());
        currentCell = '';
      } else {
        currentCell += char;
      }
    }
    cells.push(currentCell.replace(/^["']|["']$/g, '').trim());

    const getVal = (idx: number) => (idx >= 0 && idx < cells.length ? cells[idx] : undefined);

    const email = getVal(emailIdx);
    if (!email) continue;

    parsedLeads.push({
      name: getVal(nameIdx) || 'Key Executive',
      businessEmail: email,
      phone: getVal(phoneIdx),
      companyName: getVal(companyIdx) || 'Target Enterprise',
      industry: getVal(industryIdx) || 'Technology Services',
      companySize: getVal(sizeIdx) || '250-500 employees',
      sourcePlatform: getVal(platformIdx) || 'CSV Import',
      originalPostUrl: getVal(urlIdx),
      postContent: getVal(contentIdx),
      relevanceScore: getVal(scoreIdx),
      status: getVal(statusIdx),
      location: getVal(locationIdx),
    });
  }

  return parsedLeads;
}
