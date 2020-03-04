async function sleep(ms, val = 1) { return new Promise(r => setTimeout(() => r(val), ms)); }

async function main() {
    const promises = [];
    for (let i = 0; i < 10; ++i) {
        promises.push(sleep(i * 10, i));
    }

    try {
        for await (const x of promises) {
            console.log(x);
        }

        console.log('main done');
    }
    finally {
        console.log('finally');
    }
}

main();