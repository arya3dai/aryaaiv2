import { KnowledgeEntry } from '../types';

/**
 * Normalizes text by converting to lowercase and cleaning up punctuation.
 * Keeps it simple to ensure matches aren't missed.
 */
const normalize = (text: string): string => {
  return text
    .toLowerCase()
    .replace(/[^\w\s]/g, ' ') // Replace punctuation with spaces
    .replace(/\s+/g, ' ')     // Collapse multiple spaces
    .trim();
};

/**
 * Calculates a match score based on keyword presence.
 * Prioritizes exact phrase matches, then word-by-word inclusion.
 */
const calculateScore = (normalizedInput: string, entryKeywords: string[]): number => {
  let maxScore = 0;

  for (const keyword of entryKeywords) {
    const normKeyword = normalize(keyword);
    if (!normKeyword) continue;

    // 0. Exact Strict Match (Highest Priority)
    // If user types "hi" and keyword is "hi", score is massive.
    if (normalizedInput === normKeyword) {
        return 100;
    }

    // 1. Regex Word Boundary Match (High Priority)
    // Matches "hi" in "hi there", but NOT "hi" in "hike".
    const regex = new RegExp(`\\b${normKeyword}\\b`, 'i');
    if (regex.test(normalizedInput)) {
        // Score = 20 + length (longer phrases are more specific)
        const score = 20 + normKeyword.length;
        if (score > maxScore) maxScore = score;
    }
    // 2. Phrase Match (Medium Priority)
    // Matches "pricing" in "what is the pricing".
    else if (normalizedInput.includes(normKeyword)) {
      const score = 10 + normKeyword.length;
      if (score > maxScore) maxScore = score;
    } 
    // 3. Token Intersection (Low Priority)
    // Matches "price subscription" in "subscription price".
    else {
        const keywordTokens = normKeyword.split(' ');
        if (keywordTokens.length > 1) {
            const inputTokens = new Set(normalizedInput.split(' '));
            const allFound = keywordTokens.every(token => inputTokens.has(token));
            
            if (allFound) {
                const score = 5 + normKeyword.length;
                if (score > maxScore) maxScore = score;
            }
        }
    }
  }

  return maxScore;
};

export const findBestResponse = (
  userInput: string, 
  knowledgeBase: KnowledgeEntry[]
): string | null => {
  const normalizedInput = normalize(userInput);
  if (!normalizedInput) return null;

  let bestScore = 0;
  let bestResponse: string | null = null;

  for (const entry of knowledgeBase) {
    const score = calculateScore(normalizedInput, entry.keywords);
    
    // We simply take the highest scoring entry
    if (score > bestScore) {
      bestScore = score;
      bestResponse = entry.response;
    }
  }

  // A score > 0 means we found at least a valid partial match or phrase match.
  return bestScore > 0 ? bestResponse : null;
};

export const DEFAULT_RESPONSES = [
  "I'm not sure I understand. Can you teach me about that in the Training tab?",
  "That's outside my current knowledge. Try adding it to my database!",
  "I don't have a record for that yet. Please rephrase or update my training.",
  "My database doesn't contain a match for that query."
];

export const getRandomDefaultResponse = () => {
  return DEFAULT_RESPONSES[Math.floor(Math.random() * DEFAULT_RESPONSES.length)];
};