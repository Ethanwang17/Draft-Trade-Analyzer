// React and Ant Design imports for UI elements and hooks
import React, { useState } from 'react';
import { Space, Typography, Spin, Alert, Button } from 'antd';
// Custom component imports
import ValuationSelector from '../components/Selector/ValuationSelector/ValuationSelector';
import CreateValuationModel from '../components/CreateValuationModel/CreateValuationModel';
import ValuationChart from '../components/DataVisuals/ValuationChart/ValuationChart';
import ValuationTable from '../components/DataVisuals/ValuationTable/ValuationTable';
import { useValuationData } from '../hooks';

const { Title } = Typography;

function ValuationModelPage() {
	// State for currently selected valuation model ID
	const [selectedValuation, setSelectedValuation] = useState(1);

	// State to toggle between viewing models and creating a new model
	const [createMode, setCreateMode] = useState(false);

	// Unique key to force remounting of the selector when a new model is created
	const [selectorKey, setSelectorKey] = useState(Date.now());

	// Custom hook to fetch data for the selected valuation model
	const { pickValues, loading, error, xAxisTicks } = useValuationData(selectedValuation);

	// Handler for when a user selects a different valuation model
	const handleValuationChange = (value) => {
		setSelectedValuation(value);
	};

	// Define columns for the valuation table
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
					<Button
						className="valuation-model-button"
						type="primary"
						onClick={() => setCreateMode(!createMode)}
					>
						{createMode ? 'Back to Models' : 'Create New Valuation Model'}
					</Button>
				</div>

				{/* Conditionally render create mode or valuation view */}
				{createMode ? (
					<CreateValuationModel
						onCancel={() => setCreateMode(false)}
						onModelCreated={(newId) => {
							setCreateMode(false);
							setSelectedValuation(newId);
							setSelectorKey(Date.now()); // Reset key to refresh selector
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

						{/* Show error message if data fetching fails */}
						{error && <Alert type="error" message={error} banner />}

						{/* Show loading spinner or valuation chart/table */}
						{loading ? (
							<div className="loading-container">
								<Spin size="large" />
							</div>
						) : (
							<>
								<ValuationChart pickValues={pickValues} xAxisTicks={xAxisTicks} />
								<ValuationTable pickValues={pickValues} columns={columns} />
							</>
						)}
					</>
				)}
			</Space>
		</div>
	);
}

export default ValuationModelPage;
