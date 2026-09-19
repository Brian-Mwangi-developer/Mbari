/** @format */
import * as api from '@/api';
import {setToken} from '@/api/client';

const respond = (data: unknown, status = 200) =>
  (global.fetch as jest.Mock).mockResolvedValueOnce({
    ok: status < 300,
    status,
    text: () => Promise.resolve(JSON.stringify({success: status < 300, data})),
  });

const lastRequest = () => {
  const [url, init] = (global.fetch as jest.Mock).mock.calls.at(-1);
  return {url: String(url), method: init.method, body: init.body ? JSON.parse(init.body) : undefined};
};

beforeEach(async () => {
  jest.clearAllMocks();
  await setToken('tok');
});

describe('inbox API', () => {
  it('loads the address', async () => {
    respond({address: 'brian-7f3a@in.mbari.com', forwarding: null});
    const result = await api.getAddress();
    expect(result.address).toBe('brian-7f3a@in.mbari.com');
    expect(lastRequest()).toMatchObject({method: 'GET', url: expect.stringMatching(/\/api\/v1\/me\/address$/)});
  });

  it('confirms a forwarding request by id and receives the link to open', async () => {
    respond({confirmUrl: 'https://mail-settings.google.com/mail/vf-TESTTOKEN'});
    const {confirmUrl} = await api.confirmForwarding('fr/1');
    expect(confirmUrl).toContain('mail-settings.google.com');
    // The id is URL-encoded so it can never change the path.
    expect(lastRequest()).toMatchObject({method: 'POST', url: expect.stringMatching(/\/me\/forwarding\/fr%2F1\/confirm$/)});
  });

  it('asks for a newsletters filter link by default', async () => {
    respond({url: 'http://localhost:4000/api/v1/public/gmail-filter/t.s', expiresAt: 'x'});
    await api.createGmailFilterLink();
    expect(lastRequest()).toMatchObject({method: 'POST', body: {mode: 'newsletters'}});
  });

  it('keeps and ignores pending sources', async () => {
    respond({id: 'src_1', status: 'active'});
    await api.keepSource('src_1');
    expect(lastRequest()).toMatchObject({method: 'POST', url: expect.stringMatching(/\/sources\/src_1\/keep$/)});

    respond({id: 'src_1', status: 'ignored'});
    await api.ignoreSource('src_1');
    expect(lastRequest()).toMatchObject({method: 'POST', url: expect.stringMatching(/\/sources\/src_1\/ignore$/)});
  });
});
