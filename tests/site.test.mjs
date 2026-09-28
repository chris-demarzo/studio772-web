// Structural tests over the production build in dist/.
// These deliberately assert structure (landmarks, metadata, link integrity)
// rather than exact copy, so routine wording edits don't break the suite.

import assert from 'node:assert/strict';
import { readFile, readdir, access } from 'node:fs/promises';
import test from 'node:test';
import { join } from 'node:path';

const dist = join(process.cwd(), 'dist');

const expectedPages = [
  'index.html',
  'services/index.html',
  'process/index.html',
  'about/index.html',
  'contact/index.html',
  'privacy/index.html',
  '404.html',
];

async function collectHtmlFiles(dir, found = []) {
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) await collectHtmlFiles(path, found);
    else if (entry.name.endsWith('.html')) found.push(path);
  }
  return found;
}

test('every expected page is built with core structure and metadata', async () => {
  const seenTitles = new Set();
  const seenDescriptions = new Set();

  for (const page of expectedPages) {
    const html = await readFile(join(dist, page), 'utf8');

    assert.match(html, /<html lang="en"/, `${page}: html lang`);
    assert.match(html, /<main[\s>]/, `${page}: main landmark`);
    assert.match(html, /<header class="site-header"/, `${page}: site header`);
    assert.match(html, /<footer class="site-footer"/, `${page}: site footer`);
    assert.match(html, /class="skip-link"/, `${page}: skip link`);

    const h1Count = (html.match(/<h1[\s>]/g) ?? []).length;
    assert.equal(h1Count, 1, `${page}: exactly one h1`);

    const title = html.match(/<title>([^<]+)<\/title>/)?.[1];
    assert.ok(title, `${page}: has a title`);
    assert.ok(!seenTitles.has(title), `${page}: unique title ("${title}")`);
    seenTitles.add(title);

    const description = html.match(/<meta name="description" content="([^"]+)"/)?.[1];
    assert.ok(description, `${page}: has a meta description`);
    assert.ok(description.length >= 50, `${page}: description is substantive`);
    assert.ok(!seenDescriptions.has(description), `${page}: unique description`);
    seenDescriptions.add(description);

    assert.match(html, /<link rel="canonical" href="https:\/\//, `${page}: canonical URL`);
    assert.match(html, /<meta property="og:title"/, `${page}: og:title`);
    assert.match(html, /<meta property="og:description"/, `${page}: og:description`);
    assert.match(html, /<meta property="og:image"/, `${page}: og:image`);
  }
});

test('sitemap and robots.txt are generated and agree with each other', async () => {
  const robots = await readFile(join(dist, 'robots.txt'), 'utf8');
  const sitemapUrl = robots.match(/^Sitemap: (\S+)$/m)?.[1];
  assert.ok(sitemapUrl, 'robots.txt declares a sitemap');

  const sitemapIndex = await readFile(join(dist, 'sitemap-index.xml'), 'utf8');
  assert.ok(sitemapIndex.includes('<sitemapindex'), 'sitemap index exists');
  assert.ok(sitemapUrl.endsWith('/sitemap-index.xml'), 'robots points at the sitemap index');
});

test('every internal link and asset reference resolves to a built file', async () => {
  const htmlFiles = await collectHtmlFiles(dist);
  assert.ok(htmlFiles.length >= expectedPages.length, 'html files were found');

  for (const file of htmlFiles) {
    const html = await readFile(file, 'utf8');
    const refs = [...html.matchAll(/(?:href|src)="(\/[^"]*)"/g)].map((m) => m[1]);

    for (const ref of refs) {
      const clean = ref.split('#')[0].split('?')[0];
      if (clean === '' || clean === '/') continue;

      const candidates = clean.endsWith('/')
        ? [join(dist, clean, 'index.html')]
        : clean.includes('.')
          ? [join(dist, clean)]
          : [join(dist, clean, 'index.html'), join(dist, `${clean}.html`)];

      const exists = (
        await Promise.all(candidates.map((c) => access(c).then(() => true, () => false)))
      ).some(Boolean);
      assert.ok(exists, `${file.replace(dist, '')}: broken internal reference ${ref}`);
    }
  }
});

