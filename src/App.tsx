import { useState, useCallback, useEffect, useRef } from 'react';
import {
  Box,
  Input,
  Flex,
  Container,
  Spinner,
  Text,
} from '@chakra-ui/react';
import debounce from 'lodash/debounce';
import { SearchController } from './controllers/SearchController';

function App() {
  const [searchTerm, setSearchTerm] = useState('');
  const [results, setResults] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Create a stable debounced search function
  const debouncedSearch = useCallback(
    debounce(async (term: string) => {
      if (!term.trim()) {
        setResults([]);
        setError(null);
        return;
      }

      // Cancel previous request if it exists
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }

      // Create new abort controller for this request
      const abortController = new AbortController();
      abortControllerRef.current = abortController;

      setIsLoading(true);
      setError(null);

      try {
        const searchResults = await SearchController.getSearchResults(term, abortController.signal);
        // Only update if this is still the current request
        if (abortControllerRef.current === abortController) {
          setResults(searchResults);
        }
      } catch (err) {
        // Only show error if this is still the current request
        if (abortControllerRef.current === abortController) {
          console.error(err);
          setError('Failed to fetch results. Please try again.');
          setResults([]);
        }
      } finally {
        // Only update loading state if this is still the current request
        if (abortControllerRef.current === abortController) {
          setIsLoading(false);
          abortControllerRef.current = null;
        }
      }
    }, 300),
    []
  );

  // Cleanup function
  useEffect(() => {
    return () => {
      // Cancel any pending requests
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      // Cancel any pending debounced calls
      debouncedSearch.cancel();
    };
  }, [debouncedSearch]);

  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value;
    setSearchTerm(value);
    debouncedSearch(value);
  };

  const handleResultClick = (result: string) => {
    setSearchTerm(result);
    // Cancel any pending requests when selecting a result
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    setResults([]);
    setIsLoading(false);
    setError(null);
  };

  return (
    <Container maxW="container.md" py={8}>
      <Flex direction="column" gap={4}>
        <Box position="relative" width="100%">
          <Input
            value={searchTerm}
            onChange={handleInputChange}
            placeholder="Start typing to search..."
            size="lg"
            borderRadius="md"
            isDisabled={isLoading}
          />
          
          {isLoading && (
            <Flex justify="center" mt={4}>
              <Spinner />
            </Flex>
          )}

          {error && (
            <Text color="red.500" mt={2} fontSize="sm">
              {error}
            </Text>
          )}
          
          {!isLoading && !error && results.length > 0 && (
            <Box
              as="ul"
              listStyleType="none"
              position="absolute"
              top="100%"
              left={0}
              right={0}
              bg="white"
              boxShadow="md"
              borderRadius="md"
              mt={2}
              maxH="300px"
              overflowY="auto"
              zIndex={1}
              border="1px solid"
              borderColor="gray.200"
              margin={0}
              padding={0}
            >
              {results.map((result, index) => (
                <Box
                  as="li"
                  key={index}
                  p={3}
                  _hover={{ bg: 'gray.100' }}
                  cursor="pointer"
                  onClick={() => handleResultClick(result)}
                >
                  {result}
                </Box>
              ))}
            </Box>
          )}
        </Box>
      </Flex>
    </Container>
  );
}

export default App;
