interface TimelineEvent {
  event: string;
  timestamp: Date | string;
}

interface ProgressTimelineProps {
  status: 'Open' | 'Escalated' | 'Resolved';
  timeline?: TimelineEvent[];
}

const STEPS = ['Open', 'Escalated', 'Resolved'] as const;

function getCompletedIndex(status: string): number {
  if (status === 'Open') return 0;
  if (status === 'Escalated') return 1;
  if (status === 'Resolved') return 2;
  return 0;
}

export default function ProgressTimeline({ status }: ProgressTimelineProps) {
  const completedIdx = getCompletedIndex(status);

  return (
    <div className="flex items-center gap-0" data-testid="progress-timeline">
      {STEPS.map((step, i) => {
        const isCompleted = i <= completedIdx;
        const isLast = i === STEPS.length - 1;

        return (
          <div key={step} className="flex items-center">
            <div className="flex flex-col items-center">
              <div
                className={`w-6 h-6 rounded-full border-2 flex items-center justify-center text-xs font-bold transition-colors ${
                  isCompleted
                    ? 'bg-red-600 border-red-600 text-white'
                    : 'bg-white border-gray-300 text-gray-400'
                }`}
              >
                {isCompleted ? '✓' : i + 1}
              </div>
              <span
                className={`text-xs mt-1 font-medium ${
                  isCompleted ? 'text-red-600' : 'text-gray-400'
                }`}
              >
                {step}
              </span>
            </div>
            {!isLast && (
              <div
                className={`h-0.5 w-12 mx-1 mb-4 ${
                  i < completedIdx ? 'bg-red-600' : 'bg-gray-200'
                }`}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}
