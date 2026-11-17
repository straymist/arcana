import { pathToFileURL } from 'node:url';
import { resolve } from 'node:path';
console.log('Open index.html in Chrome, Edge or Safari. No server is started.');
console.log(pathToFileURL(resolve('index.html')).href);
