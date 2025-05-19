import React from 'react';
import TradeItem from '../TradeItem/TradeItem';
import TradeSummaryValue from '../TradeSummaryValue/TradeSummaryValue';
import './TradeSummarySection.css';

const TradeSummarySection = ({ title, direction, picks = [], icon, onResetPick }) => {
	return (
		<div className={`trade-summary-section ${direction}`}>
			<div className="trade-summary-header">
				<span className="trade-direction-icon">{icon}</span>
				<h4>{title}</h4>
			</div>
			<div className="trade-summary-content">
				{picks.length > 0 ? (
					<>
						<ul className="trade-list">
							{picks.map((pick) => (
								<TradeItem key={pick.id} pick={pick} onResetPick={onResetPick} />
							))}
						</ul>
						<TradeSummaryValue picks={picks} direction={direction} />
					</>
				) : (
					<div className="trade-empty-message">No picks {direction}</div>
				)}
			</div>
		</div>
	);
};

export default TradeSummarySection;
