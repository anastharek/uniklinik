import './summary.css';
import { AssignmentTurnedIn ,ShoppingCart,HighlightOff} from "@material-ui/icons"
import ColumnChart from '../../Chart/ColumnChart';
import InventoryActivityTable from './InventoryActivityTable';
import { useEffect,useState } from 'react';
import axios from 'axios';
import moment from 'moment';
import ReactExport from "react-export-excel-fixed-xlsx";

const ExcelFile = ReactExport.ExcelFile;
const ExcelSheet = ReactExport.ExcelFile.ExcelSheet;
const ExcelColumn = ReactExport.ExcelFile.ExcelColumn;

const Card=({title="Total Stock in",value=8457,Icon=AssignmentTurnedIn,color="#4CBCD2"})=>{
    return(
        <div  className="summery-card">
            <div className="pt-1 text-center">
              <Icon style={{color:color,fontSize:40}}/>
            </div>
            <div className="mb-3 text-center">
               <span style={{color:color}}>{value}</span> 
            </div>
            <div style={{background:color}} className="label-area">
              <span >{title}</span>  
            </div>
        </div>
    )
}

const DownloadExcel=({data={},filename='data'})=>{
  let overview_data = [{
    stock_in:data.stock_in,
    stock_used:data.stock_used,
    stock_expired:data.stock_expired
  }]

  let graphData=data.graphData?.item_name?.map((name,index)=>{
    return {
      item_name:name,
      current_usage:data.graphData.current_data[index],
      prev_data:data.graphData.prev_data[index],
      future_estimate:data.graphData.future_estimate[index]
    }
  })||[]

  let activityData=data.activitys?.map(item=>{
    return {
      name:item.activity_type,
      time:moment(item.createdAt).format('YYYY-MM-DD HH:mm:ss')
    }
  })||[]

  let lowStockData=data.low_stocks?.map((item,index)=>({
      item_name:item.item_name,
      item_code:item.item_code,
      vendor:item.Vendor?.name,
      unit_quantity:item.unit_quantity
    }))||[]
  return (
    <ExcelFile filename={`Inventory-Summary-${moment().format('YYYY-MM-DD HH:mm:ss')}`} element={<button className="otjs-button otjs-button-green">Export/Download</button>}>
                <ExcelSheet data={overview_data} name="Overview">
                    <ExcelColumn label="Total Stock In" value={(col)=>col.stock_in}/>
                    <ExcelColumn label="Total Stock Used" value={(col)=>col.stock_used}/>
                    <ExcelColumn label="Total Expired Stock" value={(col)=>col.stock_expired}/>
                </ExcelSheet>
                <ExcelSheet data={graphData} name="Used Item Graph">
                    <ExcelColumn label="Item Name" value='item_name'/>
                    <ExcelColumn label="Current Usage" value='current_usage'/>
                    <ExcelColumn label="Prev. Usage" value='prev_data'/>
                    <ExcelColumn label="Estimate Usage" value='future_estimate'/>
                </ExcelSheet>
                <ExcelSheet data={activityData} name="Activity">
                    <ExcelColumn label="Activity Type" value='name'/>
                    <ExcelColumn label="Time" value='time'/>
                </ExcelSheet>
                <ExcelSheet data={lowStockData} name="Low Stock">
                    <ExcelColumn label="Item Name" value='item_name'/>
                    <ExcelColumn label="Item ID" value='item_code'/>
                    <ExcelColumn label="Supplier" value='vendor'/>
                    <ExcelColumn label="Total Stock" value='unit_quantity'/>
                </ExcelSheet>
    </ExcelFile>
);
}
const Summary=()=>{
  const [data,setData]=useState({});
  const [loading,setLoading]=useState(false);
  const [type,setType]=useState('daily');
  useEffect(()=>{
    setLoading(true);
    axios.get('/api/inventory/summary?type='+type)
    .then(res=>setData(res.data?.data||{}))
    .catch(err=>console.log(err))
    .finally(()=>setLoading(false))
  },[type])
  if(loading){
    return <div style={{height:'400px',display:'grid',placeContent:'center'}}>
        <h3>Loading...</h3>
    </div>
  }
return(
    <>
    <h3>Dashboard</h3>
    <div className='d-flex justify-content-between mb-4'>
    <select style={{width:120}} value={type} onChange={(e)=>setType(e.target.value)} className="form-select">
        <option value="daily">Daily</option>
        <option value="weekly">Weekly</option>
        <option value="monthly">Monthly</option>
    </select>
    <DownloadExcel data={data} filename='inventory-summary'/>
    </div>
    <div className="summary-card-wrapper mt-4">
        <Card
            title="Total Stock in"
            value={data.stock_in}
            Icon={AssignmentTurnedIn}
            color="#4CBCD2"
        />
        <Card
            title="Total Stock used"
            value={data.stock_used}
            Icon={ShoppingCart}
            color="#28a745"
        />
        <Card
            title="Total Expired Stock"
            value={data.stock_expired}
            Icon={HighlightOff}
            color="#F1A630"
        />
    </div>
    <div className='my-5'>
        <ColumnChart
          series={[
            {
              name: "Prev. Usage",
              data: data?.graphData?.prev_data||[],
            },
            {
              name: "Current Usage",
              data: data?.graphData?.current_data||[],
            },
            {
              name: "Expected Usage",
              data: data?.graphData?.future_estimate||[],
            },
          ]}
          category={data?.graphData?.item_name||[]}
        />
    </div>
    <div className='row my-5'>
        <div className='col-12 col-md-5'>
            <h6>Activity</h6>
            <InventoryActivityTable
             headings={['Activity','Time']}
             rows={
                data?.activitys?.map(item=>(
                    [item.activity_type?.toLowerCase(),
                     moment(item.createdAt).fromNow()]
                ))
             }
            />
        </div>
        <div className='col-12 col-md-7'>
            <h6>Low Stock</h6>
            <InventoryActivityTable
              headings={['No.','Item Name','Item ID','Supplier','Total Stock']}
              rows={
                data?.low_stocks?.map((item,index)=>(
                    [index+1,item.item_name,item.item_code,item.Vendor?.name,item.unit_quantity]
                ))
              }
            />
        </div>
    </div>
    </>
)
}

export default Summary;