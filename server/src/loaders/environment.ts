// TODO: Replace stubs with OpenWeather API and Google Calendar API calls

export async function loadEnvironment(): Promise<string> {
  const now = new Date().toISOString();
  return [
    '## Environment',
    '',
    `Time: ${now}`,
    'Weather: sunny, 22°C (stub)',
    'Calendar: no events today (stub)',
  ].join('\n');
}
