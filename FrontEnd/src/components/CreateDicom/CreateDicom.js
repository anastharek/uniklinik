import React, {Component, Fragment} from 'react'
import ModalCreateDicom from "./ModalCreateDicom";


export default class CreateDicom extends Component {

    state = {
        show: false
    }

    openModify = () => {
        this.setState({show: true})
    }

    render = () => {
        return (
            <Fragment> {/*tukar*/}
                <button className='dropdown-item bg-green' type='button'
                        onClick={this.openModify}>Upload
                </button>
                <ModalCreateDicom
                    show={this.state.show}
                    onHide={() => this.setState({show: false})}
                    modify={() => this.modify()}
                    OrthancID={this.props.orthancID}
                    level={this.props.level}
                />
            </Fragment>
        )
    }
}