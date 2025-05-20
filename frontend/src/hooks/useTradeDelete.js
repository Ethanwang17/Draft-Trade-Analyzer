import { message } from 'antd';

/**
 * Hook for deleting trades and handling related state updates
 * @param {Array} trades - Current trades array
 * @param {Function} setTrades - Function to update trades state
 * @param {Array} expandedTradeIds - IDs of the currently expanded trades
 * @param {Function} setExpandedTradeIds - Function to update expanded trade IDs
 * @param {Function} setTradeDetails - Function to update trade details
 * @returns {Function} Function to delete a trade by ID
 */
export const useTradeDelete = (
	trades,
	setTrades,
	expandedTradeIds,
	setExpandedTradeIds,
	setTradeDetails
) => {
	const deleteTrade = async (tradeId, event) => {
		if (event) {
			event.stopPropagation();
		}

		try {
			const response = await fetch(`/api/saved-trades/${tradeId}`, {
				method: 'DELETE',
			});

			if (!response.ok) {
				throw new Error('Failed to delete trade');
			}

			// Remove from local state
			setTrades(trades.filter((trade) => trade.id !== tradeId));

			// Remove from expanded trades if it was expanded
			if (expandedTradeIds.includes(tradeId)) {
				setExpandedTradeIds(expandedTradeIds.filter((id) => id !== tradeId));

				// Update trade details by removing the deleted trade
				setTradeDetails((prev) => {
					const newDetails = { ...prev };
					delete newDetails[tradeId];
					return newDetails;
				});
			}

			message.success('Trade deleted successfully');
		} catch (error) {
			console.error('Error deleting trade:', error);
			message.error('Failed to delete trade');
		}
	};

	return deleteTrade;
};
