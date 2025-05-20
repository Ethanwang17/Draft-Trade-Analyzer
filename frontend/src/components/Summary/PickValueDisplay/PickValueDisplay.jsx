import React, { useState, useEffect } from 'react';
import './PickValueDisplay.css';

const PickValueDisplay = ({ pickNumber, year, round, valuation = 1 }) => {
	const [pickValue, setPickValue] = useState(null);
	const [loading, setLoading] = useState(false);
	const currentYear = new Date().getFullYear();

	useEffect(() => {
		setLoading(true);

		// Determine which API endpoint to use based on available data
		let apiUrl;

		if (pickNumber) {
			// For specific pick numbers in current draft
			apiUrl =
				valuation === 1
					? `/api/pick-value/${pickNumber}`
					: `/api/pick-value/${pickNumber}/${valuation}`;
		} else if (year && round) {
			// For future picks (year/round only, no specific pick number)
			apiUrl = `/api/future-pick-value/${year}/${round}/${valuation}`;
		} else {
			// No valid pick data
			setLoading(false);
			return;
		}

		fetch(apiUrl)
			.then((response) => {
				if (!response.ok) {
					throw new Error('Pick value not found');
				}
				return response.json();
			})
			.then((data) => {
				setPickValue(data);
				setLoading(false);
			})
			.catch((error) => {
				console.error('Error fetching pick value:', error);
				setLoading(false);
			});
	}, [pickNumber, year, round, valuation]);

	if (loading) {
		return <span className="pick-value-loading">--</span>;
	}

	if (!pickValue) {
		return null;
	}

	// Show depreciation info for future picks
	const isFuturePick = !pickNumber && year > currentYear;

	return (
		<span className="pick-value-display">
			Value: <strong>{pickValue.value}</strong>
			{isFuturePick && pickValue.depreciation && (
				<span className="depreciation-info">*</span>
			)}
		</span>
	);
};

export default PickValueDisplay;
