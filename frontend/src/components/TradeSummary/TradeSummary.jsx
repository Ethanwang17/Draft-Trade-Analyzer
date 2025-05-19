import React from 'react';
import TradeSummarySection from '../TradeSummarySection/TradeSummarySection';
import SummaryNetValue from '../SummaryNetValue/SummaryNetValue';
import './TradeSummary.css';

const TradeSummary = ({ tradeData, onResetPick, showNetValue = false }) => {
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

			{showNetValue && <SummaryNetValue picks={tradeData} />}
		</div>
	);
};

export default TradeSummary;
