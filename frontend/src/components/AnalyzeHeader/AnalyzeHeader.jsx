import React from 'react';
import { Button } from 'antd';
import { ArrowLeftOutlined, SaveOutlined } from '@ant-design/icons';
import ValuationSelector from '../ValuationSelector/ValuationSelector';
import './AnalyzeHeader.css';

function AnalyzeHeader({ selectedValuation, onValuationChange, onBackToTrade, onSaveClick }) {
	return (
		<div className="analyze-header">
			<div className="back-button-container">
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
					<ValuationSelector defaultValue={selectedValuation} onChange={onValuationChange} />
				</div>
				<div className="save-button-container">
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
