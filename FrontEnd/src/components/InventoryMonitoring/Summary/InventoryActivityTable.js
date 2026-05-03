const InventoryActivityTable = ({ headings = [], rows = [] }) => {
  return (
    <table class="table ">
      <thead>
        <tr>
          {headings.map((text) => (
            <th scope="col">{text}</th>
          ))}
        </tr>
      </thead>
      <tbody>
        {rows.map((row, index) => {
          return (
            <tr>
              {row.map((text) => (<td>{text}</td>))}
            </tr>
          );
        })}
      </tbody>
    </table>
  );
};

export default InventoryActivityTable;
