/**
 * these are the main group. legacy commands use only these groups.
 * CLI commands can create new groups by calling `cliMain.registerGroup()`.
 */
export const groups = {
  general: 'General commands',
  start: 'Start a working area',
  development: 'Develop components',
  collaborate: 'Collaborate on components',
  discover: 'Explore components',
  ungrouped: 'Ungrouped',
};

export type Group = keyof typeof groups;

export type GroupsType = { [groupName: string]: string };
