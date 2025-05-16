import React from 'react';

function Navbar({ onNavigate, currentPage }) {
	return (
		<nav className="navbar">
			<div className="nav-logo">Lakers Trade Analyzer</div>
			<div className="nav-links">
				<button
					className={currentPage === 'home' ? 'active' : ''}
					onClick={() => onNavigate('home')}
				>
					Home
				</button>
				<button
					className={currentPage === 'saved' ? 'active' : ''}
					onClick={() => onNavigate('saved')}
				>
					Saved Trades
				</button>
			</div>
		</nav>
	);
}

export default Navbar;
