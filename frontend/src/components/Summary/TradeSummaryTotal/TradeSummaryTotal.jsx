import React, { useState, useEffect } from 'react';
import './TradeSummaryTotal.css';

const TradeSummaryTotal = ({ picks, direction }) => {
	const [totalValue, setTotalValue] = useState(null);
	const [loading] = useState(false);

	useEffect(() => {
		if (!picks || picks.length === 0) {
			setTotalValue(0);
			return;
		}

		// Calculate the total value of picks (incoming or outgoing)
		const total = picks.reduce((sum, pick) => {
			// Parse pick.value to ensure it's a number
			return sum + (parseFloat(pick.value) || 0);
		}, 0);

		setTotalValue(total);
	}, [picks]);

	// Display a loading indicator if calculation is pending
	if (loading) {
		return <div className="trade-summary-value-loading">Calculating...</div>;
	}

	// Skip rendering if value is zero or null
	if (totalValue === null || totalValue === 0) {
		return null;
	}

	// Use + or - prefix depending on trade direction
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
				{prefix} {Number(totalValue).toFixed(1)}
			</strong>
		</div>
	);
};

export default TradeSummaryTotal;
