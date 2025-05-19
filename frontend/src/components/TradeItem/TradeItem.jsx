import React from 'react';
import { CloseOutlined } from '@ant-design/icons';
import PickValueDisplay from '../PickValueDisplay/PickValueDisplay';
import './TradeItem.css';

const TradeItem = ({ pick, onResetPick }) => {
	return (
		<li className="trade-summary-item">
			<div className="trade-item-row">
				<img src={pick.originalTeamLogo} alt="Team Logo" className="trade-item-logo" />
				<span className="trade-item-content">{pick.content}</span>
				<button
					className="trade-item-delete-btn"
					onClick={() => onResetPick(pick.id)}
					title="Remove from trade"
				>
					<CloseOutlined />
				</button>
			</div>
			<div className="trade-item-details">
				<span className="trade-item-from">
					{pick.fromTeam ? `from ${pick.fromTeam}` : pick.toTeam ? `to ${pick.toTeam}` : ''}
				</span>
				{pick.pick_number && (
					<PickValueDisplay pickNumber={pick.pick_number} valuation={pick.valuation || 1} />
				)}
			</div>
		</li>
	);
};

export default TradeItem;
