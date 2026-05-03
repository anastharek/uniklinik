import React,{useState,useEffect} from "react";
import axios from "axios";
import DatasetCard from "../../Card/DatasetCard";
import { useSelector } from "react-redux";

const DatasetList = ({ setSelected, setMode,url,allowEdit,disableView,showStatus}) => {
  const [data, setData] = useState([]);
  const roles = useSelector((state) => state.PadiMedical.roles);

  useEffect(() => {
    if(!url)return;
    fetchDataset();
  }, []);

  const fetchDataset = () => {
    axios
      .get(url)
      .then((res) => {
        setData(res.data);
      })
      .catch(console.log);
  };
  const handleViewClick = (id) => {
    setMode("detail");
    setSelected(id);
  };
  return (
    <div>
      {data.length===0 && <h6>No dataset found</h6>}
      {data.map((dataset) => (
        <DatasetCard 
          data={dataset} 
          refresh={fetchDataset}
          allowEdit={allowEdit||roles.admin||roles.id===dataset.owner} 
          disableView={disableView}
          showStatus={showStatus}  
          onViewClick={handleViewClick} 
          key={dataset.id} />
      ))}
    </div>
  );
};

export default DatasetList;
