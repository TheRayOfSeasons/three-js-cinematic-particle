import React from 'react';
import { Router } from '@reach/router';
import { Home } from './pages/Home';
import { TestPage } from './pages/TestPage';

export const Routers = () => (
  <Router>
    <Home path="/*" />
    <TestPage path="/test/*" />
  </Router>
);
