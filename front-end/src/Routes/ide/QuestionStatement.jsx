import React from 'react'
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import ReactMarkdown from "react-markdown";
import rehypeRaw from 'rehype-raw';

const QuestionStatement = ({ question }) => {

  if (!question)
    return <div>Loading...</div>

  return (
    <div style={{position: 'relative'}}>
      <div className='container' style={{ position: 'absolute'}}>

        <ReactMarkdown
          children={question.description}
          remarkPlugins={[remarkMath]}
          rehypePlugins={[rehypeKatex, rehypeRaw]}
        />
      </div>
    </div>
  )
}

export default QuestionStatement