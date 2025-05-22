import React from 'react';
import PickInfo from '../PickInfo/PickInfo';
import TradeSummaryTotal from '../TradeSummaryTotal/TradeSummaryTotal';
import './TradeReceiveSend.css';

const TradeReceiveSend = ({
	title,
	direction,
	picks = [],
	icon,
	onResetPick,
	selectedValuation,
	showRemoveIcon,
}) => {
	return (
		<div className={`trade-summary-section ${direction}`}>
			<div className="trade-summary-header">
				<div className="header-left">
					<span className="trade-direction-icon">{icon}</span>
					<h4>{title}</h4>
				</div>
				{picks.length > 0 && (
					<div className="picks-count">
						({picks.length} Pick{picks.length !== 1 ? 's' : ''})
					</div>
				)}
			</div>
			<div className="trade-summary-content">
				{picks.length > 0 ? (
					<>
						<ul className="trade-list">
							{picks.map((pick) => (
								<PickInfo
									key={pick.id}
									pick={pick}
									onResetPick={onResetPick}
									selectedValuation={selectedValuation}
									showRemoveIcon={showRemoveIcon}
								/>
							))}
						</ul>
						<TradeSummaryTotal picks={picks} direction={direction} />
					</>
				) : (
					<div className="trade-empty-message">No picks {direction}</div>
				)}
			</div>
		</div>
	);
};

export default TradeReceiveSend;
