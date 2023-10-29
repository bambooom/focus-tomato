import React from 'react';
import './Feedback.scss'

const Feedback: React.FC = () => {
  const manifest = chrome.runtime.getManifest();
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
          <li>{ manifest.version }</li>
        </ul>
      </div>
    </div>
  );
}

export default Feedback;
