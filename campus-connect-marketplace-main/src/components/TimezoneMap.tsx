import React, { useEffect, useMemo, useState } from 'react';
import { cn } from '@/lib/utils';

interface TimezoneMapProps {
  selectedTimezone?: string | null;
  onTimezoneSelect: (tzid: string) => void;
  className?: string;
}

const TimezoneMap: React.FC<TimezoneMapProps> = ({ selectedTimezone, onTimezoneSelect, className }) => {
  const [userTimezone, setUserTimezone] = useState<string | null>(null);
  const offsetCache = useMemo(() => new Map<string, number>(), []);
  const timezones = useMemo(() => Array.from({ length: 24 }, (_, i) => i - 12), []);
  const worldMapUrl = 'https://upload.wikimedia.org/wikipedia/commons/8/80/World_map_-_low_resolution.svg';
  const offsetToTimezone = useMemo(
    () =>
      new Map<number, string>([
        [-12, 'Etc/GMT+12'],
        [-11, 'Pacific/Pago_Pago'],
        [-10, 'Pacific/Honolulu'],
        [-9, 'America/Anchorage'],
        [-8, 'America/Los_Angeles'],
        [-7, 'America/Denver'],
        [-6, 'America/Chicago'],
        [-5, 'America/New_York'],
        [-4, 'America/Halifax'],
        [-3, 'America/Sao_Paulo'],
        [-2, 'Atlantic/South_Georgia'],
        [-1, 'Atlantic/Azores'],
        [0, 'Europe/London'],
        [1, 'Europe/Paris'],
        [2, 'Europe/Athens'],
        [3, 'Europe/Moscow'],
        [4, 'Asia/Dubai'],
        [5, 'Asia/Karachi'],
        [6, 'Asia/Dhaka'],
        [7, 'Asia/Bangkok'],
        [8, 'Asia/Singapore'],
        [9, 'Asia/Tokyo'],
        [10, 'Australia/Sydney'],
        [11, 'Pacific/Noumea'],
      ]),
    [],
  );
  const timezoneToOffset = useMemo(() => {
    return new Map<string, number>(Array.from(offsetToTimezone.entries()).map(([offset, tzid]) => [tzid, offset]));
  }, [offsetToTimezone]);

  useEffect(() => {
    setUserTimezone(Intl.DateTimeFormat().resolvedOptions().timeZone);
  }, []);

  const getOffsetMinutes = (tzid: string) => {
    const cached = offsetCache.get(tzid);
    if (cached !== undefined) return cached;
    const parts = new Intl.DateTimeFormat('en-US', {
      timeZone: tzid,
      timeZoneName: 'shortOffset',
    }).formatToParts(new Date());
    const offsetPart = parts.find(part => part.type === 'timeZoneName')?.value ?? 'GMT';
    const match = /GMT([+-])(\d{1,2})(?::(\d{2}))?/.exec(offsetPart);
    if (!match) {
      offsetCache.set(tzid, 0);
      return 0;
    }
    const sign = match[1] === '-' ? -1 : 1;
    const hours = Number(match[2]);
    const minutes = match[3] ? Number(match[3]) : 0;
    const total = sign * (hours * 60 + minutes);
    offsetCache.set(tzid, total);
    return total;
  };

  const getFillColor = (offset: number) => {
    const minOffset = -12;
    const maxOffset = 11;
    const normalized = Math.min(1, Math.max(0, (offset - minOffset) / (maxOffset - minOffset)));
    const hue = 220 - normalized * 220;
    return `hsl(${hue}, 70%, 55%)`;
  };

  const clampOffset = (offset: number) => Math.max(-12, Math.min(11, offset));
  const selectedOffset = selectedTimezone
    ? clampOffset(timezoneToOffset.get(selectedTimezone) ?? Math.round(getOffsetMinutes(selectedTimezone) / 60))
    : null;
  const userOffset = userTimezone
    ? clampOffset(timezoneToOffset.get(userTimezone) ?? Math.round(getOffsetMinutes(userTimezone) / 60))
    : null;

  return (
    <div className={cn('rounded-lg border border-border bg-muted/70 overflow-hidden', className)}>
      <div className="p-4">
        <svg viewBox="0 0 360 180" width="100%" height="300">
          <image
            href={worldMapUrl}
            x={0}
            y={0}
            width={360}
            height={180}
            preserveAspectRatio="none"
            opacity={0.4}
            pointerEvents="none"
          />
          {timezones.map((offset, i) => {
            const tzid = offsetToTimezone.get(offset);
            const isSelected = selectedOffset === offset;
            const isUser = userOffset === offset;
            const stroke = isSelected ? '#f43f5e' : isUser ? '#2563eb' : 'rgba(15, 23, 42, 0.35)';
            const opacity = isSelected ? 0.75 : isUser ? 0.55 : 0.35;
            return (
              <rect
                key={offset}
                x={i * 15}
                y={0}
                width={15}
                height={180}
                fill={getFillColor(offset)}
                opacity={opacity}
                stroke={stroke}
                strokeWidth={isSelected || isUser ? 2 : 1}
                onClick={() => {
                  if (!tzid) return;
                  onTimezoneSelect(tzid);
                }}
                style={{ cursor: 'pointer' }}
              />
            );
          })}
          <rect x={0} y={0} width={360} height={180} fill="none" stroke="rgba(15, 23, 42, 0.35)" />
        </svg>
      </div>
    </div>
  );
};

export default TimezoneMap;
