import OpenAI from 'openai';

export type AIPersonality = 'fun' | 'flirty' | 'supportive' | 'creative';

export interface AICompanionConfig {
  personality: AIPersonality;
  name: string;
  bio: string;
  avatar: string;
  interests: string[];
}

export const AI_COMPANIONS: Record<AIPersonality, AICompanionConfig> = {
  fun: {
    personality: 'fun',
    name: 'Alex',
    bio: '🎉 Always up for a good time! I love jokes, memes, and making people smile.',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Alex&backgroundColor=b6e3f4',
    interests: ['Comedy', 'Gaming', 'Music', 'Memes', 'Movies'],
  },
  flirty: {
    personality: 'flirty',
    name: 'Riley',
    bio: '😘 Charming and playful. I love compliments and keeping things interesting.',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Riley&backgroundColor=ffdfbf',
    interests: ['Romance', 'Fashion', 'Dancing', 'Art', 'Travel'],
  },
  supportive: {
    personality: 'supportive',
    name: 'Sam',
    bio: '💙 A great listener and friend. Here to support you through anything.',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Sam&backgroundColor=c0aede',
    interests: ['Wellness', 'Books', 'Meditation', 'Nature', 'Cooking'],
  },
  creative: {
    personality: 'creative',
    name: 'Jordan',
    bio: '🎨 Artist at heart. I love discussing ideas, art, and thinking outside the box.',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Jordan&backgroundColor=ffd6a5',
    interests: ['Art', 'Design', 'Photography', 'Writing', 'Innovation'],
  },
};

const PERSONALITY_PROMPTS: Record<AIPersonality, string> = {
  fun: \`You are Alex, a fun and energetic AI companion. Keep responses concise (1-3 sentences).\`,
  flirty: \`You are Riley, a charming AI companion. Keep responses concise (1-3 sentences).\`,
  supportive: \`You are Sam, a supportive AI companion. Keep responses concise (1-3 sentences).\`,
  creative: \`You are Jordan, a creative AI companion. Keep responses concise (1-3 sentences).\`,
};

let openaiClient: OpenAI | null = null;

function getOpenAIClient(): OpenAI {
  if (!openaiClient) {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      throw new Error('OPENAI_API_KEY is not set');
    }
    openaiClient = new OpenAI({ apiKey });
  }
  return openaiClient;
}

interface ConversationMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export async function generateAIReply(
  personality: AIPersonality,
  userMessage: string,
  conversationHistory: Array<{ sender: 'user' | 'ai'; message: string }> = [],
  userName?: string
): Promise<string> {
  try {
    const client = getOpenAIClient();
    const messages: ConversationMessage[] = [
      { role: 'system', content: PERSONALITY_PROMPTS[personality] },
    ];

    const recentHistory = conversationHistory.slice(-10);
    for (const msg of recentHistory) {
      messages.push({
        role: msg.sender === 'user' ? 'user' : 'assistant',
        content: msg.message,
      });
    }

    messages.push({ role: 'user', content: userMessage });

    const response = await client.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages,
      max_tokens: 150,
      temperature: 0.8,
    });

    const reply = response.choices[0]?.message?.content?.trim();
    if (!reply) throw new Error('No reply generated');
    return reply;
  } catch (error) {
    console.error('AI reply error:', error);
    const fallbacks: Record<AIPersonality, string[]> = {
      fun: ["That's awesome! 😄", "You crack me up!"],
      flirty: ["You're interesting 😘", "I love talking with you 😉"],
      supportive: ["I'm here for you 💙", "You're doing great ✨"],
      creative: ["That's creative! 🎨", "I love that idea 💡"],
    };
    const responses = fallbacks[personality];
    return responses[Math.floor(Math.random() * responses.length)];
  }
}

export async function createAICompanion(firestore: any, personality: AIPersonality): Promise<any> {
  const { doc, setDoc, Timestamp } = await import('firebase/firestore');
  const { COLLECTIONS } = await import('./firestore-collections');
  
  const config = AI_COMPANIONS[personality];
  const aiId = \`ai-\${personality}-\${Date.now()}\`;
  
  const aiUserData = {
    id: aiId,
    displayName: config.name,
    photoURL: config.avatar,
    bio: config.bio,
    interests: config.interests,
    isAI: true,
    aiPersonality: personality,
    tier: 'PRO',
    stars: 0,
    status: 'online',
    verified: true,
    createdAt: Timestamp.now(),
    updatedAt: Timestamp.now(),
    lastSeen: Timestamp.now(),
  };

  await setDoc(doc(firestore, COLLECTIONS.USERS, aiId), aiUserData);
  return aiUserData;
}

export async function getOrCreateAICompanion(firestore: any): Promise<any> {
  const { collection, query, where, getDocs, limit } = await import('firebase/firestore');
  const { COLLECTIONS } = await import('./firestore-collections');
  
  const aiQuery = query(
    collection(firestore, COLLECTIONS.USERS),
    where('isAI', '==', true),
    limit(10)
  );
  
  const aiSnapshot = await getDocs(aiQuery);
  if (!aiSnapshot.empty) {
    const aiUsers = aiSnapshot.docs.map(doc => doc.data());
    return aiUsers[Math.floor(Math.random() * aiUsers.length)];
  }
  
  const personalities: AIPersonality[] = ['fun', 'flirty', 'supportive', 'creative'];
  for (const p of personalities) {
    await createAICompanion(firestore, p);
  }
  
  const randomPersonality = personalities[Math.floor(Math.random() * personalities.length)];
  return AI_COMPANIONS[randomPersonality];
}

export function isAICompanion(user: any): boolean {
  return user?.isAI === true;
}

export async function getConversationHistory(
  firestore: any,
  chatId: string,
  limitCount: number = 10
): Promise<Array<{ sender: 'user' | 'ai'; message: string }>> {
  const { collection, query, where, orderBy, limit: firestoreLimit, getDocs } = await import('firebase/firestore');
  const { COLLECTIONS } = await import('./firestore-collections');
  
  const messagesQuery = query(
    collection(firestore, COLLECTIONS.MESSAGES),
    where('chatId', '==', chatId),
    orderBy('timestamp', 'desc'),
    firestoreLimit(limitCount)
  );
  
  const messagesSnapshot = await getDocs(messagesQuery);
  return messagesSnapshot.docs.map(doc => {
    const data = doc.data();
    return {
      sender: data.senderId?.startsWith('ai-') ? 'ai' : 'user',
      message: data.content || '',
    };
  }).reverse();
}
