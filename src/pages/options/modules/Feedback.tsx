import React from 'react';
import './Feedback.scss'
import packageJson from '@root/package.json';

const Feedback: React.FC = () => {

  return (
    <div className='tab-page feedback'>
      <div className="links">
        <p>Feedback</p>
        <ul>
          <li><a href="https://chrome.google.com/webstore/detail/marinara-pomodoro-timer/lojgmehidjdhhbmpjfamhpkpodfcodef/reviews" target="_blank" rel="noreferrer">Write a review</a></li>
          <li><a href="https://github.com/schmich/marinara/issues" target="_blank" rel="noreferrer">Report a issue</a></li>
        </ul>
      </div>
      <div className="links">
        <p>Version</p>
        <ul>
          <li>{ packageJson.version }</li>
        </ul>
      </div>
    </div>
  );
}

export default Feedback;
