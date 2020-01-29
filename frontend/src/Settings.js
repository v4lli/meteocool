export class Settings {
  constructor (settingsCbs) {
    // expects a structure like this:
    // {
    //      "settingName": {"type": "boolean", "default": true, "cb": f},
    //      ....
    // }
    this.settings = settingsCbs;
  }

  get (key) {
    if (typeof key !== "string") { return; }

    let local = localStorage.getItem(key);
    if (local) {
      return local;
    } else {
      return this.settings[key]["default"];
    }
  }

  set (key, value) {
    if (typeof key !== "string") { return; }
    if (typeof value !== this.settings[key]["type"]) { // eslint-disable-line valid-typeof
      return;
    }

    let old = this.get(key);

    if (old !== value && this.settings[key]["default"] !== value) {
      localStorage.setItem(key, value);
    } else if (this.settings[key]["default"] === value && localStorage.getItem(key) !== null) {
      // remove from localstorage if value is reset to default
      localStorage.removeItem(key);
    }

    if (old !== this.get(key)) {
      if (this.settings[key]["cb"]) {
        this.settings[key]["cb"](value);
      }
    }
  }

  cb (key) {
    if (typeof key !== "string") { return; }
    if (this.settings[key]["cb"]) {
      this.settings[key]["cb"](this.get(key));
    }
  }
}

/* vim: set ts=2 sw=2 expandtab: */
