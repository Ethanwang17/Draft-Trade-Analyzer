import { useNavigate } from 'react-router-dom';
import { message } from 'antd';

/**
 * Hook for trade analysis navigation
 * @returns {Object} Functions for trade analysis
 */
export const useTradeAnalyzer = () => {
	const navigate = useNavigate();

	// Validate trade data before analyzing
	const validateTrade = (teamGroups) => {
		// Check if we have at least two teams with valid IDs
		const validTeams = teamGroups.filter((team) => team.teamId && team.name !== '');

		if (validTeams.length < 2) {
			message.error('Please select at least two teams for the trade');
			return false;
		}

		return true;
	};

	// Check if trades have been made
	const checkTradesMade = (hasTradesMade) => {
		if (!hasTradesMade) {
			message.warning('No trades have been made yet');
			return false;
		}
		return true;
	};

	// Handle analyzing the trade
	const handleAnalyzeTrade = (teamGroups, selectedValuation, hasTradesMade) => {
		// Validate trade data
		if (!validateTrade(teamGroups)) {
			return;
		}

		// Check if any trades have been made
		if (!checkTradesMade(hasTradesMade)) {
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

	return {
		handleAnalyzeTrade,
		validateTrade,
		checkTradesMade,
	};
};
