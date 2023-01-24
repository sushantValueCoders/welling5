1. Install postgres in system
2. create 
	db "welling5" 
	user "welling5" 
	password "mypassword"
3. Connect you db and run below queries
	CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
	CREATE TABLE users (
	    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
	    username VARCHAR NOT NULL,
	    password VARCHAR NOT NULL
    );

4. npm install


5. create one blank file (index.d.ts) in node_modules/@types/hapi__hapi
	Add simple comment in this



To start the project


6. npm run start
http://127.0.0.1:3200/
Api's
1. Url : http://127.0.0.1:3200/signup
	method : POST
	request : {"username":"your_name","password":"your_password"}
2. Url : http://127.0.0.1:3200/sigin
	method : POST
	request : {"username":"your_name","password":"your_password"}

3. http://127.0.0.1:3200/getAllClients
	method : GET
