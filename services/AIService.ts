import OpenAI from 'openai';

// Initialize OpenAI client - will fallback to mock if API key is not available
let openai: OpenAI | null = null;

try {
  // Only initialize if we have a valid API key
  const apiKey = process.env.EXPO_PUBLIC_OPENAI_API_KEY;
  if (apiKey && apiKey.startsWith('sk-')) {
    openai = new OpenAI({
      apiKey: apiKey,
      dangerouslyAllowBrowser: true
    });
  }
} catch (error) {
  console.log('OpenAI not available, using mock responses');
}

class AIServiceClass {
  async processInteraction(inputText: string) {
    try {
      // Check if OpenAI is available
      if (!openai) {
        console.log('OpenAI not configured, using mock processing');
        return this.mockGPTResponse(inputText);
      }

      // Use ChatGPT 3.5-turbo to process the interaction
      const completion = await openai.chat.completions.create({
        model: "gpt-3.5-turbo",
        messages: [
          {
            role: "system",
            content: `You are an expert AI assistant that extracts comprehensive structured information from natural language descriptions of social interactions. You excel at identifying names, relationships, personal details, preferences, and family information with high accuracy.

🚨 CRITICAL NAME EXTRACTION RULE - NEVER VIOLATE THIS:
You MUST extract names EXACTLY as they appear in the input text. DO NOT autocorrect, simplify, or change spellings.
- If input says "Sarah", you MUST return "Sarah" (NOT "Sara")
- If input says "Michael", you MUST return "Michael" (NOT "Mike") 
- If input says "Katherine", you MUST return "Katherine" (NOT "Kate")
VIOLATION OF THIS RULE IS A CRITICAL ERROR. Always preserve exact spelling.

CRITICAL RULES:
1. NAME EXTRACTION: Identify the correct person's name by looking for:
   - Names after interaction verbs: "met Sarah", "talked to Mike", "saw Jennifer"
   - Names in possessive contexts: "Sarah's birthday", "Mike's job"
   - Names with descriptors: "Sarah who works at", "Mike the engineer"
   - Look for proper nouns that are clearly person names
   - NEVER use time references, locations, activities, or descriptive words as names
   - If text says "Me and [Name]" or "I and [Name]", extract [Name]
   - 🚨 ULTRA-CRITICAL: Extract the EXACT spelling of the name - if input says "Sarah", return "Sarah", NOT "Sara"
   - Do not abbreviate, truncate, or modify names in any way
   - Ignore words like "yesterday", "today", "tomorrow", "bar", "restaurant", etc.

2. RELATIONSHIP MAPPING: Determine relationship from context clues:
   - Family: mom, dad, sister, brother, cousin, aunt, uncle, grandmother, grandfather, family
   - Friend: friend, buddy, pal, bestie, close friend, old friend
   - Partner: boyfriend, girlfriend, husband, wife, partner, spouse, significant other
   - Coworker: coworker, colleague, boss, manager, teammate, work friend
   - Neighbor: neighbor, lives next door, down the street
   - Acquaintance: just met, new person, someone I know

3. COMPREHENSIVE EXTRACTION: Extract ALL available information including:
   - Personal details (age, job, contact info)
   - Family information (kids, siblings, parents)
   - Preferences (likes, dislikes, hobbies, interests)
   - Physical descriptions and personality traits
   - Life events and important dates

4. SMART PARSING: Handle conversational, messy input gracefully
5. CONTEXT AWARENESS: Use surrounding context to disambiguate unclear information

CRITICAL FIELD MAPPING RULES:
- "name": ONLY the person's actual name (e.g., "Sarah", "Mike", "Jennifer")
- "age": ONLY if explicitly mentioned as a number (e.g., "she's 25", "35 years old"). Return null if not mentioned.
- "job": ONLY if occupation is mentioned (e.g., "engineer", "teacher", "doctor"). Return empty string if not mentioned.
- "tags": Descriptive words about the person (e.g., ["social", "parent", "outgoing"]), NOT the entire input text
- "notes": The full context for reference, but other fields should contain ONLY the specific extracted information

Extract information and return it as a JSON object in this exact format:

{
  "name": "string (REQUIRED - the actual person's name, NOT time references)",
  "relationship": "string (family/friend/partner/coworker/neighbor/acquaintance)",
  "age": "number or null (ONLY if age is explicitly mentioned as a number, otherwise null)",
  "phone": "string (phone number if mentioned)",
  "email": "string (email if mentioned)",
  "job": "string (occupation/work if mentioned, empty string if not mentioned)",
  "kids": ["array of children names/descriptions if mentioned"],
  "siblings": ["array of sibling names/descriptions if mentioned"],
  "likes": ["array of things they like/enjoy"],
  "dislikes": ["array of things they dislike/avoid"],
  "tags": ["array of personality traits, descriptors, or categories - NOT the input text"],
  "interests": ["array of hobbies/interests mentioned"],
  "notes": "string (any additional context, quotes, or details that don't fit other fields)",
  "suggestedReminder": {
    "title": "string (suggested reminder title)",
    "description": "string (suggested reminder description)",
    "type": "string (general/health/celebration/career/life_event)",
    "suggestedDays": "number (days from now to schedule)"
  }
}

EXAMPLES:

Input: "Me and Sarah met yesterday at the bar. She likes twisted shots and margaritas. Has 2 kids, 0 siblings. Phone number is 111-222-3333."
🚨 CRITICAL: The name is "Sarah" - you MUST return "Sarah" exactly, NOT "Sara"
Output: {
  "name": "Sarah",
  "relationship": "acquaintance",
  "age": null,
  "phone": "111-222-3333",
  "email": null,
  "job": null,
  "kids": ["child 1", "child 2"],
  "siblings": [],
  "likes": ["twisted shots", "margaritas"],
  "dislikes": [],
  "tags": ["parent", "social"],
  "interests": ["drinks", "nightlife"],
  "notes": "Met at bar yesterday. Enjoys going out for drinks.",
  "suggestedReminder": {
    "title": "Follow up with Sarah",
    "description": "Check in and see how she's doing with the kids",
    "type": "general",
    "suggestedDays": 7
  }
}

Input: "My coworker Mike got promoted to senior engineer. He's around 35, married with twin boys, loves craft beer and hates meetings. His wife is a teacher."
Output: {
  "name": "Mike",
  "relationship": "coworker",
  "age": 35,
  "phone": "",
  "email": "",
  "job": "senior engineer",
  "kids": ["twin boys"],
  "siblings": [],
  "likes": ["craft beer"],
  "dislikes": ["meetings"],
  "tags": ["promoted", "married", "father", "engineer"],
  "interests": ["craft beer"],
  "notes": "Just got promoted to senior engineer. Wife is a teacher. Has twin boys.",
  "suggestedReminder": {
    "title": "Congratulate Mike on promotion",
    "description": "Follow up on his new role and see how he's settling in",
    "type": "career",
    "suggestedDays": 3
  }
}

CRITICAL: Always extract the actual person's name from the text. For "Me and Sarah met yesterday", the name is "Sarah". Never use "yesterday", "today", "tomorrow", locations, or activities as names. Map information to the most appropriate fields and put any remaining context in notes. Always suggest an appropriate reminder based on the context.`
          },
          {
            role: "user",
            content: inputText
          }
        ],
        temperature: 0.1,
        max_tokens: 1000
      });

      const response = completion.choices[0]?.message?.content;
      if (!response) {
        throw new Error('No response from OpenAI');
      }

      // Parse the JSON response
      const parsedResponse = JSON.parse(response);
      
      // Convert to the format expected by the app
      const profile = {
        name: parsedResponse.name || 'Unknown Person',
        age: parsedResponse.age > 0 ? parsedResponse.age : null,
        phone: parsedResponse.phone || null,
        email: parsedResponse.email || null,
        relationship: parsedResponse.relationship || 'acquaintance',
        job: parsedResponse.job || null,
        notes: parsedResponse.notes || null,
        kids: parsedResponse.kids || [],
        siblings: parsedResponse.siblings || [],
        likes: parsedResponse.likes || [],
        dislikes: parsedResponse.dislikes || [],
        tags: parsedResponse.tags || [],
        interests: parsedResponse.interests || [],
        lastContactDate: new Date().toISOString(),
        isNew: true
      };

      return {
        profile,
        suggestedReminder: parsedResponse.suggestedReminder || null,
        sentiment: this.analyzeSentiment(inputText),
        confidence: 0.95
      };
    } catch (error) {
      console.error('Error processing with OpenAI:', error);
      
      // Fallback to mock processing if API fails
      return this.mockGPTResponse(inputText);
    }
  }

