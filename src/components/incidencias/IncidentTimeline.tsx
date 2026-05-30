import { STATUS_CONFIG } from "@/lib/constants";
import { formatDateTime } from "@/lib/date";
import type { TimelineEvent } from "@/types/incident.types";
import { cn } from "@/lib/utils";

interface IncidentTimelineProps {
  events: TimelineEvent[];
}

export function IncidentTimeline({ events }: IncidentTimelineProps) {
  return (
    <div className="relative">
      {events.map((event, i) => {
        const isLast = i === events.length - 1;
        const config = STATUS_CONFIG[event.status];
        return (
          <div key={event.id} className="flex gap-4 pb-6 last:pb-0">
            {/* Line + dot */}
            <div className="flex flex-col items-center">
              <div
                className="w-3 h-3 rounded-full shrink-0 border-2 border-background mt-0.5"
                style={{ background: config.color }}
              />
              {!isLast && <div className="w-px flex-1 mt-1 bg-border" />}
            </div>
            {/* Content */}
            <div className={cn("flex-1", !isLast && "pb-2")}>
              <div className="flex items-baseline justify-between gap-2 mb-0.5">
                <span className="text-sm font-medium text-foreground">{config.label}</span>
                <span className="text-xs font-mono text-muted-foreground shrink-0">{formatDateTime(event.timestamp)}</span>
              </div>
              <p className="text-xs text-muted-foreground">{event.actorName}</p>
              {event.note && (
                <p className="mt-1 text-xs text-foreground/80 bg-accent/40 rounded-md px-2 py-1">{event.note}</p>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
