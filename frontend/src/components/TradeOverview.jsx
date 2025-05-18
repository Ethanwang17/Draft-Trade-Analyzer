import React, { useMemo, useState } from 'react';
import { Table, Typography } from 'antd';

const { Title, Text } = Typography;

const TradeOverview = ({ teamGroups }) => {
	// Track which column is currently sorted
	const [activeColumn, setActiveColumn] = useState('pick');

	// Process data to find trades
	const tradeData = useMemo(() => {
		const trades = [];

		// Go through each team group
		teamGroups.forEach((team) => {
			if (!team.teamId) return;

			// Find picks that don't originally belong to this team
			team.picks.forEach((pick) => {
				if (pick.originalTeamId && pick.originalTeamId !== team.teamId) {
					trades.push({
						key: pick.id,
						pick: {
							year: pick.year,
							round: pick.round,
							originalTeam: pick.originalTeamName,
							content: pick.content,
							logo: pick.originalTeamLogo,
							pick_number: pick.pick_number || 0,
						},
						destination: {
							team: team.name,
							logo: team.logo,
						},
					});
				}
			});
		});

		return trades;
	}, [teamGroups]);

	// Handle column click for sorting
	const handleTableChange = (pagination, filters, sorter) => {
		if (sorter && sorter.columnKey) {
			setActiveColumn(sorter.columnKey);
		}
	};

	// Get sorted data based on active column
	const sortedData = useMemo(() => {
		if (tradeData.length === 0) return [];

		return [...tradeData].sort((a, b) => {
			if (activeColumn === 'pick') {
				// First sort by team name
				const teamCompare = a.pick.originalTeam.localeCompare(b.pick.originalTeam);
				if (teamCompare !== 0) return teamCompare;

				// Then by year (ascending - older years first)
				if (a.pick.year !== b.pick.year) return a.pick.year - b.pick.year;

				// Then by round (ascending - earlier rounds first)
				if (a.pick.round !== b.pick.round) return a.pick.round - b.pick.round;

				// Finally by pick number if available (ascending)
				return a.pick.pick_number - b.pick.pick_number;
			} else {
				// Sort by destination team name
				return a.destination.team.localeCompare(b.destination.team);
			}
		});
	}, [tradeData, activeColumn]);

	const columns = [
		{
			title: 'Pick Being Traded',
			dataIndex: 'pick',
			key: 'pick',
			showSorterTooltip: false,
			sortOrder: activeColumn === 'pick' ? 'ascend' : null,
			sorter: true, // We're handling actual sorting in the sortedData memo
			render: (pick) => (
				<div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
					<img
						src={pick.logo}
						alt={`${pick.originalTeam} logo`}
						style={{ width: '25px', height: '25px' }}
					/>
					<div>
						<div>{pick.content}</div>
						<div style={{ fontSize: '12px', color: '#888' }}>From: {pick.originalTeam}</div>
					</div>
				</div>
			),
		},
		{
			title: 'Team Receiving Pick',
			dataIndex: 'destination',
			key: 'destination',
			showSorterTooltip: false,
			sortOrder: activeColumn === 'destination' ? 'ascend' : null,
			sorter: true, // We're handling actual sorting in the sortedData memo
			render: (destination) => (
				<div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
					<img
						src={destination.logo}
						alt={`${destination.team} logo`}
						style={{ width: '25px', height: '25px' }}
					/>
					<span>{destination.team}</span>
				</div>
			),
		},
	];

	return (
		<div className="trade-overview">
			<Title level={4}>Trade Overview</Title>
			{tradeData.length > 0 ? (
				<Table
					dataSource={sortedData}
					columns={columns}
					pagination={false}
					bordered
					className="trade-overview-table"
					onChange={handleTableChange}
				/>
			) : (
				<div className="empty-trade-message">
					<Text type="secondary">No picks have been traded yet.</Text>
				</div>
			)}
		</div>
	);
};

export default TradeOverview;
