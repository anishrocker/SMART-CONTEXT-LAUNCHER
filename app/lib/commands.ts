export type LaunchFlow = {
  command: string;
  label: string;
  summary: string;
  actions: string[];
  /** URLs to open in new tabs when this flow is launched */
  urls: { label: string; url: string }[];
};

export const launchFlows: LaunchFlow[] = [
  {
    command: 'gym',
    label: 'Workout stack',
    summary: 'Open the exact tools that turn intent into motion.',
    actions: ['Workout tracker', 'Music playlist', 'Timer'],
    urls: [
      { label: 'Workout tracker', url: 'https://www.strava.com' },
      { label: 'Music playlist', url: 'https://open.spotify.com' },
      { label: 'Timer', url: 'https://timer-tab.com' },
    ],
  },
  {
    command: 'study',
    label: 'Focus stack',
    summary: 'Switch into a concentrated environment without context drift.',
    actions: ['Focus timer', 'Notes', 'Blocking apps'],
    urls: [
      { label: 'Focus timer', url: 'https://pomofocus.io' },
      { label: 'Notes', url: 'https://keep.google.com' },
      { label: 'Blocking apps', url: 'https://freedom.to' },
    ],
  },
];
