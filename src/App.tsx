import { useState, useCallback, useEffect } from 'react';
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

  // Create a stable debounced search function that won't change on re-renders
  const debouncedSearch = useCallback(
    debounce(async (term: string) => {
      if (!term.trim()) {
        setResults([]);
        setError(null);
        return;
      }

      setIsLoading(true);
      setError(null);

      try {
        const searchResults = await SearchController.getSearchResults(term);
        // Only update results if we still have the same search term
        setResults(searchResults);
      } catch (err) {
        console.error(err);
        setError('Failed to fetch results. Please try again.');
        setResults([]);
      } finally {
        setIsLoading(false);
      }
    }, 300),
    [] // Empty dependency array means this function won't be recreated
  );

  // Cleanup the debounced function on component unmount
  useEffect(() => {
    return () => {
      debouncedSearch.cancel();
    };
  }, [debouncedSearch]);

  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value;
    setSearchTerm(value);
    debouncedSearch(value);
  };

  // Clear results when input is cleared
  useEffect(() => {
    if (!searchTerm.trim()) {
      setResults([]);
      setError(null);
    }
  }, [searchTerm]);

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
                  onClick={() => {
                    setSearchTerm(result);
                    setResults([]);
                  }}
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
