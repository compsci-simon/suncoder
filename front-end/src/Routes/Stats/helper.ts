const formatDate = (inputDate: string) => {
  return inputDate.split('T').join(' ').slice(5, -3).replaceAll('-', '/')
}

const applyKeyStroke = (code: string, keystroke: any) => {
  let range = keystroke.range
  let startCol = range.startColumn
  let startLine = range.startLineNumber - 1
  let endCol = range.endColumn
  let endLine = range.endLineNumber - 1

  const startIndex = indexOfNth(code, '\n', startLine) + startCol
  const endIndex = indexOfNth(code, '\n', endLine) + endCol
  return code.substring(0, startIndex) + keystroke.text + code.substring(endIndex)
}

const indexOfNth: any = (string: string, char: string, nth: number, fromIndex = 0) => {
  const indexChar = string.indexOf(char, fromIndex);
  if (indexChar === -1) {
    return -1;
  } else if (nth === 1) {
    return indexChar;
  } else {
    return indexOfNth(string, char, nth - 1, indexChar + 1);
  }
}

const applyKeyStrokes = (template: string, changes: any, versionId: number) => {
  let newCode = template
  for (let i = 0; i < versionId; i++) {
    newCode = applyKeyStroke(newCode, changes[i])
  }
  return newCode
}

const minMag = (v1: number, v2: number) => {
  if (Math.abs(v1) < Math.abs(v2)) {
    return v1
  } else {
    return v2
  }
}

export { formatDate, applyKeyStrokes, minMag }