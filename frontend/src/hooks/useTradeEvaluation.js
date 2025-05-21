import { CheckCircleOutlined, WarningOutlined, CloseCircleOutlined } from '@ant-design/icons';

/**
 * Hook for evaluating trade balance
 * @param {Object} tradeData - The trade data
 * @param {Object} pickValues - Object mapping pick numbers to values
 * @returns {Object} Trade evaluation functions and utilities
 */
export const useTradeEvaluation = (tradeData, pickValues) => {
	// Find moved picks and track their movements
	const findMovedPicks = () => {
		if (!tradeData || !tradeData.teamGroups) return {};

		const movedPicks = {};

		// Track where each pick currently is
		const currentPickLocations = {};

		// Find all picks that have moved
		tradeData.teamGroups.forEach((team) => {
			if (!team.teamId || !team.picks) return;

			team.picks.forEach((pick) => {
				// Store current location of each pick
				currentPickLocations[pick.id] = {
					teamId: team.teamId,
					teamName: team.name,
					pick,
				};

				// If pick is not with its original team, it has moved
				if (pick.originalTeamId !== team.teamId) {
					// Record this as a moved pick
					if (!movedPicks[pick.originalTeamId]) {
						movedPicks[pick.originalTeamId] = {
							outgoing: [],
							incoming: [],
						};
					}

					if (!movedPicks[team.teamId]) {
						movedPicks[team.teamId] = {
							outgoing: [],
							incoming: [],
						};
					}

					// Add to outgoing for original team
					movedPicks[pick.originalTeamId].outgoing.push({
						...pick,
						currentTeamId: team.teamId,
						currentTeamName: team.name,
					});

					// Add to incoming for current team
					movedPicks[team.teamId].incoming.push(pick);
				}
			});
		});

		return movedPicks;
	};

	// Helper function to get pick value, handling both numbered and future picks
	const getPickValue = (pick) => {
		if (!pickValues) return 0;

		// For picks with a specific pick number
		if (pick.pick_number && pickValues[pick.pick_number]) {
			return pickValues[pick.pick_number];
		}

		// For future picks, try to get value by pick id
		if (pick.id && pickValues[pick.id]) {
			return pickValues[pick.id];
		}

		// For future picks, try to get value by year and round
		if (pick.year && pick.round) {
			const futureKey = `future_${pick.year}_${pick.round}`;
			if (pickValues[futureKey]) {
				return pickValues[futureKey];
			}
		}

		return 0;
	};

	// Calculate team values based on pick movements
	const calculateTeamValues = (team) => {
		if (!tradeData)
			return {
				outgoingPicks: [],
				incomingPicks: [],
				outgoingValue: 0,
				incomingValue: 0,
				netValue: 0,
			};

		const movedPicks = findMovedPicks();
		const teamMovedPicks = movedPicks[team.teamId] || { outgoing: [], incoming: [] };

		// Use the correctly identified moved picks
		const outgoingPicks = teamMovedPicks.outgoing;
		const incomingPicks = teamMovedPicks.incoming;

		// Calculate values using the fetched pick values
		const outgoingValue = outgoingPicks.reduce((sum, pick) => {
			return sum + getPickValue(pick);
		}, 0);

		const incomingValue = incomingPicks.reduce((sum, pick) => {
			return sum + getPickValue(pick);
		}, 0);

		const netValue = incomingValue - outgoingValue;

		return {
			outgoingPicks,
			incomingPicks,
			outgoingValue,
			incomingValue,
			netValue,
		};
	};

	// Evaluate trade balance
	const evaluateTrade = () => {
		if (!tradeData) return null;

		const teamValues = tradeData.teamGroups
			.filter((team) => team.teamId)
			.map((team) => {
				const values = calculateTeamValues(team);
				return {
					teamId: team.teamId,
					name: team.name,
					netValue: values.netValue,
				};
			});

		// Find the team with highest and lowest net values
		const sortedTeams = [...teamValues].sort((a, b) => b.netValue - a.netValue);
		const highestValue = sortedTeams[0];
		const lowestValue = sortedTeams[sortedTeams.length - 1];

		// Calculate the absolute difference between highest and lowest values
		const valueDifference = Math.abs(highestValue.netValue);

		// Calculate the total value of all picks involved in the trade
		let totalTradeValue = 0;
		tradeData.teamGroups.forEach((team) => {
			if (!team.teamId || !team.picks) return;

			team.picks.forEach((pick) => {
				// Only count picks that have been traded (not with original team)
				if (pick.originalTeamId !== team.teamId) {
					totalTradeValue += getPickValue(pick);
				}
			});
		});

		// Calculate percentage as difference divided by total trade value
		const percentageDifference =
			totalTradeValue > 0 ? (valueDifference / totalTradeValue) * 100 : 0;


		// Determine if the trade is balanced - use 5% as threshold
		if (percentageDifference < 5) {
			return {
				status: 'slightlyFavors',
				message: `Slightly Favors ${highestValue.name} (${Math.round(percentageDifference)}%)`,
				value: `+${Math.round(highestValue.netValue)}`,
				iconType: CheckCircleOutlined,

				// iconType: WarningOutlined,
			};
		} else {
			return {
				status: 'heavilyFavors',
				message: `Heavily Favors ${highestValue.name} (${Math.round(percentageDifference)}%)`,
				value: `+${Math.round(highestValue.netValue)}`,
				iconType: CloseCircleOutlined,
			};
		}
	};

	// Prepare team trade data for display
	const prepareTeamTradeData = (team) => {
		const movedPicks = findMovedPicks();
		const teamMovedPicks = movedPicks[team.teamId] || { outgoing: [], incoming: [] };

		// Transform outgoing picks for proper display
		const outgoingWithInfo = teamMovedPicks.outgoing.map((pick) => ({
			...pick,
			toTeam: pick.currentTeamName,
			value: getPickValue(pick),
		}));

		// Transform incoming picks for proper display
		const incomingWithInfo = teamMovedPicks.incoming.map((pick) => ({
			...pick,
			fromTeam: pick.originalTeamName,
			value: getPickValue(pick),
		}));

		return {
			outgoing: outgoingWithInfo,
			incoming: incomingWithInfo,
		};
	};

	return {
		findMovedPicks,
		calculateTeamValues,
		evaluateTrade,
		prepareTeamTradeData,
	};
};
