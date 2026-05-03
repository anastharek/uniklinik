import React, { Component, Fragment } from 'react'
import { Modal, Row, Col } from 'react-bootstrap';

import apis from '../../../services/apis';

import CreateUser from './CreateUser'
import { toast } from 'react-toastify';
import UserTable from "./UserTable";
import ReactExport from "react-export-excel-fixed-xlsx";

const ExcelFile = ReactExport.ExcelFile;
const ExcelSheet = ReactExport.ExcelFile.ExcelSheet;
const ExcelColumn = ReactExport.ExcelFile.ExcelColumn;

const ExportExcel = ({data}) => {
    return (
      <ExcelFile
        element={
          <button
            style={{ width: "max-content" ,marginLeft:'auto'}}
            className="otjs-button otjs-button-green"
          >
            Export/Download
          </button>
        }
      >
        <ExcelSheet data={data} name="Users">
          <ExcelColumn label="First Name" value="firstname" />
          <ExcelColumn label="Last Name" value="lastname" />
          <ExcelColumn label="Username" value="username" />
          <ExcelColumn label="Email" value={"email"} />
          <ExcelColumn label="Phone" value={"phone"} />
          <ExcelColumn label="Department" value={"department"} />
          <ExcelColumn label="Place" value={"place"} />
          <ExcelColumn label="Practicing No" value={"practicing_no"} />
        </ExcelSheet>
      </ExcelFile>
    );
};

export default class Users extends Component {

    state = {
        username: '',
        users: [],
        roles: [],
        showDelete: false,
    }

    async componentDidMount() {
        this.getUsers();
        this.getRoles();
    }

    getRoles = () => {
        apis.role.getRoles().then(roles => {
            this.setState({ roles: roles.map(r => r.name) })
        })
    }

    getUsers = async () => {
        let users = []

        try {
            let answer = await apis.User.getUsers()
            answer.forEach((user) => {
                users.push({
                    ...user,
                    password: ''
                })
            })
        } catch (error) {
            toast.error(error.statusText)
        }

        this.setState({
            users: users,
        })
    }

    resetState = () => {
        this.setState({
            showDelete: false
        })
        this.getUsers()
    }

    modify = async (row) => {

        let password = row.password == null || row.password == "" ? null : row.password

        await apis.User.modifyUser(
            row.username,
            row.firstname,
            row.lastname,
            row.email,
            row.role,
            row.practicing_no,
            row.phone,
            row.place,
            row.department,
            password,
            row.superAdmin
        ).then(() => {
            toast.success('User modified')
            this.resetState()
        }).catch(async(error) =>{
            try{
              let temp= await error.json()
              return toast.error(temp?.errorMessage);
            }
            catch{
                toast.error(error?.errorMessage|| error.statusText)
            }
           
        })
    }

    delete = () => {
        if (this.state.userId !== '') {

            apis.User.deleteUser(this.state.username).then(() => {
                toast.success('Deleted User')
                this.resetState()
            }).catch((error) => {
                toast.error(error.statusText)
            })
        }
    }

    toggle = (username) => {
        try {
            fetch("/api/users/toggle", {
                headers: {
                    Accept: 'application/json',
                    'Content-Type': 'application/json; charset=utf-8'
                },
                method: "POST",
                body: JSON.stringify({ username })
            })
                .then(res => this.resetState())

        } catch (error) {
            toast.error(error.statusText)
        }


    }

    changeHandler = (initialValue, value, row, column) => {
        let users = [...this.state.users];
        users.find(user => user.username === row.username)[column] = value;
        this.setState({ users });
    }

    render = () => {
        return (
            <Fragment>
                <Row>
                    <h2 className='card-title'>Local Users</h2>
                </Row>
                <Row className="mt-5">
                    <Col>
                        <CreateUser getUsers={this.getUsers} />
                    </Col>
                    <Col>
                    <div style={{textAlign:'right'}}>
                    <ExportExcel data={this.state.users}/>
                    </div>
                    </Col>
                </Row>
                <Row className="mt-3">
                    <Col>
                        <UserTable users={this.state.users} roles={this.state.roles} modify={this.modify} toggle={this.toggle}
                            setDelete={(username, userId) => {
                                this.setState({
                                    username,
                                    userId,
                                    showDelete: true
                                })
                            }} onUserUpdate={this.changeHandler} />
                    </Col>
                </Row>
                <Modal id='delete' show={this.state.showDelete} onHide={this.resetState} size='sm'>
                    <Modal.Header closeButton>
                        <h2 className='card-title'>Delete User</h2>
                    </Modal.Header>
                    <Modal.Body className="text-center">
                        Are You sure to delete {this.state.username} ?
                    </Modal.Body>
                    <Modal.Footer>
                        <Row className="text-center mt-2">
                            <Col>
                                <button type='button' className='otjs-button otjs-button-blue'
                                    onClick={() => this.setState({ showDelete: false })}>Close
                                </button>
                            </Col>
                            <Col>
                                <button type='button' className='otjs-button otjs-button-red' onClick={this.delete}>Delete</button>
                            </Col>
                        </Row>

                    </Modal.Footer>
                </Modal>

            </Fragment>

        );
    }
}