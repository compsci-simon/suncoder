import React, { useEffect } from 'react';
import { Paper, Modal } from '@mui/material'
import { IoIosCheckboxOutline } from 'react-icons/io'

const style = {
  position: 'absolute',
  top: '50%',
  left: '50%',
  transform: 'translate(-50%, -50%)',
  width: 400,
  bgcolor: 'background.paper',
  boxShadow: 24,
  p: 4,
}

export default function MyModal({ open, handleClose, title, success, center, delay }) {

  if (success) {
    style['backgroundColor'] = '#9ADBBA'
    style['color'] = 'white'
  }
  if (center) {
    style['textAlign'] = 'center'
  }

  useEffect(() => {
    if (open && delay) {
      setTimeout(() => {
        handleClose()
      }, delay)
    }
  }, [open])

  return (
    <div>
      <Modal
        open={open}
        onClose={handleClose}
        aria-labelledby="modal-modal-title"
        aria-describedby="modal-modal-description"
      >
        <Paper sx={style}>
          <h3>{title}</h3>
          {success ? <h1><IoIosCheckboxOutline /></h1> : null}
        </Paper>
      </Modal>
    </div>
  );
}
