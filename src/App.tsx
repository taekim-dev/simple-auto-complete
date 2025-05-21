import { useState, useCallback, useEffect, useRef } from 'react';
import {
  Box,
  Input,
  Flex,
  Container,
  Spinner,
  Text,
  VisuallyHidden,
} from '@chakra-ui/react';
import debounce from 'lodash/debounce';
import { SearchController } from './controllers/SearchController';

function App() {
  const [searchTerm, setSearchTerm] = useState('');
  const [results, setResults] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const abortControllerRef = useRef<AbortController | null>(null);
  const listRef = useRef<HTMLUListElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

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
        if (abortControllerRef.current === abortController) {
          setResults(searchResults);
          setSelectedIndex(-1); // Reset selection on new results
        }
      } catch (err) {
        if (abortControllerRef.current === abortController) {
          console.error(err);
          setError('Failed to fetch results. Please try again.');
          setResults([]);
        }
      } finally {
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
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
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
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    setResults([]);
    setIsLoading(false);
    setError(null);
    setSelectedIndex(-1);
    // Announce selection to screen readers
    announceToScreenReader(`Selected: ${result}`);
  };

  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (!results.length) return;

    switch (event.key) {
      case 'ArrowDown':
        event.preventDefault();
        setSelectedIndex(prev => 
          prev < results.length - 1 ? prev + 1 : prev
        );
        break;
      case 'ArrowUp':
        event.preventDefault();
        setSelectedIndex(prev => prev > -1 ? prev - 1 : -1);
        break;
      case 'Enter':
        if (selectedIndex >= 0) {
          handleResultClick(results[selectedIndex]);
        }
        break;
      case 'Escape':
        setResults([]);
        setSelectedIndex(-1);
        inputRef.current?.blur();
        break;
    }
  };

  // Scroll selected item into view
  useEffect(() => {
    if (selectedIndex >= 0 && listRef.current) {
      const selectedElement = listRef.current.children[selectedIndex] as HTMLElement;
      if (selectedElement) {
        selectedElement.scrollIntoView({ block: 'nearest' });
      }
    }
  }, [selectedIndex]);

  // Announce to screen readers
  const announceToScreenReader = (message: string) => {
    const announcement = document.createElement('div');
    announcement.setAttribute('aria-live', 'polite');
    announcement.setAttribute('aria-atomic', 'true');
    announcement.setAttribute('class', 'visually-hidden');
    announcement.textContent = message;
    document.body.appendChild(announcement);
    setTimeout(() => document.body.removeChild(announcement), 1000);
  };

  return (
    <Container maxW="container.md" py={8}>
      <Flex direction="column" gap={4}>
        <Box position="relative" width="100%" role="combobox" aria-expanded={results.length > 0} aria-haspopup="listbox" aria-controls="search-results">
          <VisuallyHidden as="label" htmlFor="search-input">
            Search Wikipedia
          </VisuallyHidden>
          <Input
            id="search-input"
            ref={inputRef}
            value={searchTerm}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            placeholder="Start typing to search..."
            size="lg"
            borderRadius="md"
            isDisabled={isLoading}
            aria-autocomplete="list"
            aria-controls="search-results"
            aria-activedescendant={selectedIndex >= 0 ? `result-${selectedIndex}` : undefined}
          />
          
          {isLoading && (
            <Flex justify="center" mt={4} aria-live="polite">
              <Spinner aria-label="Loading results" />
            </Flex>
          )}

          {error && (
            <Text color="red.500" mt={2} fontSize="sm" role="alert">
              {error}
            </Text>
          )}
          
          {!isLoading && !error && results.length > 0 && (
            <Box
              as="ul"
              id="search-results"
              ref={listRef}
              role="listbox"
              aria-label="Search suggestions"
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
                  id={`result-${index}`}
                  key={index}
                  role="option"
                  aria-selected={index === selectedIndex}
                  p={3}
                  bg={index === selectedIndex ? 'gray.100' : 'transparent'}
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
