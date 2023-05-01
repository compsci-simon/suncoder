import { Button, Stack, TextField } from '@mui/material'
import React, { useState } from 'react'
import fastapi from '../../apis/api'

const ChangeUserSettings = () => {
  const [password, setPassword] = useState('')

  const submitHandler = () => {
    fastapi.user.change_password(password)
    setPassword('')
    console.log('here')
  }

  return (
    <div className='p-3'>
      <Stack spacing={2}>
        <TextField
          label='New Password'
          type='text'
          fullWidth={false}
          value={password}
          onChange={e => setPassword(e.target.value)}
        />
        <Button variant='contained' onClick={submitHandler}>Change password</Button>
      </Stack>
    </div>
  )
}

export default ChangeUserSettings