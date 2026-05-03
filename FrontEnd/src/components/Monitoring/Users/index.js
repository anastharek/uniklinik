import { useEffect, useMemo, useRef, useState } from "react";
import RegisteredUserTable from "./UserTable";


const RegisteredUser = () => {
  const [data, setData] = useState([]);
  useEffect(() => {
    fetchAll();
  }, []);

  const roleData=useMemo(()=>{
    let rolesCount={};
    data.map(obj=>{
        rolesCount[obj.role]=(rolesCount[obj.role]||0)+1
    })
    return rolesCount;
  },[data])


  const fetchAll = () => {
   //  setLoadmore(true);
    fetch("/api/users")
      .then((res) => res.json())
      .then((resJson) => setData(resJson))
      .catch((err) => console.log(err));
  };


  return (
    <div class="container mt-5">
      <h4 class="text-center">Registered Users</h4>
      <div>
        <h5 className="mt-5">Roles Info :</h5>
        <div  className="flex">
        {Object.keys(roleData).map(key=><span  style={{fontSize:18,marginRight:25,textTransform:'capitalize'}}><b>{key}</b>  : {roleData[key]}</span>)}
        </div>
      </div>
      <br />
      <br />
      <br />
      <br />
      <RegisteredUserTable data={data}/>
    </div>
  );
};

export default RegisteredUser;
