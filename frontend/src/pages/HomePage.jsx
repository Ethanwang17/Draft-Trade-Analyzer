import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Modal, message } from 'antd';
import { useNavigate, useLocation } from 'react-router-dom';
import TradeBuilder from '../components/TradeBuilder';
import TradeMenuBar from '../components/TradeMenuBar/TradeMenuBar';
import { getTeamGroupClass, getTradeBuilderStyle } from '../utils/tradeUtils';
import { sortPicks } from '../utils/pickSorter';

function HomePage() {
	const navigate = useNavigate();
	const location = useLocation();
	const [teams, setTeams] = useState([]);
	const [loading, setLoading] = useState(true);
	// Store original picks for each team to enable reset functionality
	const originalPicksRef = useRef({});
	const [isResetting, setIsResetting] = useState(false);
	// State for reset confirmation modal
	const [resetModalVisible, setResetModalVisible] = useState(false);
	// State to track if any trades have been made
	const [hasTradesMade, setHasTradesMade] = useState(false);
	// State for selected valuation model
	const [selectedValuation, setSelectedValuation] = useState(1);

	// Initialize with empty team groups or from location state if coming back from analyze page
	const [teamGroups, setTeamGroups] = useState(() => {
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
	});

	// Function to check if any picks have been moved from their original teams
	const checkForTradesMade = useCallback(
		(groups = teamGroups) => {
			const hasTrades = groups.some((group) => {
				if (!group.teamId) return false;

				// Get original picks for this team
				const originalPicks = originalPicksRef.current[group.teamId] || [];
				const originalPickIds = new Set(originalPicks.map((p) => p.id));

				// Check if current picks are different from original picks
				const currentPickIds = new Set(group.picks.map((p) => p.id));

				// If the sets are different sizes or contain different IDs, trades have been made
				if (originalPickIds.size !== currentPickIds.size) return true;

				for (const id of originalPickIds) {
					if (!currentPickIds.has(id)) return true;
				}

				// Also check if this team has received picks from other teams
				for (const pick of group.picks) {
					if (pick.originalTeamId && pick.originalTeamId !== group.teamId) {
						return true;
					}
				}

				return false;
			});

			setHasTradesMade(hasTrades);
			return hasTrades;
		},
		[teamGroups]
	);

	// Check for returning from analyze page with saved state
	useEffect(() => {
		if (location.state?.preserveTradeState) {
			// Restore valuation model if passed
			if (location.state.selectedValuation) {
				setSelectedValuation(location.state.selectedValuation);
			}

			// Determine if trades are made in the restored state
			if (location.state.teamGroups) {
				checkForTradesMade(location.state.teamGroups);
			}
		}
	}, [location.state, checkForTradesMade]);

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
		checkForTradesMade(sortedTeamGroups);
	};

	// Fetch teams from the database
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

	// Update team logo and fetch team picks when team selection changes
	useEffect(() => {
		const updateTeamsAndPicks = async () => {
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

							// Store the original picks for this team
							originalPicksRef.current[selectedTeam.id] = [...formattedPicks];

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
			updateTeamGroups(updatedTeamGroupsLocal);
		};

		if (teams.length > 0 || teamGroups.some((tg) => tg.name === '')) {
			updateTeamsAndPicks();
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [teamGroups.map((t) => t.name).join(','), teams]);

	// Add a new team (maximum 4 teams)
	const addTeam = () => {
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

	// Remove a team and renumber remaining teams
	const removeTeam = (teamId) => {
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

	// Show reset confirmation modal
	const showResetConfirmation = () => {
		// Only show confirmation if trades have been made
		if (hasTradesMade) {
			setResetModalVisible(true);
		} else {
			// If no trades have been made, just proceed with reset
			performReset();
		}
	};

	// Handle confirmation modal OK button
	const handleResetConfirm = () => {
		setResetModalVisible(false);
		performReset();
	};

	// Handle confirmation modal Cancel button
	const handleResetCancel = () => {
		setResetModalVisible(false);
	};

	// Perform the actual reset
	const performReset = () => {
		// If no trades have been made, no need to reset
		if (!hasTradesMade) return;

		// Start the animation
		setIsResetting(true);

		// Create new team groups with original picks for each team
		const resetTeamGroups = teamGroups.map((group) => {
			// If this group has a team selected, restore its original picks only
			if (group.teamId) {
				const originalPicks = originalPicksRef.current[group.teamId] || [];
				return {
					...group,
					picks: [...originalPicks].map((pick) => ({
						...pick,
					})),
				};
			}
			// Otherwise return the group as is (empty)
			return {
				...group,
				picks: [],
			};
		});

		// Update the team groups
		updateTeamGroups(resetTeamGroups);

		// Reset animation state after animation completes
		setTimeout(() => {
			setIsResetting(false);
			// Remove animation classes
			const updatedGroups = resetTeamGroups.map((group) => ({
				...group,
				picks: group.picks.map((pick) => {
					return pick;
				}),
			}));
			updateTeamGroups(updatedGroups);

			// After reset, no trades have been made
			setHasTradesMade(false);
		}, 500); // Match animation duration
	};

	// Handle analyzing the trade
	const handleAnalyzeTrade = () => {
		// Check if we have at least two teams with valid IDs
		const validTeams = teamGroups.filter((team) => team.teamId && team.name !== '');

		if (validTeams.length < 2) {
			message.error('Please select at least two teams for the trade');
			return;
		}

		// Check if any trades have been made
		if (!hasTradesMade) {
			message.warning('No trades have been made yet');
			return;
		}

		// Navigate to the analyze page with the trade data
		// Include the selected valuation model and teamGroups
		navigate('/analyze', {
			state: {
				teamGroups,
				selectedValuation,
			},
		});
	};

	// Add saveTrade function
	const _saveTrade = async (tradeName) => {
		// We need at least two teams selected with valid IDs
		const validTeams = teamGroups.filter((team) => team.teamId && team.name !== '');

		if (validTeams.length < 2) {
			message.error('Please select at least two teams for the trade');
			return;
		}

		// Check if there are any trades made
		if (!hasTradesMade) {
			message.warning('No trades have been made yet');
			return;
		}

		try {
			// Get all picks that have been traded (have moved from their original team)
			const tradedPicks = [];

			// Check each team's picks
			teamGroups.forEach((team) => {
				if (!team.teamId) return;

				team.picks.forEach((pick) => {
					// If this pick belongs to another team originally
					if (pick.originalTeamId !== team.teamId) {
						tradedPicks.push({
							draft_pick_id: parseInt(pick.pickId),
							sending_team_id: pick.originalTeamId,
							receiving_team_id: team.teamId,
						});
					}
				});
			});

			if (tradedPicks.length === 0) {
				message.warning('No picks have been traded');
				return;
			}

			// Prepare the trade data with all teams
			const tradeData = {
				teams: teamGroups
					.filter((team) => team.teamId) // Only include teams with IDs
					.map((team) => ({
						id: team.teamId,
						name: team.name,
					})),
				trade_name: tradeName || null,
				picks: tradedPicks,
			};

			// Send to the API
			const response = await fetch('/api/saved-trades', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify(tradeData),
			});

			if (!response.ok) {
				throw new Error('Failed to save trade');
			}

			await response.json();
			message.success('Trade saved successfully');
		} catch (error) {
			console.error('Error saving trade:', error);
			message.error('Failed to save trade');
		}
	};

	return (
		<div className="home-page">
			<TradeMenuBar
				onAddTeam={addTeam}
				onResetTrades={showResetConfirmation}
				onValuationChange={handleValuationChange}
				selectedValuation={selectedValuation}
				disableAddTeam={teamGroups.length >= 4}
				disableResetTrades={!hasTradesMade}
				onAnalyze={handleAnalyzeTrade}
			/>

			<div className="trade-builder" style={getTradeBuilderStyle(teamGroups.length)}>
				<TradeBuilder
					teams={teams}
					loading={loading}
					teamGroups={teamGroups}
					setTeamGroups={updateTeamGroups}
					getTeamGroupClass={getTeamGroupClass}
					isResetting={isResetting}
					onRemoveTeam={removeTeam}
				/>
			</div>

			{/* Reset Confirmation Modal */}
			<Modal
				title="Reset Trades"
				open={resetModalVisible}
				onOk={handleResetConfirm}
				onCancel={handleResetCancel}
				okText="Reset"
				cancelText="Cancel"
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
