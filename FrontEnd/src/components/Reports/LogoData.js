import hpupm from '../../assets/images/hpupm.png';
import logo2 from '../../assets/images/logo-2.jpg';
import logo3 from '../../assets/images/temp-logo.png';
import fastLogo from '../../assets/images/fast-logo.png';
import fastpacsLogo from '../../assets/images/fastpacs-logo2.png';

const obj=[
    { value: 'fastlogo', label: <div><img src={fastLogo} height="40px" /></div>,img:fastLogo },
    { value: 'fastpacslogo', label:<div><img src={fastpacsLogo} height="40px" /></div>,img:fastpacsLogo  },
    { value: 'logo1', label: <div><img src={hpupm} height="40px" /></div>,img:hpupm },
    { value: 'logo2', label:<div><img src={logo2} height="40px" /></div>,img:logo2 },
    { value: 'logo3',label:<div><img src={logo3} height="40px" /></div>,img:logo3  },
]

export const DEFAULT_LOGO_OPTION = obj[0];

export default obj;
