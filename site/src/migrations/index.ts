import * as migration_20261114_045146_initial from './20261114_045146_initial';
import * as migration_20261114_050946_r2_key_and_fonts from './20261114_050946_r2_key_and_fonts';

export const migrations = [
  {
    up: migration_20261114_045146_initial.up,
    down: migration_20261114_045146_initial.down,
    name: '20261114_045146_initial',
  },
  {
    up: migration_20261114_050946_r2_key_and_fonts.up,
    down: migration_20261114_050946_r2_key_and_fonts.down,
    name: '20261114_050946_r2_key_and_fonts'
  },
];
