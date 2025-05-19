import React from 'react';
import { Card, Typography, Button, Spin } from 'antd';
import { DeleteOutlined, SwapOutlined, LoadingOutlined } from '@ant-design/icons';
import TeamPicksDisplay from '../TeamPicksDisplay/TeamPicksDisplay';
import LoadTradeButton from '../LoadTradeButton/LoadTradeButton';
import TeamDisplay from '../TeamDisplay/TeamDisplay';
import './TradeCard.css';

const { Title, Text } = Typography;

function TradeCard({
	trade,
	expandedTradeId,
	loadingDetails,
	tradeDetails,
	deleteTrade,
	loadTradeDetails,
	formatDate,
}) {
	return (
		<Card
			key={trade.id}
			className={`st-trade-card team-count-${trade.teams ? trade.teams.length : 0}`}
			onClick={() => loadTradeDetails(trade.id)}
			hoverable
		>
			<div className="st-trade-header">
				<div className="trade-title">
					<Title level={4}>{trade.trade_name || `Trade #${trade.id}`}</Title>
					<Text type="secondary">{formatDate(trade.created_at)}</Text>
				</div>
				<div className="st-trade-actions">
					<LoadTradeButton tradeId={trade.id} />
					<Button
						type="text"
						danger
						icon={<DeleteOutlined />}
						onClick={(e) => deleteTrade(trade.id, e)}
					/>
				</div>
			</div>

			<div className="st-trade-teams">
				{trade.teams &&
					trade.teams.map((team, index) => (
						<React.Fragment key={team.id}>
							<div className="st-team">
								<TeamDisplay team={team} />

								{expandedTradeId === trade.id && !loadingDetails && tradeDetails && (
									<div className="st-team-picks-inline">
										<TeamPicksDisplay teamId={team.id} type="sending" tradeDetails={tradeDetails} />
										<TeamPicksDisplay
											teamId={team.id}
											type="receiving"
											tradeDetails={tradeDetails}
										/>
									</div>
								)}
							</div>

							{index < trade.teams.length - 1 && (
								<div className="st-trade-direction">
									<SwapOutlined className="st-swap-icon" />
								</div>
							)}
						</React.Fragment>
					))}
			</div>

			{expandedTradeId === trade.id && loadingDetails && (
				<div className="st-loading-details">
					<Spin size="small" />
				</div>
			)}
		</Card>
	);
}

export default TradeCard;
