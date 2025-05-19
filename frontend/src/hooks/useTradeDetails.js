import { useState } from 'react';
import { message } from 'antd';

/**
 * Hook for managing trade details
 * @returns {Object} Object containing trade details state and related functions
 */
export const useTradeDetails = () => {
	const [expandedTradeId, setExpandedTradeId] = useState(null);
	const [tradeDetails, setTradeDetails] = useState(null);
	const [loadingDetails, setLoadingDetails] = useState(false);

	const loadTradeDetails = async (tradeId) => {
		if (expandedTradeId === tradeId) {
			setExpandedTradeId(null);
			return;
		}

		try {
			setExpandedTradeId(tradeId);
			setLoadingDetails(true);

			const response = await fetch(`/api/saved-trades/${tradeId}`);

			if (!response.ok) {
				throw new Error('Failed to fetch trade details');
			}

			const data = await response.json();
			setTradeDetails(data);
		} catch (error) {
			console.error('Error loading trade details:', error);
			message.error('Failed to load trade details');
			setExpandedTradeId(null);
		} finally {
			setLoadingDetails(false);
		}
	};

	return {
		expandedTradeId,
		setExpandedTradeId,
		tradeDetails,
		setTradeDetails,
		loadingDetails,
		loadTradeDetails,
	};
};
