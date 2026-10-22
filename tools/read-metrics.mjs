#!/usr/bin/env node

import { readFile } from 'node:fs/promises';

const catalogUrl = new URL('../metrics-keys.json', import.meta.url);
const catalog = JSON.parse(await readFile(catalogUrl, 'utf8'));
const totalsOnly = process.argv.includes('--totals-only');
const intervalMs = 500;
const timeoutMs = 6000;
const wait = milliseconds => new Promise(resolve => setTimeout(resolve, milliseconds));

const groups = { totals: Object.values(catalog.totals) };
if (!totalsOnly) Object.assign(groups, catalog.details);

async function readCounter(key) {
  const url = `${catalog.apiOrigin}/get/${encodeURIComponent(catalog.namespace)}/${encodeURIComponent(key)}`;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: { Accept: 'application/json' },
      redirect: 'error',
      signal: controller.signal
    });
    if (response.status === 404) return { value: 0, exists: false };
    if (!response.ok) return { value: null, exists: null, error: `HTTP ${response.status}` };
    const body = await response.json();
    const value = Number(body?.value);
    if (!Number.isSafeInteger(value) || value < 0) return { value: null, exists: null, error: 'invalid response' };
    return { value, exists: true };
  } catch (error) {
    return { value: null, exists: null, error: error?.name === 'AbortError' ? 'timeout' : String(error?.message || error) };
  } finally {
    clearTimeout(timer);
  }
}

const report = {
  fetchedAt: new Date().toISOString(),
  mode: 'read-only',
  apiOrigin: catalog.apiOrigin,
  namespace: catalog.namespace,
  groups: {}
};

const entries = Object.entries(groups);
for (let groupIndex = 0; groupIndex < entries.length; groupIndex += 1) {
  const [group, keys] = entries[groupIndex];
  report.groups[group] = {};
  for (let keyIndex = 0; keyIndex < keys.length; keyIndex += 1) {
    const key = keys[keyIndex];
    report.groups[group][key] = await readCounter(key);
    const isLast = groupIndex === entries.length - 1 && keyIndex === keys.length - 1;
    if (!isLast) await wait(intervalMs);
  }
}

console.log(JSON.stringify(report, null, 2));
