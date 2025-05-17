import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import 'antd/dist/reset.css';
import './App.css';
import GooeyNav from './components/GooeyNav/GooeyNav';
import HomePage from './pages/HomePage';
import SavedTrades from './pages/SavedTrades';

function App() {
	const navItems = [
		{
			label: 'Home',
			href: '/home',
		},
		{
			label: 'Saved Trades',
			href: '/saved',
		},
	];

	return (
		<Router basename="/Draft-Trade-Analyzer">
			<div className="app-container">
				<GooeyNav items={navItems} />
				<main className="content">
					<Routes>
						<Route path="/home" element={<HomePage />} />
						<Route path="/saved" element={<SavedTrades />} />
						<Route path="/" element={<Navigate to="/home" />} />
					</Routes>
				</main>
			</div>
		</Router>
	);
}

export default App;
