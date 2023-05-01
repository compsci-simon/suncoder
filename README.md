# This is the readme for SunCoder

## Feel free to contact me in the future at 1simonsteven@gmail.com.

The repository contains 2 code bases: app/ for the FastAPI back end and suncoder/ for the React front end.

The deployment directory contains files for deploying on kubernetes.

## Initial set up

In order for the application to work locally you will need to have a database with at least one person's details. In order to set this up follow these steps:

-   Install the required modules (You probably want to do this in a virtual environment) with `pip3 install -r app/requirements.txt`/
-   Start all of the services with the compose file in `cd ./deployment/compose-files && docker compose up -d`.
-   Start the FastAPI server `uvicorn app.main`.
-   Enter the FastAPI container in an interactive shell `docker exec -it db bash`.
-   Connect to the database `mysql -u root -p`.
-   Enter the password `mypass`.
-   Create the suncoder database `create schema suncoder;` and then leave the shell.
-   From the root directory run the following:

```bash
$ python3
# Python 3.10.6 (main, Sep 26 2022, 08:07:34) [Clang 13.1.6 (clang-1316.0.21.2)] on darwin
# Type "help", "copyright", "credits" or "license" for more information.
>>> from app.util.Models import create_schema
>>> create_schema()
```

This setup can be closely followed for the deployment setup. Just note that you will not start the containers with the docker compose files but rather with the kube deployment files.

## Running locally

To run system locally you will need to have Docker installed.
To start the system locally:

1. Go to deployment/compose-files and run `docker compose up -d` to start the mariaDB server and the job engine and the job server locally. Then go to the root of the repo.
2. Assuming you have installed all the required modules (check out app/requirements.txt) you can run `uvicorn app.main:app` to start the FastAPI back end.
3. To start the front end go to suncoder/ and run `npm start` to start the React server.

All these services need to be running at the same time. By default when running locally, authentication is bypassed and you will be signed in as 21659583, which is my student number. You might want to change this. When running on the university's cluster this will be bypassed and you will log into `yourstudentNumber` when loging in with university credentials.

When running for the first time, you may need to instantiate the database. To do this login to mariadb with `mysql -u root --protocol=TCP -p` and then the password is `mypass`. Once logged in create the schema suncoder `CREATE SCHEMA suncoder;`. Then go to the root of the repository and make sure you have activated the environment with all the neccesary modules to run the FastAPI server and start a Python REPL with `python3`. Inside the REPL run

-   `>>>from app.util.Models import *`
-   `>>>create_schema()`

Make sure there are no errors when creating the scema. You will then need to create an instance of 21659583 in the database (or your student number if you have changed the default user by updating the JWT in app/util/type.py line 13).

You can create this user with the cURL: `curl --location --request POST 'http://localhost:8000/api/v1/objects?tablename=users' \ --header 'Content-Type: application/json' \ --data-raw '[{ "username": "21659583", "type": "lecturer" }]'`.

Note to change the username and type if you have change the default username and type to 'student' if you want to login as a student.

## Deployment

To build the latest images for deployment you will need a Docker account with public repositories. Create an image repositor for: (1) fastapi, (2) react, (3) the server, and (4) the worker. How I build the images is shown below. Note that simona4220 is my docker username.

-   `docker build --platform=linux/amd64 -t simona4220/suncoder-fastapi:amd64 .` from ./app to create the fastapi iamge.
-   `npm run build && docker build --platform=linux/amd64 -t simona4220/suncoder-react:amd64 .` from ./suncoder to create the react image
-   `docker build --platform=linux/amd64 -t simona4220/suncoder-job-server:amd64 .` from ./app/engine/job_server/ to create the manager image
-   `docker build --platform=linux/amd64 -t simona4220/suncoder-job-worker:amd64 .` from ./app/engine/job_worker/ to create the worker image

After building the images, you will need to docker push each of these to dockerhub so that the university's cluster can pull the new images. Once you have pushed these images you can restart the reployments on the university's cluster in order for changes to the images to take effect. You should not have to worry about most of the deployments on the cluster as Andrew should know what is going on there. The only things you should need to update are the four custom images.

ReduxDevTools is very useful for monitoring state when developing. This can be installed in Chrome as an extension.

### ReduxORM

Be aware that ReduxORM has some nuances with regards to resolving relationships or denormalising the data received from the back end. It will require many-to-one relationships to have an id field on the many side for instance:

{
id: '1234',
name: 'CS 101',
tutorials: [
{ id: 'tut1' },
{ id: 'tut2' },
{ id: 'tut3' },
{ id: 'tut4' },
]
}

For many-to-many relationships it is required that only the id field of the related objects are present in an array i.e.

{
id: '1234',
name: 'CS 101',
prerequisites: [id1, id2, id3]
}
