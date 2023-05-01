import React from 'react'

import CreateQuestion from './CreateQuestion'
import QuestionFeed from './QuestionFeed';
import Tabs from '../../components/util/Tabs';
import BulkUpload from './BulkUpload';
import './question.css'

const QuestionManager = () => {
  
  return (
    <Tabs 
      tabs={[
        {
          'name': 'Edit Questions',
          'content': <QuestionFeed />
        },
        {
          'name': 'Create Question',
          'content': <CreateQuestion />
        },
        {
          'name': 'Bulk operations',
          'content': <BulkUpload /> 
        },
      ]}
    />
  )
}

export default QuestionManager