import React from 'react';
import NewsFeed from '../components/news/NewsFeed';
import SecretDeveloper from '../components/common/SecretDeveloper';

const Dashboard = () => {
  return (
    <>
      <SecretDeveloper />
      <NewsFeed />
    </>
  );
};

export default Dashboard;