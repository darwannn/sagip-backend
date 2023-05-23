import React from 'react'
import Categories from '../../components/categories/Categories'


import Navbar from '../../components/navbar/Navbar'

import classes from './home.module.css'

const Home = () => {
  return (
    <div>
      <Navbar />

      <Categories />

    </div>
  )
}

export default Home