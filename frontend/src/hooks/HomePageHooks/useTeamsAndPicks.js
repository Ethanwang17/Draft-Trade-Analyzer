import { useEffect } from 'react';
import { sortPicks } from '../../utils/pickSorter';

/**
 * Hook that synchronises the selected teams with their draft picks.
 *
 * It updates the Home page `teamGroups` state whenever:
 *   – the list of fetched `teams` changes
 *   – the user changes a team selection (name change)
 *   – the valuation model (`selectedValuation`) changes
 *
 */
export const useTeamsAndPicks = ({
	teams,
	teamGroups,
	setTeamGroups,
	selectedValuation,
	originalPicksRef,
	checkForTradesMade,
	checkForTradesMadeAndUpdateState,
}) => {
	// Create a stable string of the chosen team names. This is cheaper than doing
	// a deep comparison of `teamGroups` in the effect dependency array.
	const teamNamesString = teamGroups.map((t) => t.name).join(',');

	useEffect(() => {
		const updateTeamsAndPicks = async () => {
			if (!teams || teams.length === 0) return;

			const updatedTeamGroupsLocal = [...teamGroups];

			for (let i = 0; i < updatedTeamGroupsLocal.length; i++) {
				const group = updatedTeamGroupsLocal[i];
				const selectedTeam = teams.find((team) => team.name === group.name);

				if (selectedTeam) {
					// Update logo & team ID so the UI reflects the newly-selected team
					updatedTeamGroupsLocal[i] = {
						...group,
						logo: selectedTeam.logo || '',
						teamId: selectedTeam.id,
					};

					// (Re-)fetch picks when the team changes or if no picks have been loaded yet
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

							// Format the API response so it matches the structure expected by the UI
							const formattedPicks = picksData.map((pick) => ({
								id: `pick-${pick.id}`,
								content: `${pick.year} ${
									pick.round >= 1 && pick.round <= 7
										? roundWords[pick.round - 1]
										: `Round ${pick.round}`
								} Round Pick${pick.pick_number ? ` (#${pick.pick_number})` : ''}`,
								pickId: pick.id,
								year: pick.year,
								round: pick.round,
								pick_number: pick.pick_number,
								originalTeamLogo:
									pick.original_team_logo || selectedTeam.logo || 'default-logo.png',
								originalTeamId: selectedTeam.id,
								originalTeamName: selectedTeam.name,
								valuation: selectedValuation,
							}));

							// Keep a copy of the original picks for each team so resets can work later on
							originalPicksRef.current[selectedTeam.id] = [...formattedPicks];

							updatedTeamGroupsLocal[i].picks = sortPicks(formattedPicks);
						} catch (error) {
							console.error(`Error fetching picks for team ${selectedTeam.name}:`, error);
							updatedTeamGroupsLocal[i].picks = [];
						}
					}
				} else if (group.name === '') {
					// Clear state when the team selection is cleared out
					updatedTeamGroupsLocal[i] = {
						...group,
						logo: '',
						teamId: null,
						picks: [],
					};
				}
			}

			// Always keep picks sorted before committing to state
			const sortedTeamGroups = updatedTeamGroupsLocal.map((group) => ({
				...group,
				picks: sortPicks(group.picks),
			}));

			setTeamGroups(sortedTeamGroups);

			// Recalculate the \"trades made\" indicator
			if (checkForTradesMadeAndUpdateState) {
				checkForTradesMadeAndUpdateState(sortedTeamGroups, checkForTradesMade);
			}
		};

		updateTeamsAndPicks();
		// eslint-disable-next-line react-hooks/exhaustive-deps -- teamNamesString is derived from teamGroups
	}, [teams, teamNamesString, selectedValuation, checkForTradesMade]);
};
