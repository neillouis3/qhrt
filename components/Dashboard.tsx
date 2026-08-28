'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import Modal from '@/components/Modal';
import AssessmentRenderer from '@/components/AssessmentRenderer';

interface DashboardProps {
  userId?: string;
  userName?: string;
  userEmail?: string;
  onIntakeComplete: boolean;
}

interface UserProgress {
  intake_completed: boolean;
  sessions_completed: number;
  last_session_date: string | null;
  avg_stress_before: number | null;
  avg_stress_after: number | null;
}

interface SelectedCondition {
  id: string;
  condition_id: string;
  date_selected: string;
  conditions: {
    id: string;
    name: string;
    short_description: string | null;
    condition_categories: {
      id: string;
      name: string;
    };
  };
}

interface AssessmentResult {
  id: string;
  question_id: string;
  answer_value: number;
  answered_at: string;
  assessment_questions: {
    id: string;
    question_text: string;
    minimum_value: number;
    maximum_value: number;
  };
}

const sessionCards = [
  {
    id: 1,
    title: 'Session 1: Grounding and Nervous System Reset',
    description:
      'A calming, structured first experience focused on settling physiological activation and building confidence.',
    duration: '12-15 minutes',
    status: 'available',
    color: 'from-teal-500 to-emerald-500',
  },
  {
    id: 2,
    title: 'Session 2: Releasing Physical Tension',
    description: 'Body tension awareness, controlled release, and increased somatic safety.',
    duration: '15-20 minutes',
    status: 'locked',
    color: 'from-blue-500 to-indigo-500',
  },
];

