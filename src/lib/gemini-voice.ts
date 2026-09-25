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
3. Tone: Professional, warm, empathetic, confident, and concise.
`;
}

export function isHumanHandoffRequested(text: string): boolean {
  if (!text) return false;
  const textLower = text.toLowerCase();

  // Exclude past tense / observational statements e.g. "I spoke with a human yesterday"
  if (/\b(spoke|talked|met|chatted) (with|to) (a|the) (human|person|agent)\b/i.test(textLower) &&
      !/\b(want|need|can|could|please|would like|give|send)\b/i.test(textLower)) {
    return false;
  }

  const explicitPhrases = [
    'speak with a human', 'talk to a human', 'talk to a person', 'speak with someone',
    'real person', 'human representative', 'connect me to an agent', 'connect me to an sdr',
    'connect me to a person', 'send me a calendly link', 'book a call with someone', 'send calendly',
    'hablar con un humano', 'persona real', 'hablar con una persona',
    'mit einem menschen sprechen', 'echte person', 'mit jemandem sprechen',
    'इंसान से बात', 'किसी से बात', 'एजेंट से बात',
    'parler à un humain', 'vraie personne', 'parler à quelqu\'un'
  ];

  if (explicitPhrases.some((phrase) => textLower.includes(phrase))) {
    return true;
  }

  const requestRegex = /\b(speak|talk|connect|transfer|send|book|want|need)\b.*\b(human|real person|person|sdr|agent|calendly)\b/i;
  return requestRegex.test(textLower);
}

export function extractPhoneNumber(text: string): string | null {
  if (!text) return null;
  // Match standard phone formats: e.g. 7861097967, +17861097967, (786) 109-7967, 786-109-7967, +919876543210
  const match = text.match(/(?:\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}|\+?\d{10,14}/);
  if (match) {
    const cleaned = match[0].replace(/[\s\-\(\)\.]/g, '');
    if (/^\+?[1-9]\d{9,14}$/.test(cleaned)) {
      return cleaned.startsWith('+') ? cleaned : `+1${cleaned}`;
    }
  }
  return null;
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

  const textLower = userUtterance.toLowerCase().trim();

  // Normalize conversation history to support both { sender, text } and { role, content } formats
  interface NormalizedHistoryItem {
    sender: 'agent' | 'prospect';
    text: string;
  }

  const rawHistory = request.conversationHistory || [];
  const history: NormalizedHistoryItem[] = rawHistory.map((item: any) => {
    const sender: 'agent' | 'prospect' =
      item.sender === 'agent' || item.role === 'assistant' ? 'agent' : 'prospect';
    const text: string = (item.text || item.content || '').trim();
    return { sender, text };
  });

  // Exclude current user turn if it was passed at the tail of history
  let pastHistory = history;
  if (
    history.length > 0 &&
    history[history.length - 1].sender === 'prospect' &&
    history[history.length - 1].text.trim().toLowerCase() === textLower
  ) {
    pastHistory = history.slice(0, -1);
  }

  const pastAgentTurns = pastHistory.filter((m) => m.sender === 'agent').map((m) => m.text);
  const pastProspectTurns = pastHistory.filter((m) => m.sender === 'prospect').map((m) => m.text);
  const lastAgentTurn = pastAgentTurns.length > 0 ? pastAgentTurns[pastAgentTurns.length - 1].toLowerCase() : '';

  // Question classifier helpers
  const isTimelineQuestion = (t: string) => {
    const tl = t.toLowerCase();
    return (
      tl.includes('timeline') ||
      tl.includes('target completion') ||
      tl.includes('zeitrahmen') ||
      tl.includes('plazo objetivo') ||
      tl.includes('समय सीमा') ||
      tl.includes('calendrier')
    );
  };

  const isBudgetQuestion = (t: string) => {
    const tl = t.toLowerCase();
    return (
      tl.includes('budget') ||
      tl.includes('team size') ||
      tl.includes('allocated') ||
      tl.includes('presupuesto') ||
      tl.includes('बजट') ||
      tl.includes("taille de l'équipe") ||
      tl.includes('geplante budget')
    );
  };

  const isDemoProposal = (t: string) => {
    const tl = t.toLowerCase();
    return (
      tl.includes('20-minute architecture demo') ||
      tl.includes('tuesday or thursday') ||
      tl.includes('block 20 minutes') ||
      tl.includes('2 pm work') ||
      tl.includes('demostración técnica') ||
      tl.includes('martes o jueves') ||
      tl.includes('dienstag- oder donnerstag') ||
      tl.includes('tailored 20-minute') ||
      tl.includes('20 मिनट का डेमो')
    );
  };

  // Derive past qualification milestones
  const hasAskedTimeline = pastAgentTurns.some(isTimelineQuestion);
  const hasAskedBudget = pastAgentTurns.some(isBudgetQuestion);
  const hasProposedDemo = pastAgentTurns.some(isDemoProposal);

  // Stateful qualification state determination
  type QualificationState =
    | 'INITIAL'
    | 'TIMELINE_ASKED'
    | 'TIMELINE_ANSWERED'
    | 'BUDGET_ASKED'
    | 'BUDGET_ANSWERED'
    | 'MEETING_PROPOSED'
    | 'HUMAN_HANDOFF';

  let currentStageState: QualificationState = 'INITIAL';
  if (hasProposedDemo) {
    currentStageState = 'MEETING_PROPOSED';
  } else if (hasAskedBudget) {
    currentStageState = 'BUDGET_ASKED';
  } else if (hasAskedTimeline) {
    currentStageState = 'TIMELINE_ASKED';
  } else {
    currentStageState = 'INITIAL';
  }

  // 1. Check if user is responding with a phone number (e.g. after phone confirmation prompt or during handoff)
  const phoneDetected = extractPhoneNumber(userUtterance);
  if (
    phoneDetected &&
    (lastAgentTurn.includes('phone') ||
      lastAgentTurn.includes('number') ||
      lastAgentTurn.includes('confirm') ||
      isHumanHandoffRequested(lastAgentTurn) ||
      lastAgentTurn.includes('booking link'))
  ) {
    const confirmationResponses: Record<SupportedLocale, string> = {
      en: `Thank you, ${leadName}! I have updated your phone number to ${phoneDetected} and sent your Calendly booking link. Please check your messages to pick a time!`,
      es: `¡Gracias, ${leadName}! He actualizado su número de teléfono a ${phoneDetected} y enviado el enlace de reserva de Calendly. ¡Por favor revise sus mensajes!`,
      de: `Vielen Dank, ${leadName}! Ich habe Ihre Telefonnummer auf ${phoneDetected} aktualisiert und den Calendly-Buchungslink gesendet. Bitte überprüfen Sie Ihre Nachrichten!`,
      hi: `धन्यवाद, ${leadName}! मैंने आपका फ़ोन नंबर ${phoneDetected} अपडेट कर दिया है और कैलेंडली बुकिंग लिंक भेज दिया है। कृपया अपने संदेश देखें!`,
      fr: `Merci, ${leadName}! J'ai mis à jour votre numéro de téléphone au ${phoneDetected} et envoyé le lien de réservation Calendly. Veuillez vérifier vos messages!`,
    };

    return {
      replyText: confirmationResponses[locale] || confirmationResponses.en,
      stage: 'HUMAN_HANDOFF',
      sentiment: 'POSITIVE',
      nextSuggestedStep: `Dispatched Calendly booking link to ${phoneDetected}.`,
      isHighIntent: true,
      disposition: CallDisposition.HUMAN_HANDOFF,
      extractedPhone: phoneDetected,
    };
  }

  // 2. Check Human Handoff Intent FIRST
  if (isHumanHandoffRequested(userUtterance)) {
    const handoffResponses: Record<SupportedLocale, string> = {
      en: `I'd be happy to connect you with our team, ${leadName}! I'm sending a booking link to your phone now so you can pick a convenient time to speak with us.`,
      es: `¡Con gusto le conectaré con nuestro equipo, ${leadName}! Le estoy enviando un enlace de reserva a su teléfono para que elija el momento más conveniente.`,
      de: `Ich verbinde Sie gerne mit unserem Team, ${leadName}! Ich sende Ihnen jetzt einen Buchungslink auf Ihr Telefon, damit Sie einen passenden Termin auswählen können.`,
      hi: `मुझे आपको हमारी टीम से जोड़कर खुशी होगी, ${leadName}! मैं अभी आपके फ़ोन पर एक बुकिंग लिंक भेज रहा हूँ ताकि आप अपनी सुविधा का समय चुन सकें।`,
      fr: `Je serais ravi de vous mettre en relation avec notre équipe, ${leadName}! Je vous envoie un lien de réservation sur votre téléphone pour choisir le moment qui vous convient.`,
    };

    return {
      replyText: handoffResponses[locale] || handoffResponses.en,
      stage: 'HUMAN_HANDOFF',
      sentiment: 'POSITIVE',
      nextSuggestedStep: '🤖 Human Handoff Requested: Dispatch SMS Calendly booking link & update Lead status.',
      isHighIntent: true,
      disposition: CallDisposition.HUMAN_HANDOFF,
    };
  }

  // Explicit Meeting Acceptance Detection (when demo was already proposed)
  const meetingConfirmationKeywords = [
    'tuesday', 'thursday', '2 pm', '2pm', 'afternoon', 'works for me', 'sounds good',
    'perfect', 'martes', 'jueves', 'dienstag', 'donnerstag', 'गुरुवार', 'मंगलवार', 'mardi', 'jeudi'
  ];

  const isAcceptingMeeting =
    hasProposedDemo &&
    (meetingConfirmationKeywords.some((k) => textLower.includes(k)) ||
      textLower === 'yes' ||
      textLower === 'sure' ||
      textLower === 'yes that works' ||
      textLower.includes('that works') ||
      textLower.includes('works great'));

  if (isAcceptingMeeting) {
    const confirmResponses: Record<SupportedLocale, string> = {
      en: `Fantastic! I have noted ${userUtterance.trim().length <= 30 ? userUtterance.trim() : 'that time'} for our solutions demo with ${companyName}. I'll send the calendar invitation and project overview directly to your contact info. Have a wonderful day!`,
      es: `¡Fantástico! He reservado ese horario para la demostración con ${companyName}. Enviaré la invitación y el resumen directamente a su correo. ¡Que tenga un excelente día!`,
      de: `Fantastisch! Ich habe den Termin für die Demo mit ${companyName} notiert. Ich sende Ihnen die Kalendereinladung und Übersicht direkt zu. Einen schönen Tag noch!`,
      hi: `शानदार! मैंने ${companyName} के साथ डेमो के लिए समय दर्ज कर लिया है। मैं सीधे आपके संपर्क पर कैलेंडर आमंत्रण भेज दूँगा। आपका दिन शुभ हो!`,
      fr: `Fantastique! J'ai bien noté ce créneau pour la démonstration avec ${companyName}. Je vous envoie l'invitation d'agenda et la synthèse directement. Excellente journée!`,
    };
    return {
      replyText: confirmResponses[locale] || confirmResponses.en,
      stage: 'INTENT_AFFIRMED',
      sentiment: 'POSITIVE',
      nextSuggestedStep: 'Meeting confirmed. Send calendar invitation & discovery deck.',
      isHighIntent: true,
      disposition: CallDisposition.INTERESTED,
    };
  }

  // Affirmation / High Intent detection logic
  const explicitDemoKeywords = [
    'schedule a demo', 'schedule demo', 'book a demo', 'book demo', 'send proposal',
    'send contract', 'budget approved', 'budget is approved', 'we want to start',
    'start next month', 'looking for vendor', 'hire', 'demostración', 'presupuesto aprobado',
    'termin vereinbaren', 'डेमो बुक करें', 'démonstration'
  ];

  const generalInterestKeywords = [
    'interested', 'yes', 'we need this', 'tell me more', 'interesado', 'si',
    'interessiert', 'ja', 'दिलचस्प', 'हाँ', 'intéressé', 'oui'
  ];

  const objectionKeywords = [
    'too expensive', 'no budget', 'already have', 'busy', 'not interested', 'send email',
    'cost', 'expensive', 'caro', 'demasiado', 'teuer', 'kein budget', 'महंगा', 'बजट नहीं',
    'trop cher', 'pas de budget'
  ];

  const faqKeywords = [
    'what do you do', 'how much', 'pricing', 'case study', 'references',
    'services', 'offerings', 'cómo funciona', 'precio', 'wie viel', 'kosten',
    'क्या करते हैं', 'कीमत', 'combien', 'services'
  ];

  const matchesKeyword = (keywords: string[]) => {
    return keywords.some((k) => {
      if (k.length <= 3) {
        const regex = new RegExp(`\\b${k.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i');
        return regex.test(textLower);
      }
      return textLower.includes(k);
    });
  };

  // Explicit demo / high intent request (e.g. "budget is approved, schedule a demo")
  if (matchesKeyword(explicitDemoKeywords)) {
    const intentResponses: Record<SupportedLocale, string> = {
      en: `That sounds fantastic, ${leadName}! Since you have an active project requirement for ${companyName}, I'll send over our technical roadmap and block 20 minutes with our Lead Solution Architect this Thursday. Does 2 PM work for you?`,
      es: `¡Eso suena fantástico, ${leadName}! Ya que tienen un proyecto activo para ${companyName}, enviaré nuestra hoja de ruta técnica y reservaré 20 minutos con nuestro arquitecto principal este jueves. ¿Le conviene a las 2 PM?`,
      de: `Das klingt fantastisch, ${leadName}! Da Sie ein aktives Projekt für ${companyName} planen, sende ich Ihnen unsere Roadmap zu und reserviere 20 Minuten mit unserem Chefarchitekten diesen Donnerstag. Passt 14:00 Uhr?`,
      hi: `यह बहुत बढ़िया है, ${leadName}! चूंकि ${companyName} के पास सक्रिय आवश्यकता है, मैं रोडमैप भेज रहा हूँ और इस गुरुवार 2:00 बजे 20 मिनट का समय बुक कर रहा हूँ। क्या यह समय सही रहेगा?`,
      fr: `C'est fantastique, ${leadName}! Étant donné que vous avez un projet actif pour ${companyName}, je vous envoie notre feuille de route et réserve 20 minutes avec notre architecte jeudi à 14h. Est-ce que cela vous convient?`,
    };

    return {
      replyText: intentResponses[locale] || intentResponses.en,
      stage: 'INTENT_AFFIRMED',
      sentiment: 'POSITIVE',
      nextSuggestedStep: '🔥 Auto-flagged Lead as HIGH INTENT. Schedule Calendar Booking & Send Proposal Deck.',
      isHighIntent: true,
      disposition: CallDisposition.INTERESTED,
    };
  }

  // Objection Handling
  if (matchesKeyword(objectionKeywords)) {
    const objectionResponses: Record<SupportedLocale, string> = {
      en: `I completely understand, ${leadName}. Budget and existing vendor commitments are top priorities. Our modernizations typically reduce operational costs by 35% within 90 days. May I share a 1-page ROI benchmark doc?`,
      es: `Entiendo perfectamente, ${leadName}. El presupuesto y los proveedores actuales son la prioridad. Nuestras soluciones reducen los costos operativos un 35% en 90 días. ¿Puedo compartir un documento de ROI de 1 página?`,
      de: `Das verstehe ich vollkommen, ${leadName}. Unsere Modernisierungen senken die Betriebskosten in der Regel innerhalb von 90 Tagen um 35%. Darf ich Ihnen einen 1-seitigen ROI-Vergleich senden?`,
      hi: `मैं पूरी तरह समझता हूँ, ${leadName}। हमारा समाधान 90 दिनों में परिचालन लागत को 35% तक कम कर देता है। क्या मैं आपके साथ 1-पेज का आरओआई केस स्टडी साझा कर सकता हूँ?`,
      fr: `Je comprends tout à fait, ${leadName}. Nos modernisations réduisent généralement les coûts d'exploitation de 35% en 90 jours. Puis-je vous partager un document de ROI d'une page?`,
    };

    return {
      replyText: objectionResponses[locale] || objectionResponses.en,
      stage: 'OBJECTION',
      sentiment: 'NEUTRAL',
      nextSuggestedStep: 'Address objection with ROI case study & request permission for follow-up email.',
      isHighIntent: false,
      disposition: CallDisposition.INTERESTED,
    };
  }

  // FAQ Handling
  if (matchesKeyword(faqKeywords)) {
    const faqResponses: Record<SupportedLocale, string> = {
      en: `At ${bizName}, we specialize in ${bizOfferings.slice(0, 2).join(' and ')}. We help enterprise teams transition from legacy stacks to scalable cloud microservices seamlessly with zero downtime.`,
      es: `En ${bizName}, nos especializamos en ${bizOfferings.slice(0, 2).join(' y ')}. Ayudamos a equipos empresariales a migrar sistemas antiguos a microservicios en la nube sin interrupciones.`,
      de: `Bei ${bizName} sind wir spezialisiert auf ${bizOfferings.slice(0, 2).join(' und ')}. Wir unterstützen Unternehmen beim nahtlosen Wechsel von Legacy-Systemen zu Cloud-Microservices.`,
      hi: `हम ${bizName} में ${bizOfferings.slice(0, 2).join(' और ')} में विशेषज्ञता रखते हैं। हम कंपनियों को शून्य डाउनटाइम के साथ क्लाउड पर माइग्रेट करने में मदद करते हैं।`,
      fr: `Chez ${bizName}, nous sommes spécialisés dans ${bizOfferings.slice(0, 2).join(' et ')}. Nous aidons les entreprises à migrer sans interruption vers des microservices cloud.`,
    };

    return {
      replyText: faqResponses[locale] || faqResponses.en,
      stage: 'FAQ',
      sentiment: 'POSITIVE',
      nextSuggestedStep: 'Explain core service offerings & ask qualification question on timeline.',
      isHighIntent: false,
      disposition: CallDisposition.INTERESTED,
    };
  }

  // Multi-Turn Stateful Qualification Progression

  // 1. If agent previously asked for budget/team size:
  // Prospect's response now answers budget/team size -> State advances to BUDGET_ANSWERED -> MEETING_PROPOSED
  if (currentStageState === 'BUDGET_ASKED') {
    const demoResponses: Record<SupportedLocale, string> = {
      en: `Understood, thanks for providing those details, ${leadName}. Based on what you've shared for ${companyName}, our solutions engineer would love to walk you through a tailored 20-minute architecture demo. Would Tuesday or Thursday afternoon work better for you?`,
      es: `Entendido, gracias por los detalles, ${leadName}. Según lo compartido para ${companyName}, nos encantaría coordinar una demostración técnica de 20 minutos. ¿Le queda mejor el martes o jueves por la tarde?`,
      de: `Verstanden, vielen Dank für die Details, ${leadName}. Passend zu Ihren Anforderungen für ${companyName} möchten wir Ihnen gerne eine 20-minütige Demo präsentieren. Passt Ihnen Dienstag- oder Donnerstagnachmittag besser?`,
      hi: `समझ गया, विवरण के लिए धन्यवाद, ${leadName}। ${companyName} की आवश्यकताओं के आधार पर, हम एक 20 मिनट का डेमो प्रदर्शित करना चाहते हैं। क्या मंगलवार या गुरुवार दोपहर आपके लिए बेहतर रहेगा?`,
      fr: `C'est bien noté, merci pour ces précisions, ${leadName}. Selon vos besoins pour ${companyName}, nous aimerions vous proposer une démonstration de 20 minutes. Le mardi ou le jeudi après-midi vous conviendrait-il?`,
    };

    return {
      replyText: demoResponses[locale] || demoResponses.en,
      stage: 'INTENT_AFFIRMED',
      sentiment: 'POSITIVE',
      nextSuggestedStep: '🔥 Qualification completed. Proposed meeting time slots.',
      isHighIntent: true,
      disposition: CallDisposition.INTERESTED,
    };
  }

  // 2. If agent previously asked for timeline:
  // Prospect's response answers timeline -> State advances to TIMELINE_ANSWERED -> BUDGET_ASKED
  if (currentStageState === 'TIMELINE_ASKED') {
    const timelineLabel =
      userUtterance.trim().length > 0 && userUtterance.trim().length <= 35
        ? userUtterance.trim()
        : 'that timeline';

    const budgetResponses: Record<SupportedLocale, string> = {
      en: `Great, ${timelineLabel} gives us a clear runway to plan deployment for ${companyName}. To help tailor the right architecture, what is your team size or estimated budget allocated for this initiative?`,
      es: `Excelente, ${timelineLabel} nos da un panorama claro para ${companyName}. Para adaptar la arquitectura, ¿cuál es el tamaño del equipo o presupuesto estimado?`,
      de: `Großartig, ${timelineLabel} bietet uns eine klare Grundlage für ${companyName}. Wie groß ist Ihr Team oder das geplante Budget?`,
      hi: `बहुत अच्छा, यह समय सीमा ${companyName} के लिए स्पष्ट योजना देती है। सही समाधान के लिए, आपकी टीम का आकार या अनुमानित बजट क्या है?`,
      fr: `Parfait, ${timelineLabel} nous donne une bonne visibilité pour ${companyName}. Quelle est la taille de votre équipe ou le budget estimé?`,
    };

    return {
      replyText: budgetResponses[locale] || budgetResponses.en,
      stage: 'QUALIFYING',
      sentiment: 'POSITIVE',
      nextSuggestedStep: 'Qualify budget and team size for architecture scope.',
      isHighIntent: false,
      disposition: CallDisposition.INTERESTED,
    };
  }

  // 3. If demo was already proposed and user says something other than explicit confirmation:
  if (currentStageState === 'MEETING_PROPOSED') {
    const repeatDemoResponses: Record<SupportedLocale, string> = {
      en: `Thanks for that, ${leadName}. To explore how we can support ${companyName} in detail, I'd like to schedule a 20-minute architecture session with our team. Would Tuesday or Thursday afternoon work best for you?`,
      es: `Gracias por esa información, ${leadName}. Para explorar en detalle cómo apoyar a ${companyName}, me gustaría programar una sesión técnica de 20 minutos. ¿Le queda mejor el martes o jueves por la tarde?`,
      de: `Vielen Dank für diese Info, ${leadName}. Um im Detail zu besprechen, wie wir ${companyName} unterstützen können, würde ich gerne eine 20-minütige Demo vereinbaren. Passt Dienstag oder Donnerstag besser?`,
      hi: `जानकारी के लिए धन्यवाद, ${leadName}। ${companyName} के लिए हमारे समाधान को विस्तार से समझने के लिए, हम 20 मिनट का सत्र निर्धारित करना चाहते हैं। क्या मंगलवार या गुरुवार आपके लिए सुविधाजनक रहेगा?`,
      fr: `Merci pour ces informations, ${leadName}. Pour voir en détail comment accompagner ${companyName}, nous aimerions planifier une session de 20 minutes. Le mardi ou jeudi vous conviendrait-il?`,
    };

    return {
      replyText: repeatDemoResponses[locale] || repeatDemoResponses.en,
      stage: 'INTENT_AFFIRMED',
      sentiment: 'POSITIVE',
      nextSuggestedStep: 'Coordinate meeting time with prospect.',
      isHighIntent: true,
      disposition: CallDisposition.INTERESTED,
    };
  }

  // 4. Initial qualification question (when neither timeline nor budget has been asked yet)
  if (matchesKeyword(generalInterestKeywords)) {
    const interestedResponses: Record<SupportedLocale, string> = {
      en: `That sounds fantastic, ${leadName}! We'd love to help ${companyName}. To ensure we tailor the right architecture, what is your target completion timeline for this initiative?`,
      es: `¡Eso suena excelente, ${leadName}! Nos encantaría ayudar a ${companyName}. Para adaptar la arquitectura adecuada, ¿cuál es su plazo objetivo para esta iniciativa?`,
      de: `Das klingt fantastisch, ${leadName}! Wir unterstützen ${companyName} gerne dabei. Was ist Ihr Zieltermin für dieses Vorhaben?`,
      hi: `यह बहुत बढ़िया है, ${leadName}! हम ${companyName} की मदद करने के लिए तत्पर हैं। सही समाधान के लिए, आपकी समय सीमा क्या है?`,
      fr: `C'est fantastique, ${leadName}! Nous serions ravis d'accompagner ${companyName}. Quel est votre calendrier cible pour cette initiative?`,
    };

    return {
      replyText: interestedResponses[locale] || interestedResponses.en,
      stage: 'QUALIFYING',
      sentiment: 'POSITIVE',
      nextSuggestedStep: 'Acknowledge interest & qualify target completion timeline.',
      isHighIntent: false,
      disposition: CallDisposition.INTERESTED,
    };
  }

  const qualifyingResponses: Record<SupportedLocale, string> = {
    en: `Thanks for sharing that, ${leadName}. To ensure we tailor the right architecture for ${companyName}, what is your target completion timeline for this initiative?`,
    es: `Gracias por compartir eso, ${leadName}. Para asegurarnos de adaptar la arquitectura adecuada para ${companyName}, ¿cuál es su plazo objetivo para esta iniciativa?`,
    de: `Vielen Dank für diese Info, ${leadName}. Um die richtige Architektur für ${companyName} zu wählen: Was ist Ihr angestrebter Zeitrahmen für dieses Projekt?`,
    hi: `साझा करने के लिए धन्यवाद, ${leadName}। ${companyName} के लिए सही समाधान तैयार करने के लिए, आपकी समय सीमा क्या है?`,
    fr: `Merci pour ces précisions, ${leadName}. Afin d'adapter au mieux l'architecture pour ${companyName}, quel est votre calendrier cible?`,
  };

  return {
    replyText: qualifyingResponses[locale] || qualifyingResponses.en,
    stage: 'QUALIFYING',
    sentiment: 'POSITIVE',
    nextSuggestedStep: 'Qualify timeline & decision maker involvement.',
    isHighIntent: false,
    disposition: CallDisposition.INTERESTED,
  };
}
