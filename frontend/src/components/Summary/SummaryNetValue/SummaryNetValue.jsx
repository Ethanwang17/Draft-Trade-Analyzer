import React, { useState, useEffect } from 'react';
import './SummaryNetValue.css';

const SummaryNetValue = ({ picks }) => {
	const [incomingValue, setIncomingValue] = useState(0);
	const [outgoingValue, setOutgoingValue] = useState(0);
	const [loading] = useState(false);

	// Compute total incoming and outgoing value and derive net result
	useEffect(() => {
		if (!picks || !picks.incoming || !picks.outgoing) {
			setIncomingValue(0);
			setOutgoingValue(0);
			return;
		}

		// Calculate totals directly from the provided values
		const totalIncoming = picks.incoming.reduce((sum, pick) => sum + (pick.value || 0), 0);
		const totalOutgoing = picks.outgoing.reduce((sum, pick) => sum + (pick.value || 0), 0);

		setIncomingValue(totalIncoming);
		setOutgoingValue(totalOutgoing);
	}, [picks]);

	if (loading) {
		return <div className="summary-net-value-loading">Calculating net value...</div>;
	}

	const netValue = incomingValue - outgoingValue;
	const isPositive = netValue > 0;
	const isNeutral = netValue === 0;

	// Display net value with color-coded styling based on positive/neutral/negative
	return (
		<div className="summary-net-value">
			<div className="net-value-label">Net Value:</div>
			<div
				className={`net-value-amount ${isPositive ? 'positive' : isNeutral ? 'neutral' : 'negative'}`}
			>
				{isPositive && '+'}
				{netValue.toFixed(1)}
			</div>
		</div>
	);
};

export default SummaryNetValue;
