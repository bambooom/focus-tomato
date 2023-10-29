import React from 'react';
import './Settings.scss';

const Settings: React.FC = () => {
  return (
    <form className='tab-page'>
      {/* Focus seciton */}
      <div className='section'>
        <h2>Focus</h2>
        <p className="field">
          <label>
            <span>Duration: </span>
            <input
              type="number"
              min="1"
              max="999"
              className="duration" />
            <span>minutes</span>
          </label>
        </p>
        <p>Timer sound:</p>
        <div className='group'>
          <p className='field'>
            <select>
              <option value={null}>None</option>
              {/* timeSounds list */}
              {/* noise list */}
              {/* can hover to listen sounds preview */}
            </select>
          </p>
          {/* if timer sounds, can set bpm */}
          {/* <p className='field'>
            <label>
              <span>Spped: </span>
              <input
                type="number"
                className="duration"
                min="1"
                max="1000" />
              <span>beats per minute</span>
            </label>
          </p> */}
        </div>
        <p>When complete:</p>
        <div className='group'>
          <p className='field'>
            <label>
              <input type="checkbox" />
              <span>Show desktop notification</span>
            </label>
          </p>
          <p className='field'>
            <label>
              <input type="checkbox" />
              <span>Show new tab notification</span>
            </label>
          </p>
          <p className='field'>
            <label>
              <span>Play sound:</span>
              {/* <SoundSelect v-model="settings.focus.notifications.sound" :sounds="notificationSounds"></SoundSelect> */}
            </label>
          </p>
        </div>
      </div>
      {/* Short Break */}
      <div className='section'>
        <h2>Short Break</h2>
        <p className='field'>
          <label>
            <span>Duration: </span>
            <input
              type="number"
              min="1"
              max="999"
              className="duration" />
            <span>minutes</span>
          </label>
        </p>
        <p>When complete:</p>
        <div className='group'>
          <p className='field'>
            <label>
              <input type="checkbox" />
              <span>Show desktop notification</span>
            </label>
          </p>
          <p className='field'>
            <label>
              <input type="checkbox" />
              <span>Show new tab notification</span>
            </label>
          </p>
          <p className='field'>
            <label>
              <span>Play sound:</span>
              {/* <SoundSelect v-model="settings.focus.notifications.sound" :sounds="notificationSounds"></SoundSelect> */}
            </label>
          </p>
        </div>
      </div>
      {/* Long Break */}
      <div className='section'>
        <h2>Long Break</h2>
        <p className='field'>
          <label>
            <span>Duration: </span>
            <input
              type="number"
              min="1"
              max="999"
              className="duration" />
            <span>minutes</span>
          </label>
        </p>
        <p>When complete:</p>
        <div className='group'>
          <p className='field'>
            <label>
              <input type="checkbox" />
              <span>Show desktop notification</span>
            </label>
          </p>
          <p className='field'>
            <label>
              <input type="checkbox" />
              <span>Show new tab notification</span>
            </label>
          </p>
          <p className='field'>
            <label>
              <span>Play sound:</span>
              {/* <SoundSelect v-model="settings.focus.notifications.sound" :sounds="notificationSounds"></SoundSelect> */}
            </label>
          </p>
        </div>
      </div>
      {/* saved notification */}
      {/* <transition name="slide-up">
        <div v-if="showSettingsSaved" @click="dismissSettingsSaved" className="saved-noti">
          <p>
            <img src="/images/check.svg"> {{ M.settings_saved }}
          </p>
        </div>
      </transition> */}
    </form>
  );
}

export default Settings;
