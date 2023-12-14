/* eslint-disable */

import React, { useEffect, useState, useMemo } from 'react';
import { SettingsClient, SoundsClient } from '../../background/Services';
import { SettingsSchema } from '../../background/Settings';
import Mutex from '@root/utils/Mutex';
import './Settings.scss';

const settingsClient = new SettingsClient();
const soundsClient = new SoundsClient();
const timerSoundMutes = new Mutex();

const Settings: React.FC = () => {
  const [settings, setSettings] = useState(new SettingsSchema().default);
  const [showSaved, setShowSaved] = useState(false);
  const [showSavedTimeout, setShowSavedTimeout] = useState(null);
  const [notificationSounds, setNotificationSounds] = useState(null);
  const [timerSoundList, setTimerSoundList] = useState(null);
  const [timerSound, setTimerSound] = useState(null);

  useEffect(() => {
    settingsClient.getSettings().then(res => {
      console.log(res);
    });

    // Promise.all([
    //   settingsClient.getSettings(),
    //   soundsClient.getNotificationSounds(),
    //   soundsClient.getTimerSounds()
    // ]).then(([currentSettings, notificationSounds, timerSounds]) => {
    //   setSettings({...currentSettings});
    //   setNotificationSounds(notificationSounds);
    //   setTimerSoundList(timerSounds);
    // });

    return () => {
      settingsClient.dispose();
      soundsClient.dispose();
    };
  }, []);

  function focusDurationOnChange(e) {
    const newVal = Number(e.target.value);
    setSettings(val => ({
      ...val,
      focus: {
        ...val.focus,
        duration: newVal,
      },
    }));
  }

  const focusTimerSound = useMemo(() => {
    const sound = settings?.focus?.timerSound;
    return sound && (sound.procedural || sound.metronome.files);
  }, [settings]);

  function focusTimerSoundOnChange(e) {
    const newVal = e.target.value;
    console.log(newVal);
    const focus = settings.focus;
    if (!newVal) {
      focus.timerSound = null;
    } else if (!Array.isArray(newVal)) {
      focus.timerSound = {
        procedural: newVal,
      };
    }
  }

  return (
    <form className="tab-page">
      {/* Focus seciton */}
      <div className="section">
        <h2>Focus</h2>
        <p className="field">
          <label>
            <span>Duration: </span>
            <input
              type="number"
              min="1"
              max="999"
              className="duration"
              value={settings.focus.duration}
              onChange={focusDurationOnChange}
            />
            <span>minutes</span>
          </label>
        </p>
        <p>Timer sound:</p>
        <div className="group">
          <p className="field">
            <select value={focusTimerSound} onChange={focusTimerSoundOnChange}>
              <option value={null}>None</option>
              <optgroup label="Periodic Beat">
                {timerSoundList &&
                  timerSoundList.map(sound => (
                    <option key={sound.name} value={sound.files}>
                      {sound.name}
                    </option>
                  ))}
              </optgroup>
              <optgroup label="Noise">
                <option value="brown-noise">Brown Noise</option>
                <option value="pink-noise">Pink Noise</option>
                <option value="white-noise">White Noise</option>
              </optgroup>
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
        <div className="group">
          <p className="field">
            <label>
              <input type="checkbox" />
              <span>Show desktop notification</span>
            </label>
          </p>
          <p className="field">
            <label>
              <input type="checkbox" />
              <span>Show new tab notification</span>
            </label>
          </p>
          <p className="field">
            <label>
              <span>Play sound:</span>
              {/* <SoundSelect v-model="settings.focus.notifications.sound" :sounds="notificationSounds"></SoundSelect> */}
            </label>
          </p>
        </div>
      </div>
      {/* Short Break */}
      <div className="section">
        <h2>Short Break</h2>
        <p className="field">
          <label>
            <span>Duration: </span>
            <input type="number" min="1" max="999" className="duration" />
            <span>minutes</span>
          </label>
        </p>
        <p>When complete:</p>
        <div className="group">
          <p className="field">
            <label>
              <input type="checkbox" />
              <span>Show desktop notification</span>
            </label>
          </p>
          <p className="field">
            <label>
              <input type="checkbox" />
              <span>Show new tab notification</span>
            </label>
          </p>
          <p className="field">
            <label>
              <span>Play sound:</span>
              {/* <SoundSelect v-model="settings.focus.notifications.sound" :sounds="notificationSounds"></SoundSelect> */}
            </label>
          </p>
        </div>
      </div>
      {/* Long Break */}
      <div className="section">
        <h2>Long Break</h2>
        <p className="field">
          <label>
            <span>Duration: </span>
            <input type="number" min="1" max="999" className="duration" />
            <span>minutes</span>
          </label>
        </p>
        <p>When complete:</p>
        <div className="group">
          <p className="field">
            <label>
              <input type="checkbox" />
              <span>Show desktop notification</span>
            </label>
          </p>
          <p className="field">
            <label>
              <input type="checkbox" />
              <span>Show new tab notification</span>
            </label>
          </p>
          <p className="field">
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
};

export default Settings;
