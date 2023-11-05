import React from 'react';
import './History.scss';

const History: React.FC = () => {
  return (
    <div className='history tab-page'>
      <div className='stats'>
        <div className='stat'>
          <div className='value'>0</div>
          <div className='bucket'>Today</div>
          <div className='average'>1.2avg</div>
        </div>
        <div className='stat'>
          <div className='value'>0</div>
          <div className='bucket'>This Week</div>
          <div className='average'>1.2avg</div>
        </div>
        <div className='stat'>
          <div className='value'>0</div>
          <div className='bucket'>In October</div>
          <div className='average'>12avg</div>
        </div>
        <div className='stat'>
          <div className='value'>100</div>
          <div className='bucket'>Total</div>
        </div>
      </div>
    </div>
  );
}

export default History;
