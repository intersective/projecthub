'use client';

import { useState, useEffect } from 'react';
import { useAuth, ROLES } from '@/lib/auth-context';
import { useRouter } from 'next/navigation';

interface Project {
  id: string;
  title: string;
  description: string;
  industry: string;
  domain: string;
  difficulty: string;
  estimatedHours: number;
  image?: string;
  status: string;
}

interface SelectedProject {
  project: Project;
  rank: number;
}

export default function ProjectPreferencesPage() {
  const { user, hasRole } = useAuth();
  const router = useRouter();
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProjects, setSelectedProjects] = useState<SelectedProject[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [viewingProject, setViewingProject] = useState<Project | null>(null);

  useEffect(() => {
    if (!hasRole(ROLES.LEARNER)) {
      router.push('/');
      return;
    }
    loadData();
  }, []);

  const loadData = async () => {
    try {
      // Fetch both projects and preferences in parallel
      const [projectsResponse, preferencesResponse] = await Promise.all([
        fetch('/api/projects?status=active'),
        fetch('/api/project-preferences')
      ]);

      const projectsData = await projectsResponse.json();
      const preferencesData = await preferencesResponse.json();

      const fetchedProjects = projectsData.projects || [];
      setProjects(fetchedProjects);

      // Match preferences with projects
      if (preferencesData.preferences && Array.isArray(preferencesData.preferences)) {
        const prefs = preferencesData.preferences
          .map((pref: any) => {
            const project = fetchedProjects.find((p: Project) => p.id === pref.projectId);
            return project ? { project, rank: pref.rank } : null;
          })
          .filter(Boolean)
          .sort((a: any, b: any) => a.rank - b.rank); // Sort by rank to ensure correct order
        
        setSelectedProjects(prefs as SelectedProject[]);
      }
    } catch (error) {
      console.error('Failed to load data:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleProjectSelection = (project: Project) => {
    setSelectedProjects(prev => {
      const existing = prev.find(sp => sp.project.id === project.id);
      
      if (existing) {
        // Deselect: remove and reorder remaining
        const filtered = prev.filter(sp => sp.project.id !== project.id);
        return filtered.map((sp, index) => ({ ...sp, rank: index + 1 }));
      } else {
        // Select: add if under limit
        if (prev.length >= 5) {
          alert('You can select up to 5 projects');
          return prev;
        }
        return [...prev, { project, rank: prev.length + 1 }];
      }
    });
  };

  const savePreferences = async () => {
    setSaving(true);
    try {
      const response = await fetch('/api/project-preferences', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          preferences: selectedProjects.map(sp => ({
            projectId: sp.project.id,
            rank: sp.rank
          }))
        })
      });

      if (response.ok) {
        alert('Preferences saved successfully!');
        router.push('/learner/dashboard');
      } else {
        const data = await response.json();
        alert(data.error || 'Failed to save preferences');
      }
    } catch (error) {
      console.error('Failed to save preferences:', error);
      alert('Error saving preferences');
    } finally {
      setSaving(false);
    }
  };

  const isSelected = (projectId: string) => {
    return selectedProjects.some(sp => sp.project.id === projectId);
  };

  const getProjectRank = (projectId: string) => {
    const selected = selectedProjects.find(sp => sp.project.id === projectId);
    return selected?.rank || 0;
  };

  if (!hasRole(ROLES.LEARNER)) return null;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header with Selected Projects */}
      <div className="sticky top-0 z-40 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              Select Your Project Preferences
            </h1>
            <button
              onClick={savePreferences}
              disabled={selectedProjects.length === 0 || saving}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
            >
              {saving ? 'Saving...' : `Save Preferences (${selectedProjects.length}/5)`}
            </button>
          </div>

          {/* Selected Projects Preview */}
          {selectedProjects.length > 0 && (
            <div className="flex items-center gap-2 overflow-x-auto pb-2">
              <span className="text-sm text-gray-600 dark:text-gray-400 whitespace-nowrap">
                Your selection:
              </span>
              {selectedProjects.map((sp) => (
                <div
                  key={sp.project.id}
                  className="flex items-center gap-2 px-3 py-1 bg-blue-100 dark:bg-blue-900 rounded-full group cursor-pointer hover:bg-blue-200 dark:hover:bg-blue-800 transition-colors"
                  onClick={() => toggleProjectSelection(sp.project)}
                >
                  <span className="text-sm font-medium text-blue-800 dark:text-blue-200">
                    #{sp.rank}
                  </span>
                  <span className="text-sm text-blue-700 dark:text-blue-300 max-w-xs truncate">
                    {sp.project.title}
                  </span>
                  <svg 
                    className="w-4 h-4 text-blue-600 dark:text-blue-400 opacity-0 group-hover:opacity-100 transition-opacity"
                    fill="none" 
                    stroke="currentColor" 
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Projects Grid */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        <p className="text-gray-600 dark:text-gray-400 mb-6">
          Select up to 5 projects in order of preference. The first project you select will be your top preference.
        </p>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="bg-gray-200 dark:bg-gray-700 rounded-lg h-80 animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {projects.map((project) => {
              const selected = isSelected(project.id);
              const rank = getProjectRank(project.id);

              return (
                <div
                  key={project.id}
                  className={`relative bg-white dark:bg-gray-800 rounded-lg shadow-md hover:shadow-xl transition-all cursor-pointer transform ${
                    selected ? 'ring-2 ring-blue-500 scale-105' : 'hover:scale-105'
                  }`}
                  onClick={() => toggleProjectSelection(project)}
                >
                  {/* Selection Badge */}
                  {selected && (
                    <div className="absolute -top-3 -right-3 z-10 w-10 h-10 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold text-lg shadow-lg">
                      {rank}
                    </div>
                  )}

                  {/* Project Image */}
                  <div className="relative h-40 rounded-t-lg overflow-hidden bg-gray-100 dark:bg-gray-700">
                    {project.image ? (
                      <img
                        src={project.image}
                        alt={project.title}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-400">
                        <svg className="w-16 h-16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                      </div>
                    )}
                    <div className={`absolute inset-0 ${selected ? 'bg-blue-500/20' : ''} transition-colors`} />
                  </div>

                  {/* Project Info */}
                  <div className="p-4">
                    <h3 className="font-semibold text-gray-900 dark:text-white mb-2 line-clamp-2 min-h-[3rem]">
                      {project.title}
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2 mb-3 min-h-[2.5rem]">
                      {project.description}
                    </p>
                    <div className="flex items-center justify-between text-xs mb-3">
                      <span className="px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded text-gray-700 dark:text-gray-300">
                        {project.difficulty}
                      </span>
                      <span className="text-gray-500 dark:text-gray-400">
                        {project.estimatedHours}h
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                      <span className="truncate">{project.industry}</span>
                    </div>

                    {/* View Details Button */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setViewingProject(project);
                      }}
                      className="mt-3 w-full text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors py-1"
                    >
                      View Details →
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {!loading && projects.length === 0 && (
          <div className="text-center py-12">
            <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">No projects available</h3>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              There are no active projects to select from at the moment.
            </p>
          </div>
        )}
      </div>

      {/* Quick View Modal */}
      {viewingProject && (
        <div 
          className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
          onClick={() => setViewingProject(null)}
        >
          <div 
            className="bg-white dark:bg-gray-800 rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                  {viewingProject.title}
                </h2>
                <button
                  onClick={() => setViewingProject(null)}
                  className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <p className="text-gray-600 dark:text-gray-300 mb-6 whitespace-pre-wrap">
                {viewingProject.description}
              </p>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="space-y-2">
                  <div>
                    <span className="font-semibold text-gray-900 dark:text-white">Industry:</span>{' '}
                    <span className="text-gray-600 dark:text-gray-400">{viewingProject.industry}</span>
                  </div>
                  <div>
                    <span className="font-semibold text-gray-900 dark:text-white">Domain:</span>{' '}
                    <span className="text-gray-600 dark:text-gray-400">{viewingProject.domain}</span>
                  </div>
                </div>
                <div className="space-y-2">
                  <div>
                    <span className="font-semibold text-gray-900 dark:text-white">Difficulty:</span>{' '}
                    <span className="text-gray-600 dark:text-gray-400">{viewingProject.difficulty}</span>
                  </div>
                  <div>
                    <span className="font-semibold text-gray-900 dark:text-white">Duration:</span>{' '}
                    <span className="text-gray-600 dark:text-gray-400">{viewingProject.estimatedHours} hours</span>
                  </div>
                </div>
              </div>
              <button
                onClick={() => {
                  toggleProjectSelection(viewingProject);
                  setViewingProject(null);
                }}
                className={`mt-6 w-full py-2 rounded-lg font-medium transition-colors ${
                  isSelected(viewingProject.id)
                    ? 'bg-red-600 hover:bg-red-700 text-white'
                    : 'bg-blue-600 hover:bg-blue-700 text-white'
                }`}
              >
                {isSelected(viewingProject.id) ? 'Remove from Preferences' : 'Add to Preferences'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
