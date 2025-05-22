import React from 'react';
import { Card } from 'antd';
import {
	LineChart,
	Line,
	XAxis,
	YAxis,
	CartesianGrid,
	Tooltip,
	Legend,
	ResponsiveContainer,
} from 'recharts';
import './ValuationChart.css'; // We'll create this next

function ValuationChart({ pickValues, xAxisTicks }) {
	return (
		<Card title="Valuation Chart" className="chart-card">
			<ResponsiveContainer width="100%" height={400}>
				<LineChart data={pickValues} margin={{ top: 20, right: 30, left: 20, bottom: 10 }}>
					<CartesianGrid strokeDasharray="3 3" />
					<XAxis
						dataKey="pickNumber"
						type="number"
						label={{ value: 'Pick Number', position: 'insideBottom', offset: -5 }}
						domain={['dataMin', 'dataMax']}
						allowDataOverflow={true}
						allowDuplicatedCategory={false}
						ticks={xAxisTicks}
					/>
					<YAxis label={{ value: 'Value', angle: -90, position: 'insideLeft' }} />
					<Tooltip formatter={(value) => parseFloat(value).toFixed(2)} />
					<Legend />
					<Line
						type="monotone"
						dataKey="value"
						stroke="#5b21b6"
						activeDot={{ r: 8 }}
						name="Value"
					/>
				</LineChart>
			</ResponsiveContainer>
		</Card>
	);
}

export default ValuationChart;
