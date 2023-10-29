import React, {Suspense, useState} from 'react';
import '@pages/options/Options.css';
import Tab from '@pages/options/Tab';
import icon from '@assets/img/icon-48.png';

const tabs = [
  'settings',
  'history',
  'feedback',
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
    </div>
  );
};

export default Options;
