import React from 'react';
import { Router } from '@reach/router';
import { Home } from './pages/Home';
import { TestPage } from './pages/TestPage';
import { TestPage2 } from './pages/TestPage2';

export const Routers = () => (
  <Router>
    <Home path="/*" />
    <TestPage path="/test/*" />
    <TestPage2 path="/test-2/*" />
  </Router>
);
