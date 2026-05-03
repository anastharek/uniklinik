import React from 'react';

const calculateColumnWidth = (rows, field, minWidth = 150) => {
    if(typeof rows[0][field]=='string'){
      if(rows[0][field].includes('http')){
        return field.length*10+80;
      }
    }
    let maxLength = Math.max(
      ...rows.map(row => (row[field] ? (row[field]).toString().length : 0)),
        field.length
    );
    return Math.max(minWidth, (maxLength * 10)+(field.length<maxLength?0:80)); // Adjust multiplier as needed for your font size
};

const getColumsByData = (data,column_sequence=[]) => {
    const columns = column_sequence.length > 0 ? column_sequence : Object.keys(data[0]);
    return columns.map((column) => ({ 
        field: column, 
        headerName: column.toLocaleUpperCase(),
        width:calculateColumnWidth(data,column),
        renderCell: (params) => {
            const cellValue = params.value;
            
            // Check if the cell value contains 'http'
            if (typeof cellValue === 'string' && cellValue.includes('http')) {
              return (
                <a href={cellValue} target="_blank" rel="noopener noreferrer">
                  LINK
                </a>
              );
            }
            
            // Otherwise, display as plain text
            return <span>{cellValue}</span>;
          },
    }));
  }

export default getColumsByData;