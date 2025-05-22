import React from 'react';
import { Button, message } from 'antd';
import { EditOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import './LoadTradeButton.css';

// Button that loads a saved trade and navigates to the Home page with state
function LoadTradeButton({ tradeId }) {
	const navigate = useNavigate();

	const handleLoadTrade = async (e) => {
		if (e) {
			// Prevent event bubbling to avoid triggering parent click handlers
			e.stopPropagation(); // Prevent card expansion when clicking the button
		}

		try {
			// Fetch trade details and pass them as navigation state to reconstruct UI
			const response = await fetch(`/api/trades/${tradeId}/full`);

			if (!response.ok) {
				throw new Error('Failed to load trade data');
			}

			const tradeData = await response.json();

			// Navigate to homepage with trade data
			navigate('/home', {
				state: {
					preserveTradeState: true,
					teamGroups: tradeData.teamGroups,
					selectedValuation: tradeData.valuation_model_id || 1,
				},
			});
		} catch (error) {
			console.error('Error loading trade:', error);
			message.error('Failed to load trade: ' + error.message);
		}
	};

	return (
		<Button
			type="primary"
			icon={<EditOutlined />}
			onClick={handleLoadTrade}
			className="load-trade-button"
		>
			Load Trade
		</Button>
	);
}

export default LoadTradeButton;
