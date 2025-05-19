import React from 'react';
import { Button } from 'antd';
import { PlusOutlined, UndoOutlined, BarChartOutlined, SaveOutlined } from '@ant-design/icons';
import ValuationSelector from '../ValuationSelector/ValuationSelector';
import './TradeMenuBar.css';

const TradeMenuBar = ({
	onAddTeam,
	onResetTrades,
	onValuationChange,
	selectedValuation,
	disableAddTeam,
	disableResetTrades,
	onAnalyze,
}) => {
	return (
		<div className="header-container">
			<div className="header-actions">
				<div className="header-valuation-select">
					<ValuationSelector onChange={onValuationChange} defaultValue={selectedValuation} />
				</div>
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
					title={disableAddTeam ? 'Maximum of 4 teams allowed' : 'Add another team to the trade'}
				>
					Add Team
				</Button>
				<Button
					type="primary"
					icon={<BarChartOutlined />}
					onClick={onAnalyze}
					className="analyze-button"
				>
					Analyze Trade
				</Button>
			</div>
		</div>
	);
};

export default TradeMenuBar;
