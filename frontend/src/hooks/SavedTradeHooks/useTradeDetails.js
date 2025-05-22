import { useState } from 'react';
import { message } from 'antd';

// Hook for managing which trade cards are expanded and fetching details from the backend
export const useTradeDetails = () => {
	const [expandedTradeIds, setExpandedTradeIds] = useState([]);
	const [tradeDetails, setTradeDetails] = useState({});
	const [loadingDetails, setLoadingDetails] = useState({});

	const loadTradeDetails = async (tradeId) => {
		// Collapse card if already expanded, otherwise proceed to expand and possibly fetch data
		if (expandedTradeIds.includes(tradeId)) {
			setExpandedTradeIds(expandedTradeIds.filter((id) => id !== tradeId));
			return;
		}

		try {
			setExpandedTradeIds([...expandedTradeIds, tradeId]);
			setLoadingDetails((prev) => ({ ...prev, [tradeId]: true }));

			// Fetch trade details from API only if they are not already loaded
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
			// On error, show user feedback and revert expansion state
			message.error('Failed to load trade details');
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
