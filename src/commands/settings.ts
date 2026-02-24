// chrisflex settings — View/edit config.json
import { readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import * as log from '../lib/logger.js';
import { getFlexDir } from '../lib/memory.js';
import type { ChrisflexConfig } from '../types.js';

export async function settingsCommand(setExpr?: string): Promise<void> {
  const flexDir = await getFlexDir();
  const configPath = join(flexDir, 'config.json');

  const config: ChrisflexConfig = JSON.parse(await readFile(configPath, 'utf8'));

  if (!setExpr) {
    // View mode — show all settings
    log.banner('SETTINGS');

    log.heading('Project');
    log.keyValue('Name', config.project.name);
    log.keyValue('Description', config.project.description || '(not set)');
    log.keyValue('Directory', config.project.directory);

    log.heading('Git');
    log.keyValue('No Co-Author', String(config.git.noCoAuthor));
    log.keyValue('Commit Model', config.git.commitModel);
    log.keyValue('Auto Branch', String(config.git.autoBranch));

    log.heading('Screenshots');
    log.keyValue('Auto Approve', String(config.screenshots.autoApprove));
    log.keyValue('Viewport', config.screenshots.viewport);
    log.keyValue('Format', config.screenshots.format);
    log.keyValue('Quality', String(config.screenshots.quality));

    log.heading('Scaling');
    log.keyValue('Default Mode', config.scaling.defaultMode);

    console.log('');
    log.info('Set a value: chrisflex settings -s key.subkey=value');
    log.info('Example: chrisflex settings -s git.autoBranch=true');
    return;
  }

  // Set mode — parse key=value
  const eqIdx = setExpr.indexOf('=');
  if (eqIdx === -1) {
    log.error('Invalid format. Use: chrisflex settings -s key.subkey=value');
    return;
  }

  const key = setExpr.slice(0, eqIdx).trim();
  const rawValue = setExpr.slice(eqIdx + 1).trim();
  const parts = key.split('.');

  if (parts.length !== 2) {
    log.error('Use dot notation with exactly 2 levels: section.key');
    log.info('Examples: git.autoBranch, screenshots.quality, scaling.defaultMode');
    return;
  }

  const [section, prop] = parts as [string, string];

  // Validate section exists
  if (!(section in config)) {
    log.error(`Unknown section: "${section}"`);
    log.info(`Valid sections: ${Object.keys(config).join(', ')}`);
    return;
  }

  const sectionObj = config[section as keyof ChrisflexConfig];
  if (typeof sectionObj !== 'object' || sectionObj === null) {
    log.error(`"${section}" is not a configurable section.`);
    return;
  }

  if (!(prop in sectionObj)) {
    log.error(`Unknown key "${prop}" in section "${section}"`);
    log.info(`Valid keys: ${Object.keys(sectionObj).join(', ')}`);
    return;
  }

  // Type coercion
  const currentValue = (sectionObj as Record<string, unknown>)[prop];
  let newValue: unknown;

  if (typeof currentValue === 'boolean') {
    newValue = rawValue === 'true';
  } else if (typeof currentValue === 'number') {
    newValue = Number(rawValue);
    if (isNaN(newValue as number)) {
      log.error(`"${rawValue}" is not a valid number.`);
      return;
    }
  } else {
    newValue = rawValue;
  }

  // Apply
  (sectionObj as Record<string, unknown>)[prop] = newValue;
  await writeFile(configPath, JSON.stringify(config, null, 2) + '\n');

  log.success(`${key} = ${String(newValue)}`);
  log.info(`Previous value: ${String(currentValue)}`);
}
