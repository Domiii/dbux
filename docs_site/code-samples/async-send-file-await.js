async function send(fpath) {
  const file = await openFile(fpath);

  const cont = await readFile(file);


  await sendFile(cont);


  console.log('File sent!');
}