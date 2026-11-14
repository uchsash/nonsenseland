import * as migration_20261114_045146_initial from './20261114_045146_initial';
import * as migration_20261114_050946_r2_key_and_fonts from './20261114_050946_r2_key_and_fonts';
import * as migration_20261114_154227_page_title_color from './20261114_154227_page_title_color';
import * as migration_20261114_163859_kindle_login_text from './20261114_163859_kindle_login_text';

export const migrations = [
  {
    up: migration_20261114_045146_initial.up,
    down: migration_20261114_045146_initial.down,
    name: '20261114_045146_initial',
  },
  {
    up: migration_20261114_050946_r2_key_and_fonts.up,
    down: migration_20261114_050946_r2_key_and_fonts.down,
    name: '20261114_050946_r2_key_and_fonts',
  },
  {
    up: migration_20261114_154227_page_title_color.up,
    down: migration_20261114_154227_page_title_color.down,
    name: '20261114_154227_page_title_color',
  },
  {
    up: migration_20261114_163859_kindle_login_text.up,
    down: migration_20261114_163859_kindle_login_text.down,
    name: '20261114_163859_kindle_login_text'
  },
];
