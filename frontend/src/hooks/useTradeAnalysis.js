import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

/**
 * Hook for managing trade analysis data and valuation models
 * @param {Object} initialData - Initial trade data from location state
 * @returns {Object} Trade data state and helper functions
 */
export const useTradeAnalysis = (initialData) => {
	const navigate = useNavigate();
	const [loading, setLoading] = useState(true);
	const [tradeData, setTradeData] = useState(null);
	const [selectedValuation, setSelectedValuation] = useState(1);
	const [valuationModels, setValuationModels] = useState([]);

	// Initialize trade data or navigate back to home if no data
	useEffect(() => {
		if (!initialData || !initialData.teamGroups) {
			navigate('/home');
			return;
		}

		setTradeData(initialData);
		setSelectedValuation(initialData.selectedValuation || 1);
		setLoading(false);
	}, [initialData, navigate]);

	// Fetch valuation models
	useEffect(() => {
		const fetchValuations = async () => {
			try {
				const response = await fetch('/api/valuations');
				if (!response.ok) {
					throw new Error('Failed to fetch valuations');
				}
				const data = await response.json();
				setValuationModels(data);
			} catch (error) {
				console.error('Error fetching valuations:', error);
			}
		};

		fetchValuations();
	}, []);

	// Handle back to trade builder
	const handleBackToTrade = () => {
		// Make sure all picks have the current valuation when going back
		const updatedTeamGroups = tradeData?.teamGroups.map((team) => ({
			...team,
			picks:
				team.picks?.map((pick) => ({
					...pick,
					valuation: selectedValuation,
				})) || [],
		}));

		// Always preserve state when clicking the back button
		// The HomePage component will handle clearing state on page refresh
		navigate('/home', {
			state: {
				preserveTradeState: true,
				teamGroups: updatedTeamGroups,
				selectedValuation: selectedValuation,
			},
		});
	};

	return {
		loading,
		tradeData,
		setTradeData,
		selectedValuation,
		setSelectedValuation,
		valuationModels,
		handleBackToTrade,
	};
};
