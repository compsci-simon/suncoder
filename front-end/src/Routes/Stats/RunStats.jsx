import React, { useEffect, useState } from 'react'
import { useLocation } from 'react-router-dom'
import { Paper, Tabs, Tab, Button } from '@mui/material'
import { DataGrid } from '@mui/x-data-grid'

import fastapi from '../../apis/api'
import Tabpanel from '../../components/util/Tabpanel'
import Chart from '../../components/charts/Chart'
import history from '../../history'

const RunStats = (props) => {

  const [data, setData] = useState([])
  const [value, setValue] = useState(0)
  const [codeId, setCodeId] = useState(0)

  const handleChange = (event, newValue) => {
    setValue(newValue)
  }

  function a11yProps(index) {
    return {
      id: `simple-tab-${index}`,
      'aria-controls': `simple-tabpanel-${index}`,
    };
  }

  // State hooks

  const location = useLocation()

  useEffect(() => {
    const params = new URLSearchParams(location.search)
    setCodeId(params.get('code_id'))
    fastapi.get(`/run_stats?code_id=${params.get('code_id')}`).then(resp => {
      let data = resp.data
      data.forEach((element, index) => {
        data[index]['date'] = data[index]['date'].replace('T', ' ')
      })
      setData(data)
    })
  }, [])

  const renderRunStats = () => {
    if (data == null)
      return <h5>Loading stats...</h5>

    const columns = [
      { field: 'date', headerName: 'Date', width: 200 },
      {
        field: 'passes',
        headerName: '#Passed test cases',
        type: 'number',
        width: 150,
      },
      {
        field: 'runtime',
        headerName: 'Runtime',
        type: 'number',
        width: 140,
      },
      {
        field: 'link',
        headerName: 'View',
        width: 110,
        renderCell: (params) => (
          <Button
            variant="contained"
            color="primary"
            size="small"
            style={{ marginLeft: 16 }}
            onClick={() => {
              history.push(`/questions/user_code/${codeId}`)
            }}
          >
            View
          </Button>
        )
      },
    ]
    return (
      <div className='p-2'>
        <div style={{ height: "700px" }}>
          <DataGrid
            rows={data}
            columns={columns}
            pageSize={10}
            rowsPerPageOptions={[10]}
          />
        </div>
      </div>
    )
  }

  return (
    <div className='container mt-5'>
      <Paper className='p-4'> 
        <Tabs value={value} onChange={handleChange}>
          <Tab label="Submissions" {...a11yProps(0)} />
          <Tab label="Graphs" {...a11yProps(1)} />
        </Tabs>

        <Tabpanel value={value} index={0}>
          {renderRunStats()}
        </Tabpanel>

        <Tabpanel value={value} index={1}>
          <Chart data={data} independentVar='date'/>
        </Tabpanel>
      </Paper>
    </div>
  )
}

export default RunStats