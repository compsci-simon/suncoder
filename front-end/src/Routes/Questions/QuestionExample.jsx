import React from 'react'
import { FormControl, TextField } from '@mui/material'

const QuestionExample = ({ index, examples, setExamples }) => {

  const changedInput = value => {
    const newExamples = [...examples]
    newExamples[index].input = value
    setExamples(newExamples)
  }

  const changedOutput = value => {
    const newExamples = [...examples]
    newExamples[index].output = value
    setExamples(newExamples)
  }

  const changedExplanation = value => {
    const newExamples = [...examples]
    newExamples[index].explanation = value
    setExamples(newExamples)
  }

  return (
    <div>
      <h4>Example {index + 1}</h4>
      <FormControl fullWidth margin='normal'>
        <TextField 
          multiline
          value={examples[index].input} 
          onChange={e => changedInput(e.target.value)} 
          label="Input" 
          variant="filled" 
        />
      </FormControl>
      <FormControl fullWidth margin='normal'>
        <TextField 
          multiline
          value={examples[index].output} 
          onChange={e => changedOutput(e.target.value)} 
          label="Output" 
          variant="filled" 
        />
      </FormControl>
      <FormControl fullWidth margin='normal'>
        <TextField 
          multiline
          value={examples[index].explanation} 
          onChange={e => changedExplanation(e.target.value)} 
          label="Explanation" 
          variant="filled" 
        />
      </FormControl>
    </div>
  )
}

export default QuestionExample