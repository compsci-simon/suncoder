import React from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { signIn, signOut } from '../../action'
import LoginIcon from '@mui/icons-material/Login'
import LogoutIcon from '@mui/icons-material/Logout'
import { IconButton } from '@mui/material'


const SignInButton = () => {
  const identity = useSelector((state) => state.identity)
  const dispatch = useDispatch()

  const onClickHandler = () => {
    dispatch(identity.id ? signOut() : signIn())
  }

  if (identity.id) {
    return <IconButton onClick={onClickHandler}>
      <LogoutIcon sx={{ color: 'white' }}  />
    </IconButton>
  } else {
    return <IconButton onClick={onClickHandler}>
      <LoginIcon sx={{ color: 'white' }} />
    </IconButton>
  }
}

export default SignInButton