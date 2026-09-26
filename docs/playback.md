# Playback

How an item gets from the Play button to pixels. Ported from Swiftfin's `MediaPlayerManager`,
`MediaPlayerItem.build` and `VideoPlayerType` profiles, but with the player engine behind an
interface so engines can be swapped per platform.

## Layers

```
core  playback/capabilities.ts     PlayerCapabilities — what an engine can decode (the extension point)
      playback/deviceProfile.ts    capabilities → Jellyfin DeviceProfile
      playback/playbackSource.ts   POST /Items/{id}/PlaybackInfo → PlaybackSource (URL + track deliveries)
      playback/trackSelection.ts   switch a track in place, or signal "re-negotiate"
      playback/playbackViewModel.ts  StatefulStore: load, selectTrack
      playback/playbackReporter.ts   start / throttled progress / stop  (SessionApi)
      playback/usePlaybackReporting.ts  binds the reporter to a screen, one session per playSessionID

app   player/capabilities.ts(.web)  detectCapabilities(): AVPlayer / Media3 (probed) / browser (probed)
      player/engine.ts              EngineProps / EngineHandle — the engine contract
      player/VideoEngine.tsx        react-native-video (AVPlayer, Media3)
      player/VideoEngine.web.tsx    <video> + hls.js
      player/Player.tsx             VM + engine + reporting + controls
      screens/PlayerScreen.tsx      route `Player { itemID, startTicks?, mediaSourceID? }` (web: /play/:itemID)
```

## Negotiation

1. The app detects the engine's `PlayerCapabilities` once per launch.
2. `resolvePlayback` posts `buildDeviceProfile(capabilities)` with the start position and any chosen
   audio/subtitle indices. The server picks **direct play** (static file URL, built client-side:
   `/Videos/{id}/stream?static=true&mediaSourceId&playSessionId&tag`) or a **remux/transcode**
   (`TranscodingUrl`, always HLS fMP4 — our only transcoding profile).
3. Every media URL carries the token as `ApiKey` (a browser `<video>`/`<track>` can't send headers).

`PlaybackSource.playSessionID` identifies the stream. A new id = a new stream: the old reporting
session is stopped (which also ends its server-side transcode) and a new one starts.

## Subtitles and audio

Subtitle profiles are the same for every engine (see `deviceProfile.ts`):

| Server method | When | Engine does |
| --- | --- | --- |
| `External` (WebVTT; server converts SRT/ASS/…) | text subs | sideloads every external file with the stream, selects by id |
| `Hls` (listed first only for engines with `sideloadsSubtitlesWithHls: false`, i.e. AVPlayer) | text subs while transcoding | selects the manifest's only subtitle track |
| `Encode` | bitmap subs (PGS, VobSub, DVB, XSUB) | nothing — burned in |

Because all external files load with the stream, switching between them (or off) is a pure
selection and never reloads the video. `selectTrackLocally` decides whether a switch can stay on
the current stream; otherwise the view model re-negotiates at the current position:

- Audio switches locally only when direct playing with an engine that `selectsEmbeddedAudio`.
  Engines that can't (web) get an `IsSecondaryAudio=false` codec condition, so a non-default track
  makes the server remux with just that track.
- Subtitle switches locally between none / external (and embedded when direct playing); anything
  involving burn-in or the HLS manifest re-negotiates.

Engines select sideloaded subtitles by `subtitleTrackID(streamIndex)` (sent as the track title),
because display titles aren't unique and can collide with tracks embedded in the file.

## Engines

| | iOS / tvOS | Android / Android TV | Web |
| --- | --- | --- | --- |
| Engine | AVPlayer (react-native-video) | Media3 (react-native-video) | `<video>` + hls.js (native HLS in Safari) |
| Direct play | MP4/MOV/TS, H.264/HEVC | MP4/MKV/MOV/WebM/TS; HEVC/VP9 probed | probed with `canPlayType` |
| HDR | HDR10/HLG/Dolby Vision | SDR only (server tone-maps) | SDR only |
| Audio conversion | DTS/TrueHD | AC-3/E-AC-3/DTS/TrueHD | per probe |
| 4K | yes | probed (H.264 2160p decoder), else capped to 1080p | — |

Notes:

- `VideoDecoderProperties.isCodecSupported` in react-native-video 6.19 reports "hardware" and
  "software" inverted; we only use it for supported vs. `"unsupported"`.
- react-native-video's own web player has no HLS or track support, hence our web engine.
- Web transcodes are H.264 in **MPEG-TS** segments, played by hls.js even where the browser claims
  native HLS (as jellyfin-web does). With fMP4 segments, the server's remux of MKV H.264 (video
  copied) failed in Chrome with `DECODER_ERROR_NOT_SUPPORTED … kUnsupportedConfig` /
  hls.js `mediaSourceRequiresReset`. iOS keeps fMP4 (required for HEVC over HLS).
- iOS: react-native-video only skips subtitle sideloading for URLs *ending* in `.m3u8`; Jellyfin's
  playlist URL has a query string, so core must (and does) send no external subtitles with HLS on
  AVPlayer.

## Adding an engine (e.g. mpv)

1. Implement `EngineProps` / `EngineHandle` (`player/engine.ts`).
2. Describe it with a `PlayerCapabilities` — broad `directPlay`, `selectsEmbeddedAudio: true`.
3. Choose it in `PlayerScreen` (behind a setting). Core needs no changes; subtitle handling is
   driven by `PlaybackSource.subtitle` / `externalSubtitles`.

## Reporting

`PlaybackReporter` sends start on engine load, progress at most every 10 s (plus immediately on
pause/resume/seek/track switch) and stop on leaving the player or replacing the stream. Failures
are logged, never thrown. After stop, per-user item queries (resume row, played state) are
invalidated via `useRefreshUserItemData`.
