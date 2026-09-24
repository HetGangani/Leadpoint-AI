import { SupportedLocale, AgentTurnRequest, AgentTurnResponse, CallDisposition } from '@/types';

/**
 * System prompt generator for AI Voice SDR Persona
 */
export function buildVoiceAgentSystemPrompt(
  clientBusiness: { name: string; description: string; offerings?: string[] },
  leadInfo: { name: string; companyName: string },
  locale: SupportedLocale
): string {
  const languageNames: Record<SupportedLocale, string> = {
    en: 'English',
    es: 'Spanish (Español)',
    de: 'German (Deutsch)',
    hi: 'Hindi (हिंदी)',
    fr: 'French (Français)',
  };

  const currentLang = languageNames[locale] || 'English';

  return `
You are Alex, an expert AI Sales SDR representing "${clientBusiness.name}".
Your Business Description: ${clientBusiness.description}
Service Offerings: ${clientBusiness.offerings?.join(', ') || 'Enterprise Cloud & Digital Transformation Services'}

Prospect Details:
Name: ${leadInfo.name}
Company: ${leadInfo.companyName}

Goal & Persona Guidelines:
1. Speak exclusively in ${currentLang}. Keep sentences natural, concise, and conversational for voice calling (2-3 sentences per turn).
2. Objectives:
   - Handle FAQs about ${clientBusiness.name}'s capabilities.
   - Qualify prospect's budget, timeline, and decision-making urgency.
   - Detect and overcome common B2B objections (e.g., "too expensive", "already have an existing vendor", "send me an email first").
   - If prospect explicitly confirms project requirements (e.g., "we want to start next month", "approved budget", "schedule a demo", "send a proposal"), express enthusiasm and mark intention.
   - If line is busy or prospect cannot talk now, politely request to log a callback for a specific time.
   - If automated voicemail detection triggers, speak a professional 15-second voicemail leaving contact details and value proposition.
3. Tone: Professional, warm, empathetic, confident, and concise.
`;
}

/**
 * Heuristic & Gemini-backed Turn Processor
 */
