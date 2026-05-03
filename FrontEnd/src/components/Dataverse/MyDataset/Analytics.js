import axios from "axios";
import { useEffect,useMemo,useState } from "react";
import AreaChart from "../../Chart/AreaChart";

const DatasetAnalytics = ({id}) => {
    const [data,setData]=useState({});
    useEffect(()=>{
        axios.post(`/api/dataverse/analytics`,{dataset_id:id})
        .then((res)=>{
            setData(res.data);
        })
        .catch((err)=>{
            console.log(err);
        });
    },[id]);

    const purchedGraphData=useMemo(()=>{
        let obj={};
        obj.createdAt=data.purchasedRecords?.map(({purchaseDate})=>purchaseDate);
        obj.count=data.purchasedRecords?.map(({count})=>count);
        return obj;
    },[data.purchasedRecords]);
    
    const requestGraphData=useMemo(()=>{
        let obj={};
        obj.createdAt=data.requestRecords?.map(({purchaseDate})=>purchaseDate);
        obj.count=data.requestRecords?.map(({count})=>count);
        return obj;
    },[data.requestRecords]);


    return (
        <div>
            {purchedGraphData.count && purchedGraphData.count.length>0 &&(
            <div className="mb-2">
            <h6>Purchase Records</h6>
            <AreaChart series={purchedGraphData.count} category={purchedGraphData.createdAt} name="Purchased" color={"rgb(0, 227, 150)"}/>
            </div>
            )}
            {requestGraphData.count?.length>0 &&(
            <>
            <h6>Request Records</h6>
            <AreaChart series={requestGraphData.count} category={requestGraphData.createdAt} name="Purchased" color={"rgb(0, 227, 150)"}/>
            </>
            )}
        </div>
    );
}

export default DatasetAnalytics;