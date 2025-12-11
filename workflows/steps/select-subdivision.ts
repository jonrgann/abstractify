import {generateText, Output} from 'ai';
import { google } from '@ai-sdk/google';
import { z } from 'zod';


export async function selectSubdivision(input: string, subdivisions: string[]) {
    "use step"

    const filteredInput = input.toLowerCase()
    .replace(/phase/g, '')
    .replace(/subdivision/g, '')
    .replace(/addition/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .split(' ')
    .filter(word => word.length >= 3 && !/^\d+$/.test(word))
    .join(' ');
    
  
    const subdivisionList = fuzzyMatchSubdivisions(filteredInput, subdivisions);
  
    const response = await generateText({
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
        output: Output.object({
            schema:z.object({
                  bestMatch: z.string()
            })
          }
        ),
    })
  
    const normalizedBestMatch = findMatchIgnoringSpaces(response.output.bestMatch, subdivisionList);
    return normalizedBestMatch;
};


function fuzzyMatchSubdivisions(input: string, subdivisions: string[]): string[] {
    const inputWords = input.toUpperCase().trim().split(/\s+/);
    
    return subdivisions.filter(subdivision => {
      const subdivisionWords = subdivision.toUpperCase().split(/\s+/);
      
      // Check if at least one word from input matches at least one word from subdivision
      // within 1 Levenshtein distance
      return inputWords.some(inputWord => 
        subdivisionWords.some(subdivisionWord => 
          levenshteinDistance(inputWord, subdivisionWord) <= 1
        )
      );
    });
  }
  
  function levenshteinDistance(str1: string, str2: string): number {
    const len1 = str1.length;
    const len2 = str2.length;
    const matrix: number[][] = [];
  
    // Initialize matrix
    for (let i = 0; i <= len1; i++) {
      matrix[i] = [i];
    }
    for (let j = 0; j <= len2; j++) {
      matrix[0][j] = j;
    }
  
    // Fill matrix
    for (let i = 1; i <= len1; i++) {
      for (let j = 1; j <= len2; j++) {
        const cost = str1[i - 1] === str2[j - 1] ? 0 : 1;
        matrix[i][j] = Math.min(
          matrix[i - 1][j] + 1,      // deletion
          matrix[i][j - 1] + 1,      // insertion
          matrix[i - 1][j - 1] + cost // substitution
        );
      }
    }
  
    return matrix[len1][len2];}
  
  function findMatchIgnoringSpaces(inputString: string, stringArray: string[]) {
    if (!inputString || !stringArray || !Array.isArray(stringArray)) {
      return null;
    }
    
    const normalizedInput = inputString.replace(/\s+/g, ' ').trim().toLowerCase();
    const inputWords = normalizedInput.split(' ');
    
    const matches: string[] = [];
    
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
  