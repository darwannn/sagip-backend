import React, { useEffect, useState } from 'react';
import { request } from '../utils/axios';
import { format } from 'timeago.js';
import { Link } from 'react-router-dom';
import { useSelector } from 'react-redux';
import DataTable from 'react-data-table-component';
import Navbar from '../components/Navbar';
import { AiFillLike, AiOutlineLike } from 'react-icons/ai';
import { FiArrowRight } from 'react-icons/fi';
import moment from 'moment';

const SafetyTips = () => {
  const [safetyTips, setSafetyTips] = useState([]);
  const [activeCategory, setActiveCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const { user, token } = useSelector((state) => state.auth);

  const categories = [
    'all',
    'nature',
    'music',
    'travel',
    'design',
    'programming',
    'fun',
    'fashion',
  ];

  useEffect(() => {
    const fetchSafetyTips = async () => {
      try {
        const data = await request('/safety-tips/', 'GET');
        setSafetyTips(data);
      } catch (error) {
        console.error(error);
      }
    };
    fetchSafetyTips();
  }, []);

  const filteredSafetyTips = safetyTips.filter((safetyTip) => {
    const categoryMatch =
      activeCategory === 'all' || safetyTip.category.toLowerCase() === activeCategory.toLowerCase();
    const searchMatch = safetyTip.title.toLowerCase().includes(searchQuery.toLowerCase());

    return categoryMatch && searchMatch;
  });

  const columns = [
    {
      name: 'Image',
      selector: (row) => <img src={`http://localhost:5000/images/${row.image}`} alt="" style={{ width: '300px' }} />,
    },
    {
      name: 'Category',
      selector: (row) => row.category,
      sortable: true,
    },
    {
      name: 'Title',
      selector: (row) => row.title,
      sortable: true,
    },
    {
      name: 'Date',
      selector: (row) => moment(row.createdAt).format('MMMM DD, YYYY'),
      sortable: true,
    },
    {
      name: 'Actions',
      cell: (row) => (
        <>
          <Link to={`/manage/safety-tips/${row._id}`}>
            Read More <FiArrowRight />
          </Link>
        </>
      ),
    },
  ];

  const customNoDataComponent = () => (
    <div style={{ textAlign: 'center' }}>
      <DataTable
        columns={columns}
        data={[]}
        noHeader
        pagination
        paginationPerPage={10}
        paginationRowsPerPageOptions={[10, 20, 30]}
      />
    </div>
  );

  return (
    <>
      <Navbar />
      <br />
      <br />
      <Link to="/manage/safety-tips/add">Create</Link>
      
      <div>
        <input
          type="text"
          placeholder="Search safetyTips"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>
      <div>
        <select
          value={activeCategory}
          onChange={(e) => setActiveCategory(e.target.value)}
          style={{ margin: '10px' }}
        >
          {categories.map((category) => (
            <option key={category} value={category}>
              {category}
            </option>
          ))}
        </select>
      </div>
      <div>
        {filteredSafetyTips.length > 0 ? (
          <DataTable
            columns={columns}
            data={filteredSafetyTips}
            pagination
            paginationPerPage={10}
            paginationRowsPerPageOptions={[10, 20, 30]}
          />
        ) : (
          customNoDataComponent()
        )}
      </div>
    </>
  );
};

export default SafetyTips;
