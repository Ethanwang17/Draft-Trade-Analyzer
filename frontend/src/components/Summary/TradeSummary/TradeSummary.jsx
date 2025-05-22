import React from 'react';
import TradeReceiveSend from '../TradeReceiveSend/TradeReceiveSend';
import SummaryNetValue from '../SummaryNetValue/SummaryNetValue';
import './TradeSummary.css';

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

			{showNetValue && <SummaryNetValue picks={tradeData} />}
		</div>
	);
};

export default TradeSummary;
