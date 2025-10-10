import { useState, useEffect, useRef, useCallback } from 'react';

interface Project {
  id: string;
  title: string;
  description: string;
  image: string;
  industry: string;
  domain: string;
  difficulty: string;
  estimatedHours: number;
  deliverables: string[];
  status: string;
  aiGenerated: boolean;
  createdAt: string;
  scope?: string;
  learningObjectives?: string[];
}

interface UseProjectsOptions {
  page?: number;
  limit?: number;
  industry?: string;
  domain?: string;
  status?: string;
}

interface UseProjectsReturn {
  projects: Project[];
  loading: boolean;
  loadingMore: boolean;
  hasMore: boolean;
  totalProjects: number;
  currentPage: number;
  error: string | null;
  refetch: () => void;
  loadMore: () => void;
}

const dataCache = new Map<string, { data: any; timestamp: number }>();
const CACHE_DURATION = 30 * 1000; // 30 seconds

export function useProjects(options: UseProjectsOptions = {}): UseProjectsReturn {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [totalProjects, setTotalProjects] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [error, setError] = useState<string | null>(null);
  
  const abortControllerRef = useRef<AbortController | null>(null);
  const requestInProgressRef = useRef(false);
  const lastRequestKeyRef = useRef<string | null>(null);
  const isMountedRef = useRef(false);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  // Store options in a ref to avoid recreating fetchProjects unnecessarily
  const optionsRef = useRef(options);
  optionsRef.current = options;

  // Create a stable reference to fetch function and track last options
  const fetchProjectsRef = useRef<(page: number, append: boolean) => void>();
  const lastOptionsRef = useRef<string>('');

  const buildCacheKey = useCallback((page: number, opts: UseProjectsOptions) => {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: (opts.limit || 10).toString()
    });
    if (opts.industry) params.append('industry', opts.industry);
    if (opts.domain) params.append('domain', opts.domain);
    if (opts.status) params.append('status', opts.status);
    return `/api/projects?${params.toString()}`;
  }, []);

  const fetchProjects = useCallback(async (page: number = 1, append: boolean = false) => {
    const opts = optionsRef.current; // Use ref instead of closure
    const cacheKey = buildCacheKey(page, opts);

    if (requestInProgressRef.current && lastRequestKeyRef.current === cacheKey) {
      console.log('useProjects: Request already in progress for', cacheKey);
      return;
    }

    // Check cache first
    const cached = dataCache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
      if (!isMountedRef.current) {
        return;
      }
      console.log('useProjects: Using cached data for', cacheKey);
      const data = cached.data;
      if (!isMountedRef.current) {
        return;
      }
      if (append && page > 1) {
        setProjects(prev => [...prev, ...data.projects]);
      } else {
        setProjects(data.projects || []);
      }
      setHasMore(data.pagination?.hasMore || false);
      setTotalProjects(data.pagination?.total || 0);
      setCurrentPage(page);
      setLoading(false);
      setLoadingMore(false);
      return;
    }

    try {
      requestInProgressRef.current = true;
      lastRequestKeyRef.current = cacheKey;
      
      if (page === 1) {
        setLoading(true);
      } else {
        setLoadingMore(true);
      }
      setError(null);

      // Cancel previous request
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      
      abortControllerRef.current = new AbortController();
      
      console.log(`useProjects: Fetching page=${page}, append=${append}, cacheKey=${cacheKey}`);

      const response = await fetch(cacheKey, {
        signal: abortControllerRef.current.signal
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('API Error Details:', errorText);

        throw new Error(`Failed to fetch projects: ${response.status}`);
      }

      const data = await response.json();
      
      dataCache.set(cacheKey, {
        data,
        timestamp: Date.now()
      });
      
      if (isMountedRef.current) {
        if (append && page > 1) {
          setProjects(prev => [...prev, ...data.projects]);
        } else {
          setProjects(data.projects || []);
        }
        setHasMore(data.pagination?.hasMore || false);
        setTotalProjects(data.pagination?.total || 0);
        setCurrentPage(page);
      }
      
    } catch (error: any) {
      if (error?.name === 'AbortError') {
        console.log('useProjects: Request aborted for', cacheKey);
      } else {
        console.error('useProjects: Failed to fetch projects:', error);
        if (isMountedRef.current) {
          setError(error.message || 'Failed to fetch projects');
        }
      }
    } finally {
      if (isMountedRef.current) {
        setLoading(false);
        setLoadingMore(false);
      }
      requestInProgressRef.current = false;
      if (lastRequestKeyRef.current === cacheKey) {
        lastRequestKeyRef.current = null;
      }
    }
  }, [buildCacheKey]); // Remove 'options' dependency

  // Update the ref whenever fetchProjects changes
  fetchProjectsRef.current = fetchProjects;

  const refetch = useCallback(() => {
    // Clear cache for current options
    const cacheKey = buildCacheKey(1, optionsRef.current);
    dataCache.delete(cacheKey);
    
    setCurrentPage(1);
    fetchProjects(1, false);
  }, [fetchProjects, buildCacheKey]);

  const loadMore = useCallback(() => {
    if (!loadingMore && !loading && hasMore) {
      fetchProjects(currentPage + 1, true);
    }
  }, [fetchProjects, loadingMore, loading, hasMore, currentPage]);

  // Initial fetch - only trigger when filter values actually change
  useEffect(() => {
    // Create a string representation of current options to compare
    const currentOptionsKey = JSON.stringify({
      industry: options.industry || '',
      domain: options.domain || '',
      status: options.status || '',
      limit: options.limit || 10
    });

    // Only fetch if options actually changed
    if (lastOptionsRef.current !== currentOptionsKey) {
      console.log('useProjects: Filter options changed, fetching page 1');
      lastOptionsRef.current = currentOptionsKey;
      fetchProjectsRef.current?.(1, false);
    } else {
      console.log('useProjects: Options unchanged, skipping fetch');
    }
    
    // Only re-run when actual filter values change
  }, [
    options.industry,
    options.domain, 
    options.status,
    options.limit
  ]);

  return {
    projects,
    loading,
    loadingMore,
    hasMore,
    totalProjects,
    currentPage,
    error,
    refetch,
    loadMore,
  };
}