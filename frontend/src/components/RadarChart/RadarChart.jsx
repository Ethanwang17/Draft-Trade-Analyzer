import React, { useState, useMemo } from 'react';
import { Card, Select, Tag } from 'antd';
import {
	RadarChart as ReRadarChart,
	PolarGrid,
	PolarAngleAxis,
	PolarRadiusAxis,
	Radar,
	ResponsiveContainer,
	Tooltip,
	Legend,
} from 'recharts';
import './RadarChart.css';

/**
 * RadarChart component visualizes key trade metrics for each team involved.
 *
 * Props:
 * - teams: Array of team objects participating in the trade (max 4, min 2)
 * - calculateTeamValues: Function that returns { incomingValue, outgoingValue, incomingPicks, outgoingPicks, netValue }
 * - loading: boolean indicating if required data is still fetching
 */
function RadarChart({ teams, calculateTeamValues, loading }) {
	// Color palette for teams
	const colors = ['#0074D9', '#FF4136', '#2ECC40', '#FF851B'];

	// Axis options definition with colors assigned
	const axisOptions = [
		{ value: 'Total Incoming Value', label: 'Total Incoming Value', color: '#D5F3E5' },
		{ value: 'Total Outgoing Value', label: 'Total Outgoing Value', color: '#CDC1FF' },
		{ value: '# of Incoming Picks', label: '# of Incoming Picks', color: '#FFF5BA' },
		{ value: '# of Outgoing Picks', label: '# of Outgoing Picks', color: '#D6F0FF' },
		{ value: 'Net Pick Value', label: 'Net Pick Value', color: '#FADADD' },
	];

	// Selected axes state – default all
	const [selectedAxes, setSelectedAxes] = useState(axisOptions.map((o) => o.value));

	// Handle selection change
	const handleAxisChange = (values) => {
		setSelectedAxes(values);
	};

	// Custom tag renderer for the Select component
	const tagRender = (props) => {
		const { label, value, closable, onClose } = props;
		const option = axisOptions.find((opt) => opt.value === value);
		const color = option ? option.color : '#1677ff';

		const onPreventMouseDown = (event) => {
			event.preventDefault();
			event.stopPropagation();
		};

		return (
			<Tag
				color={color}
				onMouseDown={onPreventMouseDown}
				closable={closable}
				onClose={onClose}
				className="radar-chart-tag"
			>
				{label}
			</Tag>
		);
	};

	// Prepare radar chart data structure (memoized for perf)
	const baseMetrics = useMemo(() => {
		if (!teams || teams.length === 0) {
			return [];
		}

		const metricsArray = [
			{ metric: 'Total Incoming Value' },
			{ metric: 'Total Outgoing Value' },
			{ metric: '# of Incoming Picks' },
			{ metric: '# of Outgoing Picks' },
			{ metric: 'Net Pick Value' },
		];

		teams.forEach((team) => {
			const values = calculateTeamValues(team);

			metricsArray[0][team.name] = Math.round(values.incomingValue);
			metricsArray[1][team.name] = Math.round(values.outgoingValue);
			metricsArray[2][team.name] = values.incomingPicks.length;
			metricsArray[3][team.name] = values.outgoingPicks.length;
			metricsArray[4][team.name] = Math.round(values.netValue);
		});

		return metricsArray;
	}, [teams, calculateTeamValues]);

	// Filter metrics based on user selection
	const chartData = useMemo(
		() => baseMetrics.filter((metricObj) => selectedAxes.includes(metricObj.metric)),
		[baseMetrics, selectedAxes]
	);

	// Render UI based on loading state and data availability
	let chartContent;
	if (loading) {
		chartContent = <div className="radar-chart-placeholder">Loading chart</div>;
	} else if (!teams || teams.length === 0) {
		chartContent = (
			<div className="radar-chart-placeholder">No trade data available to analyze.</div>
		);
	} else if (selectedAxes.length < 3) {
		chartContent = (
			<div className="radar-chart-placeholder">
				Please select at least 3 axes to display the chart.
			</div>
		);
	} else {
		chartContent = (
			<ResponsiveContainer width="100%" height={400}>
				<ReRadarChart data={chartData} margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
					<PolarGrid stroke="#d9d9d9" />
					<PolarAngleAxis
						dataKey="metric"
						tick={({ payload, x, y, textAnchor }) => (
							<text x={x} y={y} textAnchor={textAnchor} fill="#595959" fontSize={12}>
								{payload.value}
								<title>{payload.value}</title>
							</text>
						)}
					/>
					<PolarRadiusAxis stroke="#d9d9d9" tick={{ fill: '#8c8c8c', fontSize: 10 }} />
					{teams.map((team, index) => (
						<Radar
							key={team.teamId || index}
							name={team.name}
							dataKey={team.name}
							stroke={colors[index % colors.length]}
							fill={colors[index % colors.length]}
							fillOpacity={0.15}
						/>
					))}
					<Tooltip />
					<Legend />
				</ReRadarChart>
			</ResponsiveContainer>
		);
	}

	return (
		<Card className="radar-chart-card">
			{/* Controls - always show controls unless loading */}
			{!loading && (
				<div className="radar-chart-controls">
					<Select
						mode="multiple"
						allowClear
						tagRender={tagRender}
						value={selectedAxes}
						options={axisOptions}
						onChange={handleAxisChange}
						placeholder="Select axes to display"
						className="radar-chart-select"
					/>
				</div>
			)}

			{chartContent}
		</Card>
	);
}

export default RadarChart;
