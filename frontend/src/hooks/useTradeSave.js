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
			return false;
		}

		try {
			// Prepare the trade data with all teams
			const saveData = {
				teams: tradeData.teamGroups
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
				body: JSON.stringify(saveData),
			});

			if (!response.ok) {
				throw new Error('Failed to save trade');
			}

			await response.json();
			message.success('Trade saved successfully');
			setSaveModalVisible(false);
			setTradeName('');
			return true;
		} catch (error) {
			console.error('Error saving trade:', error);
			message.error('Failed to save trade');
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
