import { useState, useEffect } from 'react';

/**
 * Hook to fetch available teams and provide functions for adding/removing teams
 * @param {Array} initialTeamGroups - Initial team groups
 * @param {Function} updateTeamGroups - Function to update team groups
 * @returns {Object} Team management functions and state
 */
export const useTeamManagement = (initialTeamGroups, updateTeamGroups) => {
	const [teams, setTeams] = useState([]);
	const [loading, setLoading] = useState(true);

	// Fetch list of all NBA teams from the backend on mount
	useEffect(() => {
		const fetchTeams = async () => {
			try {
				const response = await fetch('/api/teams');
				if (!response.ok) {
					throw new Error('Failed to fetch teams');
				}
				const teamsData = await response.json();
				setTeams(teamsData);
			} catch (error) {
				console.error('Error fetching teams:', error);
			} finally {
				setLoading(false);
			}
		};

		fetchTeams();
	}, []);

	// Add a new team group to the list if under the 4-team max
	const addTeam = (teamGroups) => {
		if (teamGroups.length >= 4) return;

		const newId = teamGroups.length + 1;
		updateTeamGroups([
			...teamGroups,
			{
				id: newId,
				name: '',
				logo: '',
				picks: [],
				teamId: null,
			},
		]);
	};

	// Remove a team, return traded picks, and reassign IDs for remaining teams
	const removeTeam = (teamGroups, teamId) => {
		// Don't allow removing if only 2 teams remain
		if (teamGroups.length <= 2) return;

		// Find the team being removed
		const teamToRemove = teamGroups.find((team) => team.id === teamId);

		if (!teamToRemove || !teamToRemove.teamId) {
			// If the team doesn't exist or doesn't have a team ID (not selected), just remove it
			const newTeamGroups = teamGroups
				.filter((team) => team.id !== teamId)
				.map((team, index) => ({
					...team,
					id: index + 1, // Renumber teams starting from 1
				}));

			updateTeamGroups(newTeamGroups);
			return;
		}

		// Restore picks from removed team to original owners and clear traded styling
		let updatedTeamGroups = [...teamGroups];

		// 1. Find picks that belonged to the team being removed but are now with other teams
		// and return them to their original teams
		updatedTeamGroups = updatedTeamGroups.map((group) => {
			// Skip the team being removed
			if (group.id === teamId) return group;

			// For each team, check if they have picks that belonged to the team being removed
			const picksToReturn = group.picks.filter(
				(pick) => pick.originalTeamId === teamToRemove.teamId
			);

			// If no picks to return, no changes needed for this team
			if (picksToReturn.length === 0) return group;

			// Remove the picks that belonged to the team being removed
			return {
				...group,
				picks: group.picks.filter((pick) => pick.originalTeamId !== teamToRemove.teamId),
			};
		});

		// 2. Find picks from other teams that the removed team had
		// and return those picks to their original teams
		const picksToReturn = teamToRemove.picks.filter(
			(pick) => pick.originalTeamId !== teamToRemove.teamId
		);

		picksToReturn.forEach((pick) => {
			const originalTeamGroup = updatedTeamGroups.find(
				(group) => group.teamId === pick.originalTeamId
			);

			if (originalTeamGroup) {
				// Reset the className (remove traded-pick class) before returning to original team
				const resetPick = {
					...pick,
					className: '', // Remove traded-pick class
				};

				// Add the pick back to its original team
				const teamIndex = updatedTeamGroups.findIndex((group) => group.id === originalTeamGroup.id);
				updatedTeamGroups[teamIndex] = {
					...originalTeamGroup,
					picks: [...originalTeamGroup.picks, resetPick],
				};
			}
		});

		// 3. Remove the team and renumber the remaining teams
		updatedTeamGroups = updatedTeamGroups
			.filter((team) => team.id !== teamId)
			.map((team, index) => ({
				...team,
				id: index + 1, // Renumber teams starting from 1
			}));

		updateTeamGroups(updatedTeamGroups);
	};

	return {
		teams,
		loading,
		addTeam,
		removeTeam,
	};
};
