import {useState} from "react";
import "./App.css";
import Navbar from "./components/Navbar";
import HomePage from "./pages/HomePage";
import SavedTrades from "./pages/SavedTrades";

function App() {
	const [currentPage, setCurrentPage] = useState("home");

	const handleNavigate = (page) => {
		setCurrentPage(page);
	};

	return (
		<div className="app-container">
			<Navbar onNavigate={handleNavigate} currentPage={currentPage} />
			<main className="content">
				{currentPage === "home" && <HomePage />}
				{currentPage === "saved" && <SavedTrades />}
			</main>
		</div>
	);
}

export default App;
