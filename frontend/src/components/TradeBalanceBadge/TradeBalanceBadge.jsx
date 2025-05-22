import React from 'react';
import { Badge } from 'antd';
import './TradeBalanceBadge.css';

function TradeBalanceBadge({ tradeBalance, loading, valuesLoading }) {
	// Return nothing while loading or if trade balance isn't available
	if (loading || valuesLoading || !tradeBalance) {
		return null;
	}

	// Render a status badge with icon and styled message based on trade balance
	return (
		<Badge
			count={
				<div
					className={`analyze-trade-badge ${
						tradeBalance.status === 'balanced'
							? 'balanced'
							: tradeBalance.status === 'perfectlyBalanced'
								? 'perfectly-balanced'
								: tradeBalance.status === 'slightlyFavors'
									? 'slightly-favors'
									: 'heavily-favors'
					}`}
				>
					{tradeBalance.iconType && React.createElement(tradeBalance.iconType)}{' '}
					{tradeBalance.message} {tradeBalance.value ? `(${tradeBalance.value})` : ''}
				</div>
			}
		/>
	);
}

export default TradeBalanceBadge;
