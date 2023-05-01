type user = {
  id: string
  username: string
  type: string
}

type userAction = {
  type: string
  payload: user[] | user
}

type Action = {
  type: string
  payload: any
}

export { user, userAction, Action }

