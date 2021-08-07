import fetch from './src';

async function main() {
  // Plain text or HTML
  try {
    const response = await fetch('https://stackoverflow.com/');
    const body = await response.text();

    console.log('fetched - size =', body.length / 1000, 'kb');
  }
  catch (err) {
    console.error("FAIL", err);
  }
}

main();