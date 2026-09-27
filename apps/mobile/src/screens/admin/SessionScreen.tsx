//
// AnemoneReact is subject to the terms of the Mozilla Public License, v2.0.
//

import {
  formatLastSeen,
  humanizeEnumValue,
  playMethodTitle,
  sessionProgress,
  useActiveSession,
} from "@anemone/core";
import type { SessionInfoDto } from "@jellyfin/sdk/lib/generated-client/models/session-info-dto";
import { useIsFocused } from "@react-navigation/native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import type { BrowseParamList } from "../../navigation/routes";
import { InfoSetting, LinkSetting, SettingsList, SettingsSection } from "../../ui/settings";
import {
  formatBitrate,
  hardwareAccelerationName,
  nowPlayingLabels,
  progressClock,
} from "./adminFormat";

/**
 * One session (Swiftfin `ActiveSessionDetailView`): what's playing and how far through, who and on
 * what device, and how it's being streamed — live while on screen.
 */
export function SessionScreen({
  navigation,
  route,
}: NativeStackScreenProps<BrowseParamList, "AdminSession">) {
  const { data: session, isLoading } = useActiveSession(route.params.sessionID, useIsFocused());

  if (!session) {
    return (
      <SettingsList title="Session" back>
        <SettingsSection>
          <InfoSetting label={isLoading ? "Loading…" : "This session has ended."} />
        </SettingsSection>
      </SettingsList>
    );
  }

  const userID = session.UserId;
  return (
    <SettingsList title="Session" back>
      <NowPlayingSection session={session} />
      {userID ? (
        <SettingsSection title="User">
          <LinkSetting
            label={session.UserName ?? "Unknown user"}
            icon={{ icon: "person-circle-outline", systemImage: "person.crop.circle" }}
            detail={formatLastSeen(session.LastPlaybackCheckIn ?? session.LastActivityDate)}
            onPress={() => navigation.push("AdminUser", { userID })}
          />
        </SettingsSection>
      ) : null}
      <SettingsSection title="Device">
        <InfoSetting label="Client" value={session.Client ?? undefined} />
        <InfoSetting label="Device" value={session.DeviceName ?? undefined} />
        <InfoSetting label="Version" value={session.ApplicationVersion ?? undefined} />
        {session.RemoteEndPoint ? <InfoSetting label="Address" value={session.RemoteEndPoint} /> : null}
      </SettingsSection>
      <StreamSection session={session} />
    </SettingsList>
  );
}

function NowPlayingSection({ session }: { session: SessionInfoDto }) {
  const item = session.NowPlayingItem;
  const progress = sessionProgress(session);
  if (!item || !progress) {
    return null;
  }
  const labels = nowPlayingLabels(item);
  return (
    <SettingsSection title="Now playing">
      <InfoSetting label={labels.title} description={labels.detail} />
      <InfoSetting
        label="Progress"
        value={`${progress.isPaused ? "Paused · " : ""}${progressClock(progress)}`}
      />
    </SettingsSection>
  );
}

/** How the stream is delivered (Swiftfin `StreamSection` + `TranscodeSection`). */
function StreamSection({ session }: { session: SessionInfoDto }) {
  const method = playMethodTitle(session);
  if (!method) {
    return null;
  }
  const transcoding = session.TranscodingInfo;
  const resolution =
    transcoding?.Width && transcoding.Height ? `${transcoding.Width}×${transcoding.Height}` : undefined;
  const reasons = transcoding?.TranscodeReasons ?? [];
  const hardware = hardwareAccelerationName(transcoding?.HardwareAccelerationType);

  return (
    <>
      <SettingsSection title="Stream">
        <InfoSetting label="Method" value={method} />
        {transcoding ? (
          <>
            <InfoSetting label="Container" value={transcoding.Container ?? undefined} />
            <InfoSetting
              label="Video"
              value={transcoding.IsVideoDirect ? "Direct" : (transcoding.VideoCodec ?? undefined)}
            />
            <InfoSetting
              label="Audio"
              value={transcoding.IsAudioDirect ? "Direct" : (transcoding.AudioCodec ?? undefined)}
            />
            {resolution ? <InfoSetting label="Resolution" value={resolution} /> : null}
            {transcoding.Bitrate ? (
              <InfoSetting label="Bitrate" value={formatBitrate(transcoding.Bitrate)} />
            ) : null}
            {transcoding.Framerate ? (
              <InfoSetting label="Frame rate" value={`${transcoding.Framerate} fps`} />
            ) : null}
            {hardware ? <InfoSetting label="Hardware acceleration" value={hardware} /> : null}
          </>
        ) : null}
      </SettingsSection>
      {reasons.length > 0 ? (
        <SettingsSection title="Transcode reasons">
          {reasons.map((reason) => (
            <InfoSetting key={reason} label={humanizeEnumValue(reason)} />
          ))}
        </SettingsSection>
      ) : null}
    </>
  );
}
