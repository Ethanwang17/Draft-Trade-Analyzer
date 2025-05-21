import React from 'react';
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
import { useSelectedAxes, useChartData, useTagRender } from '../../hooks';
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
	// Use custom hooks to manage radar chart state and behavior
	const { axisOptions, selectedAxes, handleAxisChange } = useSelectedAxes();
	const { colors, chartData, hasEnoughAxes, hasTeams } = useChartData(
		teams,
		calculateTeamValues,
		selectedAxes
	);
	const getTagProps = useTagRender(axisOptions);

	// Render UI based on loading state and data availability
	let chartContent;
	if (loading) {
		chartContent = <div className="radar-chart-placeholder">Loading chart</div>;
	} else if (!hasTeams) {
		chartContent = (
			<div className="radar-chart-placeholder">No trade data available to analyze.</div>
		);
	} else if (!hasEnoughAxes) {
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
						tagRender={(props) => {
							const tagProps = getTagProps(props);
							return <Tag {...tagProps} />;
						}}
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
