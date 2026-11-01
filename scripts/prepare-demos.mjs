import { cp, mkdir, readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { resolve } from 'node:path';

const root = fileURLToPath(new URL('../', import.meta.url));
// Node 24 strips types for this data-only module.
const { works } = await import('../src/data/works.ts');
const slugs = works.filter(work => !work.video).map(work => work.slug);
await mkdir(resolve(root, 'public/vendor/three'), { recursive: true });
await cp(resolve(root, 'node_modules/three/build'), resolve(root, 'public/vendor/three/build'), { recursive: true });
await cp(resolve(root, 'node_modules/three/examples/jsm'), resolve(root, 'public/vendor/three/addons'), { recursive: true });
await cp(resolve(root, 'node_modules/three/LICENSE'), resolve(root, 'public/vendor/three/LICENSE'));
await mkdir(resolve(root, 'public/downloads'), { recursive: true });
for (const slug of slugs) {
  const html = await readFile(resolve(root, `projects/${slug}/index.html`), 'utf8');
  const local = html.replaceAll('https://unpkg.com/three@0.160.0/build/', '../../vendor/three/build/').replaceAll('https://unpkg.com/three@0.160.0/examples/jsm/', '../../vendor/three/addons/');
  const target = resolve(root, `public/demos/${slug}`);
  await mkdir(target, { recursive: true });
  await writeFile(resolve(target, 'index.html'), local);
  await writeFile(resolve(root, `public/downloads/${slug}.html`), html);
}
for (const work of works) {
  const source = work.promptSource === 'original'
    ? '作者提供的原始提示词，仅整理断行与标点。实际生成模型与脚本未核实，不保证生成相同结果。'
    : '按成品重建的复现参考，非原始提示词。原模型与对话未核实，不保证生成相同结果。';
  await writeFile(resolve(root, `public/downloads/${work.slug}-prompt.md`), `# ${work.title}\n\n> ${source}\n\n${work.prompt}\n`);
}
console.log(`Prepared ${slugs.length} demos and source downloads, ${works.length} prompt files and local Three.js dependencies.`);
