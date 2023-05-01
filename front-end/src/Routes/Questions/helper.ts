
const get_data_type = (data: string) => {
  try {
    let x = JSON.parse(data)
    if (typeof (x) == 'object') {
      if (Array.isArray(x)) {
        if (x.length > 0) {
          let type = typeof (x[0])
          for (let item of x) {
            if (typeof (item) !== type) {
              return 'array'
            }
          }
          return type + ' array'
        } else {
          return 'array'
        }
      } else {
        return 'object'
      }
    }
    return typeof (x)
  } catch (error) { }
  return 'string'
}

export { get_data_type }