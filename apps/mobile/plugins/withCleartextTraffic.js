//
// AnemoneReact is subject to the terms of the Mozilla Public License, v2.0.
//
// Allow plain-HTTP requests in every Android build. Jellyfin servers are commonly reached over
// `http://` on a local network; Android blocks cleartext by default (API 28+) outside debug builds,
// which makes a release build silently fail every request.
//

const { withAndroidManifest } = require("expo/config-plugins");

module.exports = function withCleartextTraffic(config) {
  return withAndroidManifest(config, (manifestConfig) => {
    const application = manifestConfig.modResults.manifest.application?.[0];
    if (application) {
      application.$["android:usesCleartextTraffic"] = "true";
    }
    return manifestConfig;
  });
};
