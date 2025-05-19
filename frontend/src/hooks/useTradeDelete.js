import { message } from 'antd';

/**
 * Hook for deleting trades and handling related state updates
 * @param {Array} trades - Current trades array
 * @param {Function} setTrades - Function to update trades state
 * @param {String|null} expandedTradeId - ID of the currently expanded trade
 * @param {Function} setExpandedTradeId - Function to update expanded trade ID
 * @param {Function} setTradeDetails - Function to update trade details
 * @returns {Function} Function to delete a trade by ID
 */
export const useTradeDelete = (
	trades,
	setTrades,
	expandedTradeId,
	setExpandedTradeId,
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

			// Clear details if the deleted trade was expanded
			if (expandedTradeId === tradeId) {
				setExpandedTradeId(null);
				setTradeDetails(null);
			}

			message.success('Trade deleted successfully');
		} catch (error) {
			console.error('Error deleting trade:', error);
			message.error('Failed to delete trade');
		}
	};

	return deleteTrade;
};