export async function processVoiceAgentTurn(request: AgentTurnRequest): Promise<AgentTurnResponse> {
  const { userUtterance, locale, forceDisposition, leadName = 'Prospect', companyName = 'Target Enterprise', clientBusinessProfile } = request;

  const bizName = clientBusinessProfile?.name || 'CloudScale AI Solutions';
  const bizDesc = clientBusinessProfile?.description || 'Enterprise Cloud Modernization, AI Workflow Automation, & Infrastructure Scaling';
  const bizOfferings = clientBusinessProfile?.offerings || ['SharePoint to M365 Migration', 'AI Sales Automation', 'AWS/Azure Cloud Modernization'];

  // Handle Forced Dispositions (Busy line or Voicemail simulation)
  if (forceDisposition === 'BUSY') {
    const busyResponses: Record<SupportedLocale, string> = {
      en: `Hi ${leadName}, I see you might be in the middle of something right now. I'll log a callback request for our executive SDR to reach out at a more convenient time today!`,
      es: `Hola ${leadName}, veo que estás ocupado en este momento. Registraré una solicitud de llamada para comunicarnos más tarde hoy.`,
      de: `Hallo ${leadName}, ich sehe, dass Sie im Moment beschäftigt sind. Ich werde einen Rückrufwunsch für heute Nachmittag vormerken.`,
      hi: `नमस्ते ${leadName}, ऐसा लगता है कि आप अभी व्यस्त हैं। मैं आज बाद में फिर से संपर्क करने के लिए कॉल बैक दर्ज कर रहा हूँ।`,
      fr: `Bonjour ${leadName}, je vois que vous êtes occupé. Je programme un rappel aujourd'hui à un moment plus pratique.`,
    };
    return {
      replyText: busyResponses[locale] || busyResponses.en,
      stage: 'BUSY_CALLBACK',
      sentiment: 'NEUTRAL',
      nextSuggestedStep: 'Log callback task in CRM and re-queue call for afternoon slot.',
      isHighIntent: false,
      disposition: CallDisposition.BUSY,
    };
  }

  if (forceDisposition === 'VOICEMAIL') {
    const voicemailResponses: Record<SupportedLocale, string> = {
      en: `Hello ${leadName}, this is Alex calling from ${bizName}. We help companies like ${companyName} accelerate cloud & AI workflows. I'll drop a quick summary to your business email. Have a great day!`,
      es: `Hola ${leadName}, le habla Alex de ${bizName}. Ayudamos a empresas como ${companyName} a modernizar sus flujos de trabajo de IA y nube. Le enviaré un correo con los detalles.`,
      de: `Hallo ${leadName}, hier ist Alex von ${bizName}. Wir unterstützen Unternehmen wie ${companyName} bei der Cloud- und KI-Modernisierung. Ich sende Ihnen eine E-Mail mit Details.`,
      hi: `नमस्ते ${leadName}, मैं ${bizName} से एलेक्स बोल रहा हूँ। हम ${companyName} जैसी कंपनियों की क्लाउड और एआई वर्कफ़्लो में मदद करते हैं। मैं आपके ईमेल पर विवरण भेज दूँगा।`,
      fr: `Bonjour ${leadName}, c'est Alex de ${bizName}. Nous aidons les entreprises comme ${companyName} à accélérer leurs flux de travail cloud et IA. Je vous envoie un e-mail avec les détails.`,
    };
    return {
      replyText: voicemailResponses[locale] || voicemailResponses.en,
      stage: 'VOICEMAIL_LEFT',
      sentiment: 'NEUTRAL',
      nextSuggestedStep: 'Automated voicemail left. Trigger follow-up email drip sequence.',
      isHighIntent: false,
      disposition: CallDisposition.VOICEMAIL,
    };
  }

  const textLower = userUtterance.toLowerCase();

  // Affirmation / High Intent detection logic
  const intentKeywords = [
    'yes', 'interested', 'budget approved', 'start next month', 'schedule a demo',
    'send proposal', 'send contract', 'we need this', 'looking for vendor', 'hire',
    'si', 'interesado', 'demostración', 'presupuesto', 'ja', 'interessiert', 'termin',
    'हाँ', 'दिलचस्प', 'बजट', 'डेमो', 'oui', 'intéressé', 'démonstration', 'devis'
  ];

  const objectionKeywords = [
    'too expensive', 'no budget', 'already have', 'busy', 'not interested', 'send email',
    'cost', 'expensive', 'caro', 'demasiado', 'teuer', 'kein budget', 'महंगा', 'बजट नहीं',
    'trop cher', 'pas de budget'
  ];

  const faqKeywords = [
    'what do you do', 'how much', 'pricing', 'timeline', 'case study', 'references',
    'services', 'offerings', 'cómo funciona', 'precio', 'wie viel', 'kosten',
    'क्या करते हैं', 'कीमत', 'combien', 'services'
  ];

  let isHighIntent = false;
  let stage: 'FAQ' | 'QUALIFYING' | 'OBJECTION' | 'INTENT_AFFIRMED' | 'BUSY_CALLBACK' | 'VOICEMAIL_LEFT' = 'QUALIFYING';
  let sentiment: 'POSITIVE' | 'NEUTRAL' | 'NEGATIVE' = 'NEUTRAL';
  let replyText = '';
  let nextSuggestedStep = '';
  let disposition: CallDisposition = CallDisposition.INTERESTED;

  const matchesKeyword = (keywords: string[]) => {
    return keywords.some(k => {
      if (k.length <= 3) {
        // Use word boundary for short 2-3 letter words to avoid matching substrings like "si" in "expensive"
        const regex = new RegExp(`\\b${k.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i');
        return regex.test(textLower);
      }
      return textLower.includes(k);
    });
  };

  if (matchesKeyword(intentKeywords)) {
    isHighIntent = true;
    stage = 'INTENT_AFFIRMED';
    sentiment = 'POSITIVE';
    disposition = CallDisposition.INTERESTED;

    const intentResponses: Record<SupportedLocale, string> = {
      en: `That sounds fantastic, ${leadName}! Since you have an active project requirement for ${companyName}, I'll send over our technical roadmap and block 20 minutes with our Lead Solution Architect this Thursday. Does 2 PM work for you?`,
      es: `¡Eso suena fantástico, ${leadName}! Ya que tienen un proyecto activo para ${companyName}, enviaré nuestra hoja de ruta técnica y reservaré 20 minutos con nuestro arquitecto principal este jueves. ¿Le conviene a las 2 PM?`,
      de: `Das klingt fantastisch, ${leadName}! Da Sie ein aktives Projekt für ${companyName} planen, sende ich Ihnen unsere Roadmap zu und reserviere 20 Minuten mit unserem Chefarchitekten diesen Donnerstag. Passt 14:00 Uhr?`,
      hi: `यह बहुत बढ़िया है, ${leadName}! चूंकि ${companyName} के पास सक्रिय आवश्यकता है, मैं रोडमैप भेज रहा हूँ और इस गुरुवार 2:00 बजे 20 मिनट का समय बुक कर रहा हूँ। क्या यह समय सही रहेगा?`,
      fr: `C'est fantastique, ${leadName}! Étant donné que vous avez un projet actif pour ${companyName}, je vous envoie notre feuille de route et réserve 20 minutes avec notre architecte jeudi à 14h. Est-ce que cela vous convient?`,
    };
    replyText = intentResponses[locale] || intentResponses.en;
    nextSuggestedStep = '🔥 Auto-flagged Lead as HIGH INTENT. Schedule Calendar Booking & Send Proposal Deck.';
  } else if (matchesKeyword(objectionKeywords)) {
    stage = 'OBJECTION';
    sentiment = 'NEUTRAL';
    disposition = CallDisposition.INTERESTED;

    const objectionResponses: Record<SupportedLocale, string> = {
      en: `I completely understand, ${leadName}. Budget and existing vendor commitments are top priorities. Our modernizations typically reduce operational costs by 35% within 90 days. May I share a 1-page ROI benchmark doc?`,
      es: `Entiendo perfectamente, ${leadName}. El presupuesto y los proveedores actuales son la prioridad. Nuestras soluciones reducen los costos operativos un 35% en 90 días. ¿Puedo compartir un documento de ROI de 1 página?`,
      de: `Das verstehe ich vollkommen, ${leadName}. Unsere Modernisierungen senken die Betriebskosten in der Regel innerhalb von 90 Tagen um 35%. Darf ich Ihnen einen 1-seitigen ROI-Vergleich senden?`,
      hi: `मैं पूरी तरह समझता हूँ, ${leadName}। हमारा समाधान 90 दिनों में परिचालन लागत को 35% तक कम कर देता है। क्या मैं आपके साथ 1-पेज का आरओआई केस स्टडी साझा कर सकता हूँ?`,
      fr: `Je comprends tout à fait, ${leadName}. Nos modernisations réduisent généralement les coûts d'exploitation de 35% en 90 jours. Puis-je vous partager un document de ROI d'une page?`,
    };
    replyText = objectionResponses[locale] || objectionResponses.en;
    nextSuggestedStep = 'Address objection with ROI case study & request permission for follow-up email.';
  } else if (matchesKeyword(faqKeywords)) {
    stage = 'FAQ';
    sentiment = 'POSITIVE';
    disposition = CallDisposition.INTERESTED;

    const faqResponses: Record<SupportedLocale, string> = {
      en: `At ${bizName}, we specialize in ${bizOfferings.slice(0, 2).join(' and ')}. We help enterprise teams transition from legacy stacks to scalable cloud microservices seamlessly with zero downtime.`,
      es: `En ${bizName}, nos especializamos en ${bizOfferings.slice(0, 2).join(' y ')}. Ayudamos a equipos empresariales a migrar sistemas antiguos a microservicios en la nube sin interrupciones.`,
      de: `Bei ${bizName} sind wir spezialisiert auf ${bizOfferings.slice(0, 2).join(' und ')}. Wir unterstützen Unternehmen beim nahtlosen Wechsel von Legacy-Systemen zu Cloud-Microservices.`,
      hi: `हम ${bizName} में ${bizOfferings.slice(0, 2).join(' और ')} में विशेषज्ञता रखते हैं। हम कंपनियों को शून्य डाउनटाइम के साथ क्लाउड पर माइग्रेट करने में मदद करते हैं।`,
      fr: `Chez ${bizName}, nous sommes spécialisés dans ${bizOfferings.slice(0, 2).join(' et ')}. Nous aidons les entreprises à migrer sans interruption vers des microservices cloud.`,
    };
    replyText = faqResponses[locale] || faqResponses.en;
    nextSuggestedStep = 'Explain core service offerings & ask qualification question on timeline.';
  } else {
    stage = 'QUALIFYING';
    sentiment = 'POSITIVE';
    disposition = CallDisposition.INTERESTED;

    const qualifyingResponses: Record<SupportedLocale, string> = {
      en: `Thanks for sharing that, ${leadName}. To ensure we tailor the right architecture for ${companyName}, what is your target completion timeline for this initiative?`,
      es: `Gracias por compartir eso, ${leadName}. Para asegurarnos de adaptar la arquitectura adecuada para ${companyName}, ¿cuál es su plazo objetivo para esta iniciativa?`,
      de: `Vielen Dank für diese Info, ${leadName}. Um die richtige Architektur für ${companyName} zu wählen: Was ist Ihr angestrebter Zeitrahmen für dieses Projekt?`,
      hi: `साझा करने के लिए धन्यवाद, ${leadName}। ${companyName} के लिए सही समाधान तैयार करने के लिए, आपकी समय सीमा क्या है?`,
      fr: `Merci pour ces précisions, ${leadName}. Afin d'adapter au mieux l'architecture pour ${companyName}, quel est votre calendrier cible?`,
    };
    replyText = qualifyingResponses[locale] || qualifyingResponses.en;
    nextSuggestedStep = 'Qualify timeline & decision maker involvement.';
  }

  return {
    replyText,
    stage,
    sentiment,
    nextSuggestedStep,
    isHighIntent,
    disposition,
  };
}
