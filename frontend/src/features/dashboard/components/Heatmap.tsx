import { useState, memo } from 'react';
import { format, isSameDay, addDays, startOfDay, getDay, subDays } from 'date-fns';
import { cn } from '@/lib/utils';
import { Card } from '@/design-system/components';

interface HeatmapItem {
    date: Date;
    count: number;
}

export const Heatmap = memo(({ data }: { data: HeatmapItem[] }) => {
    const [hoveredDay, setHoveredDay] = useState<{ date: Date; count: number; x: number; y: number } | null>(null);

    // 1. Normalize today to start of day (00:00:00)
    const today = startOfDay(new Date());
    const endDate = today;
    const startDate = subDays(today, 365);

    const dayOfWeek = getDay(startDate);
    const alignedStartDate = subDays(startDate, dayOfWeek);

    const days: { date: Date; count: number }[] = [];
    let currentDate = alignedStartDate;

    while (currentDate <= endDate) {
        const dayData = data.find(d => isSameDay(d.date, currentDate));
        days.push({ date: currentDate, count: dayData ? dayData.count : 0 });
        currentDate = addDays(currentDate, 1);
    }

    const maxCount = Math.max(...data.map(d => d.count), 0);

    const getIntensityClass = (count: number) => {
        if (count === 0) return 'bg-secondary/50 hover:bg-secondary';

        // Dynamic scaling based on maxCount
        // If maxCount is small (e.g. < 5), use simple linear scale
        // If maxCount is large, use quartiles

        if (maxCount <= 4) {
            if (count >= 4) return 'bg-primary hover:bg-primary';
            if (count === 3) return 'bg-primary/80 hover:bg-primary/90';
            if (count === 2) return 'bg-primary/50 hover:bg-primary/60';
            return 'bg-primary/20 hover:bg-primary/30';
        }

        const ratio = count / maxCount;
        if (ratio > 0.75) return 'bg-primary hover:bg-primary';
        if (ratio > 0.5) return 'bg-primary/80 hover:bg-primary/90';
        if (ratio > 0.25) return 'bg-primary/50 hover:bg-primary/60';
        return 'bg-primary/20 hover:bg-primary/30';
    };

    // Group by weeks (vertical columns)
    const weeks: typeof days[] = [];
    for (let i = 0; i < days.length; i += 7) {
        weeks.push(days.slice(i, i + 7));
    }

    // Generate month labels
    const months = weeks.reduce((acc: { name: string; index: number }[], week, i) => {
        const firstDay = week[0].date;
        const monthName = format(firstDay, 'MMM');
        if (i === 0 || monthName !== format(weeks[i - 1][0].date, 'MMM')) {
            acc.push({ name: monthName, index: i });
        }
        return acc;
    }, []).filter((month, i, arr) => {
        // Check if the next label is too close (less than 2 weeks away)
        if (i < arr.length - 1) {
            const nextMonth = arr[i + 1];
            if (nextMonth.index - month.index < 2) {
                return false; // Skip this label if it's too close to the next one
            }
        }
        return true;
    });

    return (
        <Card className="p-6 shadow-sm relative overflow-hidden mb-8">
            <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-semibold text-foreground">Activity Heatmap</h3>
                <div className="flex items-center space-x-2 text-xs text-muted-foreground">
                    <span>Less</span>
                    <div className="flex space-x-1">
                        <div className="w-2.5 h-2.5 rounded-[2px] bg-secondary/50" />
                        <div className="w-2.5 h-2.5 rounded-[2px] bg-primary/20" />
                        <div className="w-2.5 h-2.5 rounded-[2px] bg-primary/50" />
                        <div className="w-2.5 h-2.5 rounded-[2px] bg-primary/80" />
                        <div className="w-2.5 h-2.5 rounded-[2px] bg-primary" />
                    </div>
                    <span>More</span>
                </div>
            </div>

            <div className="flex">
                {/* Day labels column */}
                <div className="flex flex-col space-y-[2px] pr-2 text-[10px] text-muted-foreground leading-none pt-6">
                    <div className="h-3 flex items-center invisible">Sun</div>
                    <div className="h-3 flex items-center">Mon</div>
                    <div className="h-3 flex items-center invisible">Tue</div>
                    <div className="h-3 flex items-center">Wed</div>
                    <div className="h-3 flex items-center invisible">Thu</div>
                    <div className="h-3 flex items-center">Fri</div>
                    <div className="h-3 flex items-center invisible">Sat</div>
                </div>

                <div className="flex-1 overflow-x-auto pb-2 scrollbar-hide">
                    {/* Month labels Header */}
                    <div className="flex mb-2 text-[10px] text-muted-foreground relative h-4">
                        {months.map((month, i) => (
                            <span
                                key={i}
                                style={{ left: `${month.index * 14}px` }}
                                className="absolute top-0"
                            >
                                {month.name}
                            </span>
                        ))}
                    </div>

                    {/* Grid */}
                    <div className="flex space-x-[2px]">
                        {weeks.map((week, weekIdx) => (
                            <div key={weekIdx} className="flex flex-col space-y-[2px]">
                                {week.map((day, dayIdx) => (
                                    <div
                                        key={dayIdx}
                                        onMouseEnter={(e) => {
                                            const rect = e.currentTarget.getBoundingClientRect();
                                            setHoveredDay({
                                                date: day.date,
                                                count: day.count,
                                                x: rect.left + rect.width / 2,
                                                y: rect.top
                                            });
                                        }}
                                        onMouseLeave={() => setHoveredDay(null)}
                                        className={cn(
                                            "w-3 h-3 rounded-[2px] transition-colors duration-200",
                                            getIntensityClass(day.count)
                                        )}
                                    />
                                ))}
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Custom Tooltip */}
            {hoveredDay && (
                <div
                    className="fixed z-50 px-3 py-1.5 bg-popover text-popover-foreground text-xs rounded-md shadow-lg pointer-events-none transform -translate-x-1/2 -translate-y-full -mt-2 border border-border"
                    style={{ left: hoveredDay.x, top: hoveredDay.y }}
                >
                    <div className="font-medium">{format(hoveredDay.date, 'MMM d, yyyy')}</div>
                    <div className="text-muted-foreground">{hoveredDay.count} submission{hoveredDay.count !== 1 ? 's' : ''}</div>
                </div>
            )}
        </Card>
    );
});
