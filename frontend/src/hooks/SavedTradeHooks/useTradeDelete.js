import { message } from 'antd';

// Hook to handle trade deletion, update UI state, and notify user
export const useTradeDelete = (
	trades,
	setTrades,
	expandedTradeIds,
	setExpandedTradeIds,
	setTradeDetails
) => {
	const deleteTrade = async (tradeId, event) => {
		// Remove event propagation to avoid unintended parent click behavior
		if (event) {
			event.stopPropagation();
		}

		try {
			// API call to delete the selected trade by ID
			const response = await fetch(`/api/saved-trades/${tradeId}`, {
				method: 'DELETE',
			});

			if (!response.ok) {
				throw new Error('Failed to delete trade');
			}

			// Remove from local state
			setTrades(trades.filter((trade) => trade.id !== tradeId));

			// Clean up expanded trade state and remove associated trade details
			if (expandedTradeIds.includes(tradeId)) {
				setExpandedTradeIds(expandedTradeIds.filter((id) => id !== tradeId));

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
