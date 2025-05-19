import React from 'react';
import { SwapOutlined } from '@ant-design/icons';
import SavedTeamDisplay from '../SavedTeamDisplay/SavedTeamDisplay';
import './TradeTeamsVisualization.css';

function TradeTeamsVisualization({
	teams,
	expandedTradeId,
	loadingDetails,
	tradeDetails,
	tradeId,
	children,
}) {
	return (
		<div className="trade-teams-visualization">
			{teams &&
				teams.map((team, index) => (
					<React.Fragment key={team.id}>
						<SavedTeamDisplay team={team} />

						{children &&
							expandedTradeId === tradeId &&
							!loadingDetails &&
							tradeDetails &&
							React.Children.map(children, (child) =>
								React.cloneElement(child, { teamId: team.id, tradeDetails })
							)}

						{index < teams.length - 1 && (
							<div className="trade-direction">
								<SwapOutlined className="swap-icon" />
							</div>
						)}
					</React.Fragment>
				))}
		</div>
	);
}

export default TradeTeamsVisualization;
