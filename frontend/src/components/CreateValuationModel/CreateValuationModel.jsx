import React, { useState, useEffect } from 'react';
import { Table, InputNumber, Input, Button, Space, Typography, message, Spin, Alert } from 'antd';
import './CreateValuationModel.css';

const { TextArea } = Input;
const { Title } = Typography;

// Helper to compute normalized values as a percentage of the first pick's value
const computeNormalized = (values) => {
	if (!values || values.length === 0) return [];
	const first = values[0]?.value || 0;
	return values.map((row) => {
		const normalized = first > 0 ? (row.value / first) * 100 : 0;
		return { ...row, normalized: Number(normalized.toFixed(2)) };
	});
};

const CreateValuationModel = ({ onCancel, onModelCreated }) => {
	const [modelName, setModelName] = useState('');
	const [description, setDescription] = useState('');
	const [rows, setRows] = useState([]);
	const [saving, setSaving] = useState(false);
	const [error, setError] = useState(null);
	const [loading, setLoading] = useState(true);

	// Fetch all draft pick positions and initialize rows with default values
	useEffect(() => {
		const fetchPicks = async () => {
			try {
				setLoading(true);
				const response = await fetch('/api/pick-values');
				if (!response.ok) throw new Error('Failed to fetch pick positions');
				const data = await response.json();

				// Ensure sorted
				const sorted = [...data].sort((a, b) => a.pick_position - b.pick_position);
				const initialRows = sorted.map((item) => ({
					key: item.pick_position,
					pickNumber: item.pick_position,
					value: 0,
					normalized: 0,
				}));
				setRows(initialRows);
				setLoading(false);
			} catch (err) {
				console.error(err);
				setError(err.message);
				setLoading(false);
			}
		};
		fetchPicks();
	}, []);

	// Update a single value in the table and recompute normalization
	const handleValueChange = (value, record) => {
		const newRows = rows.map((row) =>
			row.key === record.key ? { ...row, value: value || 0 } : row
		);
		setRows(computeNormalized(newRows));
	};

	// Define table columns: Pick #, Value (editable), Normalized (computed)
	const columns = [
		{
			title: 'Pick #',
			dataIndex: 'pickNumber',
			key: 'pickNumber',
			width: '33.33%',
		},
		{
			title: 'Value',
			dataIndex: 'value',
			key: 'value',
			width: '33.33%',
			render: (value, record) => (
				<InputNumber
					min={0}
					value={value}
					onChange={(val) => handleValueChange(val, record)}
					style={{ width: '100%' }}
				/>
			),
		},
		{
			title: 'Normalized',
			dataIndex: 'normalized',
			key: 'normalized',
			width: '33.33%',
			render: (val) => val.toFixed(2),
		},
	];

	// Validate inputs and send POST request to create new valuation model
	const handleSave = async () => {
		setError(null);

		if (!modelName.trim()) {
			message.error('Model name is required');
			return;
		}

		const values = rows.map((r) => Number(r.value));
		if (values.some((v) => v <= 0)) {
			message.error('All values must be positive numbers');
			return;
		}

		setSaving(true);
		try {
			const response = await fetch('/api/valuation-models', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					name: modelName.trim(),
					description,
					values,
					normalized: rows.map((r) => Number(r.normalized.toFixed(2))),
				}),
			});
			if (!response.ok) {
				const data = await response.json();
				throw new Error(data.error || 'Failed to save model');
			}
			const data = await response.json();
			message.success('Valuation model created');
			if (onModelCreated) onModelCreated(data.id);
		} catch (err) {
			console.error(err);
			setError(err.message);
		} finally {
			setSaving(false);
		}
	};

	if (loading) {
		return (
			<div className="loading-container">
				<Spin size="large" />
			</div>
		);
	}

	// Render form for entering model name, description, and pick values
	return (
		<div className="create-valuation-wrapper">
			<Space direction="vertical" style={{ width: '100%' }} size="large">
				<Title level={3}>Create New Valuation Model</Title>
				{error && <Alert type="error" message={error} />}

				<Input
					placeholder="Model Name"
					value={modelName}
					onChange={(e) => setModelName(e.target.value)}
				/>
				<TextArea
					placeholder="Description (optional)"
					value={description}
					onChange={(e) => setDescription(e.target.value)}
					rows={3}
				/>

				<Table columns={columns} dataSource={rows} pagination={false} />

				<Space>
					<Button onClick={onCancel}>Cancel</Button>
					<Button type="primary" onClick={handleSave} loading={saving}>
						Save Model
					</Button>
				</Space>
			</Space>
		</div>
	);
};

export default CreateValuationModel;
