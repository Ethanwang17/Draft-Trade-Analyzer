import { useState, useEffect } from 'react';
import { message } from 'antd';

// Hook to retrieve all saved trades on component mount and expose loading state
export const useSavedTrades = () => {
	const [trades, setTrades] = useState([]);
	const [loading, setLoading] = useState(true);

	// Fetch saved trades from the backend and update the trades state
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

	// Called once after component mount to initiate trade fetch
	useEffect(() => {
		fetchSavedTrades();
	}, []);

	// Return relevant trade data, loading flag, setter, and refresh function for consumers
	return { trades, loading, setTrades, refreshTrades: fetchSavedTrades };
};
