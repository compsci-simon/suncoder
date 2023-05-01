type user = {
  id: string
  username: string
  type: string
}

type question = {
  id: number
  name: string
  description: string
}

type unit = {
  id: number
  name: string
}

type fragment = {
  name: string
}

type io = {
  id: string
  question_id: number
  input: string
  output: string
}

type example = {
  id: string
  input: string
  output: string
  explanation: string
  question_id: string
}

type imports = {
  name: string
}

type sample = {
  id: string
  question_id: number
  source: string
}

type category = fragment
type imprt = fragment
type structure = fragment

type course = {
  id: string
  name: string
}

export { user, question, category, imprt, structure, unit, io, example, imports, sample, course }