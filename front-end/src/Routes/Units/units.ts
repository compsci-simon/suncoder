export type Unit = {
  id: string
  name: string
}

export type courseUnit = {
  id: string
  name: string
  prerequisites: {
    [key: string]: any
  }
  course_id?: string
}