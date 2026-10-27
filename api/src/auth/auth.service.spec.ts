import { AuthService } from './auth.service';
import { sql } from '../common/db';

jest.mock('../common/db', () => ({ sql: jest.fn() }));
jest.mock('../common/token', () => ({
  newInviteCode: () => '123456',
  newToken: () => ({ token: 'new-token', hash: 'new-hash' }),
}));

describe('AuthService failure paths', () => {
  const query = jest.mocked(sql);
  const service = new AuthService();
  beforeEach(() => query.mockReset());

  it('retries code collisions without reactivating an old invite', async () => {
    query.mockResolvedValueOnce([]).mockResolvedValueOnce([{ code: '123456' }]);
    await expect(service.createInvite()).resolves.toEqual({
      inviteCode: '123456',
    });
    expect(query).toHaveBeenCalledTimes(2);
    expect(query.mock.calls[0][0].join('')).toContain(
      'on conflict (code) do nothing',
    );
  });

  it('stops after bounded collisions', async () => {
    query.mockResolvedValue([]);
    await expect(service.createInvite()).rejects.toThrow(
      'Could not allocate invite',
    );
    expect(query).toHaveBeenCalledTimes(10);
  });

  it('does not write a user when a code cannot be claimed', async () => {
    query.mockResolvedValue([]);
    await expect(service.join({ code: '123456', name: 'Em' })).rejects.toThrow(
      'invalid code',
    );
    expect(query).toHaveBeenCalledTimes(2);
    expect(query.mock.calls[0][0].join('')).toContain(
      'attempts = attempts + 1',
    );
  });

  it('propagates database failures instead of returning an unusable token', async () => {
    query
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([{ code: '123456' }])
      .mockRejectedValueOnce(new Error('database unavailable'));
    await expect(service.join({ code: '123456', name: 'Em' })).rejects.toThrow(
      'database unavailable',
    );
    expect(query).toHaveBeenCalledTimes(3);
  });
});
