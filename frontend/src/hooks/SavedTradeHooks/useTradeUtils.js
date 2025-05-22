/****
 * Custom hook providing utility functions for formatting and trade data retrieval
 * @returns {Object} Utility functions: formatDate, getTeamPickDetails
 */
export const useTradeUtils = () => {
	/**
	 * Convert a raw date string into a formatted, human-readable string
	 * Example output: "Apr 5, 2025, 03:30 PM"
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
	 * Retrieve a list of picks associated with a team, filtered by type
	 * @param {Object} tradeDetails - The trade data including picks by team
	 * @param {String} teamId - The ID of the team to look up
	 * @param {String} type - Either 'receiving' or 'sending' to filter the picks
	 * @returns {Array|null} List of picks or null if unavailable
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
