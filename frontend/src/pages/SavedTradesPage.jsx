// React hooks and Ant Design components
import React, { useMemo, useState } from 'react';
import { Typography, Empty, Spin } from 'antd';
import { LoadingOutlined } from '@ant-design/icons';

// Custom hooks for managing trades
import {
	useSavedTrades,
	useTradeDetails,
	useTradeDelete,
	useTradeUtils,
	useTradeFilters,
} from '../hooks';

// Component imports
import SavedTradeCard from '../components/Saved/SavedTradeCard/SavedTradeCard';
import FilterBar from '../components/Saved/FilterBar/FilterBar';

const { Title } = Typography;

function SavedTradesPage() {
	// Load saved trades and manage loading state
	const { trades, loading, setTrades } = useSavedTrades();

	// Manage expanded trade details and loading state for details
	const {
		expandedTradeIds,
		tradeDetails,
		loadingDetails,
		loadTradeDetails,
		setExpandedTradeIds,
		setTradeDetails,
	} = useTradeDetails();

	// Hook to handle deleting a trade and update relevant states
	const deleteTrade = useTradeDelete(
		trades,
		setTrades,
		expandedTradeIds,
		setExpandedTradeIds,
		setTradeDetails
	);

	// Utility function to format trade dates
	const { formatDate } = useTradeUtils();

	// Apply and clear filters for displaying trades
	const { filteredTrades, applyFilters, clearFilters } = useTradeFilters(trades);

	// Currently selected valuation model (affects how trades are displayed)
	const [selectedValuation, setSelectedValuation] = useState(1);

	// Extract unique list of teams from trades for filter dropdown
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

	// Callback to update selected valuation model
	const handleValuationChange = (value) => {
		setSelectedValuation(value);
	};

	return (
		<div className="saved-trade-container">
			<Title level={2}>Saved Trade Concepts</Title>

			{/* Show loading spinner while trades are being fetched */}
			{loading ? (
				<div>
					<Spin indicator={<LoadingOutlined style={{ fontSize: 24 }} spin />} />
					<p>Loading saved trades...</p>
				</div>
			) : trades.length === 0 ? (
				// Show message when there are no saved trades
				<Empty description="No saved trades yet" />
			) : (
				<>
					{/* Filter bar to apply team and valuation filters */}
					<FilterBar
						teams={allTeams}
						onApplyFilters={applyFilters}
						onClearFilters={clearFilters}
						selectedValuation={selectedValuation}
						onValuationChange={handleValuationChange}
					/>

					{/* Render a list of saved trades using cards */}
					<div className="saved-trade-list">
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

					{/* Show empty state if no trades match filters */}
					{filteredTrades.length === 0 && <Empty description="No trades match your filters" />}
				</>
			)}
		</div>
	);
}

export default SavedTradesPage;
