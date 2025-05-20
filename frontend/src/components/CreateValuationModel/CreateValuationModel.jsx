import React, { useState, useEffect } from 'react';
import { Form, Input, Button, Table, InputNumber, notification, Card, Space } from 'antd';
import './CreateValuationModel.css';

const CreateValuationModel = ({ onCancel, onSuccess }) => {
	const [form] = Form.useForm();
	const [pickValues, setPickValues] = useState([]);
	const [loading, setLoading] = useState(true);
	const [saving, setSaving] = useState(false);
	const [baseValue, setBaseValue] = useState(null);

	useEffect(() => {
		// Fetch the standard model pick positions to use as a template
		const fetchPickPositions = async () => {
			try {
				setLoading(true);
				const response = await fetch('/api/pick-values');

				if (!response.ok) {
					throw new Error('Failed to fetch pick positions');
				}

				const data = await response.json();

				// Sort by pick position
				const sortedData = [...data].sort(
					(a, b) => parseInt(a.pick_position, 10) - parseInt(b.pick_position, 10)
				);

				// Format data for editable table
				const formattedData = sortedData.map((item) => ({
					key: item.id,
					pickNumber: parseInt(item.pick_position, 10),
					value: null, // Start with empty values for user input
					normalized: null, // Will be calculated
				}));

				setPickValues(formattedData);
				setLoading(false);
			} catch (error) {
				console.error('Error fetching pick positions:', error);
				notification.error({
					message: 'Error',
					description: 'Failed to load pick positions. Please try again.',
				});
				setLoading(false);
			}
		};

		fetchPickPositions();
	}, []);

	// Update normalized values when values change
	useEffect(() => {
		if (pickValues.length === 0) return;

		// Find the value of the first pick (should be pick #1)
		const firstPick = [...pickValues].sort((a, b) => a.pickNumber - b.pickNumber)[0];
		const firstPickValue = firstPick?.value;

		if (firstPickValue && firstPickValue > 0) {
			setBaseValue(firstPickValue);

			// Calculate normalized values (but don't display them in the table)
			const updatedValues = pickValues.map((pick) => ({
				...pick,
				normalized: pick.value ? ((pick.value / firstPickValue) * 100).toFixed(3) : null,
			}));

			setPickValues(updatedValues);
		}
	}, [JSON.stringify(pickValues.map((p) => ({ key: p.key, value: p.value })))]);

	const handleValueChange = (value, record) => {
		// Create a deep copy of the array to avoid state mutation issues
		const updatedValues = pickValues.map((pick) => {
			if (pick.key === record.key) {
				return {
					...pick,
					value: value, // Store the value directly without parsing
				};
			}
			return { ...pick }; // Return a new object for other items
		});

		setPickValues(updatedValues);
	};

	const handleSubmit = async (values) => {
		// Validate that all picks have values
		const missingValues = pickValues.some((pick) => pick.value === null || isNaN(pick.value));
		if (missingValues) {
			notification.error({
				message: 'Validation Error',
				description: 'All pick positions must have valid numeric values.',
			});
			return;
		}

		// Validate that the first pick has a value > 0
		const firstPick = [...pickValues].sort((a, b) => a.pickNumber - b.pickNumber)[0];
		if (!firstPick.value || firstPick.value <= 0) {
			notification.error({
				message: 'Validation Error',
				description: 'The first pick must have a value greater than zero for normalization.',
			});
			return;
		}

		try {
			setSaving(true);

			// Prepare payload
			const payload = {
				name: values.name,
				description: values.description || `Custom valuation model: ${values.name}`,
				values: pickValues.map((pick) => ({
					pick_position: pick.pickNumber,
					value: pick.value,
					normalized: parseFloat(pick.normalized),
				})),
			};

			// Send to server
			const response = await fetch('/api/valuation-models', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify(payload),
			});

			if (!response.ok) {
				const errorData = await response.json();
				throw new Error(errorData.error || 'Failed to create valuation model');
			}

			const result = await response.json();

			notification.success({
				message: 'Success',
				description: 'Valuation model created successfully!',
			});

			// Call the success callback
			if (onSuccess) {
				onSuccess(result.id);
			}

			setSaving(false);
		} catch (error) {
			console.error('Error creating valuation model:', error);
			notification.error({
				message: 'Error',
				description: error.message || 'Failed to create valuation model. Please try again.',
			});
			setSaving(false);
		}
	};

	const columns = [
		{
			title: 'Pick Number',
			dataIndex: 'pickNumber',
			key: 'pickNumber',
			width: '50%',
		},
		{
			title: 'Value',
			dataIndex: 'value',
			key: 'value',
			width: '50%',
			render: (text, record) => (
				<InputNumber
					min={0}
					step={0.1}
					style={{ width: '100%' }}
					value={record.value}
					onChange={(value) => handleValueChange(value, record)}
					placeholder="Enter value"
				/>
			),
		},
	];

	return (
		<div className="create-valuation-model">
			<Form form={form} layout="vertical" onFinish={handleSubmit}>
				<Space direction="vertical" size="large" style={{ width: '100%' }}>
					<Card title="Model Details" className="model-details-card">
						<Form.Item
							name="name"
							label="Model Name"
							rules={[
								{ required: true, message: 'Please enter a name for your model' },
								{ min: 3, message: 'Name must be at least 3 characters' },
							]}
						>
							<Input placeholder="Enter a unique name for your model" />
						</Form.Item>

						<Form.Item name="description" label="Description (Optional)">
							<Input.TextArea placeholder="Enter a description for your model" rows={2} />
						</Form.Item>
					</Card>

					<Card title="Pick Values" className="pick-values-card">
						<p className="instructions">
							Enter the value for each pick position. Normalized values will be calculated
							automatically when saved (using the formula: value / first pick value * 100).
						</p>

						<Table
							columns={columns}
							dataSource={pickValues}
							pagination={false}
							loading={loading}
							size="middle"
						/>
					</Card>

					<div className="button-container">
						<Button onClick={onCancel}>Cancel</Button>
						<Button type="primary" htmlType="submit" loading={saving} disabled={loading}>
							Save Valuation Model
						</Button>
					</div>
				</Space>
			</Form>
		</div>
	);
};

export default CreateValuationModel;
