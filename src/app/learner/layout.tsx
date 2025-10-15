/**
 * Learner Layout
 * 
 * Minimal layout for learner-facing pages
 * Separate from admin/organization layouts
 */

export default function LearnerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 dark:from-gray-900 dark:via-black dark:to-gray-900">
      {children}
    </div>
  );
}
