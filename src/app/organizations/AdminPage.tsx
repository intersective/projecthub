'use client';

import { useEffect, useMemo, useState } from 'react';
import { AdminOnlyRoute } from '@/components/ProtectedRoute';

type Organization = {
  id: string;
  name: string;
  description: string;
  domain: string;
  organizationType: string;
  contactEmail: string;
  website?: string | null;
};

export default function AdminOrganizationsPage() {
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState<boolean>(false);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [typeFilter, setTypeFilter] = useState<string>('');

  const fetchOrgs = async () => {
    try {
      setIsLoading(true);
      const res = await fetch('/api/organizations');
      if (!res.ok) throw new Error(`Failed to load organizations (${res.status})`);
      
      // Handle empty response gracefully
      const text = await res.text();
      if (!text) {
        console.log('[DEBUG] Empty response from /api/organizations');
        setOrganizations([]);
        return;
      }
      
      const data = JSON.parse(text);
      console.log('[DEBUG] Organizations response:', data);
      
      // API may return { organizations: [...] }, { body: [...] }, or just [...]
      const list = data.organizations || (Array.isArray(data) ? data : (data.body ?? data));
      setOrganizations(Array.isArray(list) ? list : []);
    } catch (e: any) {
      console.error('[DEBUG] Error fetching organizations:', e);
      setError(e.message ?? 'Failed to load organizations');
      setOrganizations([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchOrgs();
  }, []);

  // Filter organizations based on search and type
  const filteredOrganizations = useMemo(() => {
    return organizations.filter(org => {
      const matchesSearch = !searchQuery || 
        org.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        org.domain.toLowerCase().includes(searchQuery.toLowerCase()) ||
        org.description?.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesType = !typeFilter || org.organizationType === typeFilter;
      
      return matchesSearch && matchesType;
    });
  }, [organizations, searchQuery, typeFilter]);

  // Show error message if there's an error
  if (error) {
    return (
      <AdminOnlyRoute>
        <div className="min-h-screen bg-white dark:bg-gray-900 flex items-center justify-center">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-red-600 mb-4">Error Loading Organizations</h2>
            <p className="text-gray-600 dark:text-gray-400 mb-4">{error}</p>
            <button
              onClick={fetchOrgs}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Retry
            </button>
          </div>
        </div>
      </AdminOnlyRoute>
    );
  }

  return (
    <AdminOnlyRoute>
      <div className="min-h-screen bg-white dark:bg-gray-900 text-gray-900 dark:text-white">
        {/* Header */}
        <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 sticky top-0 z-10">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div>
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Organizations</h1>
                <p className="text-gray-600 dark:text-gray-400 mt-1">
                  Manage organizations and their members
                </p>
              </div>
              <button
                className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-sm"
                onClick={() => setIsCreating(true)}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                New Organization
              </button>
            </div>

            {/* Filters and View Toggle */}
            <div className="mt-6 flex flex-col sm:flex-row gap-4">
              {/* Search */}
              <div className="flex-1 relative">
                <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <input
                  type="text"
                  placeholder="Search organizations..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              {/* Type Filter */}
              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">All Types</option>
                <option value="education">Education</option>
                <option value="industry">Industry</option>
                <option value="government">Government</option>
                <option value="nonprofit">Nonprofit</option>
              </select>

              {/* View Mode Toggle */}
              <div className="flex gap-2 bg-gray-100 dark:bg-gray-700 p-1 rounded-lg">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`p-2 rounded ${
                    viewMode === 'grid'
                      ? 'bg-white dark:bg-gray-600 shadow-sm'
                      : 'hover:bg-gray-200 dark:hover:bg-gray-600'
                  }`}
                  title="Grid view"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                  </svg>
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`p-2 rounded ${
                    viewMode === 'list'
                      ? 'bg-white dark:bg-gray-600 shadow-sm'
                      : 'hover:bg-gray-200 dark:hover:bg-gray-600'
                  }`}
                  title="List view"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Results Count */}
            <div className="mt-4 text-sm text-gray-600 dark:text-gray-400">
              Showing {filteredOrganizations.length} of {organizations.length} organizations
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {isCreating && (
            <OrganizationCreateForm
              onCancel={() => setIsCreating(false)}
              onCreated={() => {
                setIsCreating(false);
                fetchOrgs();
              }}
            />
          )}

          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="animate-pulse">
                  <div className="bg-gray-200 dark:bg-gray-700 h-48 rounded-lg"></div>
                </div>
              ))}
            </div>
          ) : (
            <>
              {filteredOrganizations.length === 0 ? (
                <div className="text-center py-12">
                  <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                  <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">No organizations found</h3>
                  <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                    {searchQuery || typeFilter ? 'Try adjusting your filters' : 'Get started by creating a new organization'}
                  </p>
                </div>
              ) : (
                <div className={
                  viewMode === 'grid'
                    ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'
                    : 'space-y-4'
                }>
                  {filteredOrganizations.map((org) => (
                    <OrganizationCard key={org.id} org={org} onUpdated={fetchOrgs} viewMode={viewMode} />
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </AdminOnlyRoute>
  );
}

function OrganizationCard({ org, onUpdated, viewMode }: { org: Organization; onUpdated: () => void; viewMode: 'grid' | 'list' }) {
  const [showMembers, setShowMembers] = useState<boolean>(false);

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'education': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      case 'industry': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'government': return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200';
      case 'nonprofit': return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200';
    }
  };

  if (viewMode === 'list') {
    return (
      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:shadow-lg transition-shadow">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{org.name}</h3>
              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getTypeColor(org.organizationType)}`}>
                {org.organizationType}
              </span>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-3 line-clamp-2">{org.description}</p>
            <div className="flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400">
              <div className="flex items-center gap-1">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
                </svg>
                {org.domain}
              </div>
              <div className="flex items-center gap-1">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                {org.contactEmail}
              </div>
              {org.website && (
                <a href={org.website} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 hover:text-blue-600">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                  </svg>
                  Website
                </a>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              className="px-4 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              onClick={() => setShowMembers((v) => !v)}
            >
              <svg className="w-4 h-4 inline mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
              {showMembers ? 'Hide Members' : 'View Members'}
            </button>
            <a
              className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              href={`/admin/organizations/${org.id}`}
            >
              Manage
            </a>
          </div>
        </div>
        {showMembers && (
          <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
            <OrganizationMembers organizationId={org.id} />
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden hover:shadow-lg transition-shadow">
      <div className="p-6">
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1">
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">{org.name}</h3>
            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getTypeColor(org.organizationType)}`}>
              {org.organizationType}
            </span>
          </div>
        </div>
        
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-4 line-clamp-3">{org.description}</p>
        
        <div className="space-y-2 mb-4">
          <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
            </svg>
            <span>{org.domain}</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
            <span className="truncate">{org.contactEmail}</span>
          </div>
          {org.website && (
            <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
              <a href={org.website} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline truncate">
                {org.website}
              </a>
            </div>
          )}
        </div>

        <div className="flex gap-2">
          <button
            className="flex-1 px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            onClick={() => setShowMembers((v) => !v)}
          >
            <svg className="w-4 h-4 inline mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
            </svg>
            {showMembers ? 'Hide' : 'Members'}
          </button>
          <a
            className="flex-1 px-3 py-2 text-sm text-center bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            href={`/admin/organizations/${org.id}`}
          >
            Manage
          </a>
        </div>
      </div>
      
      {showMembers && (
        <div className="px-6 pb-6">
          <OrganizationMembers organizationId={org.id} />
        </div>
      )}
    </div>
  );
}

function OrganizationCreateForm({ onCancel, onCreated }: { onCancel: () => void; onCreated: () => void }) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [domain, setDomain] = useState('');
  const [type, setType] = useState('education');
  const [website, setWebsite] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState<boolean>(false);

  const canSave = useMemo(() => name && domain && type, [name, domain, type]);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSave) return;
    try {
      setSaving(true);
      setError(null);
      const res = await fetch('/api/organizations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, description, domain, type, website })
      });
      if (!res.ok) throw new Error(`Failed to create (${res.status})`);
      onCreated();
    } catch (e: any) {
      setError(e.message ?? 'Failed to create');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6 mb-6 shadow-sm">
      <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Create New Organization</h2>
      <form onSubmit={onSubmit}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Organization Name <span className="text-red-500">*</span>
            </label>
            <input 
              className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-4 py-2 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent" 
              value={name} 
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter organization name"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Domain <span className="text-red-500">*</span>
            </label>
            <input 
              className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-4 py-2 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent" 
              value={domain} 
              onChange={(e) => setDomain(e.target.value)}
              placeholder="example.com"
              required
            />
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Description</label>
            <textarea 
              className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-4 py-2 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent" 
              value={description} 
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              placeholder="Brief description of the organization"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Organization Type <span className="text-red-500">*</span>
            </label>
            <select 
              className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-4 py-2 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent" 
              value={type} 
              onChange={(e) => setType(e.target.value)}
              required
            >
              <option value="education">Education</option>
              <option value="industry">Industry</option>
              <option value="government">Government</option>
              <option value="nonprofit">Nonprofit</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Website</label>
            <input 
              className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-4 py-2 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent" 
              value={website} 
              onChange={(e) => setWebsite(e.target.value)}
              placeholder="https://example.com"
              type="url"
            />
          </div>
        </div>
        {error && (
          <div className="mt-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
            <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
          </div>
        )}
        <div className="mt-6 flex gap-3">
          <button 
            type="submit" 
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed" 
            disabled={!canSave || saving}
          >
            {saving ? 'Creating...' : 'Create Organization'}
          </button>
          <button 
            type="button" 
            className="px-6 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors" 
            onClick={onCancel}
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}

function OrganizationMembers({ organizationId }: { organizationId: string }) {
  const [members, setMembers] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchMembers = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/organizations/${organizationId}/members`);
      if (!res.ok) throw new Error(`Failed to load members (${res.status})`);
      const data = await res.json();
      const list = Array.isArray(data) ? data : (data.body ?? data);
      setMembers(list ?? []);
    } catch (e: any) {
      setError(e.message ?? 'Failed to load members');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMembers();
  }, [organizationId]);

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <h3 className="font-medium">Members</h3>
        <AddMemberModal organizationId={organizationId} onAdded={fetchMembers} />
      </div>
      {loading && <div className="text-gray-500">Loading...</div>}
      {error && <div className="text-red-600">{error}</div>}
      {!loading && !error && (
        <ul className="space-y-2">
          {members && members.length > 0 && members.map((m, idx) => (
            <li key={m.id ?? idx} className="text-sm flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-700 rounded">
              <div className="flex-1">
                {m.memberInfo ? (
                  <div>
                    <div className="font-medium">{m.memberInfo.name || 'Unnamed User'}</div>
                    <div className="text-xs text-gray-500">{m.memberInfo.email}</div>
                  </div>
                ) : (
                  <div className="text-gray-500">
                    {m.memberEntityType}: {m.memberEntityId.substring(0, 12)}...
                  </div>
                )}
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-600">
                  {m.roleInfo?.displayName || m.roleEntityId}
                </span>
                <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                  m.status === 'active' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' :
                  m.status === 'invited' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200' :
                  'bg-gray-100 text-gray-800 dark:bg-gray-600 dark:text-gray-200'
                }`}>
                  {m.status}
                </span>
              </div>
            </li>
          ))}
          {members.length === 0 && (
            <li className="text-sm text-gray-500">No members yet</li>
          )}
        </ul>
      )}
    </div>
  );
}

