import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
for (const name of ['check_lookup_update','check_archive_explorer','check_reviewed_entities','check_cloud_search','check_unselected_start','check_entity_type_reset','check_all_years_toggle','check_entry_balance','check_frequency_panel','check_anchored_cloud']) {
  execFileSync(process.execPath,[fileURLToPath(new URL(`./${name}.mjs`,import.meta.url))],{stdio:'inherit'});
}
