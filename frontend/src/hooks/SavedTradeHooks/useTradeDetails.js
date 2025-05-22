import { useState } from 'react';
import { message } from 'antd';

/**
 * Hook for managing trade details
 * @returns {Object} Object containing trade details state and related functions
 */
export const useTradeDetails = () => {
	const [expandedTradeIds, setExpandedTradeIds] = useState([]);
	const [tradeDetails, setTradeDetails] = useState({});
	const [loadingDetails, setLoadingDetails] = useState({});

	const loadTradeDetails = async (tradeId) => {
		// Toggle expansion state
		if (expandedTradeIds.includes(tradeId)) {
			setExpandedTradeIds(expandedTradeIds.filter((id) => id !== tradeId));
			return;
		}

		try {
			// Add this trade ID to expanded IDs
			setExpandedTradeIds([...expandedTradeIds, tradeId]);

			// Set loading state for this specific trade
			setLoadingDetails((prev) => ({ ...prev, [tradeId]: true }));

			// Only fetch if we don't already have the details
			if (!tradeDetails[tradeId]) {
				const response = await fetch(`/api/saved-trades/${tradeId}`);

				if (!response.ok) {
					throw new Error('Failed to fetch trade details');
				}

				const data = await response.json();
				setTradeDetails((prev) => ({ ...prev, [tradeId]: data }));
			}
		} catch (error) {
			console.error('Error loading trade details:', error);
			message.error('Failed to load trade details');
			// Remove this ID from expanded IDs
			setExpandedTradeIds(expandedTradeIds.filter((id) => id !== tradeId));
		} finally {
			setLoadingDetails((prev) => ({ ...prev, [tradeId]: false }));
		}
	};

	return {
		expandedTradeIds,
		setExpandedTradeIds,
		tradeDetails,
		setTradeDetails,
		loadingDetails,
		loadTradeDetails,
	};
};
