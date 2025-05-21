const WIKIPEDIA_API_URL = 'https://en.wikipedia.org/w/api.php';

export class ApiService {
  static async searchWikipedia(searchTerm: string): Promise<string[]> {
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
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      // Wikipedia OpenSearch returns an array where index 1 contains the titles
      if (Array.isArray(data) && data.length > 1) {
        return data[1];
      }
      
      return [];
    } catch (error) {
      console.error('Error fetching data:', error);
      if (error instanceof Error) {
        console.error('Error message:', error.message);
      }
      return [];
    }
  }
} 