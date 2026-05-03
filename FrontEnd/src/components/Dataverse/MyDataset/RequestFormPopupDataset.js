import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  IconButton
} from '@material-ui/core';
import CloseIcon from '@material-ui/icons/Close';
import axios from 'axios';
import { toast } from 'react-toastify';
import { useSelector } from 'react-redux';
import { useHistory } from 'react-router-dom/cjs/react-router-dom.min';

export default function RequestFormPopupDataset({id,setNeedRegister}) {
  const [open, setOpen] = useState(false);
  const roles= useSelector((state)=>state?.PadiMedical?.roles);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: ''
  });
  const handleOpen = () =>{ 
    if(!roles.username){
      if(setNeedRegister)setNeedRegister(true);
      return;
    }
    setOpen(true)
  };
  const handleClose = () => setOpen(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    let payload = {
        ...formData,
        dataset_id: id
    };
    axios.post(`/api/dataverse/request`, payload)
    .then((res) => {
        toast.success('Request submitted successfully, we will get back to you soon.',{
            autoClose: 10000,
        });
        })
    .catch((err) => {
        if(err?.response?.data?.message){
            toast.error(err.response.data.message);
        }else{
            toast.error('Something went wrong!',{
                autoClose: 10000,
            });
        }
    }).finally(()=>{
        setFormData({
            name: '',
            email: '',
            phone: ''
        });
    });
    handleClose();
  };

  return (
    <div>
      <button onClick={handleOpen} className='btn  otjs-button-blue text-light mt-4 mx-auto'>Request For Dataset </button>
      <Dialog open={open} onClose={handleClose}  style={{width:"95%",maxWidth:"600px",margin:"auto",}}>
        <DialogTitle>
          Please fill out the form to get access.
        </DialogTitle>
        <DialogContent>
          <form onSubmit={handleSubmit}>
            <label className='mt-2'>Name</label>
            <input
              className='form-control'
              autoFocus
              margin="dense"
              label="Name"
              name="name"
              type="text"
              fullWidth
              value={formData.name}
              onChange={handleChange}
              required
            />
            <label className='mt-2'>Email</label>
            <input
              className='form-control'
              margin="dense"
              label="Email"
              name="email"
              type="email"
              fullWidth
              value={formData.email}
              onChange={handleChange}
              required
            />
            <label className='mt-2'>Phone</label>
            <input
              className='form-control'
              margin="dense"
              label="Phone"
              name="phone"
              type="tel"
              fullWidth
              value={formData.phone}
              onChange={handleChange}
              required
            />
          </form>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose} color="secondary">
            Cancel
          </Button>
          <button type='submit' onClick={handleSubmit} className='btn otjs-button-blue text-light'>
            Submit
          </button>
        </DialogActions>
      </Dialog>
    </div>
  );
}
