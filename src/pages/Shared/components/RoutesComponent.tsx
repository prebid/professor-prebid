/* eslint-disable @typescript-eslint/no-unused-vars */
import React from 'react';
import AdUnitsComponent from './adUnits/AdUnitsComponent';
import UserIdsComponent from './userIds/UserIdsComponent';
import ConfigComponent from './config/ConfigComponent';
import TimelineComponent from './timeline/TimeLineComponent';
import BidsComponent from './bids/BidsComponent';
import ToolsComponent from './tools/ToolsComponent';
import EventsComponent from './auctionDebugEvents/EventsComponent';
import { Routes, Route } from 'react-router-dom';

const RoutesComponent = (): JSX.Element => {
  return (
    <Routes>
      <Route path="/" element={<AdUnitsComponent />} />
      <Route path="/panel.html" element={<AdUnitsComponent />} />
      <Route path="/popup.html" element={<AdUnitsComponent />} />
      <Route path="bids" element={<BidsComponent />}></Route>
      <Route path="timeline" element={<TimelineComponent />}></Route>
      <Route path="config" element={<ConfigComponent />} />
      <Route path="userId" element={<UserIdsComponent />} />
      <Route path="tools" element={<ToolsComponent />} />
      <Route path="events" element={<EventsComponent />} />
    </Routes>
  );
};

export default RoutesComponent;
