export function makePdgLinkId(data) {
  const {
    chapterGroup,
    chapter,
    exercise,
    ddgTitle
  } = data;

  return `${chapterGroup}/${chapter}/${exercise}/${ddgTitle}`;
}

export function parsePdgLinkId(s) {
  const arr = s.split('/');
  if (arr.length !== 4) {
    // invalid
    return null;
  }
  const [
    chapterGroup,
    chapter,
    exercise,
    ddgTitle
  ] = arr;

  return {
    chapterGroup,
    chapter,
    exercise,
    ddgTitle
  };
}
