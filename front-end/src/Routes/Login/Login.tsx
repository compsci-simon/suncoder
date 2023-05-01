import { Button, Stack, TextField } from '@mui/material'
import React, { useState } from 'react'
import { login } from './actions'
import store from '../../store'

const Login = () => {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [failed, setFailed] = useState(false)
  const afterEffect = (data: any) => {
    console.log(data)
    if (!data.id) {
      setFailed(true)
    } else {
      localStorage.setItem('token', data.rawJWT)
      if (data.username == 'demo') {
        localStorage.setItem('id', data.id)
      }
      store.dispatch({ type: 'SIGN_IN', payload: data })
    }
  }

  const submitHandler = () => {
    const id = localStorage.getItem('id')
    store.dispatch<any>(
      login(
        username,
        password,
        id,
        afterEffect
      )
    )
    setUsername('')
    setPassword('')
  }

  return (
    <div style={{ justifyContent: 'center', alignItems: 'center', display: 'flex', height: '100%' }}>
      <div
        style={{ width: '50%', height: '50%' }}
      >
        <Stack spacing={2}>
          <TextField label='Username' type='text' value={username} onChange={e => setUsername(e.target.value)} />
          <TextField label='Password' type='password' value={password} onChange={e => setPassword(e.target.value)} />
          <Button variant='contained' onClick={submitHandler} >Log in</Button>
          {failed && <p style={{ color: 'red', fontSize: '11px', marginLeft: '10px' }}>Failed to log in. Username or password is incorrect.</p>}
        </Stack>
      </div>
    </div>
  )
}

export default Login