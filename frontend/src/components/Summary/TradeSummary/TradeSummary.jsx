import React from 'react';
import TradeReceiveSend from '../TradeReceiveSend/TradeReceiveSend';
import SummaryNetValue from '../SummaryNetValue/SummaryNetValue';
import './TradeSummary.css';

// Component that displays both incoming and outgoing picks for a trade
const TradeSummary = ({
	tradeData,
	onResetPick,
	showNetValue = false,
	selectedValuation,
	showRemoveIcon,
}) => {
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
				showRemoveIcon={showRemoveIcon}
			/>

			<TradeReceiveSend
				title="Receiving"
				direction="incoming"
				picks={incoming}
				icon="↓"
				onResetPick={onResetPick}
				selectedValuation={selectedValuation}
				showRemoveIcon={showRemoveIcon}
			/>

			{/* Conditionally show net value summary if enabled */}
			{showNetValue && <SummaryNetValue picks={tradeData} />}
		</div>
	);
};

export default TradeSummary;
