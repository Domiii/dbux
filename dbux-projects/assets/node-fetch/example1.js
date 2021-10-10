import fetch from './src';

async function download(url) {
  try {
    const res1 = await fetch(url, {
      timeout: 1000
    });
    const body = await res1.text();

    console.log('fetched - size =', body.length / 1000, 'kb');
  }
  catch (err) {
    console.error("FAIL", err);
  }
}

async function main() {
  // Plain text or HTML
  await download('https://www.npmjs.com/package/node-fetch');
  await download('https://en.wikipedia.org/wiki/JavaScript');
}

main();