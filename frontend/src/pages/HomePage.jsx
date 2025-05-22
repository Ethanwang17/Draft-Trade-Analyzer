import React, { useRef, useState } from 'react';
import { Modal } from 'antd';
import { useLocation } from 'react-router-dom';
import TradeBuilder from '../components/TradeBuilder/TradeBuilder';
import TradeMenuBar from '../components/Layout/TradeMenuBar/TradeMenuBar';
import { getTeamGroupClass, getTradeBuilderStyle } from '../utils/tradeUtils';
import { sortPicks } from '../utils/pickSorter';
import {
	useTeamManagement,
	useTradeReset,
	useTradeAnalyzer,
	usePageRefresh,
	useTeamsAndPicks,
	useRestoreTradeState,
	useInitialTradeCheck,
} from '../hooks';

function HomePage() {
	const location = useLocation();
	const originalPicksRef = useRef({});
	const [hasTradesMade, setHasTradesMade] = useState(false);

	// Handle full page refreshes
	usePageRefresh();

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

	// Reset-related behaviour (modal & state helpers)
	const {
		isResetting,
		resetModalVisible,
		checkForTradesMade,
		showResetConfirmation,
		handleResetConfirm,
		handleResetCancel,
	} = useTradeReset(originalPicksRef, setTeamGroups, hasTradesMade, setHasTradesMade);

	// Synchronise team & pick data
	useTeamsAndPicks({
		teams,
		teamGroups,
		setTeamGroups,
		selectedValuation,
		originalPicksRef,
		checkForTradesMade,
		checkForTradesMadeAndUpdateState,
	});

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

	// Restore state when navigating back from Analyze page
	useRestoreTradeState({
		handleValuationChange,
		originalPicksRef,
		checkForTradesMadeAndUpdateState,
		checkForTradesMade,
	});

	// Perform initial trade status calculation
	useInitialTradeCheck({ teamGroups, checkForTradesMade, setHasTradesMade });

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
