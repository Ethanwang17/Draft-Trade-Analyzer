import React, { useState, useEffect } from 'react';
import './SummaryNetValue.css';

const SummaryNetValue = ({ picks, direction }) => {
	const [incomingValue, setIncomingValue] = useState(0);
	const [outgoingValue, setOutgoingValue] = useState(0);
	const [loading, setLoading] = useState(false);

	// Calculate incoming and outgoing values
	useEffect(() => {
		if (!picks || !picks.incoming || !picks.outgoing) {
			setIncomingValue(0);
			setOutgoingValue(0);
			return;
		}

		setLoading(true);
		const fetchValues = async () => {
			try {
				let totalIncoming = 0;
				let totalOutgoing = 0;

				// Calculate incoming value
				for (const pick of picks.incoming) {
					if (pick.pick_number) {
						const valuation = pick.valuation || 1;
						const apiUrl = `/api/pick-value/${pick.pick_number}/${valuation}`;

						const response = await fetch(apiUrl);
						if (response.ok) {
							const data = await response.json();
							totalIncoming += parseFloat(data.value);
						}
					}
				}

				// Calculate outgoing value
				for (const pick of picks.outgoing) {
					if (pick.pick_number) {
						const valuation = pick.valuation || 1;
						const apiUrl = `/api/pick-value/${pick.pick_number}/${valuation}`;

						const response = await fetch(apiUrl);
						if (response.ok) {
							const data = await response.json();
							totalOutgoing += parseFloat(data.value);
						}
					}
				}

				setIncomingValue(totalIncoming);
				setOutgoingValue(totalOutgoing);
				setLoading(false);
			} catch (error) {
				console.error('Error calculating net value:', error);
				setLoading(false);
			}
		};

		fetchValues();
	}, [picks]);

	if (loading) {
		return <div className="summary-net-value-loading">Calculating net value...</div>;
	}

	const netValue = incomingValue - outgoingValue;
	const isPositive = netValue > 0;
	const isNeutral = netValue === 0;

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
