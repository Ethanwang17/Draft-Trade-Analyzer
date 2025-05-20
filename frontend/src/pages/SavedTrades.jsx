import React from 'react';
import { Typography, Empty, Spin } from 'antd';
import { LoadingOutlined } from '@ant-design/icons';
import '../App.css';
import { useSavedTrades, useTradeDetails, useTradeDelete, useTradeUtils } from '../hooks';
import SavedTradeCard from '../components/Saved/SavedTradeCard/SavedTradeCard';

const { Title } = Typography;

function SavedTrades() {
	const { trades, loading, setTrades } = useSavedTrades();
	const {
		expandedTradeId,
		tradeDetails,
		loadingDetails,
		loadTradeDetails,
		setExpandedTradeId,
		setTradeDetails,
	} = useTradeDetails();
	const deleteTrade = useTradeDelete(
		trades,
		setTrades,
		expandedTradeId,
		setExpandedTradeId,
		setTradeDetails
	);
	const { formatDate } = useTradeUtils();

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
						<SavedTradeCard
							key={trade.id}
							trade={trade}
							expandedTradeId={expandedTradeId}
							loadingDetails={loadingDetails}
							tradeDetails={tradeDetails}
							deleteTrade={deleteTrade}
							loadTradeDetails={loadTradeDetails}
							formatDate={formatDate}
						/>
					))}
				</div>
			)}
		</div>
	);
}

export default SavedTrades;
