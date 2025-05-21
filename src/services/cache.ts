import { DBService } from './db';

export class CacheService {
  static async set(key: string, value: string[]): Promise<void> {
    try {
      await DBService.set(key, value);
    } catch (error) {
      console.error('Error caching data:', error);
    }
  }

  static async get(key: string): Promise<string[] | null> {
    try {
      return await DBService.get(key);
    } catch (error) {
      console.error('Error retrieving cached data:', error);
      return null;
    }
  }

  static async remove(key: string): Promise<void> {
    try {
      await DBService.remove(key);
    } catch (error) {
      console.error('Error removing cached data:', error);
    }
  }

  static async clearExpired(): Promise<void> {
    try {
      await DBService.clearExpired();
    } catch (error) {
      console.error('Error clearing expired cache:', error);
    }
  }
} 