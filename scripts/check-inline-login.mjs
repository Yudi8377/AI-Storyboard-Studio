import { readFileSync } from 'node:fs';
import vm from 'node:vm';
const html = readFileSync('app/public/login.html', 'utf8');
const scripts = [...html.matchAll(/<script(?:\\s[^>]*)?>([\\s\\S]*?)<\\/script>/gi)].map(m => m[1]).filter(s => s.trim());
if (scripts.length !== 1) throw new Error(`Expected one inline login script, found ${scripts.length}`);
new vm.Script(scripts[0], { filename: 'app/public/login.html:inline-script' });
console.log('Login inline JavaScript syntax OK');