  async processReminderResponse(inputText: string, context: any) {
    try {
      if (!openai) {
        return this.mockReminderResponse(inputText, context);
      }

      const completion = await openai.chat.completions.create({
        model: "gpt-3.5-turbo",
        messages: [
          {
            role: "system",
            content: `You are an AI assistant helping users manage reminders. The user is responding to a reminder suggestion with natural language.

CONTEXT: The user was suggested a reminder and is now responding naturally with their preferences.

Your job is to:
1. Parse their response to understand what they want
2. Extract specific dates/times if mentioned
3. Determine if they want to create the reminder or not
4. Handle complex natural language like "set it for next Thursday at 4pm" or "yes that works perfect"
5. Return structured data for reminder creation

Return JSON in this format:
{
  "action": "create" | "cancel" | "clarify",
  "title": "string (reminder title)",
  "description": "string (reminder description)", 
  "type": "string (general/health/celebration/career/life_event)",
  "scheduledFor": "ISO date string or null",
  "response": "string (conversational response to user)"
}

Examples:
User Input: "yes that works perfect"
Output: {
  "action": "create",
  "title": "Follow up with Sarah",
  "description": "Check in and see how she's doing",
  "type": "general", 
  "scheduledFor": "2024-08-08T12:00:00.000Z",
  "response": "Perfect! I'll create a reminder to follow up with Sarah for next week."
}

User Input: "nah lets schedule it for next thursday at 4pm"
Output: {
  "action": "create",
  "title": "Follow up with Sarah", 
  "description": "Check in and see how she's doing",
  "type": "general",
  "scheduledFor": "2024-08-15T16:00:00.000Z",
  "response": "Got it! I'll set the reminder for next Thursday at 4pm instead."
}

User Input: "no thats okay"
Output: {
  "action": "cancel",
  "title": null,
  "description": null,
  "type": null,
  "scheduledFor": null,
  "response": "No problem! I won't create a reminder for this contact."
}

User Input: "yes but make it for tomorrow at 3pm"
Output: {
  "action": "create",
  "title": "Follow up with Sarah",
  "description": "Check in and see how she's doing", 
  "type": "general",
  "scheduledFor": "2024-08-02T15:00:00.000Z",
  "response": "Great! I'll create the reminder for tomorrow at 3pm instead."
}

User Input: "sure but change it to a celebration reminder"
Output: {
  "action": "create",
  "title": "Follow up with Sarah",
  "description": "Check in and see how she's doing",
  "type": "celebration", 
  "scheduledFor": "2024-08-08T12:00:00.000Z",
  "response": "Perfect! I'll create a celebration reminder for next week."
}
Handle natural language time expressions like:
- "tomorrow", "next week", "next Thursday", "in 3 days"
- "at 4pm", "at 2:30", "in the morning", "this evening"
- "yes", "sure", "that works", "sounds good" (use suggested timing)
- "no", "nah", "not now", "maybe later" (cancel)
- "yes but...", "sure but...", "that works but..." (modify the suggestion)

Always be conversational and confirm the user's intent clearly.`
          },
          {
            role: "user",
            content: `Context: ${JSON.stringify(context)}\n\nUser response: ${inputText}`
          }
        ],
        temperature: 0.1,
        max_tokens: 500
      });

      const response = completion.choices[0]?.message?.content;
      if (!response) {
        throw new Error('No response from OpenAI');
      }

      return JSON.parse(response);
    } catch (error) {
      console.error('Error processing reminder response:', error);
      return this.mockReminderResponse(inputText, context);
    }
  }

  private mockReminderResponse(inputText: string, context: any) {
    const lowerText = inputText.toLowerCase();
    
    if (lowerText.includes('no') || lowerText.includes('cancel') || lowerText.includes('don\'t')) {
      return {
        action: 'cancel',
        title: null,
        description: null,
        type: null,
        scheduledFor: null,
        response: "No problem! I won't create a reminder for this contact."
      };
    }
    
    // Default to creating the reminder
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    return {
      action: 'create',
      title: context.suggestedReminder?.title || 'Follow up',
      description: context.suggestedReminder?.description || 'Check in',
      type: context.suggestedReminder?.type || 'general',
      scheduledFor: tomorrow.toISOString(),
      response: "I'll create that reminder for you!"
    };
  }

  private mockGPTResponse(inputText: string) {
    // Keep the existing mock implementation as fallback
    const extractedData = this.extractInformation(inputText);
    
    return {
      profile: extractedData,
      suggestedReminder: {
        title: `Follow up with ${extractedData.name}`,
        description: 'Check in and maintain connection',
        type: 'general',
        suggestedDays: 7
      },
      sentiment: this.analyzeSentiment(inputText),
      confidence: 0.85
    };
  }

  private extractInformation(text: string) {
    const lowerText = text.toLowerCase();
    
    // Extract name with comprehensive pattern matching
    let name = 'Unknown Person';
    const namePatterns = [
      // Primary patterns - most reliable
      /(?:met|talked to|saw|bumped into|spoke with|chatted with|ran into)\s+([A-Z][a-z]+(?:[a-z]*))(?!\s+(?:yesterday|today|tomorrow|last|this|morning|afternoon|evening|night))/i,
      /(?:me and|I and)\s+([A-Z][a-z]+(?:[a-z]*))(?!\s+(?:went|met|saw|talked))/i,
      /(?:my|our)\s+(?:friend|coworker|colleague|neighbor|sister|brother|cousin|mom|dad|mother|father)\s+([A-Z][a-z]+(?:[a-z]*?))/i,
      
      // Secondary patterns - contextual
      /([A-Z][a-z]+(?:[a-z]*))\s+(?:is|was|has|works|got|just|recently|who)/i,
      /([A-Z][a-z]+(?:[a-z]*?))'s\s+(?:birthday|job|house|car|phone|email)/i,
      /with\s+([A-Z][a-z]+(?:[a-z]*))(?!\s+(?:yesterday|today|tomorrow|last|this|morning|afternoon|evening|night|me|us|them))/i,
      
      // Fallback patterns - less reliable
      /\b([A-Z][a-z]{2,}(?:[a-z]*))(?!\s+(?:yesterday|today|tomorrow|last|this|morning|afternoon|evening|night|street|avenue|road|drive|way|place|city|state|country|university|college|school|company|inc|llc|corp))\b/
    ];
    
    // Comprehensive exclusion list
    const excludeWords = [
      // Time references
      'yesterday', 'today', 'tomorrow', 'morning', 'afternoon', 'evening', 'night', 'last', 'this', 'next', 'week', 'month', 'year',
      // Locations
      'street', 'avenue', 'road', 'drive', 'way', 'place', 'city', 'state', 'country', 'home', 'house', 'office', 'work', 'school',
      // Organizations
      'university', 'college', 'company', 'corporation', 'inc', 'llc', 'corp', 'ltd',
      // Common words
      'phone', 'email', 'number', 'address', 'birthday', 'party', 'meeting', 'lunch', 'dinner', 'coffee', 'bar', 'restaurant'
    ];
    
    for (const pattern of namePatterns) {
      const match = text.match(pattern);
      if (match && match[1] && !excludeWords.includes(match[1].toLowerCase()) && match[1].length > 1) {
        name = match[1];
        break;
      }
    }
    
    // Extract age with multiple patterns
    const ageMatch = text.match(/(?:she's|he's|they're|is)\s+(?:about|around|probably)?\s*(\d+)/i) || 
                    text.match(/(\d+)\s+years?\s+old/i) || 
                    text.match(/(\d+)ish/i) ||
                    text.match(/age\s+(\d+)/i) ||
                    text.match(/around\s+(\d+)/i);
    const age = ageMatch && parseInt(ageMatch[1]) < 120 ? parseInt(ageMatch[1]) : null;
    
    // Extract job/profession with comprehensive patterns
    let job = null;
    const jobPatterns = [
      /works?\s+(?:as\s+)?(?:a\s+)?([a-z\s]+?)(?:\s+at|\s+for|\.|,|$)/i,
      /(?:job|profession|career|work)\s+(?:as\s+)?(?:a\s+)?([a-z\s]+?)(?:\s+at|\s+for|\.|,|$)/i,
      /(?:is\s+)?(?:a\s+)?([a-z\s]+?)(?:\s+at\s+[A-Z])/i,
      /promoted\s+to\s+([a-z\s]+?)(?:\s+at|\s+for|\.|,|$)/i
    ];
    
    for (const pattern of jobPatterns) {
      const match = text.match(pattern);
      if (match && match[1]) {
        job = match[1].trim();
        break;
      }
    }
    
    // Extract phone number
    const phoneMatch = text.match(/(?:phone|number|call|text)(?:\s+is|\s+:)?\s*([\d\-\(\)\s\.]{10,})/i) ||
                      text.match(/([\d\-\(\)\s\.]{10,})/);
    const phone = phoneMatch ? phoneMatch[1].replace(/[^\d\-\(\)]/g, '') : null;
    
    // Extract email
    const emailMatch = text.match(/([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/);
    const email = emailMatch ? emailMatch[1] : null;
    
    // Extract relationship type with comprehensive mapping
    let relationship = 'acquaintance'; // default
    const familyWords = ['cousin', 'family', 'brother', 'sister', 'mom', 'dad', 'mother', 'father', 'aunt', 'uncle', 'grandmother', 'grandfather', 'grandma', 'grandpa', 'nephew', 'niece'];
    const friendWords = ['friend', 'buddy', 'pal', 'bestie', 'close friend', 'old friend'];
    const partnerWords = ['boyfriend', 'girlfriend', 'husband', 'wife', 'partner', 'spouse', 'significant other', 'fiancé', 'fiancée'];
    const coworkerWords = ['coworker', 'colleague', 'boss', 'manager', 'teammate', 'work friend', 'supervisor'];
    const neighborWords = ['neighbor', 'lives next door', 'down the street', 'in the building'];
    
    if (familyWords.some(word => lowerText.includes(word))) {
      relationship = 'family';
    } else if (partnerWords.some(word => lowerText.includes(word))) {
      relationship = 'partner';
    } else if (coworkerWords.some(word => lowerText.includes(word))) {
      relationship = 'coworker';
    } else if (neighborWords.some(word => lowerText.includes(word))) {
      relationship = 'neighbor';
    } else if (friendWords.some(word => lowerText.includes(word))) {
      relationship = 'friend';
    }
    
    // Extract kids/children
    const kids = [];
    const kidPatterns = [
      /(?:has|have)\s+(\d+)\s+(?:kids?|children)/i,
      /(?:kids?|children)(?:\s+named)?\s+([A-Z][a-z]+(?:\s+and\s+[A-Z][a-z]+)*)/i,
      /(?:son|daughter)\s+([A-Z][a-z]+)/i,
      /(?:twin|twins)\s+(?:boys?|girls?)\s*(?:named)?\s*([A-Z][a-z]+(?:\s+and\s+[A-Z][a-z]+)*)?/i
    ];
    
    for (const pattern of kidPatterns) {
      const match = text.match(pattern);
      if (match) {
        if (match[1] && isNaN(parseInt(match[1]))) {
          // Names found
          const names = match[1].split(/\s+and\s+/);
          kids.push(...names);
        } else if (match[1] && !isNaN(parseInt(match[1]))) {
          // Number found
          const count = parseInt(match[1]);
          for (let i = 0; i < count; i++) {
            kids.push(`child ${i + 1}`);
          }
        }
      }
    }
    
    // Extract siblings
    const siblings = [];
    const siblingPatterns = [
      /(?:brother|sister)\s+([A-Z][a-z]+)/i,
      /(?:has|have)\s+(\d+)\s+(?:brothers?|sisters?|siblings?)/i,
      /(?:siblings?)\s+(?:named)?\s+([A-Z][a-z]+(?:\s+and\s+[A-Z][a-z]+)*)/i
    ];
    
    for (const pattern of siblingPatterns) {
      const match = text.match(pattern);
      if (match) {
        if (match[1] && isNaN(parseInt(match[1]))) {
          const names = match[1].split(/\s+and\s+/);
          siblings.push(...names);
        }
      }
    }
    
    // Extract likes
    const likes = [];
    const likePatterns = [
      /(?:likes?|loves?|enjoys?|into)\s+([a-z\s,]+?)(?:\s+and\s+(?:hates?|dislikes?)|\.|\,|$)/i,
      /(?:favorite|fav)\s+(?:thing|food|drink|activity|hobby)\s+is\s+([a-z\s]+)/i
    ];
    
    for (const pattern of likePatterns) {
      const match = text.match(pattern);
      if (match && match[1]) {
        const items = match[1].split(/,|\s+and\s+/).map(item => item.trim()).filter(item => item.length > 0);
        likes.push(...items);
      }
    }
    
    // Extract dislikes
    const dislikes = [];
    const dislikePatterns = [
      /(?:hates?|dislikes?|can't stand|doesn't like)\s+([a-z\s,]+?)(?:\.|\,|$)/i,
      /(?:not a fan of|not into)\s+([a-z\s]+)/i
    ];
    
    for (const pattern of dislikePatterns) {
      const match = text.match(pattern);
      if (match && match[1]) {
        const items = match[1].split(/,|\s+and\s+/).map(item => item.trim()).filter(item => item.length > 0);
        dislikes.push(...items);
      }
    }
    
    // Extract interests/hobbies (broader than likes)
    const interests = [];
    const interestKeywords = [
      'gardening', 'design', 'music', 'sports', 'reading', 'cooking', 'travel', 'photography', 
      'hiking', 'yoga', 'gaming', 'art', 'dancing', 'swimming', 'running', 'cycling',
      'movies', 'theater', 'concerts', 'festivals', 'volunteering', 'crafts'
    ];
    
    interestKeywords.forEach(keyword => {
      if (lowerText.includes(keyword)) {
        interests.push(keyword);
      }
    });
    
    // Generate tags based on extracted information
    const tags = [];
    if (kids.length > 0) tags.push('parent');
    if (likes.length > 0) tags.push('social');
    if (lowerText.includes('bar') || lowerText.includes('drinks')) tags.push('social');
    if (job) tags.push('professional');
    
    // Don't add the entire input text as a tag
    const filteredTags = tags.filter(tag => tag.length < 20 && !tag.includes('met') && !tag.includes('yesterday'));
    
    return {
      name,
      age,
      phone,
      email,
      job,
      relationship,
      kids,
      siblings,
      likes,
      dislikes,
      tags: filteredTags,
      interests,
      notes: text,
      lastContactDate: new Date().toISOString(),
      isNew: true
    };
  }

  private analyzeSentiment(text: string) {
    const positiveWords = ['happy', 'excited', 'great', 'wonderful', 'amazing', 'good', 'love', 'enjoy', 'fantastic', 'awesome'];
    const negativeWords = ['sad', 'upset', 'difficult', 'hard', 'worried', 'stressed', 'surgery', 'problem', 'trouble', 'sick'];
    
    const lowerText = text.toLowerCase();
    const positiveCount = positiveWords.filter(word => lowerText.includes(word)).length;
    const negativeCount = negativeWords.filter(word => lowerText.includes(word)).length;
    
    if (positiveCount > negativeCount) return 'positive';
    if (negativeCount > positiveCount) return 'negative';
    return 'neutral';
  }
}

export const AIService = new AIServiceClass();