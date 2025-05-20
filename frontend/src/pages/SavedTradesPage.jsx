import React, { useMemo, useState } from 'react';
import { Typography, Empty, Spin } from 'antd';
import { LoadingOutlined } from '@ant-design/icons';
import '../App.css';
import {
	useSavedTrades,
	useTradeDetails,
	useTradeDelete,
	useTradeUtils,
	useTradeFilters,
} from '../hooks';
import SavedTradeCard from '../components/Saved/SavedTradeCard/SavedTradeCard';
import FilterBar from '../components/Saved/FilterBar/FilterBar';

const { Title } = Typography;

function SavedTradesPage() {
	const { trades, loading, setTrades } = useSavedTrades();
	const {
		expandedTradeIds,
		tradeDetails,
		loadingDetails,
		loadTradeDetails,
		setExpandedTradeIds,
		setTradeDetails,
	} = useTradeDetails();
	const deleteTrade = useTradeDelete(
		trades,
		setTrades,
		expandedTradeIds,
		setExpandedTradeIds,
		setTradeDetails
	);
	const { formatDate } = useTradeUtils();
	const { filteredTrades, applyFilters, clearFilters } = useTradeFilters(trades);
	const [selectedValuation, setSelectedValuation] = useState(1);

	// Extract all teams from trades for the filter dropdown
	const allTeams = useMemo(() => {
		const teamsMap = new Map();
		trades.forEach((trade) => {
			if (trade.teams && trade.teams.length > 0) {
				trade.teams.forEach((team) => {
					if (!teamsMap.has(team.id)) {
						teamsMap.set(team.id, team);
					}
				});
			}
		});
		return Array.from(teamsMap.values());
	}, [trades]);

	const handleValuationChange = (value) => {
		setSelectedValuation(value);
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
				<>
					<FilterBar
						teams={allTeams}
						onApplyFilters={applyFilters}
						onClearFilters={clearFilters}
						selectedValuation={selectedValuation}
						onValuationChange={handleValuationChange}
					/>

					<div className="st-trades-list">
						{filteredTrades.map((trade) => (
							<SavedTradeCard
								key={trade.id}
								trade={trade}
								expandedTradeIds={expandedTradeIds}
								loadingDetails={loadingDetails}
								tradeDetails={tradeDetails}
								deleteTrade={deleteTrade}
								loadTradeDetails={loadTradeDetails}
								formatDate={formatDate}
								selectedValuation={selectedValuation}
							/>
						))}
					</div>

					{filteredTrades.length === 0 && <Empty description="No trades match your filters" />}
				</>
			)}
		</div>
	);
}

export default SavedTradesPage;
