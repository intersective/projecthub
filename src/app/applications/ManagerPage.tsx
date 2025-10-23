'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth-context';

interface ProjectApplication {
  id: string;
  projectId: string;
  applicantName: string;
  applicantEmail: string;
  applicantImage: string | null;
  linkedinUrl: string;
  message: string;
  videoUrl: string | null;
  status: string;
  appliedAt: string;
  reviewedAt: string | null;
  reviewedBy: string | null;
  project: {
    title: string;
    industry: string;
    domain: string;
    difficulty: string;
  };
}

// Function to get status color
const getStatusColor = (status: string) => {
  switch (status.toLowerCase()) {
    case 'approved': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
    case 'rejected': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
    case 'pending': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
    default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
  }
};

// Function to get status badge
const getStatusBadge = (status: string) => {
  const icons = {
    approved: (
      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
      </svg>
    ),
    rejected: (
      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
        <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
      </svg>
    ),
    pending: (
      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
      </svg>
    )
  };

  return (
    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-semibold ${getStatusColor(status)}`}>
      {icons[status.toLowerCase() as keyof typeof icons]}
      <span className="uppercase">{status}</span>
    </span>
  );
};

export default function ManagerPage() {
  const { user } = useAuth();
  const [applications, setApplications] = useState<ProjectApplication[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedApplication, setSelectedApplication] = useState<ProjectApplication | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [filter, setFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('pending');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchApplications();
  }, []);

  const fetchApplications = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/applications/all');
      if (response.ok) {
        const data = await response.json();
        setApplications(data.applications || []);
      }
    } catch (error) {
      console.error('Failed to fetch applications:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (applicationId: string) => {
    if (!confirm('Are you sure you want to approve this application?')) {
      return;
    }

    try {
      setProcessing(true);
      const response = await fetch(`/api/applications/${applicationId}/approve`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: 'approved' }),
      });

      if (response.ok) {
        await fetchApplications();
        setShowDetailModal(false);
        alert('Application approved successfully!');
      } else {
        const data = await response.json();
        alert(data.error || 'Failed to approve application');
      }
    } catch (error) {
      console.error('Error approving application:', error);
      alert('Failed to approve application. Please try again.');
    } finally {
      setProcessing(false);
    }
  };

  const handleReject = async (applicationId: string) => {
    if (!confirm('Are you sure you want to reject this application?')) {
      return;
    }

    try {
      setProcessing(true);
      const response = await fetch(`/api/applications/${applicationId}/approve`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: 'rejected' }),
      });

      if (response.ok) {
        await fetchApplications();
        setShowDetailModal(false);
        alert('Application rejected successfully!');
      } else {
        const data = await response.json();
        alert(data.error || 'Failed to reject application');
      }
    } catch (error) {
      console.error('Error rejecting application:', error);
      alert('Failed to reject application. Please try again.');
    } finally {
      setProcessing(false);
    }
  };

  const handleViewDetails = (application: ProjectApplication) => {
    setSelectedApplication(application);
    setShowDetailModal(true);
  };

  // Filter applications
  const filteredApplications = applications.filter(app => {
    const matchesFilter = filter === 'all' || app.status.toLowerCase() === filter.toLowerCase();
    const matchesSearch = searchQuery === '' || 
      app.applicantName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      app.applicantEmail.toLowerCase().includes(searchQuery.toLowerCase()) ||
      app.project.title.toLowerCase().includes(searchQuery.toLowerCase());
    
    return matchesFilter && matchesSearch;
  });

  // Count by status
  const counts = {
    all: applications.length,
    pending: applications.filter(a => a.status === 'pending').length,
    approved: applications.filter(a => a.status === 'approved').length,
    rejected: applications.filter(a => a.status === 'rejected').length,
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white dark:bg-black flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 dark:border-white/20 border-black/20 dark:border-t-white border-t-black rounded-full animate-spin mx-auto mb-4"></div>
          <div className="text-xl text-black dark:text-white">Loading applications...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white dark:bg-black text-gray-900 dark:text-white p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">Project Applications</h1>
          <p className="text-gray-600 dark:text-gray-400">
            Review and manage learner applications to projects
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <button
            onClick={() => setFilter('all')}
            className={`p-6 rounded-2xl border-2 transition-all ${
              filter === 'all'
                ? 'border-blue-600 bg-blue-50 dark:bg-blue-900/20'
                : 'border-gray-200 dark:border-gray-800 hover:border-blue-400'
            }`}
          >
            <div className="text-3xl font-bold mb-1">{counts.all}</div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Total Applications</div>
          </button>

          <button
            onClick={() => setFilter('pending')}
            className={`p-6 rounded-2xl border-2 transition-all ${
              filter === 'pending'
                ? 'border-yellow-600 bg-yellow-50 dark:bg-yellow-900/20'
                : 'border-gray-200 dark:border-gray-800 hover:border-yellow-400'
            }`}
          >
            <div className="text-3xl font-bold mb-1 text-yellow-600">{counts.pending}</div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Pending Review</div>
          </button>

          <button
            onClick={() => setFilter('approved')}
            className={`p-6 rounded-2xl border-2 transition-all ${
              filter === 'approved'
                ? 'border-green-600 bg-green-50 dark:bg-green-900/20'
                : 'border-gray-200 dark:border-gray-800 hover:border-green-400'
            }`}
          >
            <div className="text-3xl font-bold mb-1 text-green-600">{counts.approved}</div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Approved</div>
          </button>

          <button
            onClick={() => setFilter('rejected')}
            className={`p-6 rounded-2xl border-2 transition-all ${
              filter === 'rejected'
                ? 'border-red-600 bg-red-50 dark:bg-red-900/20'
                : 'border-gray-200 dark:border-gray-800 hover:border-red-400'
            }`}
          >
            <div className="text-3xl font-bold mb-1 text-red-600">{counts.rejected}</div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Rejected</div>
          </button>
        </div>

        {/* Search Bar */}
        <div className="mb-6">
          <div className="relative">
            <input
              type="text"
              placeholder="Search by name, email, or project..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-4 py-3 pl-12 rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <svg
              className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
        </div>

        {/* Applications Table */}
        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-800">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Applicant
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Project
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Applied Date
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
                {filteredApplications.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-12 text-center text-gray-500 dark:text-gray-400">
                      {searchQuery ? 'No applications match your search' : `No ${filter} applications found`}
                    </td>
                  </tr>
                ) : (
                  filteredApplications.map((application) => (
                    <tr
                      key={application.id}
                      className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <img
                            src={application.applicantImage || `https://ui-avatars.com/api/?name=${encodeURIComponent(application.applicantName)}&background=random`}
                            alt={application.applicantName}
                            className="w-10 h-10 rounded-full object-cover"
                          />
                          <div>
                            <div className="font-semibold">{application.applicantName}</div>
                            <div className="text-sm text-gray-500 dark:text-gray-400">
                              {application.applicantEmail}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="font-medium">{application.project.title}</div>
                        <div className="text-sm text-gray-500 dark:text-gray-400">
                          {application.project.industry} • {application.project.difficulty}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">
                        {new Date(application.appliedAt).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric'
                        })}
                      </td>
                      <td className="px-6 py-4">
                        {getStatusBadge(application.status)}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleViewDetails(application)}
                            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
                          >
                            View Details
                          </button>
                          {application.status === 'pending' && (
                            <>
                              <button
                                onClick={() => handleApprove(application.id)}
                                disabled={processing}
                                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm font-medium disabled:opacity-50"
                              >
                                Approve
                              </button>
                              <button
                                onClick={() => handleReject(application.id)}
                                disabled={processing}
                                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm font-medium disabled:opacity-50"
                              >
                                Reject
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Detail Modal */}
      {showDetailModal && selectedApplication && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-900 rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200 dark:border-gray-800">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold">Application Details</h2>
                <button
                  onClick={() => setShowDetailModal(false)}
                  className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            <div className="p-6 space-y-6">
              {/* Applicant Info */}
              <div>
                <h3 className="text-lg font-semibold mb-4">Applicant Information</h3>
                <div className="flex items-start gap-4">
                  <img
                    src={selectedApplication.applicantImage || `https://ui-avatars.com/api/?name=${encodeURIComponent(selectedApplication.applicantName)}&background=random`}
                    alt={selectedApplication.applicantName}
                    className="w-20 h-20 rounded-full object-cover"
                  />
                  <div className="flex-1">
                    <div className="text-xl font-semibold mb-1">{selectedApplication.applicantName}</div>
                    <div className="text-gray-600 dark:text-gray-400 mb-2">{selectedApplication.applicantEmail}</div>
                    <a
                      href={selectedApplication.linkedinUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
                    >
                      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"/>
                      </svg>
                      View LinkedIn Profile
                    </a>
                  </div>
                  <div>
                    {getStatusBadge(selectedApplication.status)}
                  </div>
                </div>
              </div>

              {/* Project Info */}
              <div>
                <h3 className="text-lg font-semibold mb-4">Project Details</h3>
                <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-4">
                  <div className="text-xl font-semibold mb-2">{selectedApplication.project.title}</div>
                  <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
                    <span>{selectedApplication.project.industry}</span>
                    <span>•</span>
                    <span>{selectedApplication.project.domain}</span>
                    <span>•</span>
                    <span className="capitalize">{selectedApplication.project.difficulty}</span>
                  </div>
                </div>
              </div>

              {/* Application Message */}
              <div>
                <h3 className="text-lg font-semibold mb-4">Application Message</h3>
                <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-4">
                  <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                    {selectedApplication.message}
                  </p>
                </div>
              </div>

              {/* Video Submission */}
              {selectedApplication.videoUrl && (
                <div>
                  <h3 className="text-lg font-semibold mb-4">Video Introduction</h3>
                  <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-4">
                    <video
                      controls
                      className="w-full rounded-lg"
                      src={selectedApplication.videoUrl}
                    >
                      Your browser does not support the video tag.
                    </video>
                  </div>
                </div>
              )}

              {/* Application Timeline */}
              <div>
                <h3 className="text-lg font-semibold mb-4">Timeline</h3>
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                    <div>
                      <div className="font-medium">Applied</div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">
                        {new Date(selectedApplication.appliedAt).toLocaleString()}
                      </div>
                    </div>
                  </div>
                  {selectedApplication.reviewedAt && (
                    <div className="flex items-center gap-3">
                      <div className={`w-2 h-2 rounded-full ${
                        selectedApplication.status === 'approved' ? 'bg-green-600' : 'bg-red-600'
                      }`}></div>
                      <div>
                        <div className="font-medium capitalize">{selectedApplication.status}</div>
                        <div className="text-sm text-gray-600 dark:text-gray-400">
                          {new Date(selectedApplication.reviewedAt).toLocaleString()}
                          {selectedApplication.reviewedBy && ` by ${selectedApplication.reviewedBy}`}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Actions */}
              {selectedApplication.status === 'pending' && (
                <div className="flex items-center gap-4 pt-4 border-t border-gray-200 dark:border-gray-800">
                  <button
                    onClick={() => handleApprove(selectedApplication.id)}
                    disabled={processing}
                    className="flex-1 px-6 py-3 bg-green-600 text-white rounded-xl hover:bg-green-700 transition-colors font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {processing ? 'Processing...' : 'Approve Application'}
                  </button>
                  <button
                    onClick={() => handleReject(selectedApplication.id)}
                    disabled={processing}
                    className="flex-1 px-6 py-3 bg-red-600 text-white rounded-xl hover:bg-red-700 transition-colors font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {processing ? 'Processing...' : 'Reject Application'}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}