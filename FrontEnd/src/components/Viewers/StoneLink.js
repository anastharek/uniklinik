import React, { Component } from 'react'
import { Link } from 'react-router-dom'

/**
 * OHIF Link to open OHIF viewer in another Tab
 * The Backend redirect this destination to OHIF static HTML page integration
 */
export default class StoneLink extends Component {
  render = () => {
    return (
                                                                                                      //tukar link
      this.props.orthancID === undefined ? null : <Link className={this.props.className} to={{pathname:"https://strokesvr.padimedical.com/osimis-viewer/app/index.html?study=" + this.props.orthancID}} target='_blank'>OSIMIS Viewer</Link>
    )
  } 
}
