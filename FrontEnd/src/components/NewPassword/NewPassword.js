import padilogo from '../../assets/images/padi-logo-transparent.png';
import { CSSTransition } from "react-transition-group";

import { Lock, } from '@material-ui/icons';
import { Link, useHistory, useParams } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { toast } from 'react-toastify';


var Token = null;

const NewPassword = () => {
    const [data, setData] = useState({});
    const [error, setError] = useState(null);
    const history = useHistory()
    const params = useParams();


    useEffect(() => {
        Token = params.token;
    }, [])

    const handleChange = (e) => {
        setData({ ...data, [e.target.name]: e.target.value });
    }

    const handleSubmit = (e) => {
        e.preventDefault();
        if (data.password !== data.confirm_password) {
            toast.error("Password doesn't match !!")
        }
        fetch("/api/users/reset-password", {
            headers: {
                Accept: 'application/json',
                'Content-Type': 'application/json; charset=utf-8'
            },
            method: "POST",
            body: JSON.stringify({ password: data.password, token: Token })
        })
            .then(async (res) => {
                if (res.status !== 200) {
                    let data = await res.json();
                    setError(data?.errorMessage);
                    setTimeout(() => {
                        setError(null);
                    }, [5000])
                }
                else {
                    toast.success("New password set successfully !!")
                    setTimeout(() => {
                        history.push('/')
                    }, [5000])
                }
            })
            .catch(err => {
                console.log('err', err.response.data)
            })
    }

    return (<CSSTransition timeout={1500} classNames='auth'>
        <div className='vertical-center authentification'>
            <div className='text-center' id='login'>
                <img src={padilogo} onClick={() => history.push('/')} id='logo-login' height="150" text-align="center"></img>
                <div className='alert alert-danger' id='error' style={{ display: error === null ? 'none' : '' }}>{error}</div>
                <div className='block-content block block-400'>
                    <form onSubmit={handleSubmit} id='login-form'>

                        <fieldset>
                            <label><Lock /></label>
                            <input type='password' placeholder='Password' name='password' onChange={handleChange} required />
                        </fieldset>

                        <fieldset>
                            <label><Lock /></label>
                            <input type='password' placeholder='Confirm Password' name='confirm_password' onChange={handleChange} required />
                        </fieldset>


                        <div className='r-and-f'>
                        </div>

                        <button name='connexion' type='submit' className='login-btn' > Submit </button>


                    </form>
                </div>
            </div>
        </div>
    </CSSTransition>)
}

export default NewPassword;