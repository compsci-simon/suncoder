class DirectedCycle {
  marked: any
  onStack: any
  cycle: any

  constructor(graph: any) {
    this.onStack = []
    this.marked = {}
    this.cycle = null
    let keys = Object.keys(graph)
    for (let key of keys) {
      this.dfs(graph, key)
    }
  }

  dfs(graph: any, v: string) {
    this.onStack.push(v)
    this.marked[v] = true
    for (let w of graph[v]) {
      if (this.cycle) return
      else if (!this.marked[w]) {
        this.dfs(graph, w)
      } else if (this.onStack.includes(w)) {
        this.cycle = []
        for (let x of this.onStack) {
          this.cycle.push(x)
        }
        this.cycle.push(w)
      }
    }
    this.onStack.pop()
  }

  hasCycle() {
    return this.cycle
  }
}

export const cycles = (inQuestion: any, items: any) => {
  if (!inQuestion || !inQuestion.prerequisites) return null
  let graph = {}
  for (let item of items) {
    graph[item.id] = item.prerequisites.map((prereq: any) => prereq.id)
  }
  graph[inQuestion.id] = inQuestion.prerequisites.map((prereq: any) => prereq.id)

  let dc = new DirectedCycle(graph)
  let cycle = dc.hasCycle()
  if (cycle) {
    cycle = cycle.reverse()
    let cycleNames: any[] = []
    items.push(inQuestion)
    for (let id of cycle) {
      for (let item of items) {
        if (item.id == id) {
          cycleNames.push(item.name)
        }
      }
    }
    return { cycle: cycleNames, offending: true, ids: cycle }
  }
  return {}
}

export const poolCycles = (unit: any) => {
  let graph = {}
  for (let pool of unit.pools) {
    graph[pool.id] = pool.prerequisites.map((x: any) => x.id)
  }
  let dc = new DirectedCycle(graph)
  return dc.hasCycle()
}

export const unitPrereqCycle = (units: any[]) => {
  let graph = {}
  for (let unit of units) {
    graph[unit.id] = unit.prerequisites.map((x: any) => x.id)
  }
  let dc = new DirectedCycle(graph)
  return dc.hasCycle()
}