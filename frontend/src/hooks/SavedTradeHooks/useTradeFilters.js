import { useState, useCallback, useEffect } from 'react';

// Hook for filtering and sorting saved trades by team or date
export const useTradeFilters = (trades) => {
	const [filteredTrades, setFilteredTrades] = useState(trades);
	const [activeFilters, setActiveFilters] = useState(null);

	// Apply team and sort filters to the saved trades array
	const applyFilters = useCallback(
		(filters) => {
			setActiveFilters(filters);

			let filtered = [...trades];

			// Filter by team
			if (filters.teams && filters.teams.length > 0) {
				filtered = filtered.filter(
					(trade) => trade.teams && trade.teams.some((team) => filters.teams.includes(team.id))
				);
			}

			// Apply sorting based on selected option
			if (filters.sortOption) {
				switch (filters.sortOption) {
					case 'date_newest':
						filtered.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
						break;
					case 'date_oldest':
						filtered.sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
						break;
					default:
						// Default to newest first
						filtered.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
				}
			}

			setFilteredTrades(filtered);
		},
		[trades]
	);

	// Reset filters and default to newest trades first
	const clearFilters = useCallback(() => {
		setActiveFilters(null);
		// Default to sorting by newest date
		const sortedTrades = [...trades].sort(
			(a, b) => new Date(b.created_at) - new Date(a.created_at)
		);
		setFilteredTrades(sortedTrades);
	}, [trades]);

	// Re-run filtering logic when trades list or filters change
	useEffect(() => {
		if (activeFilters) {
			applyFilters(activeFilters);
		} else {
			// Default to sorting by newest date
			const sortedTrades = [...trades].sort(
				(a, b) => new Date(b.created_at) - new Date(a.created_at)
			);
			setFilteredTrades(sortedTrades);
		}
	}, [trades, activeFilters, applyFilters]);

	return {
		filteredTrades,
		applyFilters,
		clearFilters,
		activeFilters,
	};
};
