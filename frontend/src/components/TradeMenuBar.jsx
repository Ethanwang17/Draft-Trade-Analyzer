import React from 'react';
import { Button, Modal, Input } from 'antd';
import { PlusOutlined, UndoOutlined, BarChartOutlined, SaveOutlined } from '@ant-design/icons';
import ValuationSelector from './ValuationSelector';

const TradeMenuBar = ({
	onAddTeam,
	onResetTrades,
	onValuationChange,
	selectedValuation,
	disableAddTeam,
	disableResetTrades,
	onAnalyze,
	onSaveTrade,
}) => {
	const [isModalVisible, setIsModalVisible] = React.useState(false);
	const [tradeName, setTradeName] = React.useState('');

	const handleSave = () => {
		onSaveTrade(tradeName);
		setTradeName('');
		setIsModalVisible(false);
	};

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
				<Button
					type="primary"
					icon={<SaveOutlined />}
					onClick={() => setIsModalVisible(true)}
					className="save-trade-button"
				>
					Save Trade
				</Button>
			</div>

			<Modal
				title="Save Trade"
				open={isModalVisible}
				onOk={handleSave}
				onCancel={() => setIsModalVisible(false)}
				okText="Save"
				cancelText="Cancel"
			>
				<p>Enter a name for this trade (optional):</p>
				<Input
					placeholder="Trade Name"
					value={tradeName}
					onChange={(e) => setTradeName(e.target.value)}
				/>
			</Modal>
		</div>
	);
};

export default TradeMenuBar;
