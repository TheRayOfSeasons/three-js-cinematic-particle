import React from 'react';
import { Router } from '@reach/router';
import { Home } from './pages/Home';

export const Routers = () => (
  <Router>
    <Home path="/*" />
  </Router>
);
