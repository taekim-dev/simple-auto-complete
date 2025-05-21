const WIKIPEDIA_API_URL = 'https://en.wikipedia.org/w/api.php';

export class ApiService {
  static async searchWikipedia(searchTerm: string, signal?: AbortSignal): Promise<string[]> {
    if (!searchTerm.trim()) {
      return [];
    }

    const params = new URLSearchParams({
      action: 'opensearch',
      format: 'json',
      search: searchTerm,
      limit: '10',
      namespace: '0',
      origin: '*'
    });

    try {
      const response = await fetch(`${WIKIPEDIA_API_URL}?${params}`, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
        },
        signal,
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      if (Array.isArray(data) && data.length > 1) {
        return data[1];
      }
      
      return [];
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        return [];
      }
      console.error('Error fetching data:', error);
      throw error;
    }
  }
} 