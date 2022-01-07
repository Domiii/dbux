try {
    console.log('try');
    throw new Error('try');
    return;
}
catch (err) {
    console.log('catch');
    // e();
}
finally {
    console.log('finally');
    // throw new Error('finally');
}

function e() {
    throw new Error('e');
}