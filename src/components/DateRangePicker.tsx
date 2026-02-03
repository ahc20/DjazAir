"use client";

import React, { useState, useRef, useEffect } from "react";
import { Calendar, ChevronLeft, ChevronRight, X, ArrowRight, Plane } from "lucide-react";
import { cn } from "@/lib/utils";

interface DateRangePickerProps {
    departDate: string;
    returnDate?: string;
    onDepartDateChange: (date: string) => void;
    onReturnDateChange: (date: string) => void;
    isRoundTrip: boolean;
    onTripTypeChange: (isRoundTrip: boolean) => void;
    error?: string;
}

const MONTHS_FR = [
    "Janvier", "Février", "Mars", "Avril", "Mai", "Juin",
    "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre"
];

const DAYS_FR = ["Lu", "Ma", "Me", "Je", "Ve", "Sa", "Di"];

const QUICK_ACTIONS = [
    {
        label: "Ce week-end", days: () => {
            const today = new Date();
            const saturday = new Date(today);
            const daysUntilSaturday = (6 - today.getDay() + 7) % 7 || 7;
            saturday.setDate(today.getDate() + daysUntilSaturday);
            return { depart: saturday, duration: 2 };
        }
    },
    { label: "+1 semaine", days: () => ({ depart: new Date(), duration: 7 }) },
    { label: "+2 semaines", days: () => ({ depart: new Date(), duration: 14 }) },
];

// Helper to parse YYYY-MM-DD as local date (not UTC)
const parseLocalDate = (dateStr: string): Date => {
    const [year, month, day] = dateStr.split('-').map(Number);
    return new Date(year, month - 1, day);
};

// Helper to format date as YYYY-MM-DD using local timezone
const formatLocalDate = (date: Date): string => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
};

