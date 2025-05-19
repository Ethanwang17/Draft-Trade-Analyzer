import React, { useState, useEffect } from 'react';
import { Card, List, Typography, Button, Empty, message, Modal, Spin, Divider } from 'antd';
import {
	SwapOutlined,
	DeleteOutlined,
	LoadingOutlined,
	ArrowRightOutlined,
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import '../App.css';

const { Title, Text } = Typography;

function SavedTrades() {
	const [trades, setTrades] = useState([]);
	const [loading, setLoading] = useState(true);
	const [expandedTradeId, setExpandedTradeId] = useState(null);
	const [tradeDetails, setTradeDetails] = useState(null);
	const [loadingDetails, setLoadingDetails] = useState(false);
	const _navigate = useNavigate();

	// Fetch all saved trades
	useEffect(() => {
		const fetchSavedTrades = async () => {
			try {
				setLoading(true);
				const response = await fetch('/api/saved-trades');

				if (!response.ok) {
					throw new Error('Failed to fetch saved trades');
				}

				const data = await response.json();
				setTrades(data);
			} catch (error) {
				console.error('Error loading saved trades:', error);
				message.error('Failed to load saved trades');
			} finally {
				setLoading(false);
			}
		};

		fetchSavedTrades();
	}, []);

	// Fetch trade details
	const loadTradeDetails = async (tradeId) => {
		if (expandedTradeId === tradeId) {
			setExpandedTradeId(null);
			return;
		}

		try {
			setExpandedTradeId(tradeId);
			setLoadingDetails(true);

			const response = await fetch(`/api/saved-trades/${tradeId}`);

			if (!response.ok) {
				throw new Error('Failed to fetch trade details');
			}

			const data = await response.json();
			setTradeDetails(data);
		} catch (error) {
			console.error('Error loading trade details:', error);
			message.error('Failed to load trade details');
			setExpandedTradeId(null);
		} finally {
			setLoadingDetails(false);
		}
	};

	// Delete a trade
	const deleteTrade = async (tradeId, event) => {
		event.stopPropagation();

		try {
			const response = await fetch(`/api/saved-trades/${tradeId}`, {
				method: 'DELETE',
			});

			if (!response.ok) {
				throw new Error('Failed to delete trade');
			}

			// Remove from local state
			setTrades(trades.filter((trade) => trade.id !== tradeId));
			if (expandedTradeId === tradeId) {
				setExpandedTradeId(null);
				setTradeDetails(null);
			}

			message.success('Trade deleted successfully');
		} catch (error) {
			console.error('Error deleting trade:', error);
			message.error('Failed to delete trade');
		}
	};

	// Format date for display
	const formatDate = (dateString) => {
		const date = new Date(dateString);
		return date.toLocaleDateString('en-US', {
			year: 'numeric',
			month: 'short',
			day: 'numeric',
			hour: '2-digit',
			minute: '2-digit',
		});
	};

	// Render the pick details for a specific team
	const renderTeamPickDetails = (teamId, type) => {
		if (!tradeDetails || !tradeDetails.picksByTeam || !tradeDetails.picksByTeam[teamId]) {
			return <Text type="secondary">No picks</Text>;
		}

		const picks = tradeDetails.picksByTeam[teamId][type === 'receiving' ? 'receiving' : 'sending'];

		if (!picks || picks.length === 0) {
			return <Text type="secondary">No picks</Text>;
		}

		return (
			<List
				size="small"
				dataSource={picks}
				renderItem={(pick) => (
					<List.Item>
						<div className="st-pick-item">
							<img
								src={
									type === 'receiving'
										? pick.sending_team_logo
										: pick.receiving_team_logo || 'default-logo.png'
								}
								alt={type === 'receiving' ? pick.sending_team_name : pick.receiving_team_name}
								className="st-team-logo-small"
							/>
							<Text>
								{pick.year} Round {pick.round}
								{pick.pick_number ? ` (#${pick.pick_number})` : ''}
							</Text>
						</div>
					</List.Item>
				)}
			/>
		);
	};

	return (
		<div className="st-container">
			<Title level={2}>Saved Trade Concepts</Title>

			{loading ? (
				<div className="st-loading-container">
					<Spin indicator={<LoadingOutlined style={{ fontSize: 24 }} spin />} />
					<p>Loading saved trades...</p>
				</div>
			) : trades.length === 0 ? (
				<Empty description="No saved trades yet" />
			) : (
				<div className="st-trades-list">
					{trades.map((trade) => (
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
								<Button
									type="text"
									danger
									icon={<DeleteOutlined />}
									onClick={(e) => deleteTrade(trade.id, e)}
								/>
							</div>

							<div className="st-trade-teams">
								{trade.teams &&
									trade.teams.map((team, index) => (
										<React.Fragment key={team.id}>
											<div className="st-team">
												<img
													src={team.logo || 'default-logo.png'}
													alt={team.name}
													className="st-team-logo"
												/>
												<Text strong>{team.name}</Text>

												{expandedTradeId === trade.id && !loadingDetails && tradeDetails && (
													<div className="st-team-picks-inline">
														<div className="st-team-pick-section">
															<Title level={5}>Receives:</Title>
															{renderTeamPickDetails(team.id, 'receiving')}
														</div>
														<div className="st-team-pick-section">
															<Title level={5}>Sends:</Title>
															{renderTeamPickDetails(team.id, 'sending')}
														</div>
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
					))}
				</div>
			)}
		</div>
	);
}

export default SavedTrades;
