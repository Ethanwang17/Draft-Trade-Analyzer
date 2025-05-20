import React from 'react';
import TradeReceiveSend from '../TradeReceiveSend/TradeReceiveSend';
import SummaryNetValue from '../SummaryNetValue/SummaryNetValue';
import './TradeSummary.css';

const TradeSummary = ({ tradeData, onResetPick, showNetValue = false, selectedValuation }) => {
	const { outgoing = [], incoming = [] } = tradeData || {};

	return (
		<div className="trade-summary-container">
			<TradeReceiveSend
				title="Sending"
				direction="outgoing"
				picks={outgoing}
				icon="↑"
				onResetPick={onResetPick}
				selectedValuation={selectedValuation}
			/>

			<TradeReceiveSend
				title="Receiving"
				direction="incoming"
				picks={incoming}
				icon="↓"
				onResetPick={onResetPick}
				selectedValuation={selectedValuation}
			/>

			{showNetValue && <SummaryNetValue picks={tradeData} />}
		</div>
	);
};

export default TradeSummary;
