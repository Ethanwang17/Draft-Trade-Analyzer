import React, { useState, useEffect } from 'react';
import { Table, Card, Space, Typography, Spin, Alert, Button, Row, Col } from 'antd';
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
import ValuationSelector from '../components/Selector/ValuationSelector/ValuationSelector';
import CreateValuationModel from '../components/CreateValuationModel/CreateValuationModel';
import './ValuationModelPage.css';

const { Title } = Typography;

function ValuationModelPage() {
	const [pickValues, setPickValues] = useState([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState(null);
	const [selectedValuation, setSelectedValuation] = useState(1);
	const [xAxisTicks, setXAxisTicks] = useState([]);
	const [createMode, setCreateMode] = useState(false);
	const [selectorKey, setSelectorKey] = useState(Date.now());

	// Fetch pick values data
	useEffect(() => {
		const fetchPickValues = async () => {
			try {
				setLoading(true);
				setError(null);

				// First get all pick positions from the basic endpoint
				const pickPositionsResponse = await fetch('/api/pick-values');

				if (!pickPositionsResponse.ok) {
					throw new Error('Failed to fetch pick positions data');
				}

				const pickPositionsData = await pickPositionsResponse.json();

				// Sort pick positions to ensure they're in order
				const sortedPickPositions = [...pickPositionsData].sort(
					(a, b) => parseInt(a.pick_position, 10) - parseInt(b.pick_position, 10)
				);

				// Now fetch values for each pick position with the selected valuation model
				const valuesPromises = sortedPickPositions.map(async (pick) => {
					try {
						const response = await fetch(
							`/api/pick-value/${pick.pick_position}/${selectedValuation}`
						);

						if (!response.ok) {
							// If we get an error for this specific pick, just use the default values
							return {
								id: pick.id,
								pickNumber: parseInt(pick.pick_position, 10),
								value: parseFloat(pick.value),
								normalized: parseFloat(pick.normalized),
								valuationName: 'Standard', // Default name
							};
						}

						const valueData = await response.json();

						return {
							key: pick.id,
							pickNumber: parseInt(pick.pick_position, 10),
							value: parseFloat(valueData.value),
							normalized: parseFloat(valueData.normalized),
							valuationName: valueData.valuation_name,
						};
					} catch (error) {
						console.error(`Error fetching value for pick ${pick.pick_position}:`, error);
						// Return default value on error
						return {
							key: pick.id,
							pickNumber: parseInt(pick.pick_position, 10),
							value: parseFloat(pick.value),
							normalized: parseFloat(pick.normalized),
							valuationName: 'Standard', // Default name
						};
					}
				});

				// Wait for all value fetches to complete
				const valueResults = await Promise.all(valuesPromises);

				setPickValues(valueResults);

				if (valueResults.length > 0) {
					const pickNumbers = valueResults.map((item) => item.pickNumber);
					const minPick = Math.min(...pickNumbers);
					const maxPick = Math.max(...pickNumbers);

					const ticks = [];
					// Ensure the first pick is always a tick
					if (minPick > 0) {
						// Add minPick if it's a valid pick number
						ticks.push(minPick);
					}
					// Start from the first multiple of 5 greater than or equal to minPick
					for (let i = Math.ceil(minPick / 5) * 5; i <= maxPick; i += 5) {
						if (i >= minPick && !ticks.includes(i)) {
							// Ensure i is within range and not already added
							ticks.push(i);
						}
					}
					// Ensure the last pick is a tick if it's not a multiple of 5 and not already included
					if (maxPick > 0 && !ticks.includes(maxPick) && maxPick % 5 !== 0 && maxPick > minPick) {
						ticks.push(maxPick);
					}
					// Sort ticks to ensure they are in ascending order
					ticks.sort((a, b) => a - b);
					// Remove duplicates
					setXAxisTicks([...new Set(ticks)]);
				} else {
					setXAxisTicks([]);
				}

				setLoading(false);
			} catch (err) {
				console.error('Error fetching pick values:', err);
				setError('Failed to load pick values data. Please try again later.');
				setLoading(false);
			}
		};

		fetchPickValues();
	}, [selectedValuation]);

	const handleValuationChange = (value) => {
		setSelectedValuation(value);
	};

	// Table columns definition
	const columns = [
		{
			title: 'Pick Number',
			dataIndex: 'pickNumber',
			key: 'pickNumber',
			width: '33.33%',
		},
		{
			title: 'Value',
			dataIndex: 'value',
			key: 'value',
			width: '33.33%',
		},
		{
			title: 'Normalized',
			dataIndex: 'normalized',
			key: 'normalized',
			width: '33.33%',
		},
	];

	return (
		<div className="valuation-model-page">
			<Space direction="vertical" size="large" style={{ width: '100%' }}>
				<div className="title-container">
					<Title level={2}>Draft Pick Valuation Models</Title>
					<Button type="primary" onClick={() => setCreateMode(!createMode)}>
						{createMode ? 'Back to Models' : 'Create New Valuation Model'}
					</Button>
				</div>

				{createMode ? (
					<CreateValuationModel
						onCancel={() => setCreateMode(false)}
						onModelCreated={(newId) => {
							// switch back to view mode and refresh selector
							setCreateMode(false);
							setSelectedValuation(newId);
							setSelectorKey(Date.now());
						}}
					/>
				) : (
					<>
						<div className="selector-container">
							<ValuationSelector
								key={selectorKey}
								onChange={handleValuationChange}
								defaultValue={selectedValuation}
							/>
						</div>

						{error && <Alert type="error" message={error} banner />}

						{loading ? (
							<div className="loading-container">
								<Spin size="large" />
							</div>
						) : (
							<>
								<Card title="Valuation Chart" className="chart-card">
									<ResponsiveContainer width="100%" height={400}>
										<LineChart
											data={pickValues}
											margin={{ top: 20, right: 30, left: 20, bottom: 10 }}
										>
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
												stroke="#1677ff"
												activeDot={{ r: 8 }}
												name="Value"
											/>
										</LineChart>
									</ResponsiveContainer>
								</Card>

								<Card title="Pick Values Table" className="table-card">
									<Table
										columns={columns}
										dataSource={pickValues}
										pagination={false}
										size="middle"
									/>
								</Card>
							</>
						)}
					</>
				)}
			</Space>
		</div>
	);
}

export default ValuationModelPage;
