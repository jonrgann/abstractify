import { google } from '@ai-sdk/google';
import { generateText, Output} from 'ai';
import z from 'zod';

export const subdivisionAgent = async (input: string, list: string[]) =>{

    const filteredInput = input.toLowerCase().replace(/phase/g, '')
    .replace(/subdivision/g, '')
    .replace(/addition/g, '')
    .replace(/\s+/g, ' ')
    .trim();

    const filteredMatches = findPrefixMatches(filteredInput, list).map((match) => match.item);

    let subdivisionList: string[] = findBestMatches(filteredInput, filteredMatches).map((match) => match.text);
    // let subdivisionList: string[] = searchSubdivisions(input);
    // let validatedSubdivision: string | null = null;

    const result = await generateText({
      model: google('gemini-2.5-flash'),
      system: `You are an AI autocomplete selection tool for selecting the best autocomplete suggestion from a list of options. 
      You will receive a legal description that contains a subdivision or addition name and must locate the best match from the available options that passes validation.

            # Instructions
            1. Analyze and Match Results
                - Review all returned subdivision options from the autocomplete list
                - Compare each option against the original input using these criteria:
                - Exact name matches (highest priority)
                - Partial name matches with similar core elements
                - Geographic proximity indicators (city, county, state references)
                - Consider the abbreviations of cities. For example 'City of Rogers' as (RG). City of Bentonville as (BV) etc.
                - Consider abbreviations for words like 'ADDITION' as 'ADD' and 'SUBDIVISION' as 'SUB'.
                - Similar naming patterns or themes
            
            2. Select Best Match
                - Select the subdivision option that most closely matches the original input
                - Be sure to make note of PHASES sometimes listed as roman numerals.
                - Prioritize exact matches over partial matches
                - If multiple similar options exist, select based on:
                - Completeness of name match`,
      prompt: `
      <input>: ${input}</input>
      <list>${JSON.stringify(subdivisionList)}</list>`,
      experimental_output: Output.object({
          schema:z.object({
                bestMatch: z.string()
              })
        }
      ),
      // providerOptions: {
      //     google: {
      //       thinkingConfig: {
      //         thinkingBudget: 2048,
      //         includeThoughts: true
      //       }
      //     }
      // },
  })

  const output = JSON.parse(result.text);
  const normalizedBestMatch = findMatchIgnoringSpaces(output.bestMatch, subdivisionList);
  return normalizedBestMatch;
}


interface PrefixMatchResult {
    item: string;
    matchedPrefixes: string[];
}
  
function findPrefixMatches(textInput: string, subdivisionList: string[]): PrefixMatchResult[] {
    // Extract words from input text and get first 3 characters of each
    const words = textInput.trim().split(/\s+/);
    const inputPrefixes = words
        .map(word => word.replace(/[^a-zA-Z0-9]/g, '')) // Remove special characters
        .filter(word => word.length > 0) // Filter out empty strings
        .map(word => word.substring(0, 3).toUpperCase()); // Get first 3 chars, uppercase
  
    if (inputPrefixes.length === 0) {
        return [];
    }
  
    const matches: PrefixMatchResult[] = [];
  
    // Check each item in the subdivision list
    subdivisionList.forEach(item => {
        // Extract words from the subdivision item
        const itemWords = item.split(/\s+/);
        const itemPrefixes = itemWords
            .map(word => word.replace(/[^a-zA-Z0-9]/g, '')) // Remove special characters
            .filter(word => word.length > 0) // Filter out empty strings
            .map(word => word.substring(0, 3).toUpperCase()); // Get first 3 chars, uppercase
  
        // Find which input prefixes match any of the item prefixes
        const matchedPrefixes = inputPrefixes.filter(inputPrefix => 
            itemPrefixes.includes(inputPrefix)
        );
  
        // If any matches found, add to results
        if (matchedPrefixes.length > 0) {
            matches.push({
                item,
                matchedPrefixes: [...new Set(matchedPrefixes)] // Remove duplicates
            });
        }
    });
  
    return matches;
}

function findMatchIgnoringSpaces(inputString: string, stringArray: string[]) {
    if (!inputString || !stringArray || !Array.isArray(stringArray)) {
      return null;
    }
    
    const normalizedInput = inputString.replace(/\s+/g, ' ').trim().toLowerCase();
    const inputWords = normalizedInput.split(' ');
    
    let matches: string[] = [];
    
    for (const arrayString of stringArray) {
      if (!arrayString) continue;
      
      const normalizedArrayString = arrayString.replace(/\s+/g, ' ').trim().toLowerCase();
      
      const allWordsFound = inputWords.every(word => 
        normalizedArrayString.includes(word)
      );
      
      if (allWordsFound) {
        matches.push(arrayString);
      }
    }
    
    // Return the shortest match (most specific)
    return matches.length > 0 
      ? matches.reduce((shortest, current) => 
          current.length < shortest.length ? current : shortest
        )
      : null;
}

interface MatchResult {
    text: string;
    score: number;
    matchedTokens: string[];
}
  
function findBestMatches(input: string, candidates: string[], maxResults: number = 100): MatchResult[] {
    // Normalize text by removing common prefixes/suffixes and converting to lowercase
    function normalizeText(text: string): string {
      return text
        .toLowerCase()
        .replace(/\b(first|second|third|fourth|fifth|revision|of|the|to|city|add|addition|sub|subdivision)\b/g, '')
        .replace(/\s+/g, ' ')
        .trim();
    }
  
    // Extract meaningful tokens from text
    function extractTokens(text: string): string[] {
      return normalizeText(text)
        .split(/\s+/)
        .filter(token => token.length > 1) // Filter out single characters
        .filter(token => !/^\d+$/.test(token)) // Filter out standalone numbers
        .filter(token => !/^[a-z]$/.test(token)); // Filter out single letters
    }
  
    // Calculate similarity score between two sets of tokens
    function calculateScore(inputTokens: string[], candidateTokens: string[], originalCandidate: string): number {
      let score = 0;
      const matchedTokens: string[] = [];
      
      // Exact token matches
      for (const inputToken of inputTokens) {
        for (const candidateToken of candidateTokens) {
          if (inputToken === candidateToken) {
            score += 10; // High score for exact matches
            matchedTokens.push(inputToken);
          } else if (candidateToken.includes(inputToken) || inputToken.includes(candidateToken)) {
            score += 5; // Partial match
            matchedTokens.push(inputToken);
          }
        }
      }
      
      // Bonus for sequence preservation
      let sequenceBonus = 0;
      for (let i = 0; i < inputTokens.length - 1; i++) {
        const token1 = inputTokens[i];
        const token2 = inputTokens[i + 1];
        
        const candidateText = normalizeText(originalCandidate);
        const token1Index = candidateText.indexOf(token1);
        const token2Index = candidateText.indexOf(token2);
        
        if (token1Index !== -1 && token2Index !== -1 && token1Index < token2Index) {
          sequenceBonus += 2;
        }
      }
      
      score += sequenceBonus;
      
      // Penalty for significant length difference
      const lengthDiff = Math.abs(inputTokens.length - candidateTokens.length);
      score -= lengthDiff * 0.5;
      
      return score;
    }
  
    const inputTokens = extractTokens(input);
    const results: MatchResult[] = [];
  
    for (const candidate of candidates) {
      const candidateTokens = extractTokens(candidate);
      const score = calculateScore(inputTokens, candidateTokens, candidate);
      
      if (score > 0) {
        // Find which input tokens were matched
        const matchedTokens = inputTokens.filter(inputToken =>
          candidateTokens.some(candidateToken =>
            candidateToken === inputToken || 
            candidateToken.includes(inputToken) || 
            inputToken.includes(candidateToken)
          )
        );
        
        results.push({
          text: candidate.trim(),
          score,
          matchedTokens
        });
      }
    }
  
    // Sort by score (descending) and return top results
    const sortedResults = results
    .sort((a, b) => b.score - a.score)
    .slice(0, maxResults);
    console.log(sortedResults)
    return sortedResults;
}
  