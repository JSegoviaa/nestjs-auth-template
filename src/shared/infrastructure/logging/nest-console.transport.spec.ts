import { stripVTControlCharacters } from 'node:util';

import { format } from './nest-console.transport.js';

const TIME = new Date(2026, 9, 2, 21, 3, 0).getTime();

const print = (line: Parameters<typeof format>[0]) =>
  stripVTControlCharacters(format(line)).replace(
    / - .+? {1,}(\w+) /,
    ' - <time> $1 ',
  );

describe('nest console transport', () => {
  it('prints app logs like Nest', () => {
    expect(
      print({
        level: 30,
        time: TIME,
        pid: 1234,
        context: 'RoutesResolver',
        msg: 'AuthController {/api/auth}',
      }),
    ).toBe(
      '[Nest] 1234  - <time> LOG [RoutesResolver] AuthController {/api/auth}\n',
    );
  });

  it('summarizes failed requests with their error code and request id', () => {
    expect(
      print({
        level: 40,
        time: TIME,
        pid: 1234,
        requestId: 'req-1',
        req: { method: 'POST', url: '/api/v1/auth/login' },
        res: { statusCode: 401 },
        responseTime: 8,
        errorCode: 'INVALID_CREDENTIALS',
        body: { email: 'a@b.com' },
        msg: 'request completed',
      }),
    ).toBe(
      '[Nest] 1234  - <time> WARN [HTTP] POST /api/v1/auth/login 401 8ms INVALID_CREDENTIALS (requestId: req-1)\n',
    );
  });

  it('prints extra fields and the error stack', () => {
    const output = print({
      level: 50,
      time: TIME,
      pid: 1234,
      context: 'LogArchiver',
      msg: 'Could not archive',
      file: 'app.log',
      err: { stack: 'Error: timeout\n    at upload' },
    });

    expect(output).toBe(
      "[Nest] 1234  - <time> ERROR [LogArchiver] Could not archive { file: 'app.log' }\nError: timeout\n    at upload\n",
    );
  });
});
