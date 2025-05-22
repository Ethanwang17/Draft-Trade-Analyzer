/**
 * Hook for pick management functionality
 * @param {Object} tradeData - Trade data with team groups
 * @param {Function} setTradeData - Function to update trade data
 * @returns {Object} Functions for pick management
 */
export const usePick = (tradeData, setTradeData) => {
	// Reset a pick to its original team
	const handleResetPick = (pickId) => {
		if (!tradeData || !tradeData.teamGroups) return;

		// Find the pick and move it back to its original team
		let pickToMove = null;
		let currentTeamId = null;

		// Find the pick in all teams
		tradeData.teamGroups.forEach((team) => {
			if (!team.teamId || !team.picks) return;

			const foundPick = team.picks.find((pick) => pick.id === pickId);
			if (foundPick) {
				pickToMove = foundPick;
				currentTeamId = team.teamId;
			}
		});

		if (!pickToMove || !currentTeamId || currentTeamId === pickToMove.originalTeamId) {
			return; // Pick not found or already in original team
		}

		// Remove the pick from current team
		const updatedTeamGroups = tradeData.teamGroups.map((team) => {
			if (team.teamId === currentTeamId) {
				return {
					...team,
					picks: team.picks.filter((pick) => pick.id !== pickId),
				};
			}
			// Add the pick back to its original team
			if (team.teamId === pickToMove.originalTeamId) {
				return {
					...team,
					picks: [...team.picks, pickToMove],
				};
			}
			return team;
		});

		// Update the trade data
		setTradeData({
			...tradeData,
			teamGroups: updatedTeamGroups,
		});
	};

	return {
		handleResetPick,
	};
};
