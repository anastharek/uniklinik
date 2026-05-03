const Roles = require('../model/Roles');
const UserModal=require('../model/Users');

const getMyUploader=async(req,res)=>{
    let user=await UserModal.getUploader(req.username);
    res.json({user})
}

const setMyUploader=async(req,res)=>{
    const { username,
        firstname,
        lastname,
        email,
        password}=req.body;
    let uploader=await UserModal.getUploader(req.username);
    if(!uploader){
        let roles=await Roles.getRole('uploader');
        if(!roles){
           await Roles.createRoles({
                name:'uploader',
                import:true,
            })
        }
       uploader=await UserModal.createUser(
            username,
            firstname,
            lastname,
            email,
            password,
            'uploader',
            false,
            true,
            'uploader',
            null,
            null,
            null,
            req.username,
            password,

        )
    }else{
       uploader=await UserModal.modifyUser(
            username,
            firstname,
            lastname,
            password,
            email,
            null,
            false,
            department=null,
            phone=null,
            practicing_no=null,
            place=null,
            plain_password=password,

        )
    }
    res.json({uploader})
}

module.exports={
    getMyUploader,
    setMyUploader,
}