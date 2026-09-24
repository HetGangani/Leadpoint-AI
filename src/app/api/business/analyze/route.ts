import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSessionUser } from '@/lib/auth';

export async function POST(request: Request) {
  try {
    const session = await getSessionUser(request);
    if (!session) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { companyUrl, description, companyName } = body;

    if (!companyUrl && !description) {
      return NextResponse.json(
        { success: false, error: 'Please provide either a company URL or business description document.' },
        { status: 400 }
      );
    }

    const inputContent = `${companyName ? `Company: ${companyName}\n` : ''}${companyUrl ? `URL: ${companyUrl}\n` : ''}${description ? `Description: ${description}` : ''}`;

    let valuePropositions: Array<{ title: string; description: string; impact: string }> = [];
    let targetClientICP: {
      industries: string[];
      companySize: string;
      decisionMakers: string[];
      painPoints: string[];
    };
    let searchQueryTriggers: string[] = [];

    const isSharePointOrM365 = /sharepoint|m365|microsoft 365|azure|tenant|cloud/i.test(inputContent);
    const isHealthcare = /health|hipaa|medical|hospital/i.test(inputContent);
    const isFintech = /fintech|bank|financial|sec|finra/i.test(inputContent);

    if (isSharePointOrM365 || description?.toLowerCase().includes('consulting')) {
      valuePropositions = [
        {
          title: 'Legacy SharePoint Server Modernization',
          description: 'Seamless zero-downtime migration from SharePoint 2013/2016/2019 on-premise farms to SharePoint Online.',
          impact: 'Eliminates hardware maintenance cost & avoids legacy EOL security risks.',
        },
        {
          title: 'M365 Tenant-to-Tenant Consolidation',
          description: 'Fast post-M&A unification of Exchange Online, Teams, OneDrive, and SharePoint structures.',
          impact: 'Accelerates organizational integration within 2 to 6 weeks.',
        },
        {
          title: 'Zero Trust & Purview DLP Compliance Audit',
          description: 'Implementation of Conditional Access, PIM, and Microsoft Purview data loss prevention policies.',
          impact: 'Ensures strict regulatory compliance (FINRA, HIPAA, SOC2).',
        },
      ];

      targetClientICP = {
        industries: isFintech
          ? ['Financial Services / Fintech', 'Banking & Insurance']
          : isHealthcare
          ? ['Healthcare & Hospitals', 'Pharmaceuticals']
          : ['Financial Services', 'Aerospace & Defense', 'Healthcare Systems', 'Enterprise Logistics'],
        companySize: '250 to 5,000 employees',
        decisionMakers: ['VP of Infrastructure', 'CIO / CTO', 'Director of IT Operations', 'Enterprise Architect'],
        painPoints: [
          'On-premises SharePoint EOL support deadline',
          'Post-acquisition M365 tenant fragmentation',
          'HIPAA & FINRA document compliance audit warnings',
          'High hardware infrastructure maintenance costs',
        ],
      };

      searchQueryTriggers = [
        'SharePoint 2016 migration to SharePoint Online',
        'Microsoft 365 tenant to tenant migration partner',
        'SharePoint Server legacy EOL replacement',
        'Google Workspace to Microsoft 365 migration vendor',
        'M365 Purview DLP compliance consulting',
      ];
    } else {
      valuePropositions = [
        {
          title: 'Enterprise AI & Automation Sourcing',
          description: 'Automated requirement discovery and AI voice agent qualification for high-intent B2B sales leads.',
          impact: '3x increase in qualified sales pipelines.',
        },
        {
          title: 'High-Intent Social Intent Sourcing',
          description: 'Monitors public social channels (LinkedIn, X, Upwork, RFP directories) for active project solicitations.',
          impact: 'First-mover outreach advantage to decision makers.',
        },
      ];

      targetClientICP = {
        industries: ['B2B SaaS', 'IT Services & Consulting', 'Enterprise Software'],
        companySize: '100 to 1,000 employees',
        decisionMakers: ['VP of Sales', 'Chief Revenue Officer', 'Head of Business Development'],
        painPoints: [
          'Cold outreach low response rates',
          'Lack of timely intent signals for active projects',
          'Manual lead qualification overhead',
        ],
      };

      searchQueryTriggers = [
        'Looking for IT vendor recommendation',
        'Evaluating B2B software consulting partners',
        'Seeking RFP bids for IT modernization',
      ];
    }

    // Retrieve existing profile for session user or create one
    let profile = await prisma.companyProfile.findUnique({
      where: { userId: session.id },
    });

    if (profile) {
      profile = await prisma.companyProfile.update({
        where: { id: profile.id },
        data: {
          name: companyName || profile.name,
          website: companyUrl || profile.website,
          description: description || profile.description,
          targetKeywords: JSON.stringify(searchQueryTriggers),
          offerings: JSON.stringify({
            services: valuePropositions.map((vp, index) => ({
              id: `srv-${index + 1}`,
              title: vp.title,
              description: vp.description,
              pricingModel: 'Fixed Scope / Milestone',
              avgTimeline: '2-8 weeks',
            })),
            icp: targetClientICP,
          }),
          validationStatus: 'APPROVED',
        },
      });
    } else {
      profile = await prisma.companyProfile.create({
        data: {
          userId: session.id,
          name: companyName || `${session.name}'s Consulting Group`,
          website: companyUrl || 'https://www.example.com',
          description: description || 'Enterprise IT consulting firm.',
          targetKeywords: JSON.stringify(searchQueryTriggers),
          offerings: JSON.stringify({
            services: valuePropositions.map((vp, index) => ({
              id: `srv-${index + 1}`,
              title: vp.title,
              description: vp.description,
              pricingModel: 'Fixed Scope / Milestone',
              avgTimeline: '2-8 weeks',
            })),
            icp: targetClientICP,
          }),
          validationStatus: 'APPROVED',
        },
      });
    }

    return NextResponse.json({
      success: true,
      data: {
        companyProfileId: profile.id,
        name: profile.name,
        website: profile.website,
        valuePropositions,
        targetClientICP,
        searchQueryTriggers,
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to analyze business details' },
      { status: 500 }
    );
  }
}
