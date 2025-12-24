import { useCallback, useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { TransitionType } from '@/domain/entities/Transition';
import { TRANSITION_DURATIONS, DEFAULT_TRANSITION_DURATION } from '@/domain/entities/Transition';
import type { Seconds } from '@/domain/types';

interface TransitionPickerProps {
  /** Currently selected transition type (null if no transition) */
  currentType: TransitionType | null;
  /** Currently selected duration */
  currentDuration: Seconds;
  /** Maximum allowed duration based on clip lengths */
  maxDuration: Seconds;
  /** Called when user selects a transition */
  onSelect: (type: TransitionType, duration: Seconds) => void;
  /** Called when user removes the transition */
  onRemove: () => void;
}

/**
 * TransitionPicker - UI for selecting transition type and duration between clips
 *
 * Displays as a small button between clips that expands to show options
 */
export function TransitionPicker({
  currentType,
  currentDuration,
  maxDuration,
  onSelect,
  onRemove,
}: TransitionPickerProps) {
  const { t } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const [selectedDuration, setSelectedDuration] = useState(
    currentDuration || DEFAULT_TRANSITION_DURATION
  );

  const hasTransition = currentType && currentType !== 'none';

  const handleTypeSelect = useCallback(
    (type: TransitionType) => {
      if (type === 'none') {
        onRemove();
      } else {
        onSelect(type, selectedDuration);
      }
      setIsOpen(false);
    },
    [onSelect, onRemove, selectedDuration]
  );

  const handleDurationChange = useCallback(
    (duration: Seconds) => {
      setSelectedDuration(duration);
      if (currentType && currentType !== 'none') {
        onSelect(currentType, duration);
      }
    },
    [currentType, onSelect]
  );

  // Filter available durations based on max
  const availableDurations = TRANSITION_DURATIONS.filter((d) => d <= maxDuration);

  return (
    <div className="relative flex items-center justify-center">
      {/* Trigger Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`
          group relative w-6 h-6 rounded-full border-2 transition-all duration-200
          flex items-center justify-center
          ${
            hasTransition
              ? 'bg-indigo-600 border-indigo-500 hover:bg-indigo-500'
              : 'bg-zinc-800 border-zinc-600 hover:border-indigo-500 hover:bg-zinc-700'
          }
        `}
        title={hasTransition ? `${currentType} (${currentDuration}s)` : t('transitions.addTransition')}
      >
        {hasTransition ? (
          <TransitionIcon type={currentType!} className="w-3 h-3 text-white" />
        ) : (
          <svg
            className="w-3 h-3 text-zinc-400 group-hover:text-indigo-400 transition-colors"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 4v16m8-8H4"
            />
          </svg>
        )}
      </button>

      {/* Dropdown Panel */}
      {isOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-10"
            onClick={() => setIsOpen(false)}
          />

          {/* Panel */}
          <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 z-20">
            <div className="bg-zinc-800 border border-zinc-700 rounded-lg shadow-xl p-3 min-w-[200px]">
              <div className="text-xs font-medium text-zinc-400 mb-2">
                {t('transitions.type')}
              </div>

              {/* Transition Type Options */}
              <div className="grid grid-cols-2 gap-1.5 mb-3">
                <TransitionOption
                  type="none"
                  label={t('transitions.none')}
                  isSelected={!hasTransition}
                  onClick={() => handleTypeSelect('none')}
                />
                <TransitionOption
                  type="crossfade"
                  label={t('transitions.crossfade')}
                  isSelected={currentType === 'crossfade'}
                  onClick={() => handleTypeSelect('crossfade')}
                />
                <TransitionOption
                  type="fadeToBlack"
                  label={t('transitions.fadeBlack')}
                  isSelected={currentType === 'fadeToBlack'}
                  onClick={() => handleTypeSelect('fadeToBlack')}
                />
                <TransitionOption
                  type="fadeToWhite"
                  label={t('transitions.fadeWhite')}
                  isSelected={currentType === 'fadeToWhite'}
                  onClick={() => handleTypeSelect('fadeToWhite')}
                />
              </div>

              {/* Duration Selector */}
              {hasTransition && availableDurations.length > 0 && (
                <>
                  <div className="text-xs font-medium text-zinc-400 mb-2">
                    {t('transitions.duration')}
                  </div>
                  <div className="flex gap-1.5">
                    {availableDurations.map((duration) => (
                      <button
                        key={duration}
                        onClick={() => handleDurationChange(duration)}
                        className={`
                          flex-1 px-2 py-1.5 text-xs rounded transition-colors
                          ${
                            selectedDuration === duration
                              ? 'bg-indigo-600 text-white'
                              : 'bg-zinc-700 text-zinc-300 hover:bg-zinc-600'
                          }
                        `}
                      >
                        {duration}s
                      </button>
                    ))}
                  </div>
                </>
              )}

              {/* Warning if max duration is very small */}
              {maxDuration < 0.5 && (
                <div className="mt-2 text-xs text-amber-400">
                  {t('transitions.clipsTooShort')}
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

/**
 * Individual transition type option button
 */
function TransitionOption({
  type,
  label,
  isSelected,
  onClick,
}: {
  type: TransitionType;
  label: string;
  isSelected: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`
        flex items-center gap-1.5 px-2 py-1.5 rounded text-xs transition-colors
        ${
          isSelected
            ? 'bg-indigo-600 text-white'
            : 'bg-zinc-700 text-zinc-300 hover:bg-zinc-600'
        }
      `}
    >
      <TransitionIcon type={type} className="w-3.5 h-3.5" />
      <span>{label}</span>
    </button>
  );
}

/**
 * Icon representing each transition type
 */
function TransitionIcon({
  type,
  className = '',
}: {
  type: TransitionType;
  className?: string;
}) {
  switch (type) {
    case 'none':
      return (
        <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M6 18L18 6M6 6l12 12"
          />
        </svg>
      );

    case 'crossfade':
      return (
        <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M8 7h12M8 12h12M8 17h12M4 7h.01M4 12h.01M4 17h.01"
          />
        </svg>
      );

    case 'fadeToBlack':
      return (
        <svg className={className} viewBox="0 0 24 24" fill="currentColor">
          <rect x="3" y="3" width="18" height="18" rx="2" opacity="0.8" />
        </svg>
      );

    case 'fadeToWhite':
      return (
        <svg className={className} viewBox="0 0 24 24" stroke="currentColor" fill="none">
          <rect
            x="3"
            y="3"
            width="18"
            height="18"
            rx="2"
            strokeWidth={2}
          />
        </svg>
      );

    default:
      return null;
  }
}
