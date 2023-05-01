import React from 'react'
import CircleIcon from '@mui/icons-material/Circle';
import RadioButtonUncheckedIcon from '@mui/icons-material/RadioButtonUnchecked';

const Bullet = (props) => {
  if (!props.saved) {
    return <RadioButtonUncheckedIcon sx={{ fontSize: 10 }} />
  } else {
    return <CircleIcon sx={{ fontSize: 10 }} />
  }
}

export default Bullet