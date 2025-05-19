import React from 'react';
import { Badge } from 'antd';
import './TradeBalanceBadge.css';

function TradeBalanceBadge({ tradeBalance, loading, valuesLoading }) {
	if (loading || valuesLoading || !tradeBalance) {
		return null;
	}

	return (
		<Badge
			count={
				<div
					className={`analyze-trade-badge ${
						tradeBalance.status === 'balanced'
							? 'balanced'
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
