import React from 'react';
import { Router } from '@reach/router';
import { Home } from './pages/Home';
import { TestPage } from './pages/TestPage';
import { TestPage2 } from './pages/TestPage2';
import { TestPage3 } from './pages/TestPage3';
import { TestPage4 } from './pages/TestPage4';

export const Routers = () => (
  <Router>
    <Home path="/*" />
    <TestPage path="/test/*" />
    <TestPage2 path="/test-2/*" />
    <TestPage3 path="/test-3/*" />
    <TestPage4 path="/test-4/*" />
  </Router>
);
