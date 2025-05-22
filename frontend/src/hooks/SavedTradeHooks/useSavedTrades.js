import { useState, useEffect } from 'react';
import { message } from 'antd';

/**
 * Hook for fetching all saved trades
 * @returns {Object} Object containing trades data and loading state
 */
export const useSavedTrades = () => {
	const [trades, setTrades] = useState([]);
	const [loading, setLoading] = useState(true);

	const fetchSavedTrades = async () => {
		try {
			setLoading(true);
			const response = await fetch('/api/saved-trades');

			if (!response.ok) {
				throw new Error('Failed to fetch saved trades');
			}

			const data = await response.json();
			setTrades(data);
		} catch (error) {
			console.error('Error loading saved trades:', error);
			message.error('Failed to load saved trades');
		} finally {
			setLoading(false);
		}
	};

	useEffect(() => {
		fetchSavedTrades();
	}, []);

	return { trades, loading, setTrades, refreshTrades: fetchSavedTrades };
};
