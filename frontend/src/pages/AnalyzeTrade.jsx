import React, { useState, useEffect } from 'react';
import {
	Card,
	Typography,
	Row,
	Col,
	Tabs,
	Badge,
	Select,
	Spin,
	Alert,
	Button,
	Modal,
	Input,
	message,
} from 'antd';
import {
	CheckCircleOutlined,
	WarningOutlined,
	CloseCircleOutlined,
	ArrowLeftOutlined,
	SaveOutlined,
} from '@ant-design/icons';
import { useLocation, useNavigate } from 'react-router-dom';

const { Title, Text } = Typography;
const { TabPane } = Tabs;

function AnalyzeTrade() {
	const location = useLocation();
	const navigate = useNavigate();
	const [loading, setLoading] = useState(true);
	const [tradeData, setTradeData] = useState(null);
	const [selectedValuation, setSelectedValuation] = useState(1);
	const [valuationModels, setValuationModels] = useState([]);
	const [pickValues, setPickValues] = useState({});
	const [valuesLoading, setValuesLoading] = useState(false);
	const [saveModalVisible, setSaveModalVisible] = useState(false);
	const [tradeName, setTradeName] = useState('');

	// Get trade data from location state or redirect back to home
	useEffect(() => {
		if (!location.state || !location.state.teamGroups) {
			navigate('/home');
			return;
		}

		setTradeData(location.state);
		setSelectedValuation(location.state.selectedValuation || 1);
		setLoading(false);
	}, [location, navigate]);

	// Fetch valuation models
	useEffect(() => {
		const fetchValuations = async () => {
			try {
				const response = await fetch('/api/valuations');
				if (!response.ok) {
					throw new Error('Failed to fetch valuations');
				}
				const data = await response.json();
				setValuationModels(data);
			} catch (error) {
				console.error('Error fetching valuations:', error);
			}
		};

		fetchValuations();
	}, []);

	// Fetch pick values for all picks
	useEffect(() => {
		if (!tradeData || !tradeData.teamGroups) return;

		const fetchPickValues = async () => {
			setValuesLoading(true);
			const newPickValues = {};

			// Collect all unique pick numbers from all teams
			const pickNumbers = new Set();

			tradeData.teamGroups.forEach((team) => {
				if (!team.picks) return;

				team.picks.forEach((pick) => {
					if (pick.pick_number) {
						pickNumbers.add(pick.pick_number);
					}
				});
			});

			// Fetch values for all picks
			for (const pickNumber of pickNumbers) {
				try {
					const apiUrl = `/api/pick-value/${pickNumber}/${selectedValuation}`;
					const response = await fetch(apiUrl);

					if (response.ok) {
						const data = await response.json();
						newPickValues[pickNumber] = parseFloat(data.value);
					}
				} catch (error) {
					console.error(`Error fetching value for pick ${pickNumber}:`, error);
				}
			}

			setPickValues(newPickValues);
			setValuesLoading(false);
		};

		fetchPickValues();
	}, [tradeData, selectedValuation]);

	// Determine which picks have moved from their original teams
	const findMovedPicks = () => {
		if (!tradeData || !tradeData.teamGroups) return {};

		const movedPicks = {};

		// Track where each pick currently is
		const currentPickLocations = {};

		// Find all picks that have moved
		tradeData.teamGroups.forEach((team) => {
			if (!team.teamId || !team.picks) return;

			team.picks.forEach((pick) => {
				// Store current location of each pick
				currentPickLocations[pick.id] = {
					teamId: team.teamId,
					teamName: team.name,
					pick,
				};

				// If pick is not with its original team, it has moved
				if (pick.originalTeamId !== team.teamId) {
					// Record this as a moved pick
					if (!movedPicks[pick.originalTeamId]) {
						movedPicks[pick.originalTeamId] = {
							outgoing: [],
							incoming: [],
						};
					}

					if (!movedPicks[team.teamId]) {
						movedPicks[team.teamId] = {
							outgoing: [],
							incoming: [],
						};
					}

					// Add to outgoing for original team
					movedPicks[pick.originalTeamId].outgoing.push({
						...pick,
						currentTeamId: team.teamId,
						currentTeamName: team.name,
					});

					// Add to incoming for current team
					movedPicks[team.teamId].incoming.push(pick);
				}
			});
		});

		return movedPicks;
	};

	// Calculate total pick values for a team
	const calculateTeamValues = (team) => {
		if (!tradeData)
			return {
				outgoingPicks: [],
				incomingPicks: [],
				outgoingValue: 0,
				incomingValue: 0,
				netValue: 0,
			};

		const movedPicks = findMovedPicks();
		const teamMovedPicks = movedPicks[team.teamId] || { outgoing: [], incoming: [] };

		// Use the correctly identified moved picks
		const outgoingPicks = teamMovedPicks.outgoing;
		const incomingPicks = teamMovedPicks.incoming;

		// Calculate values using the fetched pick values
		const outgoingValue = outgoingPicks.reduce((sum, pick) => {
			return (
				sum + (pick.pick_number && pickValues[pick.pick_number] ? pickValues[pick.pick_number] : 0)
			);
		}, 0);

		const incomingValue = incomingPicks.reduce((sum, pick) => {
			return (
				sum + (pick.pick_number && pickValues[pick.pick_number] ? pickValues[pick.pick_number] : 0)
			);
		}, 0);

		const netValue = incomingValue - outgoingValue;

		return {
			outgoingPicks,
			incomingPicks,
			outgoingValue,
			incomingValue,
			netValue,
		};
	};

	// Determine trade balance evaluation
	const evaluateTrade = () => {
		if (!tradeData) return null;

		const teamValues = tradeData.teamGroups
			.filter((team) => team.teamId)
			.map((team) => {
				const values = calculateTeamValues(team);
				return {
					teamId: team.teamId,
					name: team.name,
					netValue: values.netValue,
				};
			});

		// Find the team with highest and lowest net values
		const sortedTeams = [...teamValues].sort((a, b) => b.netValue - a.netValue);
		const highestValue = sortedTeams[0];
		const lowestValue = sortedTeams[sortedTeams.length - 1];

		const valueDifference = highestValue.netValue - lowestValue.netValue;

		// Determine if the trade is balanced
		if (valueDifference < 100) {
			return {
				status: 'balanced',
				message: 'Balanced Trade',
				icon: <CheckCircleOutlined />,
			};
		} else if (valueDifference < 300) {
			return {
				status: 'slightlyFavors',
				message: `Slightly Favors ${highestValue.name}`,
				value: `+${Math.round(highestValue.netValue)}`,
				icon: <WarningOutlined />,
			};
		} else {
			return {
				status: 'heavilyFavors',
				message: `Heavily Favors ${highestValue.name}`,
				value: `+${Math.round(highestValue.netValue)}`,
				icon: <CloseCircleOutlined />,
			};
		}
	};

	// Handle going back to the trade builder while preserving state
	const handleBackToTrade = () => {
		// Navigate back to home page with the original trade data
		navigate('/home', {
			state: {
				preserveTradeState: true,
				teamGroups: tradeData.teamGroups,
				selectedValuation: selectedValuation,
			},
		});
	};

	// Handle saving the trade
	const handleSaveTrade = async () => {
		if (!tradeData || !tradeData.teamGroups) return;

		// Track picks that have moved from their original teams
		const tradedPicks = [];

		// Check each team's picks
		tradeData.teamGroups.forEach((team) => {
			if (!team.teamId) return;

			team.picks.forEach((pick) => {
				// If this pick belongs to another team originally
				if (pick.originalTeamId !== team.teamId) {
					tradedPicks.push({
						draft_pick_id: parseInt(pick.pickId),
						sending_team_id: pick.originalTeamId,
						receiving_team_id: team.teamId,
					});
				}
			});
		});

		if (tradedPicks.length === 0) {
			message.warning('No picks have been traded');
			return;
		}

		try {
			// Prepare the trade data with all teams
			const saveData = {
				teams: tradeData.teamGroups
					.filter((team) => team.teamId) // Only include teams with IDs
					.map((team) => ({
						id: team.teamId,
						name: team.name,
					})),
				trade_name: tradeName || null,
				picks: tradedPicks,
			};

			// Send to the API
			const response = await fetch('/api/saved-trades', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify(saveData),
			});

			if (!response.ok) {
				throw new Error('Failed to save trade');
			}

			await response.json();
			message.success('Trade saved successfully');
			setSaveModalVisible(false);
			setTradeName('');
		} catch (error) {
			console.error('Error saving trade:', error);
			message.error('Failed to save trade');
		}
	};

	// Handle valuation model change
	const handleValuationChange = (value) => {
		setSelectedValuation(value);
		// Trigger pick value refetch when valuation model changes
		// (this will happen via the useEffect)
	};

	if (loading) {
		return (
			<div style={{ display: 'flex', justifyContent: 'center', padding: 50 }}>
				<Spin size="large" />
			</div>
		);
	}

	if (!tradeData) {
		return <Alert message="No trade data found" type="error" />;
	}

	const tradeBalance = evaluateTrade();
	const teamsWithPicks = tradeData.teamGroups.filter((team) => team.teamId);

	return (
		<div className="analyze-page">
			<div className="analyze-header">
				<div className="back-button-container">
					<Button
						type="default"
						icon={<ArrowLeftOutlined />}
						onClick={handleBackToTrade}
						className="analyze-back-button"
					>
						Back to Trade
					</Button>
				</div>

				<div className="save-button-container">
					<Button
						type="primary"
						icon={<SaveOutlined />}
						onClick={() => setSaveModalVisible(true)}
						className="save-trade-button"
					>
						Save Trade
					</Button>
				</div>
			</div>

			<div style={{ textAlign: 'center', marginBottom: 24 }}>
				<Title level={2}>Trade Analysis</Title>

				{/* Trade Balance Badge */}
				{tradeBalance && (
					<Badge
						count={
							<div style={{ padding: '0 12px' }}>
								{tradeBalance.icon} {tradeBalance.message}{' '}
								{tradeBalance.value ? `(${tradeBalance.value})` : ''}
							</div>
						}
						style={{
							backgroundColor:
								tradeBalance.status === 'balanced'
									? '#52c41a'
									: tradeBalance.status === 'slightlyFavors'
										? '#faad14'
										: '#ff4d4f',
						}}
					/>
				)}
			</div>

			{/* 1. Trade Summary Overview */}
			<div className="analysis-section">
				<Title level={4}>Trade Summary Overview</Title>
				<Row gutter={[16, 16]}>
					{teamsWithPicks.map((team) => {
						const { outgoingPicks, incomingPicks } = calculateTeamValues(team);

						return (
							<Col key={team.teamId} xs={24} sm={12} md={8} lg={teamsWithPicks.length <= 3 ? 8 : 6}>
								<Card
									title={
										<div
											style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}
										>
											<img
												src={team.logo}
												alt={team.name}
												style={{ width: 40, height: 40, marginRight: 8 }}
											/>
											<span>{team.name}</span>
										</div>
									}
									style={{ height: '100%' }}
								>
									<div>
										<Title level={5}>Outgoing Picks</Title>
										{outgoingPicks.length > 0 ? (
											<ul className="trade-list">
												{outgoingPicks.map((pick) => (
													<li key={pick.id} className="trade-summary-item">
														<div className="trade-item-row">
															<img src={pick.originalTeamLogo} alt="" className="trade-item-logo" />
															<span>{pick.content}</span>
														</div>
														<div className="trade-item-details">
															<span className="trade-item-from">to {pick.currentTeamName}</span>
														</div>
													</li>
												))}
											</ul>
										) : (
											<div className="trade-empty-message">No outgoing picks</div>
										)}
									</div>

									<div style={{ marginTop: 16 }}>
										<Title level={5}>Incoming Picks</Title>
										{incomingPicks.length > 0 ? (
											<ul className="trade-list">
												{incomingPicks.map((pick) => (
													<li key={pick.id} className="trade-summary-item">
														<div className="trade-item-row">
															<img src={pick.originalTeamLogo} alt="" className="trade-item-logo" />
															<span>
																{pick.content} (via {pick.originalTeamName})
															</span>
														</div>
													</li>
												))}
											</ul>
										) : (
											<div className="trade-empty-message">No incoming picks</div>
										)}
									</div>
								</Card>
							</Col>
						);
					})}
				</Row>
			</div>

			{/* 2. Pick Value Breakdown */}
			<div className="analysis-section">
				<Title level={4}>Pick Value Breakdown</Title>
				{valuesLoading ? (
					<div style={{ textAlign: 'center', padding: 20 }}>
						<Spin /> <span style={{ marginLeft: 10 }}>Calculating pick values...</span>
					</div>
				) : (
					<Row gutter={[16, 16]}>
						{teamsWithPicks.map((team) => {
							const { outgoingValue, incomingValue, netValue } = calculateTeamValues(team);

							return (
								<Col
									key={team.teamId}
									xs={24}
									sm={12}
									md={8}
									lg={teamsWithPicks.length <= 3 ? 8 : 6}
								>
									<Card>
										<div style={{ textAlign: 'center', marginBottom: 16 }}>
											<img
												src={team.logo}
												alt={team.name}
												style={{ width: 40, height: 40, marginBottom: 8 }}
											/>
											<Title level={5}>{team.name}</Title>
										</div>

										<div style={{ marginBottom: 8 }}>
											<Row>
												<Col span={12}>Outgoing Value:</Col>
												<Col span={12} style={{ textAlign: 'right', color: '#ff4d4f' }}>
													-{outgoingValue.toFixed(1)}
												</Col>
											</Row>
										</div>

										<div style={{ marginBottom: 8 }}>
											<Row>
												<Col span={12}>Incoming Value:</Col>
												<Col span={12} style={{ textAlign: 'right', color: '#52c41a' }}>
													+{incomingValue.toFixed(1)}
												</Col>
											</Row>
										</div>

										<div
											style={{
												marginTop: 16,
												padding: '8px',
												backgroundColor: '#f5f5f5',
												borderRadius: 4,
											}}
										>
											<Row>
												<Col span={12}>
													<strong>Net Value:</strong>
												</Col>
												<Col
													span={12}
													style={{
														textAlign: 'right',
														color: netValue > 0 ? '#52c41a' : netValue < 0 ? '#ff4d4f' : '#000',
														fontWeight: 'bold',
													}}
												>
													{netValue > 0 ? '+' : ''}
													{netValue.toFixed(1)}
												</Col>
											</Row>
										</div>

										<div
											style={{
												marginTop: 8,
												textAlign: 'center',
												fontSize: '0.8em',
												color: '#999',
											}}
										>
											Using{' '}
											{valuationModels.find((model) => model.id === selectedValuation)?.name ||
												'Default Valuation Model'}
										</div>
									</Card>
								</Col>
							);
						})}
					</Row>
				)}
			</div>

			{/* 3. Valuation Model Comparison */}
			<div className="analysis-section">
				<Title level={4}>Valuation Model</Title>
				<div style={{ maxWidth: 300, marginBottom: 16 }}>
					<Select
						style={{ width: '100%' }}
						value={selectedValuation}
						onChange={handleValuationChange}
						options={valuationModels.map((model) => ({
							value: model.id,
							label: model.name,
						}))}
					/>
				</div>
				<Text type="secondary">
					Change the valuation model to see how it affects the trade evaluation.
				</Text>
			</div>

			{/* Save Trade Modal */}
			<Modal
				title="Save Trade"
				open={saveModalVisible}
				onOk={handleSaveTrade}
				onCancel={() => setSaveModalVisible(false)}
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
}

export default AnalyzeTrade;