export function DateRangePicker({
    departDate,
    returnDate,
    onDepartDateChange,
    onReturnDateChange,
    isRoundTrip,
    onTripTypeChange,
    error,
}: DateRangePickerProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [currentMonth, setCurrentMonth] = useState(new Date());
    const [selectingReturn, setSelectingReturn] = useState(false);
    const [hoveredDate, setHoveredDate] = useState<Date | null>(null);
    const containerRef = useRef<HTMLDivElement>(null);

    // Close on click outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };

        if (isOpen) {
            document.addEventListener("mousedown", handleClickOutside);
        }
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [isOpen]);

    // Parse dates using local timezone
    const parsedDepartDate = departDate ? parseLocalDate(departDate) : null;
    const parsedReturnDate = returnDate ? parseLocalDate(returnDate) : null;
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Format date for display
    const formatDisplayDate = (dateStr: string | undefined) => {
        if (!dateStr) return "Sélectionner";
        const date = parseLocalDate(dateStr);
        return date.toLocaleDateString("fr-FR", {
            weekday: "short",
            day: "numeric",
            month: "short",
        });
    };

    // Generate calendar days for a month
    const generateCalendarDays = (monthDate: Date) => {
        const year = monthDate.getFullYear();
        const month = monthDate.getMonth();
        const firstDay = new Date(year, month, 1);
        const lastDay = new Date(year, month + 1, 0);

        // Get the day of week for first day (0 = Sunday, convert to Monday-based)
        let startDayOfWeek = firstDay.getDay() - 1;
        if (startDayOfWeek < 0) startDayOfWeek = 6;

        const days: (Date | null)[] = [];

        // Add empty slots for days before first of month
        for (let i = 0; i < startDayOfWeek; i++) {
            days.push(null);
        }

        // Add all days of the month
        for (let i = 1; i <= lastDay.getDate(); i++) {
            days.push(new Date(year, month, i));
        }

        return days;
    };

    // Check if a date is in range
    const isInRange = (date: Date) => {
        if (!parsedDepartDate) return false;

        const endDate = selectingReturn && hoveredDate
            ? hoveredDate
            : parsedReturnDate;

        if (!endDate) return false;

        return date > parsedDepartDate && date < endDate;
    };

    // Check if date is the start of range
    const isRangeStart = (date: Date) => {
        return parsedDepartDate && date.toDateString() === parsedDepartDate.toDateString();
    };

    // Check if date is the end of range
    const isRangeEnd = (date: Date) => {
        const endDate = selectingReturn && hoveredDate ? hoveredDate : parsedReturnDate;
        return endDate && date.toDateString() === endDate.toDateString();
    };

    // Handle day click
    const handleDayClick = (date: Date) => {
        const dateStr = formatLocalDate(date);

        if (!isRoundTrip) {
            onDepartDateChange(dateStr);
            setIsOpen(false);
            return;
        }

        if (!selectingReturn) {
            onDepartDateChange(dateStr);
            onReturnDateChange(""); // Clear return date
            setSelectingReturn(true);
        } else {
            if (date > parsedDepartDate!) {
                onReturnDateChange(dateStr);
                setSelectingReturn(false);
                setIsOpen(false);
            } else {
                // If clicked date is before depart, set as new depart
                onDepartDateChange(dateStr);
                onReturnDateChange("");
            }
        }
    };

    // Handle quick action
    const handleQuickAction = (action: typeof QUICK_ACTIONS[0]) => {
        const { depart, duration } = action.days();
        const departDateObj = new Date(depart);
        departDateObj.setDate(departDateObj.getDate() + (action.label === "Ce week-end" ? 0 : 1));

        const returnDateObj = new Date(departDateObj);
        returnDateObj.setDate(returnDateObj.getDate() + duration);

        onDepartDateChange(formatLocalDate(departDateObj));
        if (isRoundTrip) {
            onReturnDateChange(formatLocalDate(returnDateObj));
        }
        setIsOpen(false);
    };

    // Navigate months
    const prevMonth = () => {
        setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1));
    };

    const nextMonth = () => {
        setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1));
    };

    // Get second month for desktop view
    const secondMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1);

    // Render a single month
    const renderMonth = (monthDate: Date, isSecond = false) => {
        const days = generateCalendarDays(monthDate);

        return (
            <div className={cn("flex-1", isSecond && "hidden md:block border-l border-gray-100 pl-4")}>
                <div className="text-center font-semibold text-gray-900 mb-4">
                    {MONTHS_FR[monthDate.getMonth()]} {monthDate.getFullYear()}
                </div>

                {/* Day headers */}
                <div className="grid grid-cols-7 gap-1 mb-2">
                    {DAYS_FR.map((day) => (
                        <div key={day} className="text-center text-xs font-medium text-gray-500 py-1">
                            {day}
                        </div>
                    ))}
                </div>

                {/* Days grid */}
                <div className="grid grid-cols-7 gap-1">
                    {days.map((date, index) => {
                        if (!date) {
                            return <div key={`empty-${index}`} className="h-10" />;
                        }

                        const isPast = date < today;
                        const isSelected = isRangeStart(date) || isRangeEnd(date);
                        const inRange = isInRange(date);
                        const isToday = date.toDateString() === today.toDateString();

                        return (
                            <button
                                key={date.toISOString()}
                                type="button"
                                disabled={isPast}
                                onClick={() => handleDayClick(date)}
                                onMouseEnter={() => selectingReturn && setHoveredDate(date)}
                                onMouseLeave={() => setHoveredDate(null)}
                                className={cn(
                                    "h-10 w-full rounded-lg text-sm font-medium transition-all duration-150",
                                    "focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-1",
                                    isPast && "text-gray-300 cursor-not-allowed",
                                    !isPast && !isSelected && !inRange && "text-gray-700 hover:bg-emerald-50",
                                    isToday && !isSelected && "border-2 border-emerald-300",
                                    isSelected && "bg-emerald-600 text-white hover:bg-emerald-700",
                                    inRange && "bg-emerald-100 text-emerald-800",
                                    isRangeStart(date) && isRoundTrip && "rounded-r-none",
                                    isRangeEnd(date) && isRoundTrip && "rounded-l-none",
                                )}
                            >
                                {date.getDate()}
                            </button>
                        );
                    })}
                </div>
            </div>
        );
    };

    return (
        <div ref={containerRef} className="relative w-full">
            {/* Trip Type Toggle */}
            <div className="flex gap-1 p-1 bg-gray-100/80 rounded-xl w-fit mb-4">
                <button
                    type="button"
                    onClick={() => {
                        onTripTypeChange(false);
                        onReturnDateChange("");
                    }}
                    className={cn(
                        "px-4 py-2.5 text-sm font-medium rounded-lg transition-all duration-200",
                        "flex items-center gap-2",
                        !isRoundTrip
                            ? "bg-white text-emerald-700 shadow-sm"
                            : "text-gray-500 hover:text-gray-700"
                    )}
                >
                    <Plane className="h-4 w-4" />
                    Aller simple
                </button>
                <button
                    type="button"
                    onClick={() => {
                        onTripTypeChange(true);
                        // Auto-set return date if depart exists
                        if (departDate && !returnDate) {
                            const dep = new Date(departDate);
                            dep.setDate(dep.getDate() + 7);
                            onReturnDateChange(formatLocalDate(dep));
                        }
                    }}
                    className={cn(
                        "px-4 py-2.5 text-sm font-medium rounded-lg transition-all duration-200",
                        "flex items-center gap-2",
                        isRoundTrip
                            ? "bg-white text-emerald-700 shadow-sm"
                            : "text-gray-500 hover:text-gray-700"
                    )}
                >
                    <ArrowRight className="h-4 w-4 rotate-90 md:rotate-0" />
                    Aller-retour
                </button>
            </div>

            {/* Date Display Buttons */}
            <div className={cn(
                "grid gap-3",
                isRoundTrip ? "grid-cols-1 md:grid-cols-2" : "grid-cols-1"
            )}>
                {/* Departure Date */}
                <button
                    type="button"
                    onClick={() => {
                        setIsOpen(true);
                        setSelectingReturn(false);
                    }}
                    className={cn(
                        "flex items-center gap-3 p-4 rounded-xl border-2 transition-all duration-200",
                        "text-left group",
                        isOpen && !selectingReturn
                            ? "border-emerald-500 bg-emerald-50"
                            : "border-gray-200 hover:border-emerald-300 bg-white",
                        error && "border-red-300"
                    )}
                >
                    <div className={cn(
                        "p-2 rounded-lg transition-colors",
                        isOpen && !selectingReturn ? "bg-emerald-100" : "bg-gray-100 group-hover:bg-emerald-100"
                    )}>
                        <Calendar className={cn(
                            "h-5 w-5",
                            isOpen && !selectingReturn ? "text-emerald-600" : "text-gray-500 group-hover:text-emerald-600"
                        )} />
                    </div>
                    <div className="flex-1 min-w-0">
                        <div className="text-xs font-medium text-gray-500 mb-0.5">
                            Départ
                        </div>
                        <div className={cn(
                            "text-base font-semibold truncate",
                            departDate ? "text-gray-900" : "text-gray-400"
                        )}>
                            {formatDisplayDate(departDate)}
                        </div>
                    </div>
                </button>

                {/* Return Date (only if round trip) */}
                {isRoundTrip && (
                    <button
                        type="button"
                        onClick={() => {
                            setIsOpen(true);
                            setSelectingReturn(true);
                        }}
                        className={cn(
                            "flex items-center gap-3 p-4 rounded-xl border-2 transition-all duration-200",
                            "text-left group",
                            "animate-in fade-in slide-in-from-left-4 duration-300",
                            isOpen && selectingReturn
                                ? "border-emerald-500 bg-emerald-50"
                                : "border-gray-200 hover:border-emerald-300 bg-white"
                        )}
                    >
                        <div className={cn(
                            "p-2 rounded-lg transition-colors",
                            isOpen && selectingReturn ? "bg-emerald-100" : "bg-gray-100 group-hover:bg-emerald-100"
                        )}>
                            <Calendar className={cn(
                                "h-5 w-5",
                                isOpen && selectingReturn ? "text-emerald-600" : "text-gray-500 group-hover:text-emerald-600"
                            )} />
                        </div>
                        <div className="flex-1 min-w-0">
                            <div className="text-xs font-medium text-gray-500 mb-0.5">
                                Retour
                            </div>
                            <div className={cn(
                                "text-base font-semibold truncate",
                                returnDate ? "text-gray-900" : "text-gray-400"
                            )}>
                                {formatDisplayDate(returnDate)}
                            </div>
                        </div>
                    </button>
                )}
            </div>

            {/* Error message */}
            {error && (
                <p className="text-sm text-red-500 mt-2">{error}</p>
            )}

            {/* Calendar Popup */}
            {isOpen && (
                <div className={cn(
                    "absolute z-50 mt-2 bg-white rounded-2xl shadow-xl border border-gray-200",
                    "animate-in fade-in slide-in-from-top-2 duration-200",
                    "left-0 right-0 md:left-auto md:right-auto md:w-auto"
                )}>
                    {/* Header */}
                    <div className="flex items-center justify-between p-4 border-b border-gray-100">
                        <div className="text-sm font-medium text-gray-700">
                            {selectingReturn ? "Sélectionnez la date de retour" : "Sélectionnez la date de départ"}
                        </div>
                        <button
                            type="button"
                            onClick={() => setIsOpen(false)}
                            className="p-1 rounded-lg hover:bg-gray-100 transition-colors"
                        >
                            <X className="h-5 w-5 text-gray-500" />
                        </button>
                    </div>

                    {/* Quick Actions */}
                    {isRoundTrip && (
                        <div className="flex gap-2 px-4 pt-4 flex-wrap">
                            {QUICK_ACTIONS.map((action) => (
                                <button
                                    key={action.label}
                                    type="button"
                                    onClick={() => handleQuickAction(action)}
                                    className="px-3 py-1.5 text-xs font-medium rounded-full bg-emerald-50 text-emerald-700 hover:bg-emerald-100 transition-colors"
                                >
                                    {action.label}
                                </button>
                            ))}
                        </div>
                    )}

                    {/* Month Navigation */}
                    <div className="flex items-center justify-between px-4 pt-4">
                        <button
                            type="button"
                            onClick={prevMonth}
                            disabled={currentMonth.getMonth() === today.getMonth() && currentMonth.getFullYear() === today.getFullYear()}
                            className="p-2 rounded-lg hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                        >
                            <ChevronLeft className="h-5 w-5 text-gray-600" />
                        </button>
                        <div className="md:hidden text-center font-semibold text-gray-900">
                            {MONTHS_FR[currentMonth.getMonth()]} {currentMonth.getFullYear()}
                        </div>
                        <button
                            type="button"
                            onClick={nextMonth}
                            className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
                        >
                            <ChevronRight className="h-5 w-5 text-gray-600" />
                        </button>
                    </div>

                    {/* Calendar Grid */}
                    <div className="flex gap-4 p-4">
                        {renderMonth(currentMonth)}
                        {renderMonth(secondMonth, true)}
                    </div>

                    {/* Footer hint */}
                    <div className="px-4 pb-4 text-center text-xs text-gray-500">
                        {isRoundTrip && parsedDepartDate && !parsedReturnDate && (
                            <span className="text-emerald-600 font-medium">
                                Cliquez sur la date de retour
                            </span>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
