import React from 'react';
import { Button } from 'antd';
import { ArrowLeftOutlined, SaveOutlined } from '@ant-design/icons';
import ValuationSelector from '../../Selector/ValuationSelector/ValuationSelector';
import './AnalyzeHeader.css';

// Header bar for the Analyze Trade view with back, valuation, and save buttons
function AnalyzeHeader({ selectedValuation, onValuationChange, onBackToTrade, onSaveClick }) {
	return (
		<div className="analyze-header">
			<div className="back-button-container">
				{/* Back button navigates to Trade Builder with preserved state */}
				<Button
					type="default"
					icon={<ArrowLeftOutlined />}
					onClick={onBackToTrade}
					className="analyze-back-button"
				>
					Back to Trade
				</Button>
			</div>

			<div className="valuation-controls-container">
				<div className="header-valuation-select">
					{/* Dropdown to select different valuation models for analysis */}
					<ValuationSelector defaultValue={selectedValuation} onChange={onValuationChange} />
				</div>
				<div className="save-button-container">
					{/* Save button opens modal to name and save current trade */}
					<Button
						type="primary"
						icon={<SaveOutlined />}
						onClick={onSaveClick}
						className="save-trade-button"
					>
						Save Trade
					</Button>
				</div>
			</div>
		</div>
	);
}

export default AnalyzeHeader;
