import React, { useState } from 'react';
import Tab from '@pages/options/components/Tab';
import icon from '@assets/img/icon-48.png';
import '@pages/options/Options.scss';

import Settings from './modules/Settings';
import History from './modules/History';
import Feedback from './modules/Feedback';

const tabs = [
  'settings',
  // 'history',
  // 'feedback',
];
const Options: React.FC = () => {
  const [curTab, setTab] = useState(tabs[0]);
  return (
    <div className="container text-lime-400">
      <div className='opts-header'>
        <div className='opts-header-inner'>
          <div>
            <img src={icon} alt="logo icon"/>
            <h1>Focus Tomato</h1>
          </div>
          <div className='tab-bar'>
            {tabs.map(tab => (
              <Tab key={tab} hash={tab} isActive={curTab === tab} onClick={() => { setTab(tab); }}>{tab}</Tab>
            ))}
          </div>
        </div>
      </div>
      <div className='opts-content'>
        <div className='opts-content-inner'>
          {curTab === 'settings' && <Settings />}
          {curTab === 'history' && <History />}
          {curTab === 'feedback' && <Feedback />}
        </div>
      </div>
    </div>
  );
};

export default Options;
