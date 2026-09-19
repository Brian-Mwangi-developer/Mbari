/** @format */
import * as api from '@/api';
import {setToken} from '@/api/client';

const respond = (data: unknown, status = 200) =>
  (global.fetch as jest.Mock).mockResolvedValueOnce({
    ok: status < 300,
    status,
    text: () => Promise.resolve(JSON.stringify({success: status < 300, data})),
  });

const lastUrl = () => String((global.fetch as jest.Mock).mock.calls.at(-1)[0]);

beforeEach(async () => {
  jest.clearAllMocks();
  await setToken('tok');
});

describe('library API', () => {
  it('loads the first page, then continues from the cursor', async () => {
    respond({items: [], nextCursor: 'ui_9'});
    const page = await api.getLibrary();
    expect(page.nextCursor).toBe('ui_9');
    expect(lastUrl()).toMatch(/\/api\/v1\/library$/);

    respond({items: [], nextCursor: null});
    await api.getLibrary('ui/9');
    expect(lastUrl()).toMatch(/\/api\/v1\/library\?cursor=ui%2F9$/);
  });

  it('loads passed-over picks', async () => {
    respond([]);
    await api.getPassedOver();
    expect(lastUrl()).toMatch(/\/api\/v1\/library\/passed$/);
  });

  it('encodes the search query', async () => {
    respond([]);
    await api.searchLibrary('Dangote & IPO');
    expect(lastUrl()).toMatch(/\/api\/v1\/library\/search\?q=Dangote%20%26%20IPO$/);
  });
});
