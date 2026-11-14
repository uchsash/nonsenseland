import * as migration_20261114_045146_initial from './20261114_045146_initial';

export const migrations = [
  {
    up: migration_20261114_045146_initial.up,
    down: migration_20261114_045146_initial.down,
    name: '20261114_045146_initial'
  },
];
