import { useState, useEffect } from 'react';
import { sortPicks } from '../../utils/pickSorter';

/**
 * Hook to manage pick loading and valuation updates based on team selection
 * @param {Array} initialTeamGroups - Initial team groups state
 * @param {Array} teams - Available teams data
 * @param {Function} onCheckForTradesMade - Function to check for trades made
 * @returns {Object} Team picks state and functions
 */
export const useTeamPicks = (initialTeamGroups, teams, onCheckForTradesMade) => {
	const [teamGroups, setTeamGroups] = useState(initialTeamGroups);
	const [selectedValuation, setSelectedValuation] = useState(1);

	// Create a stable string to track team name changes (used in dependency array)
	const teamNamesString = teamGroups.map((t) => t.name).join(',');

	// Effect that runs whenever team names or team list changes to refetch picks
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

					// Fetch picks from API if team has changed or has no picks loaded
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

							// Map and format pick data to UI-ready structure
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

			// After updating picks, sort and commit to state, then update trade status
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

	// Update all picks’ valuation model when changed by user
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

	// Utility to apply sorted team group updates and re-check trade status
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
