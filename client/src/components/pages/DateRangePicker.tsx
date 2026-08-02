import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import * as pagesApi from '../../api/pages';

interface DateRangePickerProps {
  pageId: string;
  workspaceId: string;
  initialStartDate: string | null;
  initialEndDate: string | null;
}

/**
 * Two date inputs for start/end date with client-side validation.
 * Mounted in PageHeader as a collapsible Properties section.
 */
export default function DateRangePicker({
  pageId,
  workspaceId,
  initialStartDate,
  initialEndDate,
}: DateRangePickerProps) {
  const [startDate, setStartDate] = useState(initialStartDate ? initialStartDate.slice(0, 10) : '');
  const [endDate, setEndDate] = useState(initialEndDate ? initialEndDate.slice(0, 10) : '');
  const [isOpen, setIsOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setStartDate(initialStartDate ? initialStartDate.slice(0, 10) : '');
    setEndDate(initialEndDate ? initialEndDate.slice(0, 10) : '');
  }, [pageId, initialStartDate, initialEndDate]);

  const save = async (newStart: string, newEnd: string) => {
    setError(null);

    // Client-side validation
    if (newStart && newEnd && newEnd < newStart) {
      setError('End date must be on or after start date');
      return;
    }

    try {
      await pagesApi.updatePage(workspaceId, pageId, {
        startDate: newStart ? new Date(newStart).toISOString() : null,
        endDate: newEnd ? new Date(newEnd).toISOString() : null,
      });
    } catch {
      toast.error('Failed to save dates');
    }
  };

  const handleStartChange = (val: string) => {
    setStartDate(val);
    save(val, endDate);
  };

  const handleEndChange = (val: string) => {
    setEndDate(val);
    save(startDate, val);
  };

  const clearDates = async () => {
    setStartDate('');
    setEndDate('');
    setError(null);
    try {
      await pagesApi.updatePage(workspaceId, pageId, {
        startDate: null,
        endDate: null,
      });
    } catch {
      toast.error('Failed to clear dates');
    }
  };

  const hasAnyDate = startDate || endDate;

  return (
    <div style={{ marginBottom: 'var(--space-4)' }}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 'var(--space-2)',
          padding: 'var(--space-1) var(--space-2)',
          fontSize: 'var(--text-caption)',
          color: 'var(--text-muted)',
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          borderRadius: 'var(--radius-xs)',
          transition: 'var(--transition-fast)',
        }}
        onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--bg-hover)')}
        onMouseLeave={(e) => (e.currentTarget.style.background = 'none')}
      >
        <span style={{ fontSize: '9px', transform: isOpen ? 'rotate(90deg)' : 'rotate(0deg)', transition: 'transform 0.15s' }}>
          ▶
        </span>
        Properties
      </button>

      {isOpen && (
        <div
          style={{
            padding: 'var(--space-3) 0 var(--space-2) var(--space-4)',
            display: 'flex',
            flexDirection: 'column',
            gap: 'var(--space-2)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
            <label style={{ fontSize: 'var(--text-caption)', color: 'var(--text-muted)', width: '70px', flexShrink: 0 }}>
              Start date
            </label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => handleStartChange(e.target.value)}
              style={{
                padding: 'var(--space-1) var(--space-2)',
                fontSize: 'var(--text-ui)',
                borderRadius: 'var(--radius-xs)',
                background: 'var(--bg-canvas)',
                color: 'var(--text-primary)',
                border: '1px solid var(--border)',
                colorScheme: 'dark',
              }}
            />
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
            <label style={{ fontSize: 'var(--text-caption)', color: 'var(--text-muted)', width: '70px', flexShrink: 0 }}>
              End date
            </label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => handleEndChange(e.target.value)}
              style={{
                padding: 'var(--space-1) var(--space-2)',
                fontSize: 'var(--text-ui)',
                borderRadius: 'var(--radius-xs)',
                background: 'var(--bg-canvas)',
                color: 'var(--text-primary)',
                border: '1px solid var(--border)',
                colorScheme: 'dark',
              }}
            />
          </div>

          {error && (
            <p style={{ fontSize: 'var(--text-caption)', color: 'var(--error)', margin: '2px 0 0' }}>
              {error}
            </p>
          )}

          {hasAnyDate && (
            <button
              onClick={clearDates}
              style={{
                alignSelf: 'flex-start',
                padding: '3px 10px',
                fontSize: 'var(--text-caption)',
                color: 'var(--text-muted)',
                background: 'none',
                border: '1px solid var(--border)',
                borderRadius: 'var(--radius-xs)',
                cursor: 'pointer',
                transition: 'var(--transition-fast)',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.borderColor = 'var(--text-primary)')}
              onMouseLeave={(e) => (e.currentTarget.style.borderColor = 'var(--border)')}
            >
              Clear dates
            </button>
          )}
        </div>
      )}
    </div>
  );
}
