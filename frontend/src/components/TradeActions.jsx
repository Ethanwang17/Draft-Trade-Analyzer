import React from 'react';

const TradeActions = ({ onAnalyze }) => {
	return (
		<div className="action-container">
			<button className="analyze-button" onClick={onAnalyze}>
				Analyze Trade
			</button>
		</div>
	);
};

export default TradeActions;
