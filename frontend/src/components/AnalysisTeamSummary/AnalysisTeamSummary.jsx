import React from 'react';
import { Card, Col } from 'antd';
import TradeSummary from '../Summary/TradeSummary/TradeSummary';
import './AnalysisTeamSummary.css';

function AnalysisTeamSummary({ team, teamTradeData, onResetPick, colSize, selectedValuation }) {
	return (
		<Col xs={24} sm={12} md={8} lg={colSize || 8}>
			<Card
				title={
					<div className="team-title-container">
						<img src={team.logo} alt={team.name} className="team-logo" />
						<span>{team.name}</span>
					</div>
				}
				className="team-card"
			>
				<TradeSummary
					tradeData={teamTradeData}
					onResetPick={onResetPick}
					showNetValue={true}
					selectedValuation={selectedValuation}
					showRemoveIcon={false}
				/>
			</Card>
		</Col>
	);
}

export default AnalysisTeamSummary;
