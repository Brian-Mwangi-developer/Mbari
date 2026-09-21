/**
 * @format
 */

import React from 'react';
import ReactTestRenderer from 'react-test-renderer';

import * as api from '@/api';
import type {VoiceMessage} from '@/api/types';
import {AppearanceProvider} from '@/lib/appearance';
import {CommunityProvider, useCommunity} from '@/lib/community';
import {NavigationProvider, useNavigation} from '@/lib/navigation';
import {SessionProvider} from '@/lib/session';
import {RecordScreen} from '@/screens/RecordScreen';
import {SendScreen} from '@/screens/SendScreen';
import {CommunityScreen} from '@/screens/tabs/CommunityScreen';
import {HomeScreen} from '@/screens/tabs/HomeScreen';
import {InboxScreen} from '@/screens/tabs/InboxScreen';
import {SettingsScreen} from '@/screens/tabs/SettingsScreen';

let community: ReturnType<typeof useCommunity>;
let nav: ReturnType<typeof useNavigation>;
function Probe() {
  community = useCommunity();
  nav = useNavigation();
  return null;
}

const render = async (screen: React.ReactElement) => {
  let r!: ReactTestRenderer.ReactTestRenderer;
  await ReactTestRenderer.act(() => {
    r = ReactTestRenderer.create(
      <AppearanceProvider>
        <SessionProvider>
          <CommunityProvider>
            <NavigationProvider>
              <Probe />
              {screen}
            </NavigationProvider>
          </CommunityProvider>
        </SessionProvider>
      </AppearanceProvider>,
    );
  });
  return r;
};

const texts = (r: ReactTestRenderer.ReactTestRenderer) =>
  r.root.findAll(n => typeof n.props.children === 'string').map(n => n.props.children as string);

test.each([
  ['Home', <HomeScreen />],
  ['Community', <CommunityScreen />],
  ['Inbox', <InboxScreen />],
  ['Settings', <SettingsScreen />],
])('%s renders its title', async (title, screen) => {
  const r = await render(screen);
  expect(texts(r)).toContain(title);
});

test('Home leads with the newest Kiambu update and opens it for recording', async () => {
  const r = await render(<HomeScreen />);
  expect(texts(r)).toContain('Kiambu County opens public participation on the 2026/27 budget');
  const send = r.root.find(n => n.props.accessibilityLabel === 'Send to community' && typeof n.props.onPress === 'function');
  await ReactTestRenderer.act(() => send.props.onPress());
  expect(nav.recordingId).toBe('a1');
});

test('switching county changes what Home shows', async () => {
  const r = await render(<HomeScreen />);
  await ReactTestRenderer.act(() => community.setCounty('Nyeri'));
  expect(texts(r)).toContain('Nyeri ward bursary forms now available');
  expect(texts(r)).not.toContain('Kiambu County opens public participation on the 2026/27 budget');
});

test('approving an update marks it sent', async () => {
  const r = await render(<SendScreen alertId="a1" />);
  const approve = r.root.find(n => n.props.accessibilityLabel === 'Approve and send' && typeof n.props.onPress === 'function');
  await ReactTestRenderer.act(() => approve.props.onPress());
  expect(community.alerts.find(a => a.id === 'a1')?.status).toBe('sent');
});

test('the record screen shows what to say, and says so when this build cannot record', async () => {
  const r = await render(<RecordScreen alertId="a1" />);
  expect(texts(r)).toContain('What to say');
  expect(texts(r)).toContain('Residents can give their views at ward meetings from 23 to 30 September. Bring your ID.');
  // No native recorder under Jest, as in an APK built before it existed.
  expect(texts(r).some(t => t.startsWith('Recording needs the latest build'))).toBe(true);
  const mic = r.root.find(n => n.props.accessibilityLabel === 'Start recording' && typeof n.props.onPress === 'function');
  expect(mic.props.disabled).toBe(true);
  await ReactTestRenderer.act(() => r.unmount());
});

test('a recorded message can be translated to Gĩkũyũ, and the result is marked as made by AI', async () => {
  const ready: VoiceMessage = {
    id: 'v1',
    alertId: null,
    status: 'ready',
    error: null,
    targetLanguage: 'kik',
    targetLanguageName: 'Gĩkũyũ',
    recording: {url: '/api/v1/voice/v1/audio/recording?exp=1&sig=x', durationMs: 8000},
    transcript: 'come to the ward meeting',
    spokenLanguage: 'en',
    english: 'Come to the ward meeting.',
    translation: 'Ũkai mũcemanio-inĩ wa wadi.',
    disclosure: {text: 'Ndũmĩrĩri ĩno yathondekirũo nĩ kompiuta, ti mũndũ.', english: 'This message was made by a computer, not by a person.'},
    audio: {url: '/api/v1/voice/v1/audio/translation?exp=1&sig=x', durationMs: 4000},
    madeBy: {transcript: 'whisper', english: null, translation: 'nllb-200-distilled-600M', voice: 'mms-tts-kik'},
    createdAt: '2026-09-21T12:00:00.000Z',
    completedAt: '2026-09-21T12:00:30.000Z',
  };
  const upload = jest.spyOn(api, 'translateRecording').mockResolvedValue(ready);
  const r = await render(<SendScreen alertId="a1" />);
  await ReactTestRenderer.act(() => community.saveRecording('a1', {uri: 'file:///take.m4a', durationMs: 8000}));

  const button = r.root.find(n => n.props.accessibilityLabel === 'Translate to Gĩkũyũ' && typeof n.props.onPress === 'function');
  await ReactTestRenderer.act(() => button.props.onPress());

  // A sample alert has no server copy, so the upload carries no alert id.
  expect(upload).toHaveBeenCalledWith({uri: 'file:///take.m4a', durationMs: 8000}, undefined);
  expect(texts(r)).toContain('Ũkai mũcemanio-inĩ wa wadi.');
  expect(texts(r)).toContain('Come to the ward meeting.');
  expect(texts(r).some(t => t.startsWith('Made by AI'))).toBe(true);
  expect(texts(r)).toContain('This message was made by a computer, not by a person.');

  // Recording again throws the old translation away.
  await ReactTestRenderer.act(() => community.saveRecording('a1', {uri: 'file:///take2.m4a', durationMs: 6000}));
  expect(texts(r)).not.toContain('Ũkai mũcemanio-inĩ wa wadi.');
  upload.mockRestore();
  await ReactTestRenderer.act(() => r.unmount());
});
