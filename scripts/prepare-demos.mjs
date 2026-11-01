import { cp, mkdir, readFile, readdir, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { resolve } from 'node:path';
import { spawnSync } from 'node:child_process';
import { zipSync } from 'fflate';

const root = fileURLToPath(new URL('../', import.meta.url));
// Node 24 strips types for this data-only module.
const { works } = await import('../src/data/works.ts');
const demos = works.filter(work => !work.video);
await mkdir(resolve(root, 'public/vendor/three'), { recursive: true });
await cp(resolve(root, 'node_modules/three/build'), resolve(root, 'public/vendor/three/build'), { recursive: true });
await cp(resolve(root, 'node_modules/three/examples/jsm'), resolve(root, 'public/vendor/three/addons'), { recursive: true });
await cp(resolve(root, 'node_modules/three/LICENSE'), resolve(root, 'public/vendor/three/LICENSE'));
await mkdir(resolve(root, 'public/downloads'), { recursive: true });
for (const { slug, sourceFormat } of demos) {
  if (sourceFormat === 'vite') {
    const project = resolve(root, `projects/${slug}`);
    // Use npm's JS entry point directly, including on Windows without a shell.
    const result = spawnSync(process.execPath, [process.env.npm_execpath, 'run', 'build', '--', '--base', './'], { cwd: project, stdio: 'inherit' });
    if (result.error) throw result.error;
    if (result.status !== 0) throw new Error(`Failed to build ${slug}`);
    await cp(resolve(project, 'dist'), resolve(root, `public/demos/${slug}`), { recursive: true });
    const files = {};
    async function archive(path) {
      for (const entry of await readdir(resolve(project, path), { withFileTypes: true })) {
        const name = `${path}/${entry.name}`;
        if (entry.isDirectory()) await archive(name);
        else files[`${slug}/${name}`] = new Uint8Array(await readFile(resolve(project, name)));
      }
    }
    await archive('src');
    for (const name of ['index.html', 'package.json', 'package-lock.json', 'tsconfig.json', 'vite.config.ts', 'README.md']) {
      files[`${slug}/${name}`] = new Uint8Array(await readFile(resolve(project, name)));
    }
    await writeFile(resolve(root, `public/downloads/${slug}.zip`), zipSync(files));
    const licenses = [];
    const lock = JSON.parse(await readFile(resolve(project, 'package-lock.json'), 'utf8'));
    for (const [path, info] of Object.entries(lock.packages)) {
      if (!path || info.dev || info.devOptional) continue;
      for (const name of await readdir(resolve(project, path))) {
        if (/^(license|copying|notice)(\.|$)/i.test(name)) {
          licenses.push(`## ${path} ${info.version}\n\n${await readFile(resolve(project, path, name), 'utf8')}`);
        }
      }
    }
    await writeFile(resolve(root, `public/demos/${slug}/THIRD_PARTY_LICENSES.txt`), licenses.join('\n\n'));
    continue;
  }
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
console.log(`Prepared ${demos.length} demos and source downloads, ${works.length} prompt files and local Three.js dependencies.`);
