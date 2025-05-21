import { useState } from 'react';
import { message } from 'antd';

/**
 * Hook for saving trades
 * @returns {Object} Functions and state for trade saving
 */
export const useTradeSave = () => {
	const [saveModalVisible, setSaveModalVisible] = useState(false);
	const [tradeName, setTradeName] = useState('');

	const saveTrade = async (tradeData) => {
		if (!tradeData || !tradeData.teamGroups) {
			message.error('No trade data available');
			return false;
		}

		// Track picks that have moved from their original teams
		const tradedPicks = [];

		// Check each team's picks
		tradeData.teamGroups.forEach((team) => {
			if (!team.teamId) return;

			team.picks.forEach((pick) => {
				// If this pick belongs to another team originally
				if (pick.originalTeamId !== team.teamId) {
					// Validate pickId, originalTeamId, and team.teamId
					if (!pick.pickId) {
						console.error('Missing pickId for traded pick:', pick);
						return; // Skip this pick
					}

					const draft_pick_id = parseInt(pick.pickId);
					if (isNaN(draft_pick_id)) {
						console.error('Invalid pickId format:', pick.pickId);
						return; // Skip this pick
					}

					// Ensure sending and receiving team IDs are valid integers
					const sending_team_id =
						typeof pick.originalTeamId === 'string'
							? parseInt(pick.originalTeamId)
							: pick.originalTeamId;

					const receiving_team_id =
						typeof team.teamId === 'string' ? parseInt(team.teamId) : team.teamId;

					if (isNaN(sending_team_id) || isNaN(receiving_team_id)) {
						console.error('Invalid team ID:', {
							sending: pick.originalTeamId,
							receiving: team.teamId,
						});
						return; // Skip this pick
					}

					tradedPicks.push({
						draft_pick_id,
						sending_team_id,
						receiving_team_id,
					});
				}
			});
		});

		if (tradedPicks.length === 0) {
			message.warning('No picks have been traded');
			return false;
		}

		try {
			// Prepare the trade data with all teams
			const saveData = {
				teams: tradeData.teamGroups
					.filter((team) => team.teamId) // Only include teams with IDs
					.map((team) => ({
						id: typeof team.teamId === 'string' ? parseInt(team.teamId) : team.teamId,
						name: team.name,
					})),
				trade_name: tradeName || null,
				picks: tradedPicks,
				valuation_model_id: tradeData.selectedValuation || 1,
			};

			// Send to the API
			const response = await fetch('/api/saved-trades', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify(saveData),
			});

			if (!response.ok) {
				const errorData = await response.json().catch(() => ({}));
				console.error('Server error response:', errorData);
				throw new Error(`Failed to save trade: ${errorData.error || response.statusText}`);
			}

			await response.json();
			message.success('Trade saved successfully');
			setSaveModalVisible(false);
			setTradeName('');
			return true;
		} catch (error) {
			console.error('Error saving trade:', error);
			message.error(`Failed to save trade: ${error.message}`);
			return false;
		}
	};

	return {
		saveModalVisible,
		setSaveModalVisible,
		tradeName,
		setTradeName,
		saveTrade,
	};
};
