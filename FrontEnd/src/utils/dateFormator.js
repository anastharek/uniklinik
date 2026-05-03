function dateFormator(str) {
    //20220728
    if (!str) return "";
    return `${str?.slice(6)}/${str?.slice(4, 6)}/${str?.slice(0, 4)}`;
  }

export default dateFormator;
