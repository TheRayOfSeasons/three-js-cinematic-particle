import React from 'react';
import { Router } from '@reach/router';
import { Home } from './pages/Home';
import { TestPage } from './pages/TestPage';
import { TestPage2 } from './pages/TestPage2';
import { TestPage3 } from './pages/TestPage3';
import { TestPage4 } from './pages/TestPage4';
import { TestPage5 } from './pages/TestPage5';
import { TestPage6 } from './pages/TestPage6';
import { TestPage7 } from './pages/TestPage7';

export const Routers = () => (
  <Router>
    <Home path="/*" />
    <TestPage path="/test/*" />
    <TestPage2 path="/test-2/*" />
    <TestPage3 path="/test-3/*" />
    <TestPage4 path="/test-4/*" />
    <TestPage5 path="/test-5/*" />
    <TestPage6 path="/test-6/*" />
    <TestPage7 path="/test-7/*" />
  </Router>
);
