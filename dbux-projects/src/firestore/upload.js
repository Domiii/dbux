import { serialize } from 'firestore-rest-serdes';
import https from 'https';
import NestedError from '@dbux/common/src/NestedError';

const API_KEY = 'AIzaSyC-d0HDLJ8Gd9UZ175z7dg6J98ZrOIK0Mc';

function makeUrl(collectionId, documentId = null) {
  const url = new URL(`https://firestore.googleapis.com`);
  url.pathname = `/v1/projects/learn-learn-b8e5a/databases/(default)/documents/${collectionId}`;
  url.searchParams.set('key', API_KEY);
  if (documentId) {
    url.searchParams.set('documentId', documentId);
  }
  return url.toString();
}

export async function uploadSurvey(data) {
  return await upload(makeUrl('survey1'), data);
}

export async function uploadPathways(sessionId, collectionName, entries) {
  const collectionId = `sessions/${sessionId}/${collectionName}`;
  const documentId = null;
  const url = makeUrl(collectionId, documentId);
  return await upload(url, entries);
}

export async function upload(url, data) {
  const serializedData = serialize(data);
  const dataString = JSON.stringify({ fields: serializedData });

  const options = {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
      'Content-Length': dataString.length,
    },
    timeout: 5 * 1000,
  };

  return new Promise((resolve, reject) => {
    const req = https.request(url, options, (res) => {
      const body = [];
      res.on('data', (chunk) => body.push(chunk));
      res.on('end', () => {
        const resString = Buffer.concat(body).toString();
        if (res.statusCode < 200 || res.statusCode > 299) {
          const err = JSON.parse(resString)?.error;
          reject(new Error(`HTTP status code ${res.statusCode}\n ${JSON.stringify(err, null, 2)}`));
        }
        else {
          resolve(resString);
        }
      });
    });

    req.on('error', (err) => {
      reject(new NestedError('Failed to upload to firestore.', err));
    });

    req.on('timeout', () => {
      req.destroy();
      reject(new Error('Request time out'));
    });

    req.write(dataString);
    req.end();
  });
}

// async function test() {
//   const result = await upload('test', {
//     'msg': 'Hello World!'
//   });
//   console.log(result);
// }

// test();