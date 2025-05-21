import React from 'react';
import { Typography, Row, Spin, Alert } from 'antd';
import { useLocation } from 'react-router-dom';
import {
	useTradeAnalysis,
	usePickValues,
	useTradeEvaluation,
	useTradeSave,
	usePick,
} from '../hooks';
import AnalyzeHeader from '../components/Layout/AnalyzeHeader/AnalyzeHeader';
import TradeBalanceBadge from '../components/TradeBalanceBadge/TradeBalanceBadge';
import AnalysisTeamSummary from '../components/AnalysisTeamSummary/AnalysisTeamSummary';
import SaveTradeModal from '../components/SaveTradeModal/SaveTradeModal';
import RadarChart from '../components/RadarChart/RadarChart';

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
		handleBackToTrade,
	} = useTradeAnalysis(location.state);

	const { pickValues, valuesLoading } = usePickValues(tradeData, selectedValuation);

	const { calculateTeamValues, evaluateTrade, prepareTeamTradeData } = useTradeEvaluation(
		tradeData,
		pickValues
	);

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
			<div className="analyze-loading-container">
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
			<AnalyzeHeader
				selectedValuation={selectedValuation}
				onValuationChange={handleValuationChange}
				onBackToTrade={handleBackToTrade}
				onSaveClick={() => setSaveModalVisible(true)}
			/>

			<div className="analyze-title-container">
				<Title level={2}>Trade Analysis</Title>

				{/* Trade Balance Badge */}
				<TradeBalanceBadge
					tradeBalance={tradeBalance}
					loading={loading}
					valuesLoading={valuesLoading}
				/>
			</div>

			{/* Trade Summary Components - One per team */}
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

			{/* Save Trade Modal */}
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
