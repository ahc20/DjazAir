import React from 'react';

export const DjazAirLogo = ({ className = "h-8 w-8", withText = true }: { className?: string, withText?: boolean }) => {
    return (
        <div className="flex items-center gap-2">
            <svg
                viewBox="0 0 100 100"
                className={className}
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                aria-label="DjazAir Logo"
            >
                {/* Modern abstraction of a plane/bird with subtle Islamic geometry influence */}
                <path
                    d="M20 50 C20 30 40 10 70 10 C85 10 95 20 95 35 C95 60 70 80 50 80 L90 90 L80 95 L10 60 L10 50 Z"
                    className="fill-emerald-600"
                />
                {/* Accent Wing/Feather in red - subtle patriotic nod */}
                <path
                    d="M20 50 L45 45 L35 65 Z"
                    className="fill-red-500"
                />
                {/* Inner detail line white */}
                <path
                    d="M30 50 L80 35"
                    stroke="white"
                    strokeWidth="3"
                    strokeLinecap="round"
                />
            </svg>
            {withText && (
                <span className="text-2xl font-bold tracking-tight text-gray-900">
                    Djaz<span className="text-emerald-600">Air</span>
                </span>
            )}
        </div>
    );
};