export default function Dashboard({
  userId,
  userName,
  userEmail,
  onIntakeComplete,
}: DashboardProps) {
  const [progress, setProgress] = useState<UserProgress | null>(null);
  const [selectedConditions, setSelectedConditions] = useState<SelectedCondition[]>([]);
  const [assessmentResults, setAssessmentResults] = useState<Record<string, AssessmentResult[]>>(
    {}
  );
  const [loading, setLoading] = useState(true);

  // Assessment modal state
  const [assessmentModalOpen, setAssessmentModalOpen] = useState(false);
  const [activeConditionId, setActiveConditionId] = useState<string | null>(null);
  const [activeConditionName, setActiveConditionName] = useState<string>('');

  const fetchAllData = useCallback(async () => {
    try {
      const res = await fetch('/api/user/dashboard');
      if (!res.ok) return;

      const data = await res.json();
      if (data.progress) setProgress(data.progress);
      if (Array.isArray(data.selectedConditions)) {
        setSelectedConditions(data.selectedConditions);
      }
      if (data.assessmentResults) {
        setAssessmentResults(data.assessmentResults);
      }
    } catch (err) {
      console.error('[Dashboard] Failed to fetch data:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (userId) fetchAllData();
  }, [userId, fetchAllData]);

  const displayName = userName ? userName.split('@')[0] : (userEmail?.split('@')[0] ?? 'there');

  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';

  // Calculate average score for a condition's latest assessment
  const getLatestAverageScore = (conditionId: string) => {
    const results = assessmentResults[conditionId];
    if (!results || results.length === 0) return null;

    // Get the most recent assessment date
    const dates = results.map((r) => r.answered_at).sort();
    const latestDate = dates[dates.length - 1];
    const latestResults = results.filter((r) => r.answered_at === latestDate);

    if (latestResults.length === 0) return null;

    const avg = latestResults.reduce((sum, r) => sum + r.answer_value, 0) / latestResults.length;
    return avg.toFixed(1);
  };

  // Get assessment count for a condition
  const getAssessmentCount = (conditionId: string) => {
    const results = assessmentResults[conditionId];
    if (!results || results.length === 0) return 0;

    // Count unique assessment dates
    const dates = new Set(results.map((r) => r.answered_at.split('T')[0]));
    return dates.size;
  };

  // Memoize per-condition score and count computations (used in the render loop)
  const conditionStats = useMemo(
    () =>
      new Map(
        Object.entries(assessmentResults).map(([conditionId]) => [
          conditionId,
          {
            latestScore: getLatestAverageScore(conditionId),
            assessmentCount: getAssessmentCount(conditionId),
          },
        ])
      ),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [assessmentResults]
  );

  return (
    <div className="flex flex-col flex-1 w-full max-w-4xl mx-auto px-6 py-12">
      {/* Header */}
      <div className="mb-10">
        <h1 className="text-3xl font-semibold text-foreground dark:text-white">
          {greeting}, {displayName}
        </h1>
        <p className="mt-1 text-muted dark:text-muted">
          Your space for grounding and nervous system regulation.
        </p>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <p className="text-muted">Loading your progress...</p>
        </div>
      ) : (
        <>
          {/* Quick stats */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-10">
            <div className="rounded-xl border border-border bg-background p-5 dark:bg-navy">
              <p className="text-xs text-muted uppercase tracking-wider">Sessions completed</p>
              <p className="mt-1 text-2xl font-semibold text-foreground dark:text-white">
                {progress?.sessions_completed ?? 0}
              </p>
            </div>
            <div className="rounded-xl border border-border bg-background p-5 dark:bg-navy">
              <p className="text-xs text-muted uppercase tracking-wider">Avg stress (before)</p>
              <p className="mt-1 text-2xl font-semibold text-foreground dark:text-white">
                {progress?.avg_stress_before != null ? progress.avg_stress_before.toFixed(1) : '—'}
              </p>
            </div>
            <div className="rounded-xl border border-border bg-background p-5 dark:bg-navy">
              <p className="text-xs text-muted uppercase tracking-wider">Avg stress (after)</p>
              <p className="mt-1 text-2xl font-semibold text-foreground dark:text-white">
                {progress?.avg_stress_after != null ? progress.avg_stress_after.toFixed(1) : '—'}
              </p>
            </div>
          </div>

          {/* Selected Conditions Progress */}
          {selectedConditions.length > 0 && (
            <div className="mb-10">
              <h2 className="text-lg font-semibold text-foreground dark:text-white mb-4">
                Your Focus Areas
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {selectedConditions.map((cond) => {
                  const stats = conditionStats.get(cond.condition_id);
                  const latestScore = stats?.latestScore ?? null;
                  const assessmentCount = stats?.assessmentCount ?? 0;

                  return (
                    <div
                      key={cond.id}
                      className="rounded-xl border border-border bg-background p-5 dark:bg-navy hover:border-primary/30 transition-colors"
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <h3 className="font-medium text-foreground dark:text-white">
                            {cond.conditions.name}
                          </h3>
                          <p className="text-xs text-muted mt-0.5">
                            {cond.conditions.condition_categories?.name}
                          </p>
                        </div>
                        {latestScore && (
                          <div
                            className={`px-2 py-1 rounded-full text-xs font-medium ${
                              parseFloat(latestScore) <= 3
                                ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400'
                                : parseFloat(latestScore) <= 6
                                  ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400'
                                  : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
                            }`}
                          >
                            {latestScore}/10
                          </div>
                        )}
                      </div>

                      <div className="flex items-center gap-4 text-xs text-muted">
                        <span>
                          {assessmentCount} assessment{assessmentCount !== 1 ? 's' : ''}
                        </span>
                        <span>•</span>
                        <span>Selected {new Date(cond.date_selected).toLocaleDateString()}</span>
                      </div>

                      {cond.conditions.short_description && (
                        <p className="mt-3 text-sm text-muted line-clamp-2">
                          {cond.conditions.short_description}
                        </p>
                      )}

                      <div className="mt-4 flex gap-2">
                        <button
                          onClick={() => {
                            setActiveConditionId(cond.condition_id);
                            setActiveConditionName(cond.conditions.name);
                            setAssessmentModalOpen(true);
                          }}
                          className="px-3 py-1.5 text-xs font-medium rounded-lg bg-primary text-white hover:bg-primary-dark transition-colors dark:bg-primary-light dark:hover:bg-primary"
                        >
                          Take Assessment
                        </button>
                        <button className="px-3 py-1.5 text-xs font-medium rounded-lg border border-border hover:bg-muted/5 transition-colors">
                          View Progress
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Available sessions */}
          <div className="mb-10">
            <h2 className="text-lg font-semibold text-foreground dark:text-white mb-4">
              Your sessions
            </h2>
            <div className="space-y-4">
              {sessionCards.map((session) => (
                <div
                  key={session.id}
                  className={`
                    relative overflow-hidden rounded-xl border border-border p-6 transition-colors
                    ${
                      session.status === 'locked'
                        ? 'opacity-50 cursor-not-allowed'
                        : 'hover:border-primary/30 cursor-pointer bg-background dark:bg-navy'
                    }
                  `}
                >
                  {session.status === 'locked' && (
                    <div className="absolute inset-0 bg-background/60 dark:bg-navy/60 flex items-center justify-center z-10">
                      <span className="px-3 py-1 rounded-full bg-border text-xs font-medium text-muted">
                        Complete Session 1 first
                      </span>
                    </div>
                  )}
                  <div className="flex items-start gap-4">
                    <div
                      className={`w-12 h-12 rounded-lg bg-gradient-to-br ${session.color} flex-shrink-0`}
                    />
                    <div className="flex-1">
                      <h3 className="font-medium text-foreground dark:text-white">
                        {session.title}
                      </h3>
                      <p className="mt-1 text-sm text-muted dark:text-muted">
                        {session.description}
                      </p>
                      <p className="mt-2 text-xs text-muted">Duration: {session.duration}</p>
                    </div>
                    <button
                      onClick={() => {
                        if (session.status === 'available') {
                          // Navigate to session
                        }
                      }}
                      className={`
                        px-4 py-2 text-sm font-medium rounded-lg transition-colors
                        ${
                          session.status === 'available'
                            ? 'bg-primary text-white hover:bg-primary-dark dark:bg-primary-light dark:hover:bg-primary'
                            : 'bg-border text-muted cursor-not-allowed'
                        }
                      `}
                    >
                      {session.status === 'available' ? 'Start' : 'Locked'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Quick actions */}
          <div>
            <h2 className="text-lg font-semibold text-foreground dark:text-white mb-4">
              Quick actions
            </h2>
            <div className="flex flex-wrap gap-3">
              <button className="px-4 py-2 text-sm font-medium text-foreground border border-border rounded-lg hover:bg-muted/5 dark:hover:bg-navy-light/20 transition-colors">
                View progress
              </button>
              <button className="px-4 py-2 text-sm font-medium text-foreground border border-border rounded-lg hover:bg-muted/5 dark:hover:bg-navy-light/20 transition-colors">
                Write a reflection
              </button>
              <button className="px-4 py-2 text-sm font-medium text-foreground border border-border rounded-lg hover:bg-muted/5 dark:hover:bg-navy-light/20 transition-colors">
                Breathing exercise
              </button>
            </div>
          </div>
        </>
      )}

      {/* Assessment Modal */}
      <Modal
        isOpen={assessmentModalOpen}
        onClose={() => {
          setAssessmentModalOpen(false);
          setActiveConditionId(null);
          setActiveConditionName('');
        }}
        title="Assessment"
        size="lg"
      >
        {activeConditionId && (
          <AssessmentRenderer
            conditionId={activeConditionId}
            conditionName={activeConditionName}
            onComplete={() => {
              setAssessmentModalOpen(false);
              setActiveConditionId(null);
              setActiveConditionName('');
              // Refresh dashboard data to show updated scores
              fetchAllData();
            }}
            onCancel={() => {
              setAssessmentModalOpen(false);
              setActiveConditionId(null);
              setActiveConditionName('');
            }}
          />
        )}
      </Modal>
    </div>
  );
}
