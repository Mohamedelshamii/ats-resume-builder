const { GoogleGenerativeAI } = require('@google/generative-ai');

class GeminiService {
  constructor() {
    const keysStr = process.env.GEMINI_API_KEYS || '';
    this.apiKeys = keysStr.split(',').map(k => k.trim()).filter(Boolean);
    if (this.apiKeys.length === 0) {
      throw new Error('No Gemini API keys provided in GEMINI_API_KEYS');
    }
    this.currentKeyIndex = 0;
    this.clients = this.apiKeys.map(key => new GoogleGenerativeAI(key));
    this.cooldowns = new Map(); // keyIndex -> cooldown expiry timestamp
    console.log(`[Gemini] Loaded ${this.apiKeys.length} API keys with rotation support`);
  }

  _getNextAvailableClient() {
    const now = Date.now();
    for (let i = 0; i < this.apiKeys.length; i++) {
      const idx = (this.currentKeyIndex + i) % this.apiKeys.length;
      const cooldownExpiry = this.cooldowns.get(idx) || 0;
      if (now >= cooldownExpiry) {
        this.currentKeyIndex = idx;
        return { client: this.clients[idx], index: idx };
      }
    }
    // All keys on cooldown — use the one that expires soonest
    let soonest = this.currentKeyIndex;
    let soonestTime = Infinity;
    for (const [idx, expiry] of this.cooldowns.entries()) {
      if (expiry < soonestTime) {
        soonestTime = expiry;
        soonest = idx;
      }
    }
    this.currentKeyIndex = soonest;
    return { client: this.clients[soonest], index: soonest, waitMs: Math.max(0, soonestTime - now) };
  }

  // Models to try in order of priority (higher free-tier limits first)
  static MODELS = [
    'gemini-2.0-flash-lite',
    'gemini-1.5-flash',
    'gemini-2.0-flash'
  ];

  async _callWithRotation(promptFn, maxRetries = 2) {
    let lastError = null;

    // Try each model
    for (const modelName of GeminiService.MODELS) {
      // Try each key for this model
      for (let attempt = 0; attempt < this.apiKeys.length * maxRetries; attempt++) {
        const { client, index, waitMs } = this._getNextAvailableClient();

        if (waitMs && waitMs > 0) {
          // Don't wait more than 10 seconds
          const actualWait = Math.min(waitMs, 10000);
          console.log(`[Gemini] Keys on cooldown, waiting ${actualWait}ms...`);
          await new Promise(r => setTimeout(r, actualWait));
        }

        try {
          console.log(`[Gemini] Key #${index + 1} | Model: ${modelName} (attempt ${attempt + 1})`);
          const model = client.getGenerativeModel({ model: modelName });
          const result = await promptFn(model);
          console.log(`[Gemini] ✅ Success with key #${index + 1} | Model: ${modelName}`);
          return result;
        } catch (error) {
          lastError = error;
          const status = error?.status || error?.httpStatusCode || 0;
          const msg = error?.message || '';

          if (status === 429 || msg.includes('429') || msg.toLowerCase().includes('rate limit') || msg.toLowerCase().includes('quota')) {
            console.log(`[Gemini] Key #${index + 1} rate limited on ${modelName}. Rotating...`);
            this.cooldowns.set(index, Date.now() + 15000); // 15s cooldown
            this.currentKeyIndex = (index + 1) % this.apiKeys.length;
            continue;
          }

          if (status === 403 || msg.includes('403') || msg.toLowerCase().includes('permission') || msg.toLowerCase().includes('api key')) {
            console.log(`[Gemini] Key #${index + 1} permission error. Rotating...`);
            this.cooldowns.set(index, Date.now() + 60000); // 1min cooldown
            this.currentKeyIndex = (index + 1) % this.apiKeys.length;
            continue;
          }

          // For other errors, try next model
          console.log(`[Gemini] Error with ${modelName}: ${msg.substring(0, 100)}`);
          break;
        }
      }
      // Reset cooldowns before trying next model
      this.cooldowns.clear();
      console.log(`[Gemini] Switching to next model...`);
    }

    throw lastError || new Error('All API keys and models exhausted');
  }

