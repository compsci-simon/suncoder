import { erinObj, myObj } from '../index'


export const convert_from_my_obj_to_erin_obj: (myObj: myObj) => erinObj = (obj: myObj) => {
  let q_data: erinObj = {
    calls: obj.calls,
    problem: obj.name,
    imports: obj.allowed_imports,
    required: {
      for: false,
      while: false,
      branching: false,
      recursion: false,
      nested: false,
      classes: false
    },
    illegal: {
      for: false,
      while: false,
      branching: false,
      recursion: false,
      nested: false,
      classes: false
    },
    'test cases': [],
    solutions: [],
    timeout: obj.timeout,
    operators: obj.operators
  }
  for (let structure of obj.required_structures) {
    if (structure.name in q_data['required']) {
      q_data['required'][structure.name] = true
    }
  }
  for (let structure of obj.illegal_structures) {
    if (structure.name in q_data['illegal']) {
      q_data['illegal'][structure.name] = true
    }
  }
  q_data['test cases'] = []
  for (let test_case of obj.input_outputs) {
    let i = test_case.input
    let o = test_case.output
    try {
      i = JSON.parse(i)
    } catch (error) { }
    try {
      o = JSON.parse(o)
    } catch (error) { }
    q_data['test cases'].push({ 'in': i, 'out': o })
  }
  q_data['solutions'] = []
  for (let sample of obj.sample_solutions) {
    q_data['solutions'].push(sample.source)
  }
  return q_data
}

export const bin_code_runtimes = (runtimes: number[], num_bins: number) => {
  let sorted_runtimes = runtimes.sort((a, b) => a - b)
  let min = sorted_runtimes[0]
  let interval = Math.ceil((sorted_runtimes[sorted_runtimes.length - 1] - sorted_runtimes[0]) / num_bins)
  let bins: { label: string, value: number }[] = []
  for (let i = 0; i < num_bins; i++) {
    let lower_end = min + i * interval
    if (i == 0) {
      lower_end--
    }
    let upper_end = min + (i + 1) * interval
    let item = { label: `${lower_end}-${upper_end}`, value: 0 }
    for (let runtime of sorted_runtimes) {
      if (runtime > lower_end && runtime <= upper_end) {
        item['value']++
      }
    }
    bins.push(item)
  }

  return bins
}

export const random_uuid = () => {
  let uuid = ""
  for (let i = 0; i < 32; i++) {
    const asciiCode = 97 + Math.floor(Math.random() * 24)
    uuid += String.fromCharCode(asciiCode)
  }
  return uuid
}