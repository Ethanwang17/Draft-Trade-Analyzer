import React, { useState, useEffect } from 'react';
import './PickValueDisplay.css';

const PickValueDisplay = ({ pickNumber, valuation = 1 }) => {
	const [pickValue, setPickValue] = useState(null);
	const [loading, setLoading] = useState(false);

	useEffect(() => {
		if (pickNumber) {
			setLoading(true);
			// Use the appropriate API endpoint based on whether we have a valuation model
			const apiUrl =
				valuation === 1
					? `/api/pick-value/${pickNumber}`
					: `/api/pick-value/${pickNumber}/${valuation}`;

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
		}
	}, [pickNumber, valuation]);

	if (!pickNumber || loading) {
		return <span className="pick-value-loading">--</span>;
	}

	if (!pickValue) {
		return null;
	}

	return (
		<span className="pick-value-display">
			Value: <strong>{pickValue.value}</strong>
		</span>
	);
};

export default PickValueDisplay;