test('external links are https and safe when opening new tabs', async () => {
  for (const file of await collectHtmlFiles(dist)) {
    const html = await readFile(file, 'utf8');

    assert.doesNotMatch(html, /(?:href|src)="http:\/\//, `${file.replace(dist, '')}: insecure http link`);

    for (const anchor of html.matchAll(/<a\b[^>]*>/g)) {
      if (anchor[0].includes('target="_blank"')) {
        assert.match(anchor[0], /rel="[^"]*noopener/, `${file.replace(dist, '')}: target=_blank without noopener`);
      }
    }
  }
});

test('retired Work page and Run PSL demo are fully removed', async () => {
  await assert.rejects(access(join(dist, 'work/index.html')), 'work page should not be built');
  for (const file of await collectHtmlFiles(dist)) {
    const html = await readFile(file, 'utf8');
    assert.doesNotMatch(html, /run-psl|Run PSL|href="\/work\/?"/i, `${file.replace(dist, '')}: stale Run PSL / work reference`);
  }
});

test('homepage concept switcher works without JavaScript and labels concepts as fictional', async () => {
  const html = await readFile(join(dist, 'index.html'), 'utf8');
  assert.equal((html.match(/type="radio" name="concept"/g) ?? []).length, 3, 'three concept radios');
  assert.match(html, /fictional businesses/, 'concepts are labeled fictional');
  assert.doesNotMatch(html, /<script/, 'homepage ships no scripts');
});

test('no words glued together where a line break met a {variable}', async () => {
  for (const file of await collectHtmlFiles(dist)) {
    const text = (await readFile(file, 'utf8'))
      .replace(/<script[\s\S]*?<\/script>|<style[\s\S]*?<\/style>/g, '')
      .replace(/<[^>]+>/g, ' ');
    const glued = text.match(/\b[a-z]{2,}[A-Z][a-z]+/g) ?? [];
    assert.deepEqual(glued, [], `${file.replace(dist, '')}: missing space in ${glued.join(', ')}`);
  }
});

test('brand icons use the refresh palette, not the retired teal look', async () => {
  const svg = await readFile(join(dist, 'favicon.svg'), 'utf8');
  assert.match(svg, /#ff5b24/i, 'favicon uses the hot-orange brand color');
  assert.doesNotMatch(svg, /#0b6b62|#53c9bc|#0d141b/i, 'favicon still has old teal/blueprint colors');
  const html = await readFile(join(dist, 'index.html'), 'utf8');
  assert.match(html, /rel="apple-touch-icon" href="\/apple-touch-icon\.png"/);
  await access(join(dist, 'apple-touch-icon.png'));
  await access(join(dist, 'og.png'));
});

test('copy stays honest: no hype words or fabricated-proof patterns', async () => {
  // Guards against the exact failure modes this site promises to avoid.
  const banned = [
    /revolutionary/i,
    /world-class/i,
    /cutting-edge/i,
    /trusted by \d/i,
    /\d+\+? happy (clients|customers)/i,
    /testimonial/i,
    /guaranteed (rankings|leads|traffic|results)/i,
  ];

  for (const file of await collectHtmlFiles(dist)) {
    const html = await readFile(file, 'utf8');
    for (const pattern of banned) {
      assert.doesNotMatch(html, pattern, `${file.replace(dist, '')}: banned phrase ${pattern}`);
    }
  }
});

test('no third-party runtime requests: scripts, styles, and fonts are first-party', async () => {
  for (const file of await collectHtmlFiles(dist)) {
    const html = await readFile(file, 'utf8');
    assert.doesNotMatch(html, /<script[^>]+src="https?:/, `${file.replace(dist, '')}: external script`);
    assert.doesNotMatch(html, /<link[^>]+href="https?:\/\/[^"]*\.(css|woff2?)"/, `${file.replace(dist, '')}: external style or font`);
  }
});
