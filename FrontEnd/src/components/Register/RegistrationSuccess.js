import padilogo from '../../assets/images/padi-logo-transparent.png';
import { CSSTransition } from "react-transition-group";
import { Link } from 'react-router-dom';
const RegistrationSucess = () => {
    return (<CSSTransition timeout={1500} classNames='auth'>
        <div className='vertical-center authentification'>
            <div className='text-center' id='login'>
                <Link style={{ textDecoration: 'none' }} to='/'><img src={padilogo} id='logo-login' height="150" text-align="center"></img></Link>
                <div className='block-content block block-400'>
                    <h4>Thank you for registering PadiMedical PACs system.</h4>
                    <br />
                    <br />
                    <h5>
                        <Link to='/login'>Click here to login</Link> &nbsp;
                        And start using the system.
                        Our team will review your registration and give you access to the system
                        based on your need.
                    </h5>
                </div>
            </div>
        </div>
    </CSSTransition>)
}

export default RegistrationSucess;