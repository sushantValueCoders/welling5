import { Server, Request, ResponseToolkit } from "@hapi/hapi";
import Joi from "joi"
import knex from "knex";
import bcrypt from "bcrypt";
import jwt from 'jsonwebtoken'

const saltRounds = 17;
const privateKey = 'welling5'
const init = async () => {
    const server: Server = new Server({
        port: 3200,
        host: '127.0.0.1'
    });
    
    const db = knex({
        client: 'pg',
        connection: {
          host: 'localhost',
          user: 'welling5',
          password: 'mypassword',
          database: 'welling5',
        },
      });
    const userSchema = Joi.object({
        username: Joi.string().required(),
        password: Joi.string().min(6).required()
    })
    server.route({
        method: 'POST',
        path: '/signup',
        options: {
            validate: {
                payload: userSchema
            }
        },
        handler: async (request,reply) => {
            const req = <any>request.payload;
            let response = {status:false,msg:""}
            const res = await db.select("*").from("users").where({"username":req.username});
            if(res.length > 0){
                response.msg = "Already Exists"
            }
            else{
                const hash = await bcrypt.hash(req.password, saltRounds)
                
                const d1 = await db.insert({'username':req.username,'password':hash}).into('users').returning('id')
                if(d1){
                    response.status = true
                    response.msg = "User created successfully"
                }
            }
            return response
        }
    });
    server.route({
        method: 'POST',
        path: '/signin',
        options: {
            validate: {
                payload: userSchema
            }
        },
        handler: async (request,h) => {
            const req = <any>request.payload;
            let response = {status:false,msg:"",token:""}
            const data = await db.select("*").from("users").where({"username":req.username});
            
            if(!data[0]){
                response.msg = "No user found"
            }
            else{
                let dbRes = <any>data[0]
                const match = await bcrypt.compare(req.password, dbRes.password)
                
                if(match){
                    const token = await jwt.sign({'username':dbRes.username,'id':dbRes.id}, privateKey,{});
                    response.status = true
                    response.msg = "Login successfully"
                    response.token = token
                }
                else{
                    response.msg = "Either username or password is wrong."
                }
            }
            return response
        }
    });
    server.route({
        method: 'GET',
        path: '/getAllClients',
        handler: async (request, h) => {
            let response = {status:false,msg:"", data:{}}
            const headers = <any>request.headers;
            const token = headers.authorization
            if(token)
            {
                const JWTtoken = token.slice(7, token.length);
                try{
                    const decode = await jwt.verify(JWTtoken, privateKey)
                    const user = <any>decode;
                    const userData = await db.select("*").from("users").where({"id":user.id});
                    
                    if(!userData[0]){
                        response.msg = "No user found"
                    }
                    else{
                        const userList = await db.select("*").from("users");
                        response.status = true
                        response.msg = "Get all users"
                        response.data = userList
                    }
                }
                catch(err){
                    response.msg = "Invalid token"
                }
            }else{
                response.msg = "Token not found"
            }
            return response;
        }
    });
  await server.start();
    console.log('Server running on %s', server.info.uri);
};
process.on('unhandledRejection', (err) => {
    console.log(err);
    process.exit(1);
});
init();