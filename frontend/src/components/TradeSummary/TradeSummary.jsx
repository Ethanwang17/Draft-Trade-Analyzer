import React from 'react';
import TradeSummarySection from '../TradeSummarySection/TradeSummarySection';
import './TradeSummary.css';

const TradeSummary = ({ tradeData, onResetPick }) => {
	const { outgoing = [], incoming = [] } = tradeData || {};

	return (
		<div className="trade-summary-container">
			<TradeSummarySection
				title="Sending"
				direction="outgoing"
				picks={outgoing}
				icon="↑"
				onResetPick={onResetPick}
			/>

			<TradeSummarySection
				title="Receiving"
				direction="incoming"
				picks={incoming}
				icon="↓"
				onResetPick={onResetPick}
			/>
		</div>
	);
};

export default TradeSummary;
