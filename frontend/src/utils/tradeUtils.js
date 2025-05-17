// Determine team group class based on number of teams
export const getTeamGroupClass = (totalTeams) => {
	if (totalTeams === 2) return ''; // Default
	if (totalTeams === 3) return 'three-teams';
	if (totalTeams === 4) return 'four-teams';
	return 'many-teams';
};

// Get trade builder inline style to adjust width based on number of teams
export const getTradeBuilderStyle = (teamCount) => {
	const baseWidth = 800; // Starting width for 2 teams

	// Calculate width that grows with each additional team
	const calculatedWidth = Math.min(baseWidth + (teamCount - 2) * 300, 1400);

	return {
		maxWidth: `${calculatedWidth}px`,
	};
};
