import { ApiService } from '../services/api';
import { CacheService } from '../services/cache';

export class SearchController {
  static async getSearchResults(searchTerm: string, signal?: AbortSignal): Promise<string[]> {
    if (!searchTerm.trim()) {
      return [];
    }

    // Check cache first
    const cachedResults = CacheService.get(searchTerm);
    if (cachedResults) {
      return cachedResults as string[];
    }

    // If not in cache, fetch from API
    const results = await ApiService.searchWikipedia(searchTerm, signal);
    
    // Cache the results
    if (results.length > 0) {
      CacheService.set(searchTerm, results);
    }

    return results;
  }
} 