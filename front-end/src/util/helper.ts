export const prerequisite_loop_exists: (item: any) => boolean = (item: any) => {
  if (_find_loop(item['prerequisites'], item['id'])) return true
  return false
}

const _find_loop: (item: any, id: string) => boolean = (item, id) => {
  if (typeof (item) !== 'object') return false
  if (item.id === id) {
    return true
  }
  if (Array.isArray(item)) {
    for (let index in item) {
      if (_find_loop(item[index], id)) return true
    }
    return false
  } else {
    return _find_loop(item['prerequisites'], id)
  }
}