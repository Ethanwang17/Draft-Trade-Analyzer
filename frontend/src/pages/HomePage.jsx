import React, { useState, useEffect, useRef } from 'react';
import { Modal } from 'antd';
import TradeBuilder from '../components/TradeBuilder';
import TradeHeader from '../components/TradeHeader';
import TradeActions from '../components/TradeActions';
import TradeOverview from '../components/TradeOverview';
import { getTeamGroupClass, getTradeBuilderStyle } from '../utils/tradeUtils';
import { sortPicks } from '../utils/pickSorter';

function HomePage() {
	const [teams, setTeams] = useState([]);
	const [loading, setLoading] = useState(true);
	// Store original picks for each team to enable reset functionality
	const originalPicksRef = useRef({});
	const [isResetting, setIsResetting] = useState(false);
	// State for reset confirmation modal
	const [resetModalVisible, setResetModalVisible] = useState(false);
	// State to track if any trades have been made
	const [hasTradesMade, setHasTradesMade] = useState(false);

	// Initialize with empty team groups
	const [teamGroups, setTeamGroups] = useState([
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
	]);

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

	// Function to check if any picks have been moved from their original teams
	const checkForTradesMade = (groups = teamGroups) => {
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

	// Add a new team (maximum 5 teams)
	const addTeam = () => {
		if (teamGroups.length >= 5) return;

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
		console.log('Analyzing trade for teams:', teamGroups);
		// Additional logic for trade analysis would go here
	};

	return (
		<div className="home-page">
			<TradeHeader
				onAddTeam={addTeam}
				onResetTrades={showResetConfirmation}
				disableAddTeam={teamGroups.length >= 5}
				disableResetTrades={!hasTradesMade}
			/>

			<TradeOverview teamGroups={teamGroups} />

			<div className="trade-builder" style={getTradeBuilderStyle(teamGroups.length)}>
				<TradeBuilder
					teams={teams}
					loading={loading}
					teamGroups={teamGroups}
					setTeamGroups={updateTeamGroups}
					getTeamGroupClass={getTeamGroupClass}
					isResetting={isResetting}
				/>

				<TradeActions onAnalyze={handleAnalyzeTrade} />
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
