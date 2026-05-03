import React, { Component, Fragment } from 'react'
import { Modal, Row, Col } from 'react-bootstrap';

import apis from '../../../services/apis';

import CreateUser from './CreateUser'
import { toast } from 'react-toastify';
import InActiveUserTable from './InActiveUserTable';

//created by rishabh

export default class InActiveUser extends Component {

    state = {
        username: '',
        users: [],
        roles: [],
        showDelete: false,
    }

    async componentDidMount() {
        this.getUsers();

    }

    getUsers = async () => {
        let users = []

        try {
            let answer = await (await fetch('/api/users/inactive')).json();
            //   console.log(answer)
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

    changeHandler = (initialValue, value, row, column) => {
        let users = [...this.state.users];
        users.find(user => user.username === row.username)[column] = value;
        this.setState({ users });
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
    render = () => {
        return (
            <Fragment>
                <Row>
                    <h2 className='card-title'>Inactive Users</h2>
                </Row>
                <Row className="mt-5">
                    <Col>
                        <CreateUser getUsers={this.getUsers} />
                    </Col>
                </Row>
                <Row className="mt-3">
                    <Col>
                        <InActiveUserTable users={this.state.users} roles={this.state.roles} toggle={this.toggle}
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