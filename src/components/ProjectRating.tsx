'use client';

import { useState, useEffect } from 'react';

interface ProjectRatingProps {
  projectId: string;
  currentRating?: number | null;
  onRatingChange?: (rating: number) => void;
  compact?: boolean;
}

export default function ProjectRating({ 
  projectId, 
  currentRating, 
  onRatingChange,
  compact = false 
}: ProjectRatingProps) {
  const [rating, setRating] = useState<number | null>(currentRating || null);
  const [isHovering, setIsHovering] = useState<number | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    setRating(currentRating || null);
  }, [currentRating]);

  const handleRate = async (e: React.MouseEvent, newRating: number) => {
    e.stopPropagation(); // Prevent event from bubbling to parent card
    if (isSaving) return;
    
    setIsSaving(true);
    try {
      const response = await fetch('/api/projects/rating', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          projectId,
          rating: newRating 
        })
      });

      if (response.ok) {
        const data = await response.json();
        if (data.rating) {
          setRating(newRating);
          onRatingChange?.(newRating);
        }
      } else {
        console.error('Failed to set rating');
      }
    } catch (error) {
      console.error('Error setting rating:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleRemoveRating = async (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent event from bubbling to parent card
    if (isSaving || !rating) return;
    
    setIsSaving(true);
    try {
      const response = await fetch('/api/projects/rating', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ projectId })
      });

      if (response.ok) {
        setRating(null);
        onRatingChange?.(0);
      }
    } catch (error) {
      console.error('Error removing rating:', error);
    } finally {
      setIsSaving(false);
    }
  };

  if (compact) {
    return (
      <div className="flex items-center gap-1">
        {rating ? (
          <span className="text-xs font-medium text-yellow-600 dark:text-yellow-400">
            Rating: {rating}/5
          </span>
        ) : (
          <span className="text-xs text-gray-400">Not rated</span>
        )}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-gray-700 dark:text-gray-300">
          Rate:
        </span>
        <div className="flex items-center gap-1">
          {[1, 2, 3, 4, 5].map((num) => (
            <button
              key={num}
              onClick={(e) => handleRate(e, num)}
              onMouseEnter={() => setIsHovering(num)}
              onMouseLeave={() => setIsHovering(null)}
              disabled={isSaving}
              className={`transition-all ${isSaving ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:scale-110'}`}
              title={`Rating ${num} ${num === 5 ? '(Most Preferred)' : num === 1 ? '(Least Preferred)' : ''}`}
            >
              <svg
                className={`w-6 h-6 transition-colors ${
                  (isHovering !== null ? num <= isHovering : num <= (rating || 0))
                    ? 'text-yellow-500 fill-yellow-500'
                    : 'text-gray-300 dark:text-gray-600 fill-none stroke-current'
                }`}
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                strokeWidth="1.5"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z"
                />
              </svg>
            </button>
          ))}
          {rating && (
            <button
              onClick={handleRemoveRating}
              disabled={isSaving}
              className="ml-2 text-red-500 hover:text-red-600 dark:text-red-400 dark:hover:text-red-300 text-xs font-medium hover:scale-110 transition-transform"
              title="Remove rating"
            >
              ✕
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
