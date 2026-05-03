import padilogo from '../../assets/images/padi-logo-transparent.png';
import { CSSTransition } from "react-transition-group";
import Lock from '@material-ui/icons/Lock';
import Person from '@material-ui/icons/Person';
import { Visibility, VisibilityOff } from '@material-ui/icons'
import { Email, WorkOutlined, Phone } from '@material-ui/icons';
import { Link, useHistory } from 'react-router-dom';
import { useState } from 'react';
import { toast } from 'react-toastify'
import SweetAlert from 'react-bootstrap-sweetalert';
const Register = () => {
    const [data, setData] = useState({ showPass1: false, showPass2: false });
    const [error, setError] = useState(null);
    const [agree,setAgree]=useState(false);
    const [showModal,setShowModal]=useState(false);
    const history = useHistory()


    const handleChange = (e) => {
        setData({ ...data, [e.target.name]: e.target.value });
    }

    const handleSubmit = (e) => {
        e.preventDefault();
        if (data.password !== data.password2) {
            toast.error("Password doesn't match")
            return
        }
        fetch("/api/users/register", {
            headers: {
                Accept: 'application/json',
                'Content-Type': 'application/json; charset=utf-8'
            },
            method: "POST",
            body: JSON.stringify({...data,accepted_toc:agree})
        })
            .then(async (res) => {
                if (res.status !== 201) {
                    let data = await res.json();
                    //  console.log(data);
                    setError(data?.errorMessage);
                    setTimeout(() => {
                        setError(null);
                    }, [5000])
                }
                else {
                    history.push('/register-success');
                }
            })
            .catch(err => {
                console.log('err', err.response.data)
            })
    }

    const togglePass1 = () => {
        setData({ ...data, showPass1: !data.showPass1 })
    }
    const togglePass2 = () => {
        setData({ ...data, showPass2: !data.showPass2 })
    }

    const handleCheck=(e)=>{
        if(e.target.checked){
            setShowModal(true);
        }
        setAgree(e.target.checked);
    }
    return (
      <CSSTransition timeout={1500} classNames="auth">
        <div className="vertical-center authentification">
       {showModal && <SweetAlert
            showCancel
            confirmBtnText="I AGREE"
            cancelBtnText='I DISAGREE'
            confirmBtnBsStyle="danger"
            title="Terms of Services"  
            onConfirm={()=>{setAgree(true);setShowModal(false)}}
            onCancel={() => {setAgree(false);setShowModal(false)}}
            focusCancelBtn
          >
            <div style={{border:'2px solid #eeeeee',height:200,padding:5,textAlign:'left',overflowY:'auto'}}>
            <p style={{ fontSize: 18 ,textAlign: "left", fontWeight: "bold" }}>
                {" "} Terms and Conditions </p>

              <p style={{ fontWeight: "bold" }}>
                {" "} Condition of Use</p>
              <p style={{ fontSize: 12 ,textAlign: "justify"}}>By using this system, you certify that you have read and reviewed this agreement and agreed to comply with its terms. Longe Medikal Sdn. Bhd. shall not be liable for any delay and/or failure to perform its obligations pursuant to this Terms and Conditions if such delay or failure is due to a Force Majeure event. Longe Medikal only grants usage and access of this system, its product, and its services to those who have accepted its term.
            </p>
            
            <p style={{ fontWeight: "bold" }}>
                {" "} Privacy Policy</p>
            <p style={{ fontSize: 12 ,textAlign: "justify"}}>Before you continue using our system, we advise you to read our privacy policy regarding our user data collection and secondary data. It will help you better understand our practices.</p>
            
            <p style={{ fontWeight: "bold" }}>
                {" "} Age Restriction</p>
            <p style={{ fontSize: 12 ,textAlign: "justify"}}> You must be at least 18 years of age before you can use this system. By using this system, you warrant that you are at least 18 years of age and you may legally adhere to this agreement. Longe Medikal assumes no responsibility for liabilities related to age misrepresentation.</p>
            
            <p style={{ fontWeight: "bold" }}>
                {" "} Intellectual Property</p>
              <p style={{ fontSize: 12 ,textAlign: "justify"}}> You agree that all materials, products, and services provided on this platform are the property of Longe Medikal Sdn. Bhd., its affiliates, directors, officers, employees, including all copyrights, trade secrets, trademarks, patterns, and other intellectual property. You also agree that you will not reproduce or redistribute Longe Medikal Sdn. Bhd.’s intellectual property in any way, including electronic, digital, or new trademark registrations.
            You grant PadiMedical System a royalty-free and non-exclusive license to display, use, copy, and broadcast the content you upload and publish.</p> 

            <p style={{ fontWeight: "bold" }}>
                {" "} User Accounts</p>
              <p style={{ fontSize: 12 ,textAlign: "justify"}}> As a user of this system, you may be asked to register with us and provide private information. You are responsible for ensuring the accuracy of this information, and you are responsible for maintaining the safety and security of your identifying information. You are also responsible for all activities that occur under your account or password.</p>
              
              <p style={{ fontWeight: "bold" }}>
                {" "} Applicable Law</p>
              <p style={{ fontSize: 12 ,textAlign: "justify"}}>By visiting this platform, you agree that the laws of Malaysia, without regard to principles of conflict laws, will govern these terms and conditions, or any dispute of any sort that might come between Longe Medikal Sdn. Bhd. and you, or its business partners and associates.</p>
               
               <p style={{ fontWeight: "bold" }}>
                {" "} Disputes</p>
              <p style={{ fontSize: 12 ,textAlign: "justify"}}>Any disputes related in any way to your visit to this platform or to products you purchase from us are arbitrated by state or federal court of Malaysia and you consent to exclusive jurisdiction and venue of such courts.</p>
               
               <p style={{ fontWeight: "bold" }}>
                {" "} Indemnification</p>
              <p style={{ fontSize: 12 ,textAlign: "justify"}}> You agree to indemnify Longe Medikal Sdn. Bhd. and its affiliates and hold PadiMedical System harmless against legal claims and demands that may arise from your use or misuse of our services.</p>

                {/* Privacy and data protection */}
                
              <p style={{ fontSize: 18 ,textAlign: "left", fontWeight: "bold" }}>
                {" "} Privacy policy and Data Protection</p>

                <p style={{ fontWeight: "bold" }}>
                {" "} Your Privacy</p>
                <p style={{ fontSize: 12 ,textAlign: "justify"}}> Longe Medikal Sdn. Bhd. is committed to protecting your privacy. This data protection and privacy policy set out how we use and protect the information you give us through this system. To serve you better, you are aware and agreeable that we may share information you give us with government agencies or our partners when you register with this platform; submit any electronic forms available on this platform; send an e-mail that includes personal data. For instance, you may have a complaint that we can only resolve or address by working with a government agency.</p>

                <p style={{ fontWeight: "bold" }}>
                {" "} Cookies</p>
                <p style={{ fontSize: 12 ,textAlign: "justify"}}> Our platform generates “cookies”, which are special files collected by our servers that identify you or your computer whenever you visit the site. These cookies do not record data permanently and are not stored on your computer’s hard drive. 
We use “cookies” for analytics and to understand how our services are used. For example, we analyze the data about your visit to our sites to do things like optimize our system services and monitor the user activity when you visit our system.
</p>

                <p style={{ fontWeight: "bold" }}>
                {" "} Log In Information</p>
                <p style={{ fontSize: 12 ,textAlign: "justify"}}> When you access the PadiMedical system, our web servers automatically record information that your browser sends in a piece of log information. These server logs may include information such as your web request, IP address, browser type, browser language, the date and time of your request, and one or more cookies that may uniquely identify your browser.</p>

                <p style={{ fontWeight: "bold" }}>
                {" "} Storage Security and Data Protection</p>
                <p style={{ fontSize: 12 ,textAlign: "justify"}}> Longe Medikal Sdn. Bhd. has put in place technology to protect stored and transmitted personal information and medical image data you give us. However, while we are committed to protecting your data, we do not guarantee unauthorized or accidental access to such data.</p>

                <p style={{ fontWeight: "bold" }}>
                {" "} Clinical Data</p>
                <p style={{ fontSize: 12 ,textAlign: "justify"}}> When you upload the clinical data in DICOM format, we will anonymize and clean selected data and metadata to ensure the patient-sensitive part of the data is secured.</p>

                <p style={{ fontWeight: "bold" }}>
                {" "} Information Collected</p>
                <p style={{ fontSize: 12 ,textAlign: "justify"}}> PadiMedical System does not automatically gather personal information that can identify you while browsing the system. Any personal information we receive must come from you, for instance when you send us an e-mail or submit an electronic form during registration, replying to a survey, make an application or executing a contract in a secured part of the system. 
By giving us your personal information, you are giving us consent to collect, use and disclose your personal information under the terms of this policy and any relevant privacy and data protection laws in Malaysia. If you do not wish to give us this consent, then please do not use any of the electronic forms on our system.
</p>

                <p style={{ fontWeight: "bold" }}>
                {" "} Use and Disclosure of Personal Data and Purpose Specification</p>
                <p style={{ fontSize: 12 ,textAlign: "justify"}}> Longe Medikal Sdn. Bhd. will keep confidential all personal information collected through PadiMedical System. We may however disclose such information to the following parties while using the information for the reason it was collected:
• A person or company acting on behalf of Longe Medikal Sdn. Bhd.. 
• Any other person or company who has undertaken to keep such information confidential, provided they have a right to such information. 
• We will also disclose your personal data to government authorities if we are forced to by law.
We may also disclose your personal information to anyone else who has a right to it under Malaysian law so long as they can prove they have the authority to do so.
</p>

                <p style={{ fontWeight: "bold" }}>
                {" "} Data Retention</p>
                <p style={{ fontSize: 12 ,textAlign: "justify"}}> When you delete your account in PadiMedical, we will immediately start the process of removing it from our system. First, we aim to immediately remove it from view. 
We then begin a process designed to safely and completely delete the primary data from our storage systems. Safe deletion is important to protect our users and customers from accidental data loss. Complete deletion of primary data from our servers is equally important for users’ peace of mind. As with any deletion process, things like routine maintenance, unexpected outages, bugs, or failures in our servers may cause delays in the processes. We maintain systems designed to detect and remediate such issues. 
Secondary anonymized data and cleansed data, analytics and other non-sensitive clinical images will be retained.
 </p>

                <p style={{ fontWeight: "bold" }}>
                {" "} Changes to this Policy</p>
                <p style={{ fontSize: 12 ,textAlign: "justify"}}> Longe Medikal Sdn. Bhd. has right to change this policy at any time. We will announce any changes on this page. This policy is not a contract, nor does it suggest any obligation on our part with another part.</p>

            </div>
          </SweetAlert>}
          <div className="text-center" id="login">
            <img
              src={padilogo}
              id="logo-login"
              height="150"
              text-align="center"
            ></img>
            <div
              className="alert alert-danger"
              id="error"
              style={{ display: error === null ? "none" : "" }}
            >
              {error}
            </div>
            <div className="block-content block block-400">
              <form onSubmit={handleSubmit} id="login-form">
                <fieldset>
                  <label>
                    <Person />
                  </label>
                  <input
                    type="text"
                    placeholder="PACs Username"
                    name="username"
                    onChange={handleChange}
                    required
                  />
                </fieldset>

                <fieldset>
                  <label>
                    <Lock />
                  </label>
                  <input
                    type={data.showPass1 ? "text" : "password"}
                    placeholder="Password"
                    name="password"
                    onChange={handleChange}
                    required
                  />
                  <button
                    type="button"
                    style={{ border: "none", background: "none" }}
                    onClick={togglePass1}
                  >
                    {" "}
                    {data.showPass1 ? <Visibility /> : <VisibilityOff />}
                  </button>
                </fieldset>

                <fieldset>
                  <label>
                    <Lock />
                  </label>
                  <input
                    type={data.showPass2 ? "text" : "password"}
                    placeholder="Retype Password"
                    name="password2"
                    onChange={handleChange}
                    required
                  />
                  <button
                    type="button"
                    style={{ border: "none", background: "none" }}
                    onClick={togglePass2}
                  >
                    {" "}
                    {data.showPass2 ? <Visibility /> : <VisibilityOff />}
                  </button>
                </fieldset>

                <fieldset>
                  <label>
                    <Person />
                  </label>
                  <input
                    type="text"
                    placeholder="First Name"
                    name="firstname"
                    onChange={handleChange}
                    required
                  />
                </fieldset>

                <fieldset>
                  <label>
                    <Person />
                  </label>
                  <input
                    type="text"
                    placeholder="Last Name"
                    name="lastname"
                    onChange={handleChange}
                    required
                  />
                </fieldset>

                <fieldset>
                  <label>
                    <Phone />
                  </label>
                  <input
                    type="tel"
                    placeholder="Phone Number"
                    name="phone"
                    onChange={handleChange}
                    required
                  />
                </fieldset>

                <fieldset>
                  <label>
                    <Email />
                  </label>
                  <input
                    type="email"
                    placeholder="Email"
                    name="email"
                    onChange={handleChange}
                    required
                  />
                </fieldset>

                <fieldset>
                  <label>
                    <WorkOutlined />
                  </label>
                  <input
                    type="text"
                    placeholder="Department"
                    name="department"
                    onChange={handleChange}
                    required
                  />
                </fieldset>

                <fieldset>
                  <label>
                    <WorkOutlined />
                  </label>
                  <input
                    type="text"
                    placeholder="Place Of Work"
                    name="place"
                    onChange={handleChange}
                    required
                  />
                </fieldset>

                <fieldset>
                  <label>
                    <WorkOutlined />
                  </label>
                  <input
                    type="text"
                    placeholder="Practicing Number"
                    name="practicing_no"
                    onChange={handleChange}
                    required
                  />
                </fieldset>
                <p  className='mt-4 d-flex '>
                  <input
                    style={{height:17,width:17,marginRight:10}}
                    type="checkbox"
                    class="form-check-input"
                    name="agree"
                    id='agree'
                    checked={agree}
                    onChange={handleCheck}
                    required
                  />
                  <label style={{fontSize:'16px',textAlign:'left',float:'left',wordBreak:'break-word'}} class="form-check-label" for="agree">
                    I certify that I have read and agree to the <span style={{color:'#1e81b0'}}>Terms and Conditions </span>.
                  </label>
                </p>

                <div className="r-and-f">
                  <div style={{ fontSize: "1rem" }}>
                    Already have account ?
                    <Link to={"/"}>
                      <label style={{ fontStyle: "italic", cursor: "pointer" }}>
                        {" "}
                        Login
                      </label>
                    </Link>
                  </div>
                </div>

                <button name="connexion" type="submit" className="login-btn">
                  {" "}
                  Register{" "}
                </button>
              </form>
              <br />
              <br />
            </div>
          </div>
        </div>
      </CSSTransition>
    );
}

export default Register;