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
    <div style={{ marginBottom: '16px' }}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          padding: '4px 8px',
          fontSize: '12px',
          color: 'var(--text-muted)',
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          borderRadius: 'var(--radius-sm)',
          transition: 'var(--transition-fast)',
        }}
        onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--bg-hover)')}
        onMouseLeave={(e) => (e.currentTarget.style.background = 'none')}
      >
        <span style={{ fontSize: '10px', transform: isOpen ? 'rotate(90deg)' : 'rotate(0deg)', transition: 'transform 0.15s' }}>
          ▶
        </span>
        Properties
      </button>

      {isOpen && (
        <div
          style={{
            padding: '12px 0 8px 16px',
            display: 'flex',
            flexDirection: 'column',
            gap: '8px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <label style={{ fontSize: '12px', color: 'var(--text-muted)', width: '70px', flexShrink: 0 }}>
              Start date
            </label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => handleStartChange(e.target.value)}
              style={{
                padding: '4px 8px',
                fontSize: '13px',
                borderRadius: 'var(--radius-sm)',
                background: 'var(--bg-primary)',
                color: 'var(--text-primary)',
                border: '1px solid var(--border-default)',
                colorScheme: 'dark',
              }}
            />
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <label style={{ fontSize: '12px', color: 'var(--text-muted)', width: '70px', flexShrink: 0 }}>
              End date
            </label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => handleEndChange(e.target.value)}
              style={{
                padding: '4px 8px',
                fontSize: '13px',
                borderRadius: 'var(--radius-sm)',
                background: 'var(--bg-primary)',
                color: 'var(--text-primary)',
                border: '1px solid var(--border-default)',
                colorScheme: 'dark',
              }}
            />
          </div>

          {error && (
            <p style={{ fontSize: '12px', color: 'var(--error)', margin: '2px 0 0' }}>
              {error}
            </p>
          )}

          {hasAnyDate && (
            <button
              onClick={clearDates}
              style={{
                alignSelf: 'flex-start',
                padding: '3px 10px',
                fontSize: '11px',
                color: 'var(--text-muted)',
                background: 'none',
                border: '1px solid var(--border-default)',
                borderRadius: 'var(--radius-sm)',
                cursor: 'pointer',
                transition: 'var(--transition-fast)',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.borderColor = 'var(--text-primary)')}
              onMouseLeave={(e) => (e.currentTarget.style.borderColor = 'var(--border-default)')}
            >
              Clear dates
            </button>
          )}
        </div>
      )}
    </div>
  );
}
