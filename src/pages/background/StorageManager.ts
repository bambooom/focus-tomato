import EventEmitter from 'events';
import { Storage } from '@root/utils/Chrome';
import { SettingsSchema } from './Settings';

class StorageManager extends EventEmitter {
  schema: SettingsSchema;
  storage: Storage;
  constructor(schema, storage) {
    super();
    this.schema = schema;
    this.storage = storage;
  }

  async get() {
    const [payload, modified] = this._upgrade(await this.storage.get());
    if (modified) {
      await this.storage.clear();
      await this.storage.set(payload);
    }

    return payload;
  }

  async set(payload) {
    const [pay] = this._upgrade(payload);
    await this.storage.set(pay);
    this.emit('change', payload);
  }

  _upgrade(payload) {
    let modified = false;

    if (Object.keys(payload).length === 0) {
      modified = true;
      payload = this.schema.default;
    }

    if (!payload.version) {
      throw new Error('Missing version.');
    }

    if (payload.version < this.schema.version) {
      modified = true;
      for (let version = payload.version; version < this.schema.version; ++version) {
        const method = `from${version}To${version + 1}`;
        payload = this.schema[method](payload);

        if (payload.version !== (version + 1)) {
          throw new Error('Unexpected version.');
        }
      }
    }

    return [payload, modified];
  }
}

export default StorageManager;
