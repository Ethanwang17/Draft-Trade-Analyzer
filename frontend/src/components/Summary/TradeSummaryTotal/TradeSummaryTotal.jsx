import React, { useState, useEffect } from 'react';
import './TradeSummaryTotal.css';

const TradeSummaryTotal = ({ picks, direction }) => {
	const [totalValue, setTotalValue] = useState(null);
	const [loading, setLoading] = useState(false);

	useEffect(() => {
		if (!picks || picks.length === 0) {
			setTotalValue(0);
			return;
		}

		// Calculate total value from the pre-calculated values
		const total = picks.reduce((sum, pick) => {
			return sum + (pick.value || 0);
		}, 0);

		setTotalValue(total);
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
				{prefix} {totalValue.toFixed(1)}
			</strong>
		</div>
	);
};

export default TradeSummaryTotal;
