import { useTheme } from '../hooks/useTheme';

export function SkeletonChart({ height = 'h-64', className = '' }) {
    const { theme } = useTheme();
    const isDark = theme === 'dark';
    const bg = isDark ? 'bg-gray-800' : 'bg-gray-200';
    const shimmer = isDark ? 'bg-gray-700' : 'bg-gray-300';

    return (
        <div className={`${className} animate-pulse rounded-xl border ${isDark ? 'border-gray-700 bg-gray-900/50' : 'border-gray-200 bg-white/80'} p-6`}>
            <div className={`${shimmer} rounded h-4 w-40 mb-6`} />
            <div className={`${bg} rounded-lg ${height} w-full flex items-end gap-1 p-4`}>
                {[...Array(20)].map((_, i) => (
                    <div
                        key={i}
                        className={`${shimmer} rounded-t flex-1 transition-all`}
                        style={{ height: `${20 + Math.random() * 60}%` }}
                    />
                ))}
            </div>
        </div>
    );
}

export function SkeletonTable({ rows = 5, cols = 4, className = '' }) {
    const { theme } = useTheme();
    const isDark = theme === 'dark';
    const shimmer = isDark ? 'bg-gray-700' : 'bg-gray-300';

    return (
        <div className={`${className} animate-pulse rounded-xl border ${isDark ? 'border-gray-700 bg-gray-900/50' : 'border-gray-200 bg-white/80'} p-6`}>
            <div className={`${shimmer} rounded h-5 w-48 mb-6`} />
            <div className="space-y-4">
                {/* Header */}
                <div className="flex gap-4 pb-3 border-b border-gray-700/30">
                    {[...Array(cols)].map((_, i) => (
                        <div key={i} className={`${shimmer} rounded h-3 flex-1`} />
                    ))}
                </div>
                {/* Rows */}
                {[...Array(rows)].map((_, r) => (
                    <div key={r} className="flex gap-4 items-center">
                        {[...Array(cols)].map((_, c) => (
                            <div key={c} className={`${shimmer} rounded h-4 flex-1`} style={{ opacity: (70 - r * 8) / 100 }} />
                        ))}
                    </div>
                ))}
            </div>
        </div>
    );
}

export function SkeletonControlBar() {
    const { theme } = useTheme();
    const isDark = theme === 'dark';
    const shimmer = isDark ? 'bg-gray-700' : 'bg-gray-300';

    return (
        <div className={`animate-pulse rounded-xl border ${isDark ? 'border-gray-700 bg-gray-800/50' : 'border-gray-200 bg-white/50'} p-4 mb-6`}>
            <div className="flex flex-wrap gap-3">
                <div className={`${shimmer} rounded-lg h-10 w-24`} />
                <div className={`${shimmer} rounded-lg h-10 w-32`} />
                <div className={`${shimmer} rounded-lg h-10 w-48`} />
                <div className={`${shimmer} rounded-lg h-10 w-28`} />
            </div>
        </div>
    );
}
