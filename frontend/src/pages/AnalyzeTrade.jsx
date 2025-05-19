import React from 'react';
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
} from 'antd';
import { ArrowLeftOutlined, SaveOutlined } from '@ant-design/icons';
import { useLocation } from 'react-router-dom';
import TradeSummary from '../components/TradeSummary/TradeSummary';
import {
	useTradeAnalysis,
	usePickValues,
	useTradeEvaluation,
	useTradeSave,
	usePick,
} from '../hooks';

const { Title, Text } = Typography;

function AnalyzeTrade() {
	const location = useLocation();

	// Use custom hooks
	const {
		loading,
		tradeData,
		setTradeData,
		selectedValuation,
		setSelectedValuation,
		valuationModels,
		handleBackToTrade,
	} = useTradeAnalysis(location.state);

	const { pickValues, valuesLoading } = usePickValues(tradeData, selectedValuation);

	const { findMovedPicks, calculateTeamValues, evaluateTrade, prepareTeamTradeData } =
		useTradeEvaluation(tradeData, pickValues);

	const { saveModalVisible, setSaveModalVisible, tradeName, setTradeName, saveTrade } =
		useTradeSave();

	const { handleResetPick } = usePick(tradeData, setTradeData);

	// Handle saving the trade
	const handleSaveTrade = async () => {
		await saveTrade(tradeData);
	};

	// Handle valuation model change
	const handleValuationChange = (value) => {
		setSelectedValuation(value);
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
								{tradeBalance.iconType && React.createElement(tradeBalance.iconType)}{' '}
								{tradeBalance.message} {tradeBalance.value ? `(${tradeBalance.value})` : ''}
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

			{/* Trade Summary Components - One per team */}
			<div className="analysis-section">
				<Title level={4}>Trade Summary by Team</Title>
				<Row gutter={[16, 16]}>
					{teamsWithPicks.map((team) => {
						const teamTradeData = prepareTeamTradeData(team);

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
									<TradeSummary
										tradeData={teamTradeData}
										onResetPick={handleResetPick}
										showNetValue={true}
									/>
								</Card>
							</Col>
						);
					})}
				</Row>
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
