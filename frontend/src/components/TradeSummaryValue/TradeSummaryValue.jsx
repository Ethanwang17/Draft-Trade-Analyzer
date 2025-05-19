import React, { useState, useEffect } from 'react';
import './TradeSummaryValue.css';

const TradeSummaryValue = ({ picks, direction }) => {
	const [totalValue, setTotalValue] = useState(null);
	const [loading, setLoading] = useState(false);

	useEffect(() => {
		if (!picks || picks.length === 0) {
			setTotalValue(0);
			return;
		}

		setLoading(true);
		const fetchValues = async () => {
			try {
				let total = 0;
				// Fetch value for each pick
				for (const pick of picks) {
					if (pick.pick_number) {
						const valuation = pick.valuation || 1;
						const apiUrl =
							valuation === 1
								? `/api/pick-value/${pick.pick_number}`
								: `/api/pick-value/${pick.pick_number}/${valuation}`;

						const response = await fetch(apiUrl);
						if (response.ok) {
							const data = await response.json();
							total += parseFloat(data.value);
						}
					}
				}
				setTotalValue(total);
				setLoading(false);
			} catch (error) {
				console.error('Error calculating total value:', error);
				setLoading(false);
			}
		};

		fetchValues();
	}, [picks]);

	if (loading) {
		return <div className="trade-summary-value-loading">Calculating...</div>;
	}

	if (totalValue === null || totalValue === 0) {
		return null;
	}

	// Display a green + for receiving and a red - for giving
	const prefix =
		direction === 'incoming' ? (
			<span className="value-prefix positive">+</span>
		) : (
			<span className="value-prefix negative">-</span>
		);

	return (
		<div className={`trade-summary-value ${direction}`}>
			<span>Total Value:</span>
			<strong>
				{prefix} {totalValue}
			</strong>
		</div>
	);
};

export default TradeSummaryValue;
