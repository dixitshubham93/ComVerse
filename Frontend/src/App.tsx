import React from 'react';
import { Routes, Route } from 'react-router-dom';
import { HomePageWithUniverse } from './pages/HomePageWithUniverse';
import { UserSpace } from './pages/UserSpace';
import { UserProfile } from './pages/UserProfile';
import { CommunityPage } from './pages/CommunityPage';
import { CommunityManagePage } from './pages/CommunityManagePage';

export default function App() {
  return (
    <Routes>
      {/* Home page with Universe */}
      <Route path="/" element={<HomePageWithUniverse />} />

      {/* User Space */}
      <Route path="/userspace" element={<UserSpace />} />

      {/* Profile */}
      <Route path="/profile" element={<UserProfile />} />

      {/* Community Detail Page */}
      <Route path="/community/:id" element={<CommunityPage />} />

      {/* Community Manage Page */}
      <Route path="/community/:id/manage" element={<CommunityManagePage />} />
    </Routes>
  );
}