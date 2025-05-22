/**
 * Hook providing utility functions for trade components
 * @returns {Object} Object containing utility functions
 */
export const useTradeUtils = () => {
	/**
	 * Format a date string for display
	 * @param {String} dateString - The date string to format
	 * @returns {String} Formatted date string
	 */
	const formatDate = (dateString) => {
		const date = new Date(dateString);
		return date.toLocaleDateString('en-US', {
			year: 'numeric',
			month: 'short',
			day: 'numeric',
			hour: '2-digit',
			minute: '2-digit',
		});
	};

	/**
	 * Renders the pick details for a specific team
	 * @param {Object} tradeDetails - The trade details object
	 * @param {String} teamId - The team ID
	 * @param {String} type - 'receiving' or 'sending'
	 * @returns {React.Element} The component to render
	 */
	const getTeamPickDetails = (tradeDetails, teamId, type) => {
		if (!tradeDetails || !tradeDetails.picksByTeam || !tradeDetails.picksByTeam[teamId]) {
			return null;
		}

		const picks = tradeDetails.picksByTeam[teamId][type === 'receiving' ? 'receiving' : 'sending'];

		if (!picks || picks.length === 0) {
			return null;
		}

		return picks;
	};

	return {
		formatDate,
		getTeamPickDetails,
	};
};
