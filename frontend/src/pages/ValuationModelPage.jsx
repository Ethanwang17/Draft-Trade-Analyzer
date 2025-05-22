import React, { useState } from 'react';
import { Space, Typography, Spin, Alert, Button } from 'antd';
import ValuationSelector from '../components/Selector/ValuationSelector/ValuationSelector';
import CreateValuationModel from '../components/CreateValuationModel/CreateValuationModel';
import ValuationChart from '../components/ValuationChart/ValuationChart';
import ValuationTable from '../components/ValuationTable/ValuationTable';
import { useValuationData } from '../hooks';

const { Title } = Typography;

function ValuationModelPage() {
	const [selectedValuation, setSelectedValuation] = useState(1);
	const [createMode, setCreateMode] = useState(false);
	const [selectorKey, setSelectorKey] = useState(Date.now());

	// Use the custom hook for data fetching
	const { pickValues, loading, error, xAxisTicks } = useValuationData(selectedValuation);

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
					<Button
						className="valuation-model-button"
						type="primary"
						onClick={() => setCreateMode(!createMode)}
					>
						{createMode ? 'Back to Models' : 'Create New Valuation Model'}
					</Button>
				</div>

				{createMode ? (
					<CreateValuationModel
						onCancel={() => setCreateMode(false)}
						onModelCreated={(newId) => {
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
