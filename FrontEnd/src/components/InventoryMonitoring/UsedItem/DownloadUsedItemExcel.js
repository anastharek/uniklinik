import ReactExport from "react-export-excel-fixed-xlsx";

const ExcelFile = ReactExport.ExcelFile;
const ExcelSheet = ReactExport.ExcelFile.ExcelSheet;
const ExcelColumn = ReactExport.ExcelFile.ExcelColumn;

const DownloadUsedItemExcel = ({data}) => {
    return (
      <ExcelFile
        element={
          <button
            style={{ width: "max-content" ,marginLeft:'auto'}}
            className="otjs-button otjs-button-green me-2"
          >
            Export/Download
          </button>
        }
      >
        <ExcelSheet data={data} name="Users">
          <ExcelColumn label="Item Code" value="item_code" />
          <ExcelColumn label="Item Name" value="item_name" />
          <ExcelColumn label="Used By" value="used_by" />
          <ExcelColumn label="Used At" value={col=>new Date(col?.createdAt).toLocaleString()} />
          <ExcelColumn label="Stock ID" value="stock_id" />
          <ExcelColumn label="Description" value="item_description" />
          <ExcelColumn label="Category" value={col=>col?.InventoryCategory?.name} />
          <ExcelColumn label="Type" value="type" />
          <ExcelColumn label="Store" value={col=>col?.StoreLocation?.location}  />
          <ExcelColumn label="QTY" value="unit_quantity" />
          <ExcelColumn label="Expiry Date" value={col=>new Date(col?.expiry_date).toLocaleDateString()} />
          <ExcelColumn label="Cost Per Unit" value="cost_per_unit" />
          <ExcelColumn label="Total Cost" value="total_cost" />
          <ExcelColumn label="Manufacture Name" value={col=>col?.Manufacture?.name} />
          <ExcelColumn label="Vendor Name"  value={col=>col?.Vendor?.name}/>
          <ExcelColumn label="Min Remaning Qty" value="min_qty" />
        </ExcelSheet>
      </ExcelFile>
    );
};


export default DownloadUsedItemExcel;