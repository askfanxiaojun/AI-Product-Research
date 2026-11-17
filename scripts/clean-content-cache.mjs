// Clear persisted loader entries, including when the last report was removed.
import {rmSync} from 'node:fs';
for (const dir of ['.astro','node_modules/.astro']) rmSync(dir,{recursive:true,force:true});
