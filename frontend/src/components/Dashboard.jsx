
import React from "react";
import { useSelector, useDispatch } from "react-redux";
import { logout } from "../authSlice";
import { useNavigate } from "react-router";

function getGoogleProfilePic(user) {
	// If user object has googleId, try to decode JWT token for picture
	if (user && user.googleId && user.jwtToken) {
		try {
			const base64Url = user.jwtToken.split('.')[1];
			const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
			const jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
				return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
			}).join(''));
			const payload = JSON.parse(jsonPayload);
			if (payload.picture) return payload.picture;
		} catch (e) {}
	}
	return null;
}


const Dashboard = () => {
	const dispatch = useDispatch();
	const navigate = useNavigate();
	const user = useSelector((state) => state.auth.user);

	let profilePic = null;
	if (user) {
		// If Google user, try to get Google profile picture
		profilePic = getGoogleProfilePic(user);
		// If not Google, use Dicebear avatar
		if (!profilePic && user.email) {
			profilePic = `https://api.dicebear.com/7.x/identicon/svg?seed=${encodeURIComponent(user.email)}`;
		}
	}

	const handleLogout = () => {
		dispatch(logout());
		navigate("/");
	};

	return (
		<div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-blue-900 via-purple-900 to-black">
			<div className="w-full max-w-md mx-auto py-8 px-8 rounded-xl shadow-2xl bg-white/10 backdrop-blur-lg border border-white/20 flex flex-col items-center">
				{profilePic && (
					<img
						src={profilePic}
						alt="Profile"x
						className="w-24 h-24 rounded-full border-4 border-white shadow-lg mb-4 object-cover bg-white"
					/>
				)}
				<h2 className="text-2xl font-bold text-white mb-4">Welcome to your Dashboard!</h2>
				<p className="text-lg text-white/80 mb-6">
					{user?.email ? `Logged in as: ${user.email}` : "User info not available."}
				</p>
				<button
					onClick={handleLogout}
					className="px-6 py-2 rounded-md font-medium text-base bg-red-600 text-white shadow hover:bg-red-700 transition-all duration-200"
				>
					Logout
				</button>
			</div>
		</div>
	);
};

export default Dashboard;
