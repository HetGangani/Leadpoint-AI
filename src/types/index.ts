export const UserRole = {
  ADMIN: 'ADMIN',
  CLIENT: 'CLIENT',
  SDR: 'SDR',
} as const;
export type UserRole = (typeof UserRole)[keyof typeof UserRole];

export const CompanyValidationStatus = {
  PENDING: 'PENDING',
  APPROVED: 'APPROVED',
  REJECTED: 'REJECTED',
} as const;
export type CompanyValidationStatus = (typeof CompanyValidationStatus)[keyof typeof CompanyValidationStatus];

export const LeadStatus = {
  NEW: 'NEW',
  QUALIFIED: 'QUALIFIED',
  CONTACTED: 'CONTACTED',
  INTERESTED: 'INTERESTED',
  UNRESPONSIVE: 'UNRESPONSIVE',
} as const;
export type LeadStatus = (typeof LeadStatus)[keyof typeof LeadStatus];

export const CampaignType = {
  CALLING_ONLY: 'CALLING_ONLY',
  LEADS_AND_CALLING: 'LEADS_AND_CALLING',
} as const;
export type CampaignType = (typeof CampaignType)[keyof typeof CampaignType];

export const CampaignStatus = {
  DRAFT: 'DRAFT',
  SCHEDULED: 'SCHEDULED',
  ACTIVE: 'ACTIVE',
  COMPLETED: 'COMPLETED',
} as const;
export type CampaignStatus = (typeof CampaignStatus)[keyof typeof CampaignStatus];

export const CallDisposition = {
  INTERESTED: 'INTERESTED',
  CALLBACK: 'CALLBACK',
  VOICEMAIL: 'VOICEMAIL',
  FAILED: 'FAILED',
  BUSY: 'BUSY',
} as const;
export type CallDisposition = (typeof CallDisposition)[keyof typeof CallDisposition];

export const PlanTier = {
  STARTER: 'STARTER',
  GROWTH: 'GROWTH',
  ENTERPRISE: 'ENTERPRISE',
} as const;
export type PlanTier = (typeof PlanTier)[keyof typeof PlanTier];

export interface UserSummary {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  createdAt: Date;
}

export interface ServiceOffering {
  id: string;
  title: string;
  description: string;
  pricingModel: string;
  avgTimeline: string;
}

export interface CompanyOfferingsJson {
  services: ServiceOffering[];
}

export interface EnrichedDataJson {
  funding?: string;
  headquarters?: string;
  techStack?: string[];
  hiringSignals?: string[];
  growthRateYOY?: string;
  decisionMakerLevel?: string;
}

export interface LeadWithCalls {
  id: string;
  companyProfileId: string;
  name: string;
  businessEmail: string;
  phone?: string | null;
  linkedinUrl?: string | null;
  companyName: string;
  industry: string;
  companySize: string;
  sourcePlatform: string;
  originalPostUrl?: string | null;
  postContent?: string | null;
  relevanceScore: number;
  status: LeadStatus;
  enrichedData: EnrichedDataJson;
  createdAt: Date;
  voiceCalls?: VoiceCallSummary[];
}

export interface VoiceCallSummary {
  id: string;
  leadId: string;
  campaignId?: string | null;
  durationSeconds: number;
  transcript: string;
  summary: string;
  sentiment: string;
  nextBestAction: string;
  disposition: CallDisposition;
  audioUrl?: string | null;
  createdAt: Date;
}

export interface CampaignSummary {
  id: string;
  userId: string;
  name: string;
  type: CampaignType;
  status: CampaignStatus;
  timezone: string;
  cronExpression?: string | null;
  maxRetries: number;
  createdAt: Date;
  voiceCallsCount?: number;
}

export interface SubscriptionUsageSummary {
  id: string;
  userId: string;
  planTier: PlanTier;
  voiceMinutesUsed: number;
  voiceMinutesLimit: number;
  contactCreditsUsed: number;
  contactCreditsLimit: number;
  billingCycleEnd: Date;
}

export interface AuditLogSummary {
  id: string;
  userId?: string | null;
  action: string;
  ipAddress?: string | null;
  userAgent?: string | null;
  metadata?: Record<string, unknown> | null;
  timestamp: Date;
}

export type SupportedLocale = 'en' | 'es' | 'de' | 'hi' | 'fr';

export interface AgentTurnRequest {
  leadName?: string;
  companyName?: string;
  prospectRole?: string;
  userUtterance: string;
  locale: SupportedLocale;
  conversationHistory?: Array<{ sender: 'agent' | 'prospect'; text: string }>;
  clientBusinessProfile?: {
    name: string;
    description: string;
    offerings?: string[];
  };
  forceDisposition?: 'BUSY' | 'VOICEMAIL' | 'NORMAL';
}

export interface AgentTurnResponse {
  replyText: string;
  stage: 'FAQ' | 'QUALIFYING' | 'OBJECTION' | 'INTENT_AFFIRMED' | 'BUSY_CALLBACK' | 'VOICEMAIL_LEFT';
  sentiment: 'POSITIVE' | 'NEUTRAL' | 'NEGATIVE';
  nextSuggestedStep: string;
  isHighIntent: boolean;
  disposition: CallDisposition;
}

export interface VoiceCallWebhookPayload {
  callId?: string;
  leadId: string;
  campaignId?: string;
  durationSeconds: number;
  transcript: Array<{ speaker: 'agent' | 'prospect'; text: string; timestamp?: string }> | string;
  audioUrl?: string;
  manualDisposition?: CallDisposition;
}

export interface CallWebhookResult {
  callId: string;
  leadId: string;
  leadName: string;
  companyName: string;
  status: string;
  sentiment: 'POSITIVE' | 'NEUTRAL' | 'NEGATIVE';
  disposition: CallDisposition;
  isHighIntentFlagged: boolean;
  summaryBulletPoints: string[];
  nextBestAction: string;
  structuredTranscript: string;
}

export interface CampaignCreatePayload {
  name: string;
  type: CampaignType;
  scheduleCron?: string;
  timezone: string;
  retryCount: number;
  leadIds?: string[];
  targetLanguage?: SupportedLocale;
}

