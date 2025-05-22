// React and library imports
import React, { useRef, useState } from 'react';
import { Modal } from 'antd';
import { useLocation } from 'react-router-dom';

// Component and utility imports
import TradeBuilder from '../components/TradeBuilder/TradeBuilder';
import TradeMenuBar from '../components/Layout/TradeMenuBar/TradeMenuBar';
import { getTeamGroupClass, getTradeBuilderStyle } from '../utils/tradeUtils';
import { sortPicks } from '../utils/pickSorter';

// Custom hook imports
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
	const originalPicksRef = useRef({}); // Store original picks for reset/restore
	const [hasTradesMade, setHasTradesMade] = useState(false); // Tracks if trades have occurred

	// Handle refreshes to avoid stale state
	usePageRefresh();

	// Set initial team groups, potentially restoring from Analyze page state
	const initialTeamGroups = (() => {
		if (location.state?.preserveTradeState && location.state?.teamGroups) {
			return location.state.teamGroups;
		}
		// Default: two empty team slots
		return [
			{ id: 1, name: '', logo: '', picks: [], teamId: null },
			{ id: 2, name: '', logo: '', picks: [], teamId: null },
		];
	})();

	// Fetch team data
	const { teams, loading } = useTeamManagement(initialTeamGroups, null);

	// Check if trades have been made and update UI state
	const checkForTradesMadeAndUpdateState = (groups, checkFn) => {
		if (!checkFn) return false;
		const hasTrades = checkFn(groups);
		setHasTradesMade(hasTrades);
		return hasTrades;
	};

	const [teamGroups, setTeamGroups] = useState(initialTeamGroups);
	const [selectedValuation, setSelectedValuation] = useState(1);

	// Manage reset modal and reset behavior
	const {
		isResetting,
		resetModalVisible,
		checkForTradesMade,
		showResetConfirmation,
		handleResetConfirm,
		handleResetCancel,
	} = useTradeReset(originalPicksRef, setTeamGroups, hasTradesMade, setHasTradesMade);

	// Syncs pick and team data (updates when valuation changes or picks are traded)
	useTeamsAndPicks({
		teams,
		teamGroups,
		setTeamGroups,
		selectedValuation,
		originalPicksRef,
		checkForTradesMade,
		checkForTradesMadeAndUpdateState,
	});

	// Get function to run analysis
	const { handleAnalyzeTrade } = useTradeAnalyzer();

	// Sorts and updates team groups when changes are made
	const updateTeamGroups = (newTeamGroups) => {
		const sortedTeamGroups = newTeamGroups.map((group) => ({
			...group,
			picks: sortPicks(group.picks),
		}));
		setTeamGroups(sortedTeamGroups);
		checkForTradesMadeAndUpdateState(sortedTeamGroups, checkForTradesMade);
	};

	// Update picks to reflect selected valuation model
	const handleValuationChange = (valuationId) => {
		setSelectedValuation(valuationId);
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

	// Add a new team slot (up to 4 allowed)
	const handleAddTeam = () => {
		if (teamGroups.length >= 4) return;
		const newId = teamGroups.length + 1;
		updateTeamGroups([...teamGroups, { id: newId, name: '', logo: '', picks: [], teamId: null }]);
	};

	// Remove a team and return traded picks to original owners
	const handleRemoveTeam = (teamId) => {
		if (teamGroups.length <= 2) return;
		const teamToRemove = teamGroups.find((team) => team.id === teamId);

		if (!teamToRemove || !teamToRemove.teamId) {
			const newTeamGroups = teamGroups
				.filter((team) => team.id !== teamId)
				.map((team, index) => ({ ...team, id: index + 1 }));
			updateTeamGroups(newTeamGroups);
			return;
		}

		let updatedTeamGroups = [...teamGroups];

		// Return picks that belong to the removed team but are held by others
		updatedTeamGroups = updatedTeamGroups.map((group) => {
			if (group.id === teamId) return group;
			const picksToReturn = group.picks.filter(
				(pick) => pick.originalTeamId === teamToRemove.teamId
			);
			if (picksToReturn.length === 0) return group;
			return {
				...group,
				picks: group.picks.filter((pick) => pick.originalTeamId !== teamToRemove.teamId),
			};
		});

		// Return picks that the removed team holds but belong to others
		const picksToReturn = teamToRemove.picks.filter(
			(pick) => pick.originalTeamId !== teamToRemove.teamId
		);

		picksToReturn.forEach((pick) => {
			const originalTeamGroup = updatedTeamGroups.find(
				(group) => group.teamId === pick.originalTeamId
			);
			if (originalTeamGroup) {
				const resetPick = { ...pick, className: '' };
				const teamIndex = updatedTeamGroups.findIndex((group) => group.id === originalTeamGroup.id);
				updatedTeamGroups[teamIndex] = {
					...originalTeamGroup,
					picks: [...originalTeamGroup.picks, resetPick],
				};
			}
		});

		updatedTeamGroups = updatedTeamGroups
			.filter((team) => team.id !== teamId)
			.map((team, index) => ({ ...team, id: index + 1 }));

		updateTeamGroups(updatedTeamGroups);
	};

	// Restore trade state from navigation
	useRestoreTradeState({
		handleValuationChange,
		originalPicksRef,
		checkForTradesMadeAndUpdateState,
		checkForTradesMade,
	});

	// Run initial trade check on mount
	useInitialTradeCheck({ teamGroups, checkForTradesMade, setHasTradesMade });

	// UI callbacks for reset and analyze
	const handleResetTrades = () => showResetConfirmation(teamGroups);
	const handleModalResetConfirm = () => handleResetConfirm(teamGroups);
	const handleAnalyze = () => handleAnalyzeTrade(teamGroups, selectedValuation, hasTradesMade);

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

			{/* Trade builder area */}
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

			{/* Modal to confirm reset action */}
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
