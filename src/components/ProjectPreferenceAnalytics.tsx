'use client';

import { useState, useEffect } from 'react';

interface ProjectStats {
  projectId: string;
  projectTitle: string;
  projectIndustry: string;
  projectDomain: string;
  projectDifficulty: string;
  totalSelections: number;
  rank1Count: number;
  rank2Count: number;
  rank3Count: number;
  rank4Count: number;
  rank5Count: number;
  averageRank: number;
  percentageOfLearners: number;
}

interface UnselectedProject {
  id: string;
  title: string;
  industry: string;
  domain: string;
  difficulty: string;
}

interface IndustryPreference {
  industry: string;
  totalSelections: number;
  percentageOfTotal: number;
}

interface AnalyticsData {
  totalLearnersWithPreferences: number;
  totalProjectsSelected: number;
  averageProjectsPerLearner: number;
  mostPreferredProjects: ProjectStats[];
  unselectedProjects: UnselectedProject[];
  industryPreferences: IndustryPreference[];
  preferenceDistribution: { rank: number; count: number }[];
}

export default function ProjectPreferenceAnalytics() {
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');
  const [showUnselected, setShowUnselected] = useState(false);

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async () => {
    try {
      const response = await fetch('/api/project-preferences/analytics');
      const data = await response.json();
      if (data.success) {
        setAnalytics(data.analytics);
      }
    } catch (error) {
      console.error('Failed to fetch analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-64">
        <div className="text-lg text-gray-900 dark:text-white">Loading analytics...</div>
      </div>
    );
  }

  if (!analytics) {
    return (
      <div className="card">
        <div className="text-center py-12">
          <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
          <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">No analytics data</h3>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            No learners have submitted project preferences yet.
          </p>
        </div>
      </div>
    );
  }

  const getRankColor = (rank: number) => {
    const colors = [
      'bg-yellow-500',  // Rank 1
      'bg-blue-500',    // Rank 2
      'bg-green-500',   // Rank 3
      'bg-purple-500',  // Rank 4
      'bg-gray-500'     // Rank 5
    ];
    return colors[rank - 1] || 'bg-gray-500';
  };

  return (
    <div className="space-y-6">
      {/* Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Learners with Preferences</p>
              <p className="text-3xl font-bold text-blue-600 dark:text-blue-400">
                {analytics.totalLearnersWithPreferences}
              </p>
            </div>
            <div className="text-blue-500 dark:text-blue-400">
              <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 20 20">
                <path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a5 5 0 015 5v1H1v-1a5 5 0 015-5z"/>
              </svg>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Projects Selected</p>
              <p className="text-3xl font-bold text-green-600 dark:text-green-400">
                {analytics.totalProjectsSelected}
              </p>
            </div>
            <div className="text-green-500 dark:text-green-400">
              <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M6 2a2 2 0 00-2 2v12a2 2 0 002 2h8a2 2 0 002-2V7.414A2 2 0 0015.414 6L12 2.586A2 2 0 0010.586 2H6zm5 6a1 1 0 10-2 0v3.586l-1.293-1.293a1 1 0 10-1.414 1.414l3 3a1 1 0 001.414 0l3-3a1 1 0 00-1.414-1.414L11 11.586V8z" clipRule="evenodd"/>
              </svg>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Avg Preferences per Learner</p>
              <p className="text-3xl font-bold text-purple-600 dark:text-purple-400">
                {analytics.averageProjectsPerLearner}
              </p>
            </div>
            <div className="text-purple-500 dark:text-purple-400">
              <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 20 20">
                <path d="M2 11a1 1 0 011-1h2a1 1 0 011 1v5a1 1 0 01-1 1H3a1 1 0 01-1-1v-5zM8 7a1 1 0 011-1h2a1 1 0 011 1v9a1 1 0 01-1 1H9a1 1 0 01-1-1V7zM14 4a1 1 0 011-1h2a1 1 0 011 1v12a1 1 0 01-1 1h-2a1 1 0 01-1-1V4z"/>
              </svg>
            </div>
          </div>
        </div>
      </div>

      {/* Preference Distribution Chart */}
      <div className="card">
        <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">Preference Distribution by Rank</h3>
        <div className="space-y-3">
          {analytics.preferenceDistribution.map((dist) => {
            const maxCount = Math.max(...analytics.preferenceDistribution.map(d => d.count));
            const percentage = maxCount > 0 ? (dist.count / maxCount) * 100 : 0;
            
            return (
              <div key={dist.rank}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Rank #{dist.rank}
                  </span>
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    {dist.count} selections
                  </span>
                </div>
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3">
                  <div 
                    className={`${getRankColor(dist.rank)} h-3 rounded-full transition-all`}
                    style={{ width: `${percentage}%` }}
                  ></div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Industry Preferences */}
      {analytics.industryPreferences.length > 0 && (
        <div className="card">
          <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">Top Industries</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {analytics.industryPreferences.slice(0, 6).map((industry, index) => (
              <div key={industry.industry} className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-900 dark:text-white truncate">
                    {industry.industry}
                  </span>
                  <span className="text-xs text-gray-500 dark:text-gray-400 ml-2">
                    #{index + 1}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                    {industry.totalSelections}
                  </span>
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    {industry.percentageOfTotal}%
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Most Preferred Projects */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Most Preferred Projects
          </h3>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-2 rounded ${viewMode === 'grid' ? 'bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-400' : 'text-gray-600 dark:text-gray-400'}`}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
              </svg>
            </button>
            <button
              onClick={() => setViewMode('table')}
              className={`p-2 rounded ${viewMode === 'table' ? 'bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-400' : 'text-gray-600 dark:text-gray-400'}`}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
              </svg>
            </button>
          </div>
        </div>

        {viewMode === 'grid' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {analytics.mostPreferredProjects.slice(0, 12).map((project, index) => (
              <div key={project.projectId} className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:shadow-lg transition-shadow">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-lg font-bold text-gray-400">#{index + 1}</span>
                      <span className="text-xs px-2 py-1 bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 rounded">
                        {project.totalSelections} selections
                      </span>
                    </div>
                    <h4 className="font-semibold text-gray-900 dark:text-white line-clamp-2">
                      {project.projectTitle}
                    </h4>
                  </div>
                </div>

                <div className="grid grid-cols-5 gap-1 my-3">
                  {[1, 2, 3, 4, 5].map((rank) => (
                    <div key={rank} className="text-center">
                      <div className={`${getRankColor(rank)} text-white text-xs font-medium py-1 rounded-t`}>
                        #{rank}
                      </div>
                      <div className="bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white text-sm font-semibold py-1 rounded-b">
                        {project[`rank${rank}Count` as keyof ProjectStats] as number}
                      </div>
                    </div>
                  ))}
                </div>

                <div className="flex items-center justify-between text-xs text-gray-600 dark:text-gray-400">
                  <span className="truncate">{project.projectIndustry}</span>
                  <span className="ml-2 font-semibold text-blue-600 dark:text-blue-400">
                    {project.percentageOfLearners}% of learners
                  </span>
                </div>

                <div className="mt-2">
                  <div className="text-xs text-gray-500 dark:text-gray-400">
                    Avg Rank: <span className="font-semibold text-gray-900 dark:text-white">
                      {project.averageRank.toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-800">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">#</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Project</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Industry</th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Total</th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">#1</th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">#2</th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">#3</th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">#4</th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">#5</th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Avg</th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">%</th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
                {analytics.mostPreferredProjects.map((project, index) => (
                  <tr key={project.projectId} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                    <td className="px-4 py-3 text-sm text-gray-900 dark:text-white font-bold">{index + 1}</td>
                    <td className="px-4 py-3 text-sm text-gray-900 dark:text-white max-w-xs truncate">
                      {project.projectTitle}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">{project.projectIndustry}</td>
                    <td className="px-4 py-3 text-sm text-center font-semibold text-blue-600 dark:text-blue-400">{project.totalSelections}</td>
                    <td className="px-4 py-3 text-sm text-center text-gray-900 dark:text-white">{project.rank1Count}</td>
                    <td className="px-4 py-3 text-sm text-center text-gray-900 dark:text-white">{project.rank2Count}</td>
                    <td className="px-4 py-3 text-sm text-center text-gray-900 dark:text-white">{project.rank3Count}</td>
                    <td className="px-4 py-3 text-sm text-center text-gray-900 dark:text-white">{project.rank4Count}</td>
                    <td className="px-4 py-3 text-sm text-center text-gray-900 dark:text-white">{project.rank5Count}</td>
                    <td className="px-4 py-3 text-sm text-center text-gray-600 dark:text-gray-400">{project.averageRank.toFixed(2)}</td>
                    <td className="px-4 py-3 text-sm text-center font-semibold text-green-600 dark:text-green-400">{project.percentageOfLearners}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Unselected Projects Alert */}
      {analytics.unselectedProjects.length > 0 && (
        <div className="card bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800">
          <div className="flex items-start">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3 flex-1">
              <h3 className="text-sm font-medium text-yellow-800 dark:text-yellow-300">
                {analytics.unselectedProjects.length} Projects with Zero Preferences
              </h3>
              <div className="mt-2 text-sm text-yellow-700 dark:text-yellow-400">
                <p>These projects haven't been selected by any learner. Consider reviewing or removing them.</p>
              </div>
              <div className="mt-3">
                <button
                  onClick={() => setShowUnselected(!showUnselected)}
                  className="text-sm font-medium text-yellow-800 dark:text-yellow-300 hover:text-yellow-900 dark:hover:text-yellow-200"
                >
                  {showUnselected ? 'Hide' : 'Show'} unselected projects →
                </button>
              </div>
            </div>
          </div>

          {showUnselected && (
            <div className="mt-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {analytics.unselectedProjects.map((project) => (
                <div key={project.id} className="p-3 bg-white dark:bg-gray-800 rounded border border-yellow-300 dark:border-yellow-700">
                  <h4 className="font-medium text-gray-900 dark:text-white text-sm line-clamp-2">
                    {project.title}
                  </h4>
                  <div className="mt-1 flex items-center gap-2 text-xs text-gray-600 dark:text-gray-400">
                    <span className="truncate">{project.industry}</span>
                    <span>•</span>
                    <span>{project.difficulty}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
