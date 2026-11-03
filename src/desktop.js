/* Narrow file bridge to the optional offline Windows host. All paths are relative to Daten. */
(function (g) {
  'use strict';

  const channel = g.chrome?.webview,
    pending = new Map();
  let sequence = 0;
  const session = globalThis.crypto?.randomUUID?.() || Date.now().toString(36)+Math.random().toString(36).slice(2);
  if (channel) channel.addEventListener('message', event => {
    const msg = event.data;
    if (!msg || !pending.has(msg.id)) return;
    const task = pending.get(msg.id);
    if(typeof msg.progress==='string'){task.progress?.(msg.progress);return;}
    pending.delete(msg.id);
    clearTimeout(task.timer);
    if (msg.ok) task.resolve(msg.result);else {
      const error = Error(msg.error || 'Die Datei konnte nicht geöffnet werden.');
      error.name = msg.name || 'Error';
      if(typeof msg.code==='string'&&msg.code.startsWith('export-'))error.code=msg.code;
      task.reject(error);
    }
  });
  function call(op, args = {}, progress = null) {
    if (!channel) return Promise.reject(Error('Bitte starte Notenblick.exe.'));
    const id = session + '-' + (++sequence);
    return new Promise((resolve, reject) => {
      // Native save/print UI may remain open for more than two minutes.
      const timer = op==='download'||op==='print-preview'||op==='update-prepare'?null:setTimeout(() => {
        pending.delete(id);
        reject(Error('Das Speichern dauert länger als erwartet. Deine Eingaben bleiben geöffnet.'));
      }, op.startsWith('migration') ? 300000 : 120000);
      pending.set(id, {
        resolve,
        reject,
        progress,
        timer
      });
      channel.postMessage({
        id,
        op,
        ...args
      });
    });
  }
  const join = (a, b) => a ? a + '/' + b : b;
  class File {
    constructor(path,meta={}) {
      this.meta=meta;this.path = path;
      this.kind = 'file';
      this.name = path.split('/').at(-1);
    }
    async getFile() {
      const text = await call('read', {
        path: this.path
      });
      return {
        text: async () => text
      };
    }
    async createWritable() {
      let text;
      return {
        write: async value => {
          text = String(value);
        },
        close: async () => {
          if (text === undefined) throw Error('Es wurden keine Daten zum Speichern übergeben.');
          await call('write', {
            path: this.path,
            text
          });
        },
        abort: async () => {
          text = undefined;
        }
      };
    }
  }
  class Directory {
    constructor(path) {
      this.path = path;
      this.kind = 'directory';
      this.name = path.split('/').at(-1) || 'Daten';
    }
    async getFileHandle(name, {
      create = false
    } = {}) {
      const path = join(this.path, name);
      if(!create)await call('file', {path,create:false});
      return new File(path);
    }
    async getDirectoryHandle(name, {
      create = false
    } = {}) {
      const path = join(this.path, name);
      await call('directory', {
        path,
        create
      });
      return new Directory(path);
    }
    async removeEntry(name) {
      await call('remove', {
        path: join(this.path, name)
      });
    }
    async *entries() {
      for (const item of await call('entries', {
        path: this.path
      })) yield [item.name, item.kind === 'directory' ? new Directory(join(this.path, item.name)) : new File(join(this.path, item.name),item)];
    }
  }
  g.NRDesktop = {
    available: !!channel,
    call,
    Directory
  };
})(globalThis);
