import padilogo from '../../assets/images/padi-logo-transparent.png';
import { CSSTransition } from "react-transition-group";

import { Email, } from '@material-ui/icons';
import { Link, useHistory } from 'react-router-dom';
import { useState } from 'react';

const ForgotPassword = () => {
    const [data, setData] = useState({});
    const [error, setError] = useState(null);
    const [send, setSend] = useState(false);
    const history = useHistory()


    const handleChange = (e) => {
        setData({ ...data, [e.target.name]: e.target.value });
    }

    const handleSubmit = (e) => {
        e.preventDefault();
        fetch("/api/users/forgot-password", {
            headers: {
                Accept: 'application/json',
                'Content-Type': 'application/json; charset=utf-8'
            },
            method: "POST",
            body: JSON.stringify(data)
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
                    setSend(true);
                }
            })
            .catch(err => {
                console.log('err', err?.response?.data)
            })
    }

    return (<CSSTransition timeout={1500} classNames='auth'>
        <div className='vertical-center authentification'>
            <div className='text-center' id='login'>
                <img onClick={() => history.push("/")} src={padilogo} id='logo-login' height="150" text-align="center"></img>
                <div className='alert alert-danger' id='error' style={{ display: error === null ? 'none' : '' }}>{error}</div>
                <div className='block-content block block-400'>
                    {
                        send ?
                            <>
                                <h4>Password reset link has been sent to your email</h4>
                                <br />
                                <br />
                                <h5> Please check your email and complete the proccess</h5>
                            </>
                            :

                            <form onSubmit={handleSubmit} id='login-form'>

                                <fieldset>
                                    <label><Email /></label>
                                    <input type='email' placeholder='Email' name='email' onChange={handleChange} required />
                                </fieldset>


                                <div className='r-and-f'>
                                </div>

                                <button name='connexion' type='submit' className='login-btn' > Procced </button>


                            </form>

                    }

                </div>
            </div>
        </div>
    </CSSTransition>)
}

export default ForgotPassword;