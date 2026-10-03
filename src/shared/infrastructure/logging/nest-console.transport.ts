import { inspect, styleText } from 'node:util';

import build from 'pino-abstract-transport';

/**
 * Pino transport that prints logs to the console with the same format as
 * Nest's default ConsoleLogger:
 *
 *   [Nest] 1234  - 10/02/2026, 9:03:00 PM     LOG [RoutesResolver] Mapped ...
 *
 * Used in development only; files always receive the raw JSON.
 */

type Color = Parameters<typeof styleText>[0];

interface LogLine {
  level: number;
  time: number;
  pid: number;
  msg?: string;
  context?: string;
  requestId?: string;
  req?: { method: string; url: string };
  res?: { statusCode: number };
  responseTime?: number;
  errorCode?: string;
  err?: { stack?: string; message?: string };
  [key: string]: unknown;
}

const LEVELS: Record<number, { label: string; color: Color }> = {
  10: { label: 'VERBOSE', color: 'cyanBright' },
  20: { label: 'DEBUG', color: 'magentaBright' },
  30: { label: 'LOG', color: 'green' },
  40: { label: 'WARN', color: 'yellow' },
  50: { label: 'ERROR', color: 'red' },
  60: { label: 'FATAL', color: 'bold' },
};

/** Fields already rendered in the line; anything else is printed after it. */
const RENDERED_FIELDS = new Set([
  'level',
  'time',
  'pid',
  'hostname',
  'msg',
  'context',
  'requestId',
  'req',
  'res',
  'responseTime',
  'errorCode',
  'errors',
  'body',
  'err',
]);

const dateTimeFormatter = new Intl.DateTimeFormat(undefined, {
  year: 'numeric',
  hour: 'numeric',
  minute: 'numeric',
  second: 'numeric',
  day: '2-digit',
  month: '2-digit',
});

const useColors = !process.env.NO_COLOR;

const paint = (color: Color, text: string): string =>
  useColors ? styleText(color, text, { validateStream: false }) : text;

/** "request completed" logs from pino-http become e.g. "POST /api/v1/auth/login 401 8ms". */
function message(line: LogLine): { context?: string; text: string } {
  if (!line.req || !line.res) {
    return { context: line.context, text: line.msg ?? '' };
  }

  const { method, url } = line.req;
  let text = `${method} ${url} ${line.res.statusCode} ${line.responseTime}ms`;
  if (line.res.statusCode >= 400) {
    text += ` ${line.errorCode ?? ''} (requestId: ${line.requestId})`;
  }
  return { context: 'HTTP', text };
}

export function format(line: LogLine): string {
  const { label, color } = LEVELS[line.level] ?? LEVELS[30];
  const { context, text } = message(line);

  const extra = Object.fromEntries(
    Object.entries(line).filter(([key]) => !RENDERED_FIELDS.has(key)),
  );
  const extraOutput = Object.keys(extra).length
    ? ` ${inspect(extra, { colors: useColors, compact: true, breakLength: Infinity })}`
    : '';

  let output =
    paint(color, `[Nest] ${line.pid}  - `) +
    `${dateTimeFormatter.format(line.time)} ` +
    paint(color, label.padStart(7, ' ')) +
    ' ' +
    (context ? paint('yellow', `[${context}] `) : '') +
    paint(color, text) +
    extraOutput;

  if (line.err?.stack) {
    output += `\n${line.err.stack}`;
  }
  return `${output}\n`;
}

export default function nestConsoleTransport() {
  return build(async (source: AsyncIterable<LogLine>) => {
    for await (const line of source) {
      process.stdout.write(format(line));
    }
  });
}
