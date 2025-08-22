// Matka helpers
function sumToDigit(panna) {
  // panna is string 'XYZ'
  const s = String(panna).split('').reduce((a, c) => a + (parseInt(c, 10) || 0), 0)
  return s % 10
}

function classifyPanna(panna) {
  const [a, b, c] = String(panna)
  if (a === b && b === c) return 'triple'
  if (a === b || a === c || b === c) return 'double'
  return 'single'
}

function buildJodi(openDigit, closeDigit) {
  return `${openDigit}${closeDigit}`.padStart(2, '0')
}

module.exports = { sumToDigit, classifyPanna, buildJodi }
