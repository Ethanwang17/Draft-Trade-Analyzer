import { useState, useEffect } from 'react';
import { sortPicks } from '../../utils/pickSorter';

/**
 * Hook for managing team picks and their state
 * @param {Array} initialTeamGroups - Initial team groups state
 * @param {Array} teams - Available teams data
 * @param {Function} onCheckForTradesMade - Function to check for trades made
 * @returns {Object} Team picks state and functions
 */
export const useTeamPicks = (initialTeamGroups, teams, onCheckForTradesMade) => {
	const [teamGroups, setTeamGroups] = useState(initialTeamGroups);
	const [selectedValuation, setSelectedValuation] = useState(1);

	// Create a dependency value for team names
	const teamNamesString = teamGroups.map((t) => t.name).join(',');

	// Update team logo and fetch team picks when team selection changes
	useEffect(() => {
		const updateTeamsAndPicks = async () => {
			if (!teams || teams.length === 0) return;

			const updatedTeamGroupsLocal = [...teamGroups];

			for (let i = 0; i < updatedTeamGroupsLocal.length; i++) {
				const group = updatedTeamGroupsLocal[i];
				const selectedTeam = teams.find((team) => team.name === group.name);

				if (selectedTeam) {
					// Update logo and team ID
					updatedTeamGroupsLocal[i] = {
						...group,
						logo: selectedTeam.logo || '',
						teamId: selectedTeam.id,
					};

					// If team ID changed or if picks are currently empty (for initial load for a pre-selected team)
					// and selectedTeam.id is valid
					if (
						selectedTeam.id &&
						(selectedTeam.id !== group.teamId ||
							(group.picks && group.picks.length === 0 && group.name === selectedTeam.name))
					) {
						try {
							const response = await fetch(`/api/teams/${selectedTeam.id}/picks`);
							if (!response.ok) {
								throw new Error(`Failed to fetch picks for team ${selectedTeam.name}`);
							}

							const picksData = await response.json();
							const roundWords = [
								'First',
								'Second',
								'Third',
								'Fourth',
								'Fifth',
								'Sixth',
								'Seventh',
							];

							// Transform picks data to the format expected by the UI
							const formattedPicks = picksData.map((pick) => ({
								id: `pick-${pick.id}`,
								content: `${pick.year} ${pick.round >= 1 && pick.round <= 7 ? roundWords[pick.round - 1] : `Round ${pick.round}`} Pick${pick.pick_number ? ` (#${pick.pick_number})` : ''}`,
								pickId: pick.id,
								year: pick.year,
								round: pick.round,
								pick_number: pick.pick_number,
								originalTeamLogo:
									pick.original_team_logo || selectedTeam.logo || 'default-logo.png',
								originalTeamId: selectedTeam.id, // Store original team ID
								originalTeamName: selectedTeam.name, // Store original team name
							}));

							updatedTeamGroupsLocal[i].picks = formattedPicks;
						} catch (error) {
							console.error(`Error fetching picks for team ${selectedTeam.name}:`, error);
							updatedTeamGroupsLocal[i].picks = [];
						}
					} else if (!selectedTeam.id && group.name === '') {
						updatedTeamGroupsLocal[i] = {
							...group,
							logo: '',
							teamId: null,
							picks: [],
						};
					}
				} else if (group.name === '') {
					updatedTeamGroupsLocal[i] = {
						...group,
						logo: '',
						teamId: null,
						picks: [],
					};
				}
			}

			// Update team groups with sorted picks
			const sortedTeamGroups = updatedTeamGroupsLocal.map((group) => ({
				...group,
				picks: sortPicks(group.picks),
			}));

			setTeamGroups(sortedTeamGroups);

			// Check if trades have been made after updating the team groups
			if (onCheckForTradesMade) {
				onCheckForTradesMade(sortedTeamGroups);
			}
		};

		if (teams.length > 0) {
			updateTeamsAndPicks();
		}
	}, [teamNamesString, teams, onCheckForTradesMade, teamGroups]);

	// Handler for valuation change
	const handleValuationChange = (valuationId) => {
		setSelectedValuation(valuationId);

		// Update the valuation for all picks without changing their positions
		const updatedTeamGroups = teamGroups.map((group) => ({
			...group,
			picks: group.picks.map((pick) => ({
				...pick,
				valuation: valuationId,
			})),
		}));

		setTeamGroups(updatedTeamGroups);
	};

	// Helper function to update team groups with sorted picks
	const updateTeamGroups = (newTeamGroups) => {
		const sortedTeamGroups = newTeamGroups.map((group) => ({
			...group,
			picks: sortPicks(group.picks),
		}));

		setTeamGroups(sortedTeamGroups);

		// Check if trades have been made after updating the team groups
		if (onCheckForTradesMade) {
			onCheckForTradesMade(sortedTeamGroups);
		}
	};

	return {
		teamGroups,
		selectedValuation,
		updateTeamGroups,
		handleValuationChange,
		setTeamGroups,
	};
};
