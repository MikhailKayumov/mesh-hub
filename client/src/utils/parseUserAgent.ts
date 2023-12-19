import UAParser from 'ua-parser-js';

export default function parseUserAgent(ua: string): string {
  const { browser, os, cpu } = UAParser(ua);

  return `${browser.name} ${browser.version}, ${os.name} ${os.version} (arch: ${cpu.architecture})`;
}
