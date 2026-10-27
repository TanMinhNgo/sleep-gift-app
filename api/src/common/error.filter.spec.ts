import {
  ArgumentsHost,
  BadRequestException,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { ErrorFilter } from './error.filter';

describe('ErrorFilter', () => {
  it.each<[unknown, number, string]>([
    [
      new BadRequestException(['name is invalid', 'code is invalid']),
      400,
      'name is invalid; code is invalid',
    ],
    [{ code: '23505', detail: 'sensitive SQL' }, 409, 'conflict'],
    ...['23514', '22P02', '22007', '22008'].map<[unknown, number, string]>(
      (code) => [{ code }, 400, 'invalid data'],
    ),
    [new InternalServerErrorException('secret'), 500, 'internal'],
    [new Error('sensitive SQL'), 500, 'internal'],
    [null, 500, 'internal'],
  ])(
    'maps exceptions without exposing internals %#',
    (exception, status, error) => {
      const json = jest.fn();
      const response = { status: jest.fn().mockReturnValue({ json }) };
      const host = {
        switchToHttp: () => ({ getResponse: () => response }),
      } as unknown as ArgumentsHost;
      const log = jest
        .spyOn(Logger.prototype, 'error')
        .mockImplementation(() => undefined);
      try {
        new ErrorFilter().catch(exception, host);
        expect(response.status).toHaveBeenCalledWith(status);
        expect(json).toHaveBeenCalledWith({ error });
      } finally {
        log.mockRestore();
      }
    },
  );
});
