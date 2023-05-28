import React, { useEffect, useState } from 'react';
import { request } from '../utils/axios';
import { format } from 'timeago.js';
import { Link } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { useParams } from 'react-router-dom';
import { useNavigate } from 'react-router-dom';
import DataTable from 'react-data-table-component';
import Navbar from '../components/Navbar';
import { AiFillEdit, AiFillLike, AiFillDelete, AiOutlineArrowRight, AiOutlineLike } from 'react-icons/ai';
import { FiArrowRight } from 'react-icons/fi';
import moment from 'moment';
import { toast } from 'react-toastify';
const SafetyTips = () => {
  const [safetyTips, setSafetyTips] = useState([]);
  const [activeCategory, setActiveCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const { user, token } = useSelector((state) => state.auth);
  const navigate = useNavigate();
  const { id } = useParams();
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
  }, [safetyTips]);
    // delete
    const handleDeleteBlog = async (id) => {
      try {
        const options = { "Authorization": `Bearer ${token}` };
        const data = await request(`/safety-tips/delete/${id}`, "DELETE", options);
        const updatedSafetyTips = safetyTips.filter((tip) => tip._id !== id);
    setSafetyTips(updatedSafetyTips);
        const { message } = data;
        console.log('====================================');
        console.log(data);
        console.log('====================================');
        toast.success(message);
        navigate(`/manage/safety-tips`);
      } catch (error) {
        console.error(error);
      }
    };
    
  

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
          <div>
                <Link to={`/manage/safety-tips/update/${row._id}`}>
                  <AiFillEdit />
                </Link>
                <div>
                <AiFillDelete onClick={() => handleDeleteBlog(row._id)} />
                </div>
                <>
               
              </>
              </div>
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
