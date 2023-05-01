import React from 'react'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import Button from '@mui/material/Button'
import Typography from '@mui/material/Typography'
import Box from '@mui/material/Box';
import Modal from '@mui/material/Modal';

import history from '../../history'
import fastapi from '../../apis/api'

const style = {
  position: 'absolute',
  top: '50%',
  left: '50%',
  transform: 'translate(-50%, -50%)',
  width: 400,
  bgcolor: 'background.paper',
  border: '2px solid #000',
  boxShadow: 24,
  p: 4,
};

const DeleteButton = (props) => {
  const [open, setOpen] = React.useState(false);
  const handleOpen = () => setOpen(true);
  const handleClose = () => setOpen(false);

  return (
    <div>
      <Button color='error' onClick={handleOpen}>Delete</Button>
      <Modal
        open={open}
        onClose={handleClose}
        aria-labelledby="modal-modal-title"
        aria-describedby="modal-modal-description"
      >
        <Box sx={style}>
          <Typography id="modal-modal-title" variant="h6" component="h3">
            Are you sure you want to delete this question?
          </Typography>
          <div className='d-flex flex-row-reverse'>
            <Button onClick={props.deleteFunction} color='error'>Delete</Button>
            <Button onClick={handleClose}>Cancel</Button>
          </div>
        </Box>
      </Modal>
    </div>
  );
}

const Question = ({ question, removeQuestion }) => {

  const answerQuestion = () => {
    if (!question.disabled)
      history.push(`/questions/answer/${question.id}`)
  }

  const editQuestion = () => {
    if (!question.disabled)
      history.push(`/questions/edit/${question.id}`)
  }

  if (question.elevation === undefined) {
    question.elevation = 3
  }

  const renderEdit = () => {
    if (!question.disabled)
      return <Button onClick={editQuestion}>Edit</Button>
  }

  const questionStats = () => {
    if (!question.disabled)
      history.push(`/questions/stats/${question.id}`)
  }

  const renderStats = () => {
    if (!question.disabled)
      return <Button onClick={questionStats}>Stats</Button>
  }
  
  const deleteQuestion = () => {
    fastapi.delete(`/question/${question.id}`)
    .then(resp => {
      removeQuestion(question.id)
    })
    .catch(error => console.log(error))

  }

  return (
    <Card elevation={question.elevation} sx={{ minWidth: 275 }} className='p-3'>
      <CardContent>
        <Typography variant="h5" component="div" className='border-bottom'>
            {question.title}
        </Typography>
        <Typography variant="body2" className='mt-2 ml-3'>
            {question.description}
        </Typography>
      </CardContent>
        <div className='d-flex justify-content-between'>
          <div>
            <Button onClick={answerQuestion}>Answer</Button>
          </div>
          <div className='d-flex'>
            <div>

            </div>
              {renderStats()}
            <div>
              {renderEdit()}
            </div>
            {!question.disabled && <DeleteButton deleteFunction={deleteQuestion} />}
          </div>
        </div>
    </Card>
  )
}

export default Question