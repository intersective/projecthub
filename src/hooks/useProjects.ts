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
    const cacheKey = buildCacheKey(page, options);

    if (requestInProgressRef.current && lastRequestKeyRef.current === cacheKey) {
      console.log('useProjects: Request already in progress for', cacheKey);
      return;
    }

    // Check cache first
    const cached = dataCache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
      console.log('useProjects: Using cached data for', cacheKey);
      const data = cached.data;
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
        throw new Error(`Failed to fetch projects: ${response.status}`);
      }

      const data = await response.json();
      
      dataCache.set(cacheKey, {
        data,
        timestamp: Date.now()
      });
      
      if (append && page > 1) {
        setProjects(prev => [...prev, ...data.projects]);
      } else {
        setProjects(data.projects || []);
      }
      setHasMore(data.pagination?.hasMore || false);
      setTotalProjects(data.pagination?.total || 0);
      setCurrentPage(page);
      
    } catch (error: any) {
      if (error?.name === 'AbortError') {
        console.log('useProjects: Request aborted for', cacheKey);
      } else {
        console.error('useProjects: Failed to fetch projects:', error);
        setError(error.message || 'Failed to fetch projects');
      }
    } finally {
      setLoading(false);
      setLoadingMore(false);
      requestInProgressRef.current = false;
      if (lastRequestKeyRef.current === cacheKey) {
        lastRequestKeyRef.current = null;
      }
    }
  }, [options, buildCacheKey]);

  const refetch = useCallback(() => {
    // Clear cache for current options
    const cacheKey = buildCacheKey(1, options);
    dataCache.delete(cacheKey);
    
    setCurrentPage(1);
    fetchProjects(1, false);
  }, [fetchProjects, options, buildCacheKey]);

  const loadMore = useCallback(() => {
    if (!loadingMore && !loading && hasMore) {
      fetchProjects(currentPage + 1, true);
    }
  }, [fetchProjects, loadingMore, loading, hasMore, currentPage]);

  // Initial fetch
  useEffect(() => {
    console.log('useProjects: Initial effect triggered');
    fetchProjects(1, false);
    
    // Cleanup on unmount
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [fetchProjects]);

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