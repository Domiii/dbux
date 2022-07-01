export function makePdgLinkId(data) {
  const {
    chapterGroup,
    chapter,
    exercise,
    pdgTitle
  } = data;

  return `${chapterGroup}/${chapter}/${exercise}/${pdgTitle}`;
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
    pdgTitle
  ] = arr;

  return {
    chapterGroup,
    chapter,
    exercise,
    pdgTitle
  };
}
