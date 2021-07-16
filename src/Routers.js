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
import { TestPage8 } from './pages/TestPage8';
import { TestPage9 } from './pages/TestPage9';
import { TestPage10 } from './pages/TestPage10';
import { TestPage11 } from './pages/TestPage11';
import { TestPage12 } from './pages/TestPage12';
import { TestPage13 } from './pages/TestPage13';
import { TestPage14 } from './pages/TestPage14';

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
    <TestPage8 path="/test-8/*" />
    <TestPage9 path="/test-9/*" />
    <TestPage10 path="/test-10/*" />
    <TestPage11 path="/test-11/*" />
    <TestPage12 path="/test-12/*" />
    <TestPage13 path="/test-13/*" />
    <TestPage14 path="/test-14/*" />
  </Router>
);