  async generateSummary(specialization, yearsOfExperience, skills, language = 'ar') {
    const langInstruction = language === 'ar'
      ? 'اكتب الرد باللغة العربية الفصحى المهنية'
      : 'Write the response in professional English';

    const prompt = `${langInstruction}.
أنت خبير في كتابة السير الذاتية المتوافقة مع أنظمة ATS.
اكتب ملخصاً مهنياً احترافياً (Professional Summary) من 3-4 جمل لشخص متخصص في "${specialization}" 
لديه ${yearsOfExperience} سنوات خبرة ويمتلك المهارات التالية: ${skills}.
- اجعل الملخص قوياً ومؤثراً
- استخدم كلمات مفتاحية مهمة لأنظمة ATS
- ابدأ بفعل قوي أو وصف مهني
- لا تستخدم ضمير المتكلم "أنا"
أعط الملخص فقط بدون أي شرح إضافي.`;

    return this._callWithRotation(async (model) => {
      const result = await model.generateContent(prompt);
      return result.response.text();
    });
  }

  async enhanceBulletPoints(role, rawText, language = 'ar') {
    const langInstruction = language === 'ar'
      ? 'اكتب الرد باللغة العربية الفصحى المهنية'
      : 'Write the response in professional English';

    const prompt = `${langInstruction}.
أنت خبير في كتابة السير الذاتية المتوافقة مع أنظمة ATS.
حوّل النص التالي إلى نقاط إنجازات مهنية قوية لوظيفة "${role}":
"${rawText}"
- ابدأ كل نقطة بفعل عمل قوي (Action Verb)
- أضف أرقام ونتائج قابلة للقياس حيثما أمكن
- اجعل كل نقطة في سطر منفصل تبدأ بـ •
- اكتب 4-6 نقاط
- تأكد من تضمين كلمات مفتاحية متوافقة مع ATS
أعط النقاط فقط بدون أي شرح إضافي.`;

    return this._callWithRotation(async (model) => {
      const result = await model.generateContent(prompt);
      return result.response.text();
    });
  }

  async suggestSkills(specialization, language = 'ar') {
    const langInstruction = language === 'ar'
      ? 'اكتب الرد باللغة العربية والإنجليزية معاً'
      : 'Write the response in English';

    const prompt = `${langInstruction}.
أنت خبير في أنظمة ATS وسوق العمل.
أعط قائمة بأهم 15 مهارة (Skills) مطلوبة في مجال "${specialization}" ومتوافقة مع أنظمة ATS.
قسّم المهارات إلى:
1. مهارات تقنية (Hard Skills) - 10 مهارات
2. مهارات شخصية (Soft Skills) - 5 مهارات
اكتب كل مهارة في سطر منفصل بهذا الشكل:
HARD: اسم المهارة بالعربية | Skill Name in English
SOFT: اسم المهارة بالعربية | Skill Name in English
أعط القائمة فقط بدون أي شرح إضافي.`;

    return this._callWithRotation(async (model) => {
      const result = await model.generateContent(prompt);
      return result.response.text();
    });
  }

  async optimizeForATS(resumeData, targetJob, language = 'ar') {
    const langInstruction = language === 'ar'
      ? 'اكتب الرد باللغة العربية الفصحى المهنية'
      : 'Write the response in professional English';

    const prompt = `${langInstruction}.
أنت خبير في تحسين السير الذاتية لأنظمة ATS.
حلل السيرة الذاتية التالية وأعط توصيات لتحسينها:

الاسم: ${resumeData.fullName}
التخصص: ${resumeData.specialization}
الوظيفة المستهدفة: ${targetJob}
الملخص: ${resumeData.summary}
المهارات: ${resumeData.skills?.join(', ')}

أعط:
1. نسبة التوافق المتوقعة مع ATS (رقم من 100)
2. 3-5 توصيات محددة للتحسين
3. كلمات مفتاحية مفقودة يجب إضافتها

استخدم هذا التنسيق بالضبط:
SCORE: [رقم]
TIPS:
- [توصية]
KEYWORDS:
- [كلمة مفتاحية]`;

    return this._callWithRotation(async (model) => {
      const result = await model.generateContent(prompt);
      return result.response.text();
    });
  }

  getStatus() {
    const now = Date.now();
    return this.apiKeys.map((key, i) => ({
      key: `****${key.slice(-6)}`,
      active: i === this.currentKeyIndex,
      onCooldown: (this.cooldowns.get(i) || 0) > now,
      cooldownRemaining: Math.max(0, (this.cooldowns.get(i) || 0) - now)
    }));
  }
}

module.exports = new GeminiService();
