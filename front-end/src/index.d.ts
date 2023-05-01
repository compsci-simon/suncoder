export type myObj = {
  allowed_imports: { name: string }[]
  calls: string[]
  categories: { name: string }[]
  description: string
  id: string
  illegal_structures: { name: string }[]
  input_outputs: { input: any, output: any }[]
  linting: boolean
  name: string
  operators: []
  question_count: number
  required_structures: { name: string }[]
  sample_solutions: { source: string, errors: boolean, expanded: boolean, question_id: string, syntax_error: boolean, test_results: any }[]
  stderr: string
  stdout: string
  template: string
  timeout: number,
  generate_method: string
}

export type erinObj = {
  calls: string[]
  problem: string
  imports: { name: string }[]
  required: {
    'for': boolean,
    'while': boolean,
    'branching': boolean,
    'recursion': boolean,
    'nested': boolean,
    'classes': boolean,
  },
  illegal: {
    'for': boolean,
    'while': boolean,
    'branching': boolean,
    'recursion': boolean,
    'nested': boolean,
    'classes': boolean,
  },
  'test cases': { in: any, out: any }[]
  operators: string[]
  solutions: string[]
  timeout: number
}

export type sample_verification_obj = {
  containsConflicts: boolean
  'forbidden operators used': string[]
  'operator consistency': string[]
  'required and illegal concepts': string[]
  'solution consistency': {
    illegal: string[],
    required: string[]
  },
  'solution outputs': {
    errors: string[],
    failed: string[]
  }
}