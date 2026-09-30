// Knowledge base powering the 24/7 assistant when the AI key is absent or the
// AI call fails — the bot must answer every mum, every hour of the day.

export type KnowledgeEntry = {
  keywords: string[];
  answer: string;
};

export const CRISIS_RESPONSE =
  "I'm really glad you told me. What you're feeling right now sounds incredibly heavy, and you shouldn't carry it alone. 💛\n\nIf you or your baby are in danger right now, please call **999**.\nFor immediate emotional support, day or night:\n\n• **Samaritans — 116 123** (free, 24/7)\n• **PANDAS Foundation** (prenatal & postnatal depression): 0800 138 9819\n• **Mind — 0300 123 3393**\n\nYou are not failing, and you are not alone. Our volunteer mums on the helpline — **0800 123 4567** — would love to sit with you through this. Please reach out to one of these now. You matter.";

export const FALLBACK_RESPONSE =
  "Thank you for reaching out — a real mum (or our volunteer team) will pick this up. In the meantime:\n\n• 24/7 Helpline: **0800 123 4567**\n• Email: **hello@rashmum.uk**\n• If anyone is unsafe: **999** or Samaritans **116 123**\n\nYou can also ask me about joining, meetups near you, our helpline, mental health support, or volunteering. 💛";

export const KNOWLEDGE_BASE: KnowledgeEntry[] = [
  {
    keywords: ["join", "sign up", "signup", "membership", "member", "register", "start"],
    answer:
      "Joining RashMum UK is free and takes about a minute: scroll to the **Join Community** form on this page, pop in your name, email and city, and we'll match you with mums near you within 24 hours. No fees, no spam, ever. 💛",
  },
  {
    keywords: ["cost", "price", "fee", "free", "charge", "money", "pay", "expensive"],
    answer:
      "Everything at RashMum UK is **100% free** — community support, meetups, the helpline and resources. We're a volunteer-led Community Interest Company funded by grants and kind donations. You'll never be charged or spammed.",
  },
  {
    keywords: ["helpline", "phone", "call", "number", "hotline", "speak to someone", "talk to someone"],
    answer:
      "Our 24/7 volunteer helpline is **0800 123 4567** — free from any UK phone, day and night. Real mums who've been through it answer, no judgement, no scripts. If anyone is in immediate danger, call **999**; for urgent emotional support, Samaritans on **116 123**.",
  },
  {
    keywords: ["meetup", "meet up", "group", "city", "near me", "nearby", "local", "coffee", "park", "where"],
    answer:
      "We run coffee mornings and park walks in **50+ UK cities**, including London, Manchester, Birmingham, Leeds and Bristol. Join the community and we'll match you with a local group within 24 hours — most mums meet their new village in their first week. 💛",
  },
  {
    keywords: ["lonely", "loneliness", "alone", "isolated", "isolation", "no friends"],
    answer:
      "Loneliness in motherhood is so common — and so often hidden. You are not the only one feeling this, even at 3am. Our community has 10,000+ mums across the UK, many of whom joined exactly because they felt alone. The helpline (**0800 123 4567**) is open right now, and joining free gets you matched with mums near you within 24 hours. You deserve a village. 💛",
  },
  {
    keywords: ["depression", "anxious", "anxiety", "postnatal", "prenatal", "ppd", "mental health", "overwhelmed", "struggling", "low", "sad"],
    answer:
      "I hear you — the hard bits of motherhood are real, and asking is a brave first step. RashMum UK offers safe peer spaces and wellbeing tools, and our volunteer counsellors and health visitors can help you find the right support. For urgent help: Samaritans **116 123** (24/7) or PANDAS (prenatal/postnatal depression) **0800 138 9819**. If you or your baby are unsafe, call **999** immediately. You're not failing — you're human. 💛",
  },
  {
    keywords: ["volunteer", "help out", "get involved", "contribute", "midwife", "counsellor"],
    answer:
      "We'd love to have you! RashMum UK runs on volunteers — mums, midwives, health visitors, counsellors, designers and developers. Email **hello@rashmum.uk** or send a message through the contact form and we'll find a role that fits around your family. Even a couple of hours a month makes a difference.",
  },
  {
    keywords: ["privacy", "private", "confidential", "gdpr", "data", "safe", "security"],
    answer:
      "Your privacy matters: everything you share is **confidential and GDPR-compliant**. We never sell data, never spam, and group conversations stay in the group. You control what you share and with whom.",
  },
  {
    keywords: ["sleep", "sleeping", "won't sleep", "night feeds", "waking"],
    answer:
      "Sleep deprivation is one of the hardest parts of motherhood — you're not doing anything wrong. Our resources cover UK-specific sleep guidance by age, and our community groups have nightly check-ins with mums on the same 3am shift. Every baby is different; if you're worried about your baby's health, contact your **health visitor or GP**.",
  },
  {
    keywords: ["feeding", "breastfeed", "breastfeeding", "formula", "bottle", "weaning", "milk"],
    answer:
      "Fed is best — however you feed your baby, you'll find non-judgemental support here. Our resources include UK feeding guides (breast, formula, combination, weaning) and our volunteer midwives answer questions in the community. For medical concerns, always check with your **midwife, health visitor or GP**.",
  },
  {
    keywords: ["benefits", "universal credit", "financial", "money help", "grant", "single mum", "single parent"],
    answer:
      "RashMum UK connects mums with UK-specific benefits guidance — Universal Credit, child benefit, Sure Start Maternity Grant and more — plus a supportive community of single mums who get it. We can point you to trusted local advice services too. You don't have to figure it out alone.",
  },
  {
    keywords: ["hours", "open", "when", "time", "24/7", "night", "3am", "2am"],
    answer:
      "RashMum UK is here **24 hours a day, 7 days a week**: this AI assistant never sleeps, the helpline (**0800 123 4567**) is staffed by volunteer mums day and night, and the community chat is always awake somewhere in the UK. 3am counts. 💛",
  },
  {
    keywords: ["real", "human", "person", "ai", "bot", "robot"],
    answer:
      "I'm RashMum UK's AI assistant — here around the clock so no mum has to wait for an answer. Real volunteer mums run the helpline (**0800 123 4567**) and reply to every contact-form message, usually within 24 hours. You're never talking to a wall here. 💛",
  },
  {
    keywords: ["thank", "thanks", "ta", "lovely", "kind"],
    answer:
      "You're so welcome. 💛 That's what RashMum is here for — anything else you need, I'm awake all night, or our volunteer mums are on **0800 123 4567**.",
  },
];

export function findKnowledgeAnswer(message: string): string | null {
  const text = message.toLowerCase();
  let best: { score: number; answer: string } | null = null;

  for (const entry of KNOWLEDGE_BASE) {
    let score = 0;
    for (const keyword of entry.keywords) {
      if (text.includes(keyword)) score += keyword.length > 4 ? 2 : 1;
    }
    if (score > 0 && (!best || score > best.score)) {
      best = { score, answer: entry.answer };
    }
  }

  return best?.answer ?? null;
}

export function isCrisisMessage(message: string): boolean {
  const text = message.toLowerCase();
  const crisisPatterns = [
    "kill myself",
    "killing myself",
    "suicide",
    "suicidal",
    "end my life",
    "end it all",
    "want to die",
    "want to be dead",
    "don't want to live",
    "dont want to live",
    "no reason to live",
    "not want to live",
    "hurt myself",
    "harm myself",
    "self harm",
    "self-harm",
    "better off without me",
  ];
  return crisisPatterns.some((p) => text.includes(p));
}
