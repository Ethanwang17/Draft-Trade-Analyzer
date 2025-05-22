import React, { useState, useEffect } from 'react';
import { CloseOutlined } from '@ant-design/icons';
import './PickInfo.css';

// Fetch pick value dynamically based on pick number or future pick info
const PickValueDisplay = ({ pickNumber, year, round, valuation = 1 }) => {
	const [pickValue, setPickValue] = useState(null);
	const [loading, setLoading] = useState(false);
	const currentYear = new Date().getFullYear();

	useEffect(() => {
		setLoading(true);

		let apiUrl;

		if (pickNumber) {
			apiUrl =
				valuation === 1
					? `/api/pick-value/${pickNumber}`
					: `/api/pick-value/${pickNumber}/${valuation}`;
		} else if (year && round) {
			apiUrl = `/api/future-pick-value/${year}/${round}/${valuation}`;
		} else {
			setLoading(false);
			return;
		}

		fetch(apiUrl)
			.then((response) => {
				if (!response.ok) {
					throw new Error('Pick value not found');
				}
				return response.json();
			})
			.then((data) => {
				setPickValue(data);
				setLoading(false);
			})
			.catch((error) => {
				console.error('Error fetching pick value:', error);
				setLoading(false);
			});
	}, [pickNumber, year, round, valuation]);

	// Render loading state or skip if no value is found
	if (loading) {
		return <span className="pick-value-loading">--</span>;
	}

	if (!pickValue) {
		return null;
	}

	const isFuturePick = !pickNumber && year > currentYear;

	return (
		<span className="pick-value-display">
			Value: <strong>{pickValue.value}</strong>
			{isFuturePick && pickValue.depreciation && <span className="depreciation-info">*</span>}
		</span>
	);
};

// Main pick item display with team logo, content, and remove button
const PickInfo = ({ pick, onResetPick, selectedValuation, showRemoveIcon = true }) => {
	return (
		<li className="trade-summary-item">
			<div className="trade-item-row">
				<img src={pick.originalTeamLogo} alt="Team Logo" className="trade-item-logo" />
				<span className="trade-item-content">{pick.content}</span>
				{showRemoveIcon && onResetPick && (
					<button
						className="trade-item-delete-btn"
						onClick={() => onResetPick(pick.id)}
						title="Remove from trade"
					>
						<CloseOutlined />
					</button>
				)}
			</div>
			{/* Show source/destination and pick value below main row */}
			<div className="trade-item-details">
				<span className="trade-item-from">
					{pick.fromTeam ? `from ${pick.fromTeam}` : pick.toTeam ? `to ${pick.toTeam}` : ''}
				</span>
				{pick.pick_number ? (
					<PickValueDisplay pickNumber={pick.pick_number} valuation={selectedValuation || 1} />
				) : (
					<PickValueDisplay
						year={pick.year}
						round={pick.round}
						valuation={selectedValuation || 1}
					/>
				)}
			</div>
		</li>
	);
};

export default PickInfo;
