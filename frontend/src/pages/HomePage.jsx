import React, { useEffect, useRef, useState } from 'react';
import { Modal } from 'antd';
import { useLocation, useNavigate } from 'react-router-dom';
import TradeBuilder from '../components/TradeBuilder/TradeBuilder';
import TradeMenuBar from '../components/Layout/TradeMenuBar/TradeMenuBar';
import { getTeamGroupClass, getTradeBuilderStyle } from '../utils/tradeUtils';
import { sortPicks } from '../utils/pickSorter';
import { useTeamManagement, useTradeReset, useTradeAnalyzer } from '../hooks';

function HomePage() {
	const location = useLocation();
	const navigate = useNavigate();
	const originalPicksRef = useRef({});
	const [hasTradesMade, setHasTradesMade] = useState(false);

	// Check if this is a page refresh
	useEffect(() => {
		// A clean page load/refresh won't have the referrer from the same site
		const isPageRefresh = !document.referrer || !document.referrer.includes(window.location.origin);

		// If it's a page refresh and we have state, clear it by re-navigating to home without state
		if (isPageRefresh && location.state) {
			navigate('/home', { replace: true, state: null });
		}
	}, [navigate, location]);

	// Initialize with empty team groups or from location state if coming back from analyze page
	const initialTeamGroups = (() => {
		// Check if we have state passed from analyze page
		if (location.state?.preserveTradeState && location.state?.teamGroups) {
			// If we do, use that state
			return location.state.teamGroups;
		}
		// Otherwise use default initialization
		return [
			{
				id: 1,
				name: '',
				logo: '',
				picks: [],
				teamId: null,
			},
			{
				id: 2,
				name: '',
				logo: '',
				picks: [],
				teamId: null,
			},
		];
	})();

	// Get teams first
	const { teams, loading } = useTeamManagement(initialTeamGroups, null); // Pass null for now

	// Helper function to check for trades
	const checkForTradesMadeAndUpdateState = (groups, checkFn) => {
		if (!checkFn) return false;
		const hasTrades = checkFn(groups);
		setHasTradesMade(hasTrades);
		return hasTrades;
	};

	// Define state for teamGroups directly
	const [teamGroups, setTeamGroups] = useState(initialTeamGroups);
	const [selectedValuation, setSelectedValuation] = useState(1);

	// Create a dependency value for team names
	const teamNamesString = teamGroups.map((t) => t.name).join(',');

	// Get reset functionality, now with direct access to setTeamGroups
	const {
		isResetting,
		resetModalVisible,
		checkForTradesMade,
		showResetConfirmation,
		handleResetConfirm,
		handleResetCancel,
	} = useTradeReset(originalPicksRef, setTeamGroups, hasTradesMade, setHasTradesMade);

	// Update team picks when teams or selected valuation changes
	useEffect(() => {
		const updateTeamsAndPicks = async () => {
			if (!teams || teams.length === 0) return;

			const updatedTeamGroupsLocal = [...teamGroups];

			// Process team selections and fetch picks (similar to useTeamPicks)
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

					// If team ID changed or if picks are empty, fetch picks
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

							// Format picks
							const formattedPicks = picksData.map((pick) => ({
								id: `pick-${pick.id}`,
								content: `${pick.year} ${pick.round >= 1 && pick.round <= 7 ? roundWords[pick.round - 1] : `Round ${pick.round}`} Round Pick${pick.pick_number ? ` (#${pick.pick_number})` : ''}`,
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

							// Store the original picks for this team
							originalPicksRef.current[selectedTeam.id] = [...formattedPicks];

							// Apply sorting to the picks
							updatedTeamGroupsLocal[i].picks = sortPicks(formattedPicks);
						} catch (error) {
							console.error(`Error fetching picks for team ${selectedTeam.name}:`, error);
							updatedTeamGroupsLocal[i].picks = [];
						}
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

			// Apply sorting to each team's picks again to ensure everything is properly sorted
			const sortedTeamGroups = updatedTeamGroupsLocal.map((group) => ({
				...group,
				picks: sortPicks(group.picks),
			}));

			// Update teamGroups state
			setTeamGroups(sortedTeamGroups);

			// Check for trades
			checkForTradesMadeAndUpdateState(sortedTeamGroups, checkForTradesMade);
		};

		updateTeamsAndPicks();
	}, [teams, teamNamesString, selectedValuation, checkForTradesMade]);

	// Other hooks
	const { handleAnalyzeTrade } = useTradeAnalyzer();

	// Function to update team groups (used by TradeBuilder)
	const updateTeamGroups = (newTeamGroups) => {
		// Apply sorting to each team's picks
		const sortedTeamGroups = newTeamGroups.map((group) => ({
			...group,
			picks: sortPicks(group.picks),
		}));

		setTeamGroups(sortedTeamGroups);
		checkForTradesMadeAndUpdateState(sortedTeamGroups, checkForTradesMade);
	};

	// Handle valuation change
	const handleValuationChange = (valuationId) => {
		setSelectedValuation(valuationId);

		// Update the valuation for all picks and apply sorting
		const updatedTeamGroups = teamGroups.map((group) => ({
			...group,
			picks: sortPicks(
				group.picks.map((pick) => ({
					...pick,
					valuation: valuationId,
				}))
			),
		}));

		setTeamGroups(updatedTeamGroups);
	};

	// Handle adding a team
	const handleAddTeam = () => {
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

	// Handle removing a team
	const handleRemoveTeam = (teamId) => {
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

		// Handle picks before removing the team
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

	// Check for returning from analyze page with saved state
	useEffect(() => {
		if (location.state?.preserveTradeState) {
			// Restore valuation model if passed
			if (location.state.selectedValuation) {
				handleValuationChange(location.state.selectedValuation);
			}

			// Determine if trades are made in the restored state
			if (location.state.teamGroups) {
				// Rebuild the originalPicksRef for each team if we're returning from analyze page
				// This ensures that reset functionality works properly after returning from analyze
				const teams = location.state.teamGroups.filter((team) => team.teamId);

				// For each team, store its original picks (picks with originalTeamId matching the team's id)
				teams.forEach((team) => {
					if (!team.teamId) return;

					// Find all picks that originally belonged to this team (across all teams)
					const originalPicks = [];
					teams.forEach((sourceTeam) => {
						sourceTeam.picks.forEach((pick) => {
							if (pick.originalTeamId === team.teamId) {
								originalPicks.push({ ...pick });
							}
						});
					});

					// Store these picks in the originalPicksRef for this team
					if (originalPicks.length > 0) {
						originalPicksRef.current[team.teamId] = originalPicks;
					}
				});

				// Check for trades in the restored state
				checkForTradesMadeAndUpdateState(location.state.teamGroups, checkForTradesMade);
			}
		}
	}, [location.state]);

	// Initial check for trades
	useEffect(() => {
		if (checkForTradesMade && teamGroups.length > 0) {
			const hasTrades = checkForTradesMade(teamGroups);
			setHasTradesMade(hasTrades);
		}
	}, [checkForTradesMade, teamGroups, handleValuationChange]);

	const handleResetTrades = () => {
		showResetConfirmation(teamGroups);
	};

	const handleModalResetConfirm = () => {
		handleResetConfirm(teamGroups);
	};

	const handleAnalyze = () => {
		handleAnalyzeTrade(teamGroups, selectedValuation, hasTradesMade);
	};

	return (
		<div className="home-page">
			<TradeMenuBar
				onAddTeam={handleAddTeam}
				onResetTrades={handleResetTrades}
				onValuationChange={handleValuationChange}
				selectedValuation={selectedValuation}
				disableAddTeam={teamGroups.length >= 4}
				disableResetTrades={!hasTradesMade}
				onAnalyze={handleAnalyze}
			/>

			<div className="trade-builder" style={getTradeBuilderStyle(teamGroups.length)}>
				<TradeBuilder
					teams={teams}
					loading={loading}
					teamGroups={teamGroups}
					setTeamGroups={updateTeamGroups}
					getTeamGroupClass={getTeamGroupClass}
					isResetting={isResetting}
					onRemoveTeam={handleRemoveTeam}
				/>
			</div>

			{/* Reset Confirmation Modal */}
			<Modal
				title="Reset Trades"
				open={resetModalVisible}
				onOk={handleModalResetConfirm}
				onCancel={handleResetCancel}
				okText="Reset"
				cancelText="Cancel"
				okButtonProps={{
					style: { backgroundColor: '#5b21b6', borderColor: '#5b21b6' },
				}}
			>
				<p>
					This will reset all trades and return picks to their original teams. Are you sure you want
					to continue?
				</p>
			</Modal>
		</div>
	);
}

export default HomePage;
