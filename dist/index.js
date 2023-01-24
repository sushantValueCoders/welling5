"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const hapi_1 = require("@hapi/hapi");
const joi_1 = __importDefault(require("joi"));
const knex_1 = __importDefault(require("knex"));
const bcrypt_1 = __importDefault(require("bcrypt"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const saltRounds = 17;
const privateKey = 'welling5';
const init = () => __awaiter(void 0, void 0, void 0, function* () {
    const server = new hapi_1.Server({
        port: 3200,
        host: '127.0.0.1'
    });
    const db = (0, knex_1.default)({
        client: 'pg',
        connection: {
            host: 'localhost',
            user: 'welling5',
            password: 'mypassword',
            database: 'welling5',
        },
    });
    const userSchema = joi_1.default.object({
        username: joi_1.default.string().required(),
        password: joi_1.default.string().min(6).required()
    });
    server.route({
        method: 'POST',
        path: '/signup',
        options: {
            validate: {
                payload: userSchema
            }
        },
        handler: (request, reply) => __awaiter(void 0, void 0, void 0, function* () {
            const req = request.payload;
            let response = { status: false, msg: "" };
            const res = yield db.select("*").from("users").where({ "username": req.username });
            if (res.length > 0) {
                response.msg = "Already Exists";
            }
            else {
                const hash = yield bcrypt_1.default.hash(req.password, saltRounds);
                const d1 = yield db.insert({ 'username': req.username, 'password': hash }).into('users').returning('id');
                if (d1) {
                    response.status = true;
                    response.msg = "User created successfully";
                }
            }
            return response;
        })
    });
    server.route({
        method: 'POST',
        path: '/signin',
        options: {
            validate: {
                payload: userSchema
            }
        },
        handler: (request, h) => __awaiter(void 0, void 0, void 0, function* () {
            const req = request.payload;
            let response = { status: false, msg: "", token: "" };
            const data = yield db.select("*").from("users").where({ "username": req.username });
            if (!data[0]) {
                response.msg = "No user found";
            }
            else {
                let dbRes = data[0];
                const match = yield bcrypt_1.default.compare(req.password, dbRes.password);
                if (match) {
                    const token = yield jsonwebtoken_1.default.sign({ 'username': dbRes.username, 'id': dbRes.id }, privateKey, {});
                    response.status = true;
                    response.msg = "Login successfully";
                    response.token = token;
                }
                else {
                    response.msg = "Either username or password is wrong.";
                }
            }
            return response;
        })
    });
    server.route({
        method: 'GET',
        path: '/getAllClients',
        handler: (request, h) => __awaiter(void 0, void 0, void 0, function* () {
            let response = { status: false, msg: "", data: {} };
            const headers = request.headers;
            const token = headers.authorization;
            if (token) {
                const JWTtoken = token.slice(7, token.length);
                try {
                    const decode = yield jsonwebtoken_1.default.verify(JWTtoken, privateKey);
                    const user = decode;
                    const userData = yield db.select("*").from("users").where({ "id": user.id });
                    if (!userData[0]) {
                        response.msg = "No user found";
                    }
                    else {
                        const userList = yield db.select("*").from("users");
                        response.status = true;
                        response.msg = "Get all users";
                        response.data = userList;
                    }
                }
                catch (err) {
                    response.msg = "Invalid token";
                }
            }
            else {
                response.msg = "Token not found";
            }
            return response;
        })
    });
    yield server.start();
    console.log('Server running on %s', server.info.uri);
});
process.on('unhandledRejection', (err) => {
    console.log(err);
    process.exit(1);
});
init();
