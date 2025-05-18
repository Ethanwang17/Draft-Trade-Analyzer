import React from 'react';
import { Button } from 'antd';
import { PlusOutlined, UndoOutlined } from '@ant-design/icons';

const TradeHeader = ({ onAddTeam, onResetTrades, disableAddTeam, disableResetTrades }) => {
	return (
		<div className="header-container">
			<h1 className="main-title">Explore NBA Draft Pick Trades</h1>
			<div className="header-actions">
				<Button
					type="default"
					icon={<UndoOutlined />}
					onClick={onResetTrades}
					className="reset-trades-button"
					disabled={disableResetTrades}
					title={disableResetTrades ? 'No trades have been made' : 'Reset picks to original teams'}
				>
					Reset Trades
				</Button>
				<Button
					type="primary"
					icon={<PlusOutlined />}
					onClick={onAddTeam}
					disabled={disableAddTeam}
					className="add-team-button"
					title={disableAddTeam ? 'Maximum of 5 teams allowed' : 'Add another team to the trade'}
				>
					Add Team
				</Button>
			</div>
		</div>
	);
};

export default TradeHeader;