function AddMemberModal({ organizationId, onAdded }: { organizationId: string; onAdded: () => void }) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [searching, setSearching] = useState(false);
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [role, setRole] = useState('org_member');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const searchUsers = async (query: string) => {
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }
    
    try {
      setSearching(true);
      const res = await fetch(`/api/users/search?q=${encodeURIComponent(query)}`);
      if (res.ok) {
        const data = await res.json();
        setSearchResults(data.users || []);
      }
    } catch (e) {
      console.error('Search failed:', e);
    } finally {
      setSearching(false);
    }
  };

  const addMember = async () => {
    if (!selectedUser) return;
    
    try {
      setSaving(true);
      setError(null);
      const res = await fetch(`/api/organizations/${organizationId}/members`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          memberEntity: selectedUser.id, 
          roleEntity: role 
        })
      });
      if (!res.ok) throw new Error(`Failed to add member (${res.status})`);
      setIsOpen(false);
      setSelectedUser(null);
      setSearchQuery('');
      onAdded();
    } catch (e: any) {
      setError(e.message ?? 'Failed to add member');
    } finally {
      setSaving(false);
    }
  };

  const createAndAddUser = async (userData: { name: string; email: string }) => {
    try {
      setSaving(true);
      setError(null);
      
      // First create the user
      const userRes = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(userData)
      });
      
      if (!userRes.ok) throw new Error(`Failed to create user (${userRes.status})`);
      const newUser = await userRes.json();
      
      // Then add them to the organization
      const memberRes = await fetch(`/api/organizations/${organizationId}/members`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          memberEntity: newUser.id, 
          roleEntity: role 
        })
      });
      
      if (!memberRes.ok) throw new Error(`Failed to add member (${userRes.status})`);
      
      setIsOpen(false);
      setSelectedUser(null);
      setSearchQuery('');
      onAdded();
    } catch (e: any) {
      setError(e.message ?? 'Failed to create and add user');
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <button 
        className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        onClick={() => setIsOpen(true)}
      >
        Add Member
      </button>

      {isOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-xl">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white">Add Member</h3>
              <button
                onClick={() => setIsOpen(false)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            {/* Search Section */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Search Existing Users</label>
              <div className="flex gap-2">
                <div className="flex-1 relative">
                  <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                  <input
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Search by name or email..."
                    value={searchQuery}
                    onChange={(e) => {
                      setSearchQuery(e.target.value);
                      searchUsers(e.target.value);
                    }}
                  />
                </div>
              </div>
              
              {/* Search Results */}
              {searching && <div className="text-sm text-gray-500 mt-2">Searching...</div>}
              {searchResults.length > 0 && (
                <div className="mt-3 max-h-48 overflow-y-auto border border-gray-200 dark:border-gray-700 rounded-lg">
                  {searchResults.map((user) => (
                    <div
                      key={user.id}
                      className={`p-3 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 border-b border-gray-100 dark:border-gray-700 last:border-b-0 ${
                        selectedUser?.id === user.id ? 'bg-blue-50 dark:bg-blue-900/20 border-l-4 border-l-blue-500' : ''
                      }`}
                      onClick={() => setSelectedUser(user)}
                    >
                      <div className="font-medium text-gray-900 dark:text-white">{user.name}</div>
                      <div className="text-sm text-gray-500 dark:text-gray-400">{user.email}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Role Selection */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Role</label>
              <select
                className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-4 py-2 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                value={role}
                onChange={(e) => setRole(e.target.value)}
              >
                <option value="org_member">Member</option>
                <option value="org_admin">Admin</option>
              </select>
            </div>

            {/* Selected User Display */}
            {selectedUser && (
              <div className="mb-6 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                <div className="text-sm text-blue-600 dark:text-blue-400 mb-1">Selected User</div>
                <div className="font-medium text-gray-900 dark:text-white">{selectedUser.name}</div>
                <div className="text-sm text-gray-600 dark:text-gray-400">{selectedUser.email}</div>
              </div>
            )}

            {/* Divider */}
            <div className="relative mb-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-200 dark:border-gray-700"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white dark:bg-gray-800 text-gray-500">OR</span>
              </div>
            </div>

            {/* Create New User Section */}
            <div className="mb-6 p-4 bg-gray-50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-600 rounded-lg">
              <h4 className="font-medium text-gray-900 dark:text-white mb-3">Create New User</h4>
              <CreateUserForm onCreateUser={createAndAddUser} />
            </div>

            {error && (
              <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex gap-3 justify-end">
              <button
                className="px-6 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                onClick={() => setIsOpen(false)}
              >
                Cancel
              </button>
              {selectedUser && (
                <button
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={saving}
                  onClick={addMember}
                >
                  {saving ? 'Adding...' : 'Add Member'}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function CreateUserForm({ onCreateUser }: { onCreateUser: (userData: { name: string; email: string }) => Promise<void> }) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [creating, setCreating] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim()) return;
    
    setCreating(true);
    try {
      await onCreateUser({ name: name.trim(), email: email.trim() });
      setName('');
      setEmail('');
    } finally {
      setCreating(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Name</label>
        <input
          className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          placeholder="Enter full name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Email</label>
        <input
          className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          placeholder="email@example.com"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
      </div>
      <button
        type="submit"
        className="w-full px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        disabled={creating || !name.trim() || !email.trim()}
      >
        {creating ? 'Creating...' : 'Create & Add User'}
      </button>
    </form>
  );
}


