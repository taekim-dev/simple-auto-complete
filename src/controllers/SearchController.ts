import { ApiService } from '../services/api';
import { CacheService } from '../services/cache';

export class SearchController {
  static async getSearchResults(searchTerm: string, signal?: AbortSignal): Promise<string[]> {
    if (!searchTerm.trim()) {
      return [];
    }

    try {
      // Check cache first
      const cachedResults = await CacheService.get(searchTerm);
      if (cachedResults) {
        return cachedResults;
      }

      // If not in cache or offline, fetch from API
      const results = await ApiService.searchWikipedia(searchTerm, signal);
      
      // Cache the results
      if (results.length > 0) {
        await CacheService.set(searchTerm, results);
      }

      return results;
    } catch (error) {
      // If we're offline or there's an error, try to find partial matches in cache
      if (!navigator.onLine || (error instanceof Error && error.name === 'TypeError')) {
        const partialResults = await this.findPartialMatches(searchTerm);
        if (partialResults.length > 0) {
          return partialResults;
        }
      }
      throw error;
    }
  }

  private static async findPartialMatches(searchTerm: string): Promise<string[]> {
    try {
      // This is a simplified version. In a real app, you'd want to implement
      // a more sophisticated search through IndexedDB
      const term = searchTerm.toLowerCase();
      const cachedResults = await CacheService.get(term);
      return cachedResults || [];
    } catch (error) {
      console.error('Error finding partial matches:', error);
      return [];
    }
  }
} 