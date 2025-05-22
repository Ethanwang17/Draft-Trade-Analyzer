// React and library imports
import React from 'react';
import { Typography, Row, Spin, Alert } from 'antd';
import { useLocation } from 'react-router-dom';

// Import custom hooks for analysis, valuation, evaluation, and saving
import {
	useTradeAnalysis,
	usePickValues,
	useTradeEvaluation,
	useTradeSave,
	usePick,
} from '../hooks';

// Import custom components for analysis layout and UI
import AnalyzeHeader from '../components/Layout/AnalyzeHeader/AnalyzeHeader';
import TradeBalanceBadge from '../components/TradeBalanceBadge/TradeBalanceBadge';
import AnalysisTeamSummary from '../components/AnalysisTeamSummary/AnalysisTeamSummary';
import SaveTradeModal from '../components/SaveTradeModal/SaveTradeModal';
import RadarChart from '../components/DataVisuals/RadarChart/RadarChart';

const { Title, Text } = Typography;

function AnalyzeTrade() {
	const location = useLocation();

	// Initialize analysis state from navigation state
	const {
		loading,
		tradeData,
		setTradeData,
		selectedValuation,
		setSelectedValuation,
		handleBackToTrade,
	} = useTradeAnalysis(location.state);

	// Fetch pick values based on selected valuation model
	const { pickValues, valuesLoading } = usePickValues(tradeData, selectedValuation);

	// Functions to calculate team value summaries and evaluate trade balance
	const { calculateTeamValues, evaluateTrade, prepareTeamTradeData } = useTradeEvaluation(
		tradeData,
		pickValues
	);

	// Modal state and save logic for persisting trade
	const { saveModalVisible, setSaveModalVisible, tradeName, setTradeName, saveTrade } =
		useTradeSave();

	// Handler to allow resetting individual picks to their original teams
	const { handleResetPick } = usePick(tradeData, setTradeData);

	// Trigger saving the trade
	const handleSaveTrade = async () => {
		await saveTrade(tradeData);
	};

	// Handle user selection of a different valuation model
	const handleValuationChange = (value) => {
		setSelectedValuation(value);
	};

	// Loading state while trade data is being processed
	if (loading) {
		return (
			<div className="analyze-loading-container">
				<Spin size="large" />
			</div>
		);
	}

	// Show error if no trade data was found
	if (!tradeData) {
		return <Alert message="No trade data found" type="error" />;
	}

	// Evaluate overall trade balance result
	const tradeBalance = evaluateTrade();

	// Filter out only active teams involved in the trade
	const teamsWithPicks = tradeData.teamGroups.filter((team) => team.teamId);

	return (
		<div className="analyze-page">
			{/* Header with back button, valuation selector, and save button */}
			<AnalyzeHeader
				selectedValuation={selectedValuation}
				onValuationChange={handleValuationChange}
				onBackToTrade={handleBackToTrade}
				onSaveClick={() => setSaveModalVisible(true)}
			/>

			{/* Title and trade balance badge */}
			<div className="analyze-title-container">
				<Title level={2}>Trade Analysis</Title>

				{/* Trade Balance Badge */}
				<TradeBalanceBadge
					tradeBalance={tradeBalance}
					loading={loading}
					valuesLoading={valuesLoading}
				/>
			</div>

			{/* Trade summary breakdown for each team */}
			<div className="analysis-section">
				<Title level={4}>Trade Summary by Team</Title>
				<Row gutter={[16, 16]} justify="space-between">
					{teamsWithPicks.map((team) => {
						const teamTradeData = prepareTeamTradeData(team);
						const colSize = teamsWithPicks.length <= 3 ? 8 : 6;

						return (
							<AnalysisTeamSummary
								key={team.teamId}
								team={team}
								teamTradeData={teamTradeData}
								onResetPick={handleResetPick}
								colSize={colSize}
								selectedValuation={selectedValuation}
							/>
						);
					})}
				</Row>

				{/* Radar Chart Visualization */}
				<Title className="radar-chart-title" level={4}>
					Radar Chart
				</Title>
				<RadarChart
					teams={teamsWithPicks}
					calculateTeamValues={calculateTeamValues}
					loading={valuesLoading}
				/>
			</div>

			{/* Modal to save trade with custom name */}
			<SaveTradeModal
				visible={saveModalVisible}
				tradeName={tradeName}
				setTradeName={setTradeName}
				onSave={handleSaveTrade}
				onCancel={() => setSaveModalVisible(false)}
			/>
		</div>
	);
}

export default AnalyzeTrade;
