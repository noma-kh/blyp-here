import React from 'react';
import { Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar.jsx';
import routes from './routes.jsx';

export default function App() {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="container py-8 flex-1">
        <Routes>
          {routes.map(({ path, element: Element }) => (
            <Route key={path} path={path} element={<Element />} />)
          )}
        </Routes>
      </main>
      <footer className="border-t py-10 text-sm text-gray-600">
        <div className="container grid grid-cols-1 md:grid-cols-4 gap-6">
          <div>
            <p>We connect coffee lovers with local cafés through community, discovery,</p>
            <div className="flex gap-3 mt-3">
              <span>📸</span>
              <span>📘</span>
            </div>
          </div>
          <div>
            <p className="font-medium mb-2">NAVIGATION</p>
            <ul className="space-y-1">
              <li>Home</li>
              <li>Explore Coffeeshops</li>
              <li>Badges & Rewards</li>
              <li>Add a Coffeeshop</li>
            </ul>
          </div>
          <div>
            <p className="font-medium mb-2">HELP</p>
            <ul className="space-y-1">
              <li>Our Mission</li>
              <li>For Coffeeshops (Partnership)</li>
              <li>Terms & Conditions</li>
              <li>Privacy Policy</li>
            </ul>
          </div>
          <div>
            <p className="font-medium mb-2">FAQ</p>
            <ul className="space-y-1">
              <li>FAQ</li>
              <li>Report a Problem</li>
              <li>Contact Us</li>
              <li>Feedback Form</li>
            </ul>
          </div>
        </div>
        <div className="container text-center mt-10">2025. ALL RIGHTS RESERVED.</div>
      </footer>
    </div>
  );
}

