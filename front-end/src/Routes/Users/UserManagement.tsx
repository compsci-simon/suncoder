import React from 'react'
import Tabs from '../../components/util/Tabs'
import BulkUserOps from './BulkUserOps'
import CreateUser from './CreateUser'

const UserManagement = () => {
  return (
    <Tabs 
      tabs={[
        {
          'name': 'Manage users',
          'content': <CreateUser />
        },
        {
          'name': 'Bulk operations',
          'content': <BulkUserOps />
        },
      ]}
    />
  )
}

export default UserManagement